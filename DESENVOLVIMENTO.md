# Guia de Desenvolvimento

## Estrutura de Diretórios

### Backend
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Entry point FastAPI
│   ├── config.py               # Configurações globais
│   ├── database.py             # SQLAlchemy setup
│   ├── models/                 # ORM Models
│   │   ├── __init__.py
│   │   ├── log.py
│   │   └── dashboard.py
│   ├── schemas/                # Pydantic schemas (validação)
│   │   ├── __init__.py
│   │   ├── log_schema.py
│   │   └── dashboard_schema.py
│   ├── routes/                 # API endpoints
│   │   ├── __init__.py
│   │   ├── logs.py
│   │   ├── dashboards.py
│   │   └── queries.py
│   └── services/               # Business logic (futuro)
│       └── __init__.py
├── tests/                      # Testes unitários (futuro)
├── scripts/
│   └── send_test_logs.py
├── requirements.txt
├── Dockerfile
├── .env.example
└── .env                        # Não commitar
```

### Frontend
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── index.tsx               # Entry point React
│   ├── App.tsx                 # Componente raiz + Router
│   ├── pages/
│   │   ├── DashboardEditor.tsx
│   │   └── DashboardViewer.tsx
│   ├── components/
│   │   ├── TimeRangeFilter.tsx
│   │   ├── ChartRenderer.tsx
│   │   ├── DetailModal.tsx
│   │   └── DashboardCard.tsx
│   ├── services/
│   │   ├── api.ts              # Axios client
│   │   ├── dashboardService.ts
│   │   └── queryService.ts
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   └── styles/
│       └── index.css           # Tailwind + custom
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env.example
└── .env                        # Não commitar
```

## Adicionando Novos Endpoints

### 1. Criar Schema (Validação)
```python
# backend/app/schemas/novo_schema.py
from pydantic import BaseModel

class NovoCreate(BaseModel):
    campo1: str
    campo2: int
```

### 2. Criar Modelo (ORM)
```python
# backend/app/models/novo.py
from sqlalchemy import Column, String, Integer
from app.database import Base

class Novo(Base):
    __tablename__ = "novos"
    
    id = Column(Integer, primary_key=True)
    campo1 = Column(String(255))
    campo2 = Column(Integer)
```

### 3. Criar Route
```python
# backend/app/routes/novo.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import NovoCreate
from app.models import Novo

router = APIRouter(prefix="/novo", tags=["novo"])

@router.post("/", response_model=dict)
def create_novo(novo: NovoCreate, db: Session = Depends(get_db)):
    db_novo = Novo(**novo.dict())
    db.add(db_novo)
    db.commit()
    db.refresh(db_novo)
    return db_novo
```

### 4. Registrar Route em main.py
```python
from app.routes import novo

app.include_router(novo.router, prefix="/api")
```

## Adicionando Novo Tipo de Gráfico

### 1. Atualizar tipo CardConfig
```typescript
// frontend/src/types/index.ts
export interface CardConfig {
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'novo_tipo'; // Adicionar aqui
  // ...
}
```

### 2. Implementar Renderizador
```typescript
// frontend/src/components/ChartRenderer.tsx
case 'novo_tipo':
  return (
    <div className="seu-novo-grafico">
      {/* Implementar rendering */}
    </div>
  );
```

### 3. Testar
- Criar dashboard
- Selecionar novo tipo no editor
- Verificar renderização no viewer

## Adicionando Campo ao Log

### 1. Atualizar Schema
```python
# backend/app/schemas/log_schema.py
class LogCreate(BaseModel):
    # ... campos existentes
    novo_campo: Optional[str] = None  # Adicionar aqui
```

### 2. Atualizar Modelo
```python
# backend/app/models/log.py
class Log(Base):
    # ... colunas existentes
    novo_campo = Column(String(255))  # Adicionar aqui
```

### 3. Migrar Banco (Manual)
```sql
ALTER TABLE logs ADD COLUMN novo_campo VARCHAR(255);
```

### 4. Atualizar Frontend
```typescript
// frontend/src/types/index.ts
export interface Log {
  // ... campos existentes
  novo_campo?: string;  // Adicionar aqui
}
```

## Testes

### Backend - Com pytest (Futuro)
```bash
cd backend
pip install pytest pytest-cov

# Rodar testes
pytest

# Com cobertura
pytest --cov=app
```

### Frontend - Com Jest (Futuro)
```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Rodar testes
npm test
```

## Deploy

### Build Docker
```bash
# Backend
cd backend
docker build -t observabilidade-logs-backend:latest .

# Frontend
cd frontend
docker build -t observabilidade-logs-frontend:latest .
```

### Push para Registry
```bash
docker tag observabilidade-logs-backend:latest myregistry/observabilidade-logs-backend:latest
docker push myregistry/observabilidade-logs-backend:latest
```

### Kubernetes
```bash
# Criar namespace
kubectl create namespace observabilidade

# Deploy
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Verificar
kubectl get pods -n observabilidade
kubectl logs -n observabilidade deployment/backend
```

## Debugging

### Backend

#### Print debugging
```python
import logging
logger = logging.getLogger(__name__)
logger.info("Message", extra={"key": value})
```

#### FastAPI Debugger
```python
# main.py
if settings.debug:
    app.add_middleware(DebugMiddleware)
```

#### PostgreSQL
```sql
-- Conectar ao banco
docker exec -it observabilidade_logs_postgres psql -U postgres -d observabilidade_logs

-- Queries úteis
SELECT * FROM logs ORDER BY created_at DESC LIMIT 10;
SELECT COUNT(*) FROM logs;
SELECT DISTINCT type FROM logs;
```

### Frontend

#### React DevTools
- Instalar extensão Chrome: "React Developer Tools"
- F12 > Components tab

#### Console
```typescript
// Log de requisições
console.log('Request:', { ...request });
console.log('Response:', response.data);
```

#### Network Tab (F12)
- Verificar requisições ao backend
- Verificar status codes
- Verificar response bodies

## Convenções de Código

### Python
- PEP 8: `python -m autopep8 --in-place <arquivo>`
- Type hints em todas as funções
- Docstrings para funções públicas
- Nomes descritivos

### TypeScript
- Trailing commas
- Semicolons
- 2 espaços indentation
- Preferir `const` sobre `let`
- Usar interfaces para tipos públicos

## Git Workflow

### Criar branch
```bash
git checkout -b feature/nova-feature
```

### Commit message
```
tipo: descrição curta

Descrição mais longa explicando o que foi feito
e por que.

Fixes #123
```

Tipos:
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Tarefas

### Push e PR
```bash
git push origin feature/nova-feature
# Criar PR no GitHub
```

## Dicas de Performance

### Backend
```python
# ✅ Bom: Usar índices
query = db.query(Log).filter(Log.source == source).filter(Log.type == type)

# ❌ Ruim: Sem índices relevantes
query = db.query(Log).filter(Log.data.like("%algo%"))
```

### Frontend
```typescript
// ✅ Bom: Memoization
const MyComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// ❌ Ruim: Re-render desnecessário
const MyComponent = ({ data }) => {
  return <div>{data}</div>;
};
```

## Variáveis de Ambiente

### Backend
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
APP_NAME="Observabilidade Logs"
DEBUG=true
LOG_LEVEL=INFO
```

### Frontend
```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ENVIRONMENT=development
```

## Troubleshooting de Desenvolvimento

### Backend não inicia
```bash
# Verificar Python
python --version

# Verificar dependências
pip list | grep fastapi

# Reinstalar
pip install -r requirements.txt --force-reinstall
```

### Frontend não inicia
```bash
# Limpar cache
rm -rf node_modules package-lock.json
npm install

# Verificar Node
node --version
npm --version
```

### Banco inacessível
```bash
# Verificar conexão
psql postgresql://user:pass@localhost:5432/db

# Verificar container (Docker)
docker ps | grep postgres
docker logs observabilidade_logs_postgres
```

### CORS errors
- Verificar `allow_origins` em main.py
- Verificar REACT_APP_API_URL
- Testar com curl:
  ```bash
  curl -H "Origin: http://localhost:3000" http://localhost:8000/api/dashboards
  ```

## Recursos Úteis

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- [React Docs](https://react.dev/)
- [Recharts Docs](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## Próximas Melhorias

- [ ] Testes unitários (pytest + jest)
- [ ] CI/CD Pipeline (GitHub Actions)
- [ ] Autenticação (Keycloak)
- [ ] Alertas customizados
- [ ] Exportar dashboards (PDF/PNG)
- [ ] Webhooks para notificações
- [ ] Backup automático do banco
- [ ] Versionamento de dashboards
- [ ] Compartilhamento de dashboards
- [ ] API Rate limiting
