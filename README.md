# Observabilidade Logs - Dashboard Dinâmico

Aplicação FastAPI + React para receber logs em formato JSON, armazená-los em PostgreSQL e criar dashboards personalizados com gráficos interativos.

## Características

✅ **Backend FastAPI**
- Endpoint para receber logs em formato JSON
- Armazenamento em PostgreSQL
- CRUD completo de dashboards
- API de queries com suporte a múltiplas agregações (count, sum, avg, min, max, distinct)
- Filtros flexíveis com suporte a operadores ($ne, $gte, $lte, etc)

✅ **Frontend React**
- Página para criar e editar dashboards
- Página dinâmica para visualizar dashboards
- Gráficos interativos (linha, barra, pizza, gauge)
- Filtro de tempo global (24h, 7d, 30d, customizado)
- Auto-refresh configurável
- Modal para detalhar dados com logs completos
- Interface sem autenticação

✅ **Formato de Log**
```json
{
  "start": "2026-05-21T10:30:00Z",
  "end": "2026-05-21T10:30:05Z",
  "source": "robo-contratos",
  "type": "error",
  "identifier": "contrato-12345",
  "data": "Falha ao processar",
  "location": "ProcessadorContratos.processar()",
  "environment": "prod",
  "status_code": "500",
  "identifier_2": "municipio-3042",
  "identifier_3": "unidade-central"
}
```

## Quick Start

### Pré-requisitos
- Docker e Docker Compose
- ou Python 3.11+ e Node.js 18+

### Com Docker (Recomendado)

```bash
# Clone o repositório
git clone <repo>
cd observabilidade-logs

# Inicie os containers
docker-compose up

# Acesse
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Swagger API: http://localhost:8000/docs
```

### Sem Docker

#### Backend
```bash
cd backend

# Criar arquivo .env
cp .env.example .env

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt

# Inicie o servidor PostgreSQL (você precisará ter instalado)
# Depois execute as migrations (já fazem auto-create de tabelas)

# Inicie o servidor
python -m uvicorn app.main:app --reload
# Acesso: http://localhost:8000
```

#### Frontend
```bash
cd frontend

# Instalar dependências
npm install

# Inicie o dev server
npm start
# Acesso: http://localhost:3000
```

## Endpoints da API

### Logs
- `POST /api/logs` - Enviar novo log
- `GET /api/logs` - Listar logs (com filtros opcionais)
- `GET /api/logs/{log_id}` - Obter log específico

### Dashboards
- `GET /api/dashboards` - Listar todos
- `GET /api/dashboards/{id}` - Obter um dashboard
- `POST /api/dashboards` - Criar novo
- `PUT /api/dashboards/{id}` - Atualizar
- `DELETE /api/dashboards/{id}` - Deletar

### Queries
- `POST /api/queries/aggregate` - Executar agregação
- `POST /api/queries/details` - Obter logs detalhados
- `GET /api/queries/metrics` - Listar campos disponíveis

## Exemplo: Enviando Logs

```bash
curl -X POST http://localhost:8000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "start": "2026-05-21T10:30:00Z",
    "end": "2026-05-21T10:30:05Z",
    "source": "robo-contratos",
    "type": "error",
    "identifier": "contrato-12345",
    "data": "Falha ao processar contrato",
    "location": "ProcessadorContratos.processar()",
    "environment": "prod",
    "status_code": "500",
    "identifier_2": "municipio-3042",
    "identifier_3": "unidade-central"
  }'
```

## Exemplo: Criar Dashboard

Acesse http://localhost:3000 e clique em "Novo Dashboard"

1. Preencha nome e descrição
2. Clique em "Adicionar Gráfico"
3. Configure o gráfico:
   - Título: "Total de Erros por Município"
   - Tipo: "Barra"
   - Source: "robo-contratos"
   - Agregação: "count"
4. Habilite "Permitir detalhamento"
5. Clique em "Criar Dashboard"

## Testando

### Script de Teste
```bash
# Gerar 50 logs de teste
python scripts/send_test_logs.py
```

Este script:
- Envia 50 logs com diferentes tipos (error, success, warning, info)
- Distribui entre 5 municípios
- Testa o endpoint `/api/logs`
- Valida a agregação de dados

## Estrutura de Projeto

```
observabilidade-logs/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app
│   │   ├── database.py             # SQLAlchemy setup
│   │   ├── config.py               # Configurações
│   │   ├── models/                 # ORM Models
│   │   ├── schemas/                # Pydantic schemas
│   │   ├── routes/                 # API endpoints
│   │   └── services/               # Business logic
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/                  # DashboardEditor, DashboardViewer
│   │   ├── components/             # ChartRenderer, TimeRangeFilter, etc
│   │   ├── services/               # API clients
│   │   ├── types/                  # TypeScript interfaces
│   │   ├── styles/                 # CSS
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── scripts/
│   └── send_test_logs.py
└── README.md
```

## Agregações Suportadas

- `count` - Contar registros
- `sum` - Somar valores
- `avg` - Média
- `min` - Valor mínimo
- `max` - Valor máximo
- `distinct` - Contar distintos

## Campos Filtráveis

- source
- type
- identifier
- location
- environment
- status_code
- identifier_2
- identifier_3

## Tipos de Gráficos

- **Linha** - Para séries temporais
- **Barra** - Para comparação entre categorias
- **Pizza** - Para distribuição
- **Gauge** - Para métricas em percentual

## Configuração de Ambiente

### Backend
```env
DATABASE_URL=postgresql://user:password@localhost:5432/observabilidade_logs
APP_NAME="Observabilidade Logs"
DEBUG=true
```

### Frontend
```env
REACT_APP_API_URL=http://localhost:8000/api
```

## Performance

- PostgreSQL com índices em campos frequentemente consultados
- Paginação de resultados (limite 1000 por padrão)
- Auto-refresh configurável por dashboard
- Caching de dashboards no frontend

## Roadmap Futuro

- [ ] Autenticação via Keycloak
- [ ] Alertas customizados
- [ ] Exportar dashboards como PDF
- [ ] Webhooks para integrações
- [ ] Rate limiting
- [ ] Histórico de versões dos dashboards
- [ ] Permissões por usuário

## Troubleshooting

### Erro de conexão com PostgreSQL
```
psycopg2.OperationalError: could not connect to server
```
- Verifique se PostgreSQL está rodando
- Verifique DATABASE_URL em .env
- Se usar Docker, verifique se o container postgres está healthy

### Frontend não conecta ao backend
- Verifique se backend está rodando em http://localhost:8000
- Verifique REACT_APP_API_URL em .env
- Verifique CORS no backend (deve estar `allow_origins=["*"]`)

### Gráficos vazios
- Verifique se há logs no banco de dados
- Confira o filtro de tempo
- Verifique os filtros da agregação

## Licença

MIT

## Contribuindo

Pull requests são bem-vindos!
