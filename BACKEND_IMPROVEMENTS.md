# Backend Improvements - Logging & Database Resilience

## Problema Identificado
O backend caía intermitentemente quando fazendo requisições e voltava sozinho após ~30 segundos. Isso indicava:
- Pool de conexões não configurado
- Sem logging adequado para diagnosticar
- Health check que não validava banco de dados
- Sem tratamento de erros de reconexão

---

## Melhorias Implementadas

### 1. **Database Pool Configuration** (`database.py`)
```python
poolclass=pool.QueuePool,  # Gerenciamento explícito de pool
pool_size=10               # 10 conexões mantidas
max_overflow=20            # Até 30 conexões em picos
pool_recycle=3600          # Recicla a cada 1 hora
pool_pre_ping=True         # Valida conexão antes de usar
```

**Benefícios:**
- ✅ Previne saturação de conexões
- ✅ Reconexão automática de conexões mortas
- ✅ Melhor utilização de recursos

### 2. **Structured Logging** (`main.py` e routes)
Novo sistema de logging com:
- Formatação clara com timestamps
- Diferentes níveis (DEBUG, INFO, WARNING, ERROR)
- Logs de início/fim de requisições
- Duração de cada requisição
- Status codes com emojis para visualização rápida

```
[2026-05-22 10:15:33] INFO [app:120] ✓ POST /api/queries/aggregate 200 (0.245s)
[2026-05-22 10:15:34] ERROR [app:156] ✗ POST /api/queries/details - Exception: OperationalError (1.203s)
```

### 3. **Real Health Check** (`main.py`)
Antes:
```python
@app.get("/health")
def health_check():
    return {"status": "ok"}  # Sempre retorna ok!
```

Depois:
```python
@app.get("/health")
def health_check():
    # Valida conexão real com BD
    with SessionLocal() as db:
        db.execute("SELECT 1")
    return {"status": "healthy", ...}
```

**Benefícios:**
- ✅ Detecta problemas de BD antes de requisições falharem
- ✅ Status code 503 quando BD está indisponível
- ✅ Permite que orchestradores (K8s, Docker) reiniciem automaticamente

### 4. **Global Database Error Handler** (`main.py`)
```python
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_error_handler(request, exc):
    # Centraliza tratamento de erros de BD
    # Retorna 503 para operacional/transiente
    # Retorna 500 para erros reais
    logger.error(f"Database error on {request.method} {request.url.path}")
```

### 5. **Enhanced Error Handling in Routes**
Todos os endpoints agora têm:
```python
try:
    logger.debug(f"Query params: {params}")
    # ... executa query
    logger.debug(f"Retrieved {count} results")
    return results
except sql_exc.OperationalError as e:
    # Erro transiente (reconexão necessária)
    logger.error(f"Connection error: {e}")
    raise HTTPException(status_code=503)
except sql_exc.SQLAlchemyError as e:
    # Erro de BD real
    logger.error(f"Database error: {e}")
    raise HTTPException(status_code=500)
except Exception as e:
    # Erro inesperado
    logger.error(f"Unexpected error: {e}", exc_info=True)
    raise HTTPException(status_code=500)
```

### 6. **Database Event Listeners** (`database.py`)
Monitora o ciclo de vida das conexões:
```
[2026-05-22 10:15:33] DEBUG Database connection established
[2026-05-22 10:15:33] DEBUG Database connection checked out from pool
[2026-05-22 10:15:33] DEBUG Database connection returned to pool
[2026-05-22 10:15:33] WARNING Database connection detached from pool
```

### 7. **Configuration Defaults** (`config.py`)
Adicionadas variáveis de ambiente para tuning:
```python
DB_POOL_SIZE=10           # Ajustável via .env
DB_MAX_OVERFLOW=20        # Ajustável via .env
DB_POOL_RECYCLE=3600      # Ajustável via .env
```

---

## Arquivos Modificados

| Arquivo | Mudanças |
|---------|----------|
| `app/backend/app/database.py` | Pool config + event listeners |
| `app/backend/app/main.py` | Logging, health check, error handlers |
| `app/backend/app/config.py` | Variáveis de pool |
| `app/backend/app/routes/logs.py` | Logging + error handling |
| `app/backend/app/routes/queries.py` | Logging + error handling |

---

## Como Testar

### 1. **Verificar Health Check**
```bash
curl http://localhost:8000/health
# Retorna: {"status": "healthy", ...}
```

### 2. **Monitorar Logs em Tempo Real**
```bash
docker logs -f observabilidade_logs_backend --tail=50
```

### 3. **Simular Desconexão do BD**
```bash
# Desligar postgres
docker-compose stop postgres

# Tentar requisição → verá erros estruturados
curl http://localhost:8000/api/queries/aggregate

# Religar postgres
docker-compose start postgres

# Logs mostrarão reconexão automática
```

---

## Diagnóstico de Problemas

### Se continuar caindo:
1. **Verificar logs** para ver qual erro específico
2. **Aumentar pool_size** em caso de muitas conexões simultâneas:
   ```python
   pool_size=20  # ao invés de 10
   ```
3. **Verificar timeout do postgres**:
   ```bash
   psql -l  # listar bancos
   ```
4. **Validar conectividade BD**:
   ```bash
   docker exec observabilidade_logs_backend python -c \
     "from app.database import SessionLocal; db = SessionLocal(); print(db.execute('SELECT 1').scalar())"
   ```

---

## Próximos Passos Recomendados

1. **Monitoramento:**
   - [ ] Adicionar Prometheus metrics
   - [ ] Criar alertas para 503s
   - [ ] Dashboard de saúde do BD

2. **Performance:**
   - [ ] Cache de agregações (Redis)
   - [ ] Índices de BD para queries lentas
   - [ ] Connection pooling com PgBouncer

3. **Resilência:**
   - [ ] Circuit breaker para BD
   - [ ] Retry automático com exponential backoff
   - [ ] Fallback em cache para leitura

---

## Mudanças no docker-compose.yml (Recomendado)

```yaml
backend:
  environment:
    DB_POOL_SIZE: 10
    DB_MAX_OVERFLOW: 20
    DB_POOL_RECYCLE: 3600
    # ... outros envs
```

Isso permite ajustar sem modificar código.
