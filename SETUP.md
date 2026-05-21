# Guia de Setup - Observabilidade Logs

## Prerequisitos

- **Docker & Docker Compose** (recomendado)
  - Ou Python 3.11+ e Node.js 18+ para desenvolvimento local

## Opção 1: Docker Compose (Recomendado)

### Passo 1: Clone e inicie
```bash
cd /c/Git/observabilidade-logs
docker-compose up --build
```

### Passo 2: Aguarde inicialização
```
✓ PostgreSQL está healthy (~10 segundos)
✓ Backend inicializa (~30 segundos)
✓ Frontend inicializa (~1 minuto)
```

### Passo 3: Acesse
- Frontend: http://localhost:3000
- Backend Swagger: http://localhost:8000/docs
- Backend Health: http://localhost:8000/health

### Passo 4: Teste com logs
```bash
# Terminal novo, ainda dentro de observabilidade-logs
python scripts/send_test_logs.py
```

## Opção 2: Desenvolvimento Local

### Backend Setup

#### 1. Preparar ambiente
```bash
cd backend

# Copiar .env
cp .env.example .env

# Criar venv
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar
pip install -r requirements.txt
```

#### 2. PostgreSQL
Opção A - Docker (apenas o banco):
```bash
docker run -d \
  --name postgres_obs \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=observabilidade_logs \
  -p 5432:5432 \
  postgres:15-alpine
```

Opção B - Local (requer PostgreSQL instalado):
```bash
# Criar banco
createdb observabilidade_logs -U postgres
```

#### 3. Iniciar backend
```bash
python -m uvicorn app.main:app --reload
# Swagger: http://localhost:8000/docs
```

### Frontend Setup

#### 1. Preparar ambiente
```bash
cd frontend

# Copiar .env
cp .env.example .env

# Instalar
npm install
```

#### 2. Iniciar
```bash
npm start
# Acesso automático: http://localhost:3000
```

## Enviando Logs de Teste

### Opção 1: Script Python
```bash
# Dentro de observabilidade-logs
python scripts/send_test_logs.py
```

### Opção 2: cURL Manual
```bash
curl -X POST http://localhost:8000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "start": "2026-05-21T10:30:00Z",
    "end": "2026-05-21T10:30:05Z",
    "source": "robo-contratos",
    "type": "error",
    "identifier": "contrato-12345",
    "data": "Falha ao processar",
    "location": "ProcessadorContratos.processar()",
    "environment": "prod",
    "status_code": "500",
    "identifier_2": "municipio-3042"
  }'
```

### Opção 3: Script Bash
Salvar como `send_logs.sh`:
```bash
#!/bin/bash

for i in {1..50}; do
  TIPO=$([ $((i % 3)) -eq 0 ] && echo "error" || echo "success")
  STATUS=$([ $((i % 3)) -eq 0 ] && echo "500" || echo "200")
  
  curl -X POST http://localhost:8000/api/logs \
    -H "Content-Type: application/json" \
    -d "{
      \"start\": \"2026-05-21T10:$((i % 60)):00Z\",
      \"end\": \"2026-05-21T10:$((i % 60)):05Z\",
      \"source\": \"robo-contratos\",
      \"type\": \"$TIPO\",
      \"identifier\": \"contrato-$i\",
      \"data\": \"Log teste $i\",
      \"location\": \"ProcessadorContratos.processar()\",
      \"environment\": \"prod\",
      \"status_code\": \"$STATUS\",
      \"identifier_2\": \"municipio-$(($i % 5))\"
    }"
  
  sleep 0.1
done

echo "✓ 50 logs enviados"
```

## Testando Endpoints

### 1. Verificar saúde
```bash
curl http://localhost:8000/health
# {"status": "ok"}
```

### 2. Listar logs
```bash
curl http://localhost:8000/api/logs?source=robo-contratos&type=error
```

### 3. Agregação
```bash
curl -X POST http://localhost:8000/api/queries/aggregate \
  -H "Content-Type: application/json" \
  -d '{
    "source": "robo-contratos",
    "aggregation": "count",
    "filters": {"type": "error"},
    "groupBy": ["identifier_2"]
  }'
```

### 4. Detalhes
```bash
curl -X POST http://localhost:8000/api/queries/details \
  -H "Content-Type: application/json" \
  -d '{
    "source": "robo-contratos",
    "filters": {"type": "error"},
    "limit": 10
  }'
```

## Criando Primeiro Dashboard

1. Acesse http://localhost:3000
2. Clique em "+ Novo Dashboard"
3. Preencha:
   - Nome: "Teste"
   - Descrição: "Dashboard de teste"
4. Clique em "+ Adicionar Gráfico"
5. Configure:
   - Título: "Erros por Município"
   - Tipo: Barra
   - Source: robo-contratos
   - Agregação: count
   - Filtro: type = error (no JSON)
   - GroupBy: identifier_2
   - Habilite "Detalhar"
6. Clique em "Criar Dashboard"
7. Clique em "Visualizar"
8. Selecione período "24h"
9. Clique em uma barra para ver detalhes

## Logs de Docker

### Ver logs de um serviço
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Monitorar em tempo real
```bash
docker-compose logs -f backend
```

## Resetar Banco de Dados

```bash
# Parar containers
docker-compose down

# Remover volume (deleta dados)
docker volume rm observabilidade-logs_postgres_data

# Reiniciar
docker-compose up
```

## Troubleshooting

### Backend não inicia
```
Error: could not connect to server
```
- Aguarde 10s para PostgreSQL iniciar
- Verifique: `docker ps | grep postgres`
- Logs: `docker-compose logs postgres`

### Frontend não conecta ao backend
- Verifique CORS: backend em `main.py` já tem `allow_origins=["*"]`
- Teste endpoint: `curl http://backend:8000/health` (Docker)
- Teste local: `curl http://localhost:8000/health`

### Gráficos vazios no dashboard
- Envie logs primeiro: `python scripts/send_test_logs.py`
- Verifique filtro de tempo (últimas 24h)
- Verifique console do navegador (F12) para erros

### Porta 5432 já em uso
```bash
# Mude porta no docker-compose.yml
# Linha: - "5432:5432"
# Para: - "15432:5432"

# E atualize DATABASE_URL
# postgresql://postgres:postgres@localhost:15432/observabilidade_logs
```

## Comandos Úteis

### Backend

```bash
# Criar migrations (se necessário)
# Nota: Atual usa auto-create de tabelas

# Entrar no container backend
docker exec -it observabilidade_logs_backend bash

# Acessar banco dentro do container
docker exec -it observabilidade_logs_postgres psql -U postgres -d observabilidade_logs

# Executar query no banco
SELECT COUNT(*) FROM logs;
```

### Frontend

```bash
# Entrar no container
docker exec -it observabilidade_logs_frontend bash

# Limpar node_modules
rm -rf node_modules
npm install

# Build for production
npm run build
```

## Performance

### Índices no PostgreSQL
```sql
-- Já criados automaticamente nos modelos
-- Visualize com:
\d+ logs
\d+ dashboards
```

### Limpar logs antigos (query manual)
```sql
DELETE FROM logs WHERE created_at < NOW() - INTERVAL '30 days';
VACUUM logs;
```

## Próximos Passos

1. **Integração com Keycloak** (para autenticação)
2. **Webhook para alertas** (notificar quando erro > threshold)
3. **Exportar como PDF** (relatórios)
4. **Persistência de filtros** (por usuário)
5. **Histórico de dashboards** (versionamento)

## Documentação Adicional

- Plano de implementação: `/c/Users/Helison/.claude/plans/crie-uma-aplica-o-com-floating-plum.md`
- API Docs (Swagger): http://localhost:8000/docs
- Backend: `/c/Git/observabilidade-logs/backend`
- Frontend: `/c/Git/observabilidade-logs/frontend`

## Suporte

Para erros ou dúvidas:
1. Verifique logs: `docker-compose logs`
2. Teste endpoints manualmente com curl
3. Verifique console do navegador (F12)
4. Reinicie tudo: `docker-compose down && docker-compose up --build`
