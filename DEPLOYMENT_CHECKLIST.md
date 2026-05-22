# Backend Deployment Checklist

## Pré-Deployment

- [ ] Revisar `BACKEND_IMPROVEMENTS.md`
- [ ] Testar em ambiente de desenvolvimento
- [ ] Verificar logs em `docker logs`
- [ ] Validar pool de conexões com stress test

## Build & Deploy

### 1. Rebuild Docker Image
```bash
cd app/backend
docker build -t observabilidade-backend:latest .
```

### 2. Atualizar docker-compose.yml
```bash
cd /path/to/observabilidade
docker-compose down
docker-compose up -d
```

### 3. Verificar Health Check
```bash
# Esperar 5-10 segundos para inicialização
sleep 10

# Testar health
curl http://localhost:8000/health
# Esperado: {"status": "healthy", ...}

# Testar um endpoint
curl -X POST http://localhost:8000/api/queries/aggregate \
  -H "Content-Type: application/json" \
  -d '{
    "source": "robo-contratos",
    "aggregation": "count",
    "from_": "2026-05-20T00:00:00Z",
    "to": "2026-05-22T23:59:59Z"
  }'
```

## Monitoramento Pós-Deployment

### 1. Verificar Logs do Backend
```bash
docker logs observabilidade_logs_backend --tail=100 -f
```

**Procurar por:**
- ✅ `✓ Banco inicializado com sucesso` - BD pronto
- ✅ `✓ POST /api/queries/aggregate 200` - Requisições bem-sucedidas
- ⚠️ `⚠ GET /health 503` - BD indisponível (esperado se postgres está down)
- ✗ `✗ POST /api/... - Exception` - Erro real que precisa investigar

### 2. Stress Test (Simular Múltiplas Requisições)
```bash
# Usando Apache Bench
ab -n 100 -c 10 http://localhost:8000/health

# Esperado: 100% success rate com duração rápida
```

### 3. Simular Falha de BD e Recuperação
```bash
# Terminal 1: Monitorar logs
docker logs observabilidade_logs_backend -f

# Terminal 2: Fazer requisições
curl http://localhost:8000/api/queries/aggregate

# Terminal 3: Simular falha
docker-compose stop postgres

# Observar:
# - Logs mostram erro de conexão
# - Health check retorna 503
# - Requisições falham graciosamente

# Recuperar
docker-compose start postgres

# Observar:
# - Conexão automaticamente restaurada
# - Requisições voltam a funcionar
```

## Troubleshooting

### Problema: "Database connection error"
```bash
# 1. Verificar se postgres está rodando
docker-compose ps postgres

# 2. Verificar logs do postgres
docker logs observabilidade_logs_postgres

# 3. Testar conexão direta
docker exec observabilidade_logs_backend python -c "
from app.database import SessionLocal
db = SessionLocal()
print('Conexão OK:', db.execute('SELECT 1').scalar())
"
```

### Problema: "Pool exhausted" / "QueuePool limit exceeded"
```bash
# 1. Aumentar pool_size no docker-compose.yml
environment:
  DB_POOL_SIZE: 20  # ao invés de 10

# 2. Reiniciar
docker-compose restart backend

# 3. Verificar logs
docker logs observabilidade_logs_backend | grep -i "pool"
```

### Problema: Requisições Lentas (>1s)
```bash
# 1. Verificar logs para queries lentas
docker logs observabilidade_logs_backend | grep -E "\([1-9]\.[0-9]+s\)"

# 2. Verificar performance do BD
docker exec observabilidade_logs_postgres psql -U postgres -d observabilidade_logs \
  -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;"
```

### Problema: Memory leak / Conexões não fecham
```bash
# 1. Verificar pool status
docker exec observabilidade_logs_backend python -c "
from app.database import engine
print('Pool size:', engine.pool.size())
print('Checked out:', engine.pool.checkedout())
"

# 2. Aumentar pool_recycle
environment:
  DB_POOL_RECYCLE: 1800  # 30 min ao invés de 1 hora
```

## Performance Benchmarks

Após deployment, você deve ver:

```
Health Check:       < 100ms
Aggregate Query:    < 500ms
Details Query:      < 1000ms
```

Se estiver acima:
1. [ ] Verificar índices do BD
2. [ ] Aumentar workers do uvicorn
3. [ ] Considerar cache (Redis)

## Rollback

Se precisar reverter:
```bash
# Backup dos dados (IMPORTANTE!)
docker exec observabilidade_logs_postgres pg_dump \
  -U postgres observabilidade_logs > backup_$(date +%s).sql

# Reverter código
git checkout HEAD~1

# Rebuild e reiniciar
docker-compose down
docker-compose up -d
```

## Configurações Recomendadas por Escala

### Pequeno (< 1000 logs/dia)
```yaml
DB_POOL_SIZE: 5
DB_MAX_OVERFLOW: 10
DB_POOL_RECYCLE: 3600
workers: 1
```

### Médio (1000-50000 logs/dia)
```yaml
DB_POOL_SIZE: 10
DB_MAX_OVERFLOW: 20
DB_POOL_RECYCLE: 3600
workers: 2
```

### Grande (> 50000 logs/dia)
```yaml
DB_POOL_SIZE: 20
DB_MAX_OVERFLOW: 40
DB_POOL_RECYCLE: 1800
workers: 4
# Considerar PgBouncer para pooling adicional
```

## Checklist Final

- [ ] Logs estão sendo produzidos corretamente
- [ ] Health check responde 200 ou 503 apropriadamente
- [ ] Requisições legítimas funcionam
- [ ] Requisições com erro retornam status codes corretos
- [ ] Não há memory leaks (monitorar por 1 hora)
- [ ] Não há conexões pendentes
- [ ] Performance dentro dos benchmarks

---

**Data de Deploy:** _______________
**Responsável:** _______________
**Issues Encontradas:** _______________
