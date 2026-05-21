# Arquitetura - Observabilidade Logs

## Visão Geral

```
┌─────────────────┐
│   Aplicação     │
│  (Seu Código)   │
└────────┬────────┘
         │ POST /api/logs (JSON)
         ▼
┌─────────────────────────────────────────┐
│         FastAPI Backend                 │
│  ┌───────────────────────────────────┐  │
│  │ POST /api/logs                   │  │
│  │ - Validação (Pydantic)           │  │
│  │ - Armazenamento                  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ CRUD Dashboards                  │  │
│  │ - Create, Read, Update, Delete   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Query Engine                      │  │
│  │ - Agregações (count, sum, avg...) │  │
│  │ - Filtros flexíveis               │  │
│  │ - Detalhes (logs completos)       │  │
│  └───────────────────────────────────┘  │
└────────┬────────┬────────────────────────┘
         │        │
         ▼        ▼
    ┌─────────────────┐
    │  PostgreSQL     │
    │  ┌───────────┐  │
    │  │ logs      │  │
    │  │ dashboards│  │
    │  └───────────┘  │
    └─────────────────┘
         │
         │ SQL Queries
         │
         ▼
┌─────────────────────────────────────┐
│      React Frontend                 │
│  ┌─────────────────────────────────┐│
│  │ DashboardEditor                 ││
│  │ - Criar dashboards              ││
│  │ - Editar JSON de configs        ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ DashboardViewer                 ││
│  │ - Visualizar dashboards         ││
│  │ - Filtro de tempo               ││
│  │ - Auto-refresh                  ││
│  │ - Click para detalhar           ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Banco de Dados** | PostgreSQL | 15 |
| **Backend** | FastAPI | 0.104.1 |
| **ORM** | SQLAlchemy | 2.0.23 |
| **Validação** | Pydantic | 2.5.0 |
| **Frontend** | React | 18.2.0 |
| **Tipagem** | TypeScript | 5.2.0 |
| **Gráficos** | Recharts | 2.10.3 |
| **HTTP Client** | Axios | 1.6.2 |
| **Styling** | Tailwind CSS | 3.3.6 |
| **Roteamento** | React Router | 6.20.0 |

## Modelos de Dados

### Log Table
```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY,
  start_time TIMESTAMP NOT NULL,        -- Início do evento
  end_time TIMESTAMP NOT NULL,          -- Fim do evento
  source VARCHAR(255) NOT NULL,         -- Origem do log (robo-contratos, etc)
  type VARCHAR(50) NOT NULL,            -- error, success, warning, info, danger
  identifier VARCHAR(255) NOT NULL,     -- ID único do evento
  data TEXT NOT NULL,                   -- Descrição/mensagem
  location VARCHAR(255),                -- Arquivo/função/módulo
  environment VARCHAR(50) NOT NULL,     -- dev, hom, prod
  status_code VARCHAR(50),              -- HTTP/Custom status (nullable)
  identifier_2 VARCHAR(255),            -- 2º identificador (ex: municipio)
  identifier_3 VARCHAR(255),            -- 3º identificador (ex: unidade)
  created_at TIMESTAMP DEFAULT NOW()
  
  -- Índices para performance
  INDEX (start_time, end_time)
  INDEX (source)
  INDEX (type)
  INDEX (identifier)
  INDEX (created_at)
);
```

### Dashboard Table
```sql
CREATE TABLE dashboards (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,           -- Nome do dashboard
  description TEXT,                     -- Descrição
  config JSONB NOT NULL,                -- Configuração JSON do dashboard
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Formato da Config JSON do Dashboard

```typescript
{
  id: string;
  name: string;
  refreshInterval?: number;  // segundos
  cards: [
    {
      id: string;
      title: string;
      type: 'line' | 'bar' | 'pie' | 'gauge';
      
      query: {
        source: string;                    // Ex: robo-contratos
        aggregation: string;               // count, sum, avg, min, max, distinct
        field?: string;                    // Para sum, avg, min, max
        filters?: Record<string, any>;     // Filtros WHERE
        groupBy?: string[];                // Campos para GROUP BY
        timeWindow?: string;               // 1hour, 1day, etc (futuro)
      };
      
      axes?: { x?: { label: string }, y?: { label: string } };
      detailsEnabled?: boolean;            // Mostrar botão detalhar
      min?: number;                        // Para gauge
      max?: number;                        // Para gauge
      thresholds?: Array<{ value: number, color: string }>;
    }
  ]
}
```

## Fluxo de Requisições

### 1. Enviar Log
```
POST /api/logs
┌──────────────────────┐
│ Aplicação            │
│  ↓                   │
│ LogCreate (Pydantic) │
│  ↓                   │
│ Validação            │
│  ↓                   │
│ Log ORM Model        │
│  ↓                   │
│ PostgreSQL INSERT    │
│  ↓                   │
│ Response: LogResponse│
└──────────────────────┘
```

### 2. Criar Dashboard
```
POST /api/dashboards
┌──────────────────────────────┐
│ React (DashboardEditor)      │
│  ↓                           │
│ DashboardCreate (Pydantic)   │
│  ↓                           │
│ Dashboard ORM Model          │
│  ↓                           │
│ PostgreSQL INSERT config JSON│
│  ↓                           │
│ Response: DashboardResponse  │
└──────────────────────────────┘
```

### 3. Agregar Dados (Para Gráfico)
```
POST /api/queries/aggregate
┌────────────────────────────────────────┐
│ React (DashboardCard)                  │
│  ↓                                     │
│ QueryAggregateRequest (Pydantic)       │
│  ↓                                     │
│ Build WHERE Clause                     │
│  ↓                                     │
│ Build SQL Agregation (COUNT/SUM/etc)   │
│  ↓                                     │
│ PostgreSQL SELECT ... GROUP BY ...     │
│  ↓                                     │
│ Response: AggregationResult[]          │
│  ↓                                     │
│ ChartRenderer (Recharts)               │
└────────────────────────────────────────┘
```

### 4. Detalhar (Click no Gráfico)
```
POST /api/queries/details
┌──────────────────────────────┐
│ DetailModal (React)          │
│  ↓                           │
│ QueryDetailsRequest          │
│  ↓                           │
│ PostgreSQL SELECT * WHERE... │
│  ↓                           │
│ Response: QueryDetailsResponse│
│  ↓                           │
│ Render Tabela com Logs       │
└──────────────────────────────┘
```

## Query Processing (Engine de Queries)

### Construção de Query SQL

1. **Base Query**
   ```sql
   SELECT * FROM logs WHERE 1=1
   ```

2. **Adicionar Filtros**
   ```sql
   AND source = 'robo-contratos'
   AND type = 'error'
   AND start_time >= '2026-05-21T00:00:00Z'
   AND start_time <= '2026-05-21T23:59:59Z'
   ```

3. **Aplicar Agregação**
   ```sql
   SELECT identifier_2, COUNT(*) as count
   FROM logs
   WHERE [filtros acima]
   GROUP BY identifier_2
   ORDER BY count DESC
   ```

### Suporte a Filtros Especiais

| Operador | SQL | Exemplo |
|----------|-----|---------|
| Igualdade | `=` | `{"type": "error"}` |
| Não igual | `!=` | `{"status_code": {"$ne": null}}` |
| IN | `IN (...)` | `{"type": ["error", "warning"]}` |
| Greater/Less | `>=`, `<=` | `{"created_at": {"$gte": "2026-05-21"}}` |

## Componentes React

### Hierarquia
```
App
├── DashboardEditor (Página)
│   └── Formulário CRUD de Dashboards
│       └── Editor de Cards (JSON)
└── DashboardViewer (Página)
    ├── TimeRangeFilter
    ├── Auto-refresh Control
    ├── Grid de Cards
    │   └── DashboardCard
    │       ├── ChartRenderer
    │       │   ├── LineChart (Recharts)
    │       │   ├── BarChart (Recharts)
    │       │   ├── PieChart (Recharts)
    │       │   └── Gauge (Custom)
    │       └── Botão "Detalhar"
    └── DetailModal
        └── Tabela de Logs
            └── Botão "Copiar JSON"
```

## Performance e Otimizações

### Banco de Dados
- ✅ Índices em colunas frequently queried
- ✅ Índice composto (start_time, end_time)
- ✅ Pagination em detalhes (limit 1000)

### Frontend
- ✅ React.memo para componentes heavyweights
- ✅ useCallback para event handlers
- ✅ Lazy loading de rotas (React.lazy)
- ✅ Auto-refresh configurável por dashboard

### API
- ✅ CORS habilitado
- ✅ Gzip compression (via uvicorn)
- ✅ Query string parameters para GET
- ✅ JSON body para POST complexos

## Segurança

### Não implementado (Futuro)
- ❌ Autenticação (planejar OIDC/Keycloak)
- ❌ Autorização por usuário
- ❌ CSRF protection
- ❌ Rate limiting
- ❌ SQL injection protection (usar Pydantic/SQLAlchemy)

### Já implementado
- ✅ CORS controls
- ✅ Input validation (Pydantic)
- ✅ Prepared statements (SQLAlchemy ORM)
- ✅ Type hints (TypeScript + Python)

## Escalabilidade

### Atuais Limitações
- Single PostgreSQL instance
- No database replication
- No caching layer (Redis)
- No message queue (Celery/RabbitMQ)

### Para Produção
- [ ] PostgreSQL em cluster (Primary/Replica)
- [ ] Redis para caching de dashboards
- [ ] Celery para agregações async
- [ ] Kafka/RabbitMQ para logs em batch
- [ ] Elasticsearch para full-text search

## Deployment

### Docker
```bash
docker-compose up -d
# Automatic:
# - PostgreSQL (postgres:15)
# - Backend (python:3.11)
# - Frontend (node:18)
```

### Kubernetes (Futuro)
```yaml
# Services
- api-deployment
- frontend-deployment
- postgres-statefulset

# Ingress
- backend.observabilidade.local
- frontend.observabilidade.local

# ConfigMaps
- database-config
- api-config

# Secrets
- database-credentials
```

## Monitoramento (Futuro)

- [ ] Prometheus metrics no backend
- [ ] Grafana para monitoramento
- [ ] ELK Stack para logs da app
- [ ] Alertas customizados

## Changelog

### v0.1.0 (MVP)
- ✅ Endpoint para receber logs
- ✅ Armazenamento em PostgreSQL
- ✅ CRUD de dashboards
- ✅ Query engine com agregações
- ✅ Frontend com editor e visualizador
- ✅ Filtros de tempo e auto-refresh
- ✅ Modal com detalhes dos logs

### v0.2.0 (Planejado)
- [ ] Autenticação Keycloak
- [ ] Alertas customizados
- [ ] Exportar PDF
- [ ] Persistência de filtros
- [ ] Histórico de versões

### v1.0.0 (Produção)
- [ ] Testes unitários 100%
- [ ] Testes integração
- [ ] Load testing
- [ ] Documentação OpenAPI completa
- [ ] CI/CD pipeline
