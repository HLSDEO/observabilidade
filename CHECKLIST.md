# Checklist de Validação

## Setup Inicial

- [ ] Clonar repositório: `git clone <repo>`
- [ ] Entrar na pasta: `cd observabilidade-logs`
- [ ] Docker está instalado: `docker --version`
- [ ] Docker Compose está instalado: `docker-compose --version`

## Com Docker Compose

### Inicializar
- [ ] Executar: `docker-compose up --build`
- [ ] Aguardar PostgreSQL inicializar (~10s)
- [ ] Aguardar Backend inicializar (~30s)
- [ ] Aguardar Frontend compilar (~1m)

### Verificar Status
- [ ] Backend Health: `curl http://localhost:8000/health`
  - Esperado: `{"status": "ok"}`
- [ ] Backend Swagger: http://localhost:8000/docs
  - Deve abrir documentação interativa
- [ ] Frontend: http://localhost:3000
  - Deve abrir página inicial

## Enviar Logs de Teste

- [ ] Executar script Python: `python scripts/send_test_logs.py`
  - Deve exibir "✓ 50 logs enviados!"
- [ ] Ou enviar via curl:
  ```bash
  curl -X POST http://localhost:8000/api/logs \
    -H "Content-Type: application/json" \
    -d '{"start":"2026-05-21T10:30:00Z","end":"2026-05-21T10:30:05Z","source":"robo-contratos","type":"error","identifier":"contrato-1","data":"Teste","location":"ProcessadorContratos.processar()","environment":"prod","identifier_2":"municipio-1"}'
  ```
  - Deve retornar status 201 com dados do log

## Testar Endpoints

### POST /api/logs
- [ ] `curl -X POST http://localhost:8000/api/logs -H "Content-Type: application/json" -d '{...}'`
- [ ] Response status: 201
- [ ] Response inclui: id, start_time, end_time, source, type

### GET /api/logs
- [ ] `curl http://localhost:8000/api/logs`
- [ ] Response é lista de logs
- [ ] Filtros funcionam: `?source=robo-contratos&type=error`

### POST /api/queries/aggregate
- [ ] `curl -X POST http://localhost:8000/api/queries/aggregate -H "Content-Type: application/json" -d '{"source":"robo-contratos","aggregation":"count","filters":{"type":"error"},"groupBy":["identifier_2"]}'`
- [ ] Response é lista de agregações
- [ ] Inclui campos: identifier_2, count

### POST /api/queries/details
- [ ] `curl -X POST http://localhost:8000/api/queries/details -H "Content-Type: application/json" -d '{"source":"robo-contratos","filters":{"type":"error"},"limit":10}'`
- [ ] Response inclui: total, limit, offset, data
- [ ] data é array de logs completos

### GET /api/dashboards
- [ ] `curl http://localhost:8000/api/dashboards`
- [ ] Response é lista vazia (inicial)

## Frontend - DashboardEditor

### Criar Dashboard
- [ ] Acessar http://localhost:3000
- [ ] Clicar "+ Novo Dashboard"
- [ ] Preencher:
  - [ ] Nome: "Dashboard Teste"
  - [ ] Descrição: "Para validar funcionamento"
  - [ ] Refresh: 30 (padrão)
- [ ] Clicar "+ Adicionar Gráfico"
- [ ] Configurar card:
  - [ ] Título: "Contagem de Erros"
  - [ ] Tipo: "bar"
  - [ ] Source: "robo-contratos"
  - [ ] Agregação: "count"
  - [ ] Habilitar "Detalhar"
- [ ] Clicar "Criar Dashboard"
- [ ] Verificar sucesso (dashboard aparece na lista)

### Editar Dashboard
- [ ] Clicar "Editar" no dashboard criado
- [ ] Mudar nome para "Dashboard Teste v2"
- [ ] Clicar "Atualizar Dashboard"
- [ ] Verificar mudança refletida

## Frontend - DashboardViewer

### Visualizar Dashboard
- [ ] Clicarem "Visualizar" no dashboard
- [ ] Deve aparecer:
  - [ ] Título "Dashboard Teste v2"
  - [ ] TimeRangeFilter com opções 24h, 7d, 30d, custom
  - [ ] Auto-refresh control
  - [ ] Card com gráfico
  - [ ] Gráfico renderizado (barras com dados)

### Filtro de Tempo
- [ ] Clicar "24h" - gráfico atualiza
- [ ] Clicar "7 dias" - gráfico atualiza
- [ ] Clicar "30 dias" - gráfico atualiza
- [ ] Clicar "Customizado":
  - [ ] Preencher "De": 2 horas atrás
  - [ ] Preencher "Até": agora
  - [ ] Clicar "Aplicar"
  - [ ] Gráfico atualiza com novo intervalo

### Auto-Refresh
- [ ] Selecionar "10 segundos"
- [ ] Aguardar 15 segundos
- [ ] Gráfico deve atualizar automaticamente
- [ ] Mensagem "✓ Atualizando a cada 10s" aparece
- [ ] Selecionar "Desativado"
- [ ] Auto-refresh para

### Modal de Detalhes
- [ ] Clicar em uma barra do gráfico
- [ ] Modal abre com título "Detalhes dos Logs"
- [ ] Tabela contém colunas: Data/Hora, Tipo, Identificador, Dados, Status, Ações
- [ ] Dados aparecem ordenados por mais recente
- [ ] Botão "Copiar JSON" em cada linha:
  - [ ] Clicar uma vez
  - [ ] Botão muda para "✓ Copiado"
  - [ ] Cola o JSON (Ctrl+V) em um arquivo
  - [ ] JSON está bem formatado
- [ ] Se houver muitos resultados:
  - [ ] Aparecer botão "Carregar mais"
  - [ ] Clicar carrega próxima página
- [ ] Clicar X fecha modal

## Testes de Estresse (Opcional)

### Enviar muitos logs
```bash
for i in {1..1000}; do
  curl -X POST http://localhost:8000/api/logs \
    -H "Content-Type: application/json" \
    -d "{\"start\":\"2026-05-21T10:$(printf '%02d' $((i % 60))):00Z\",\"end\":\"2026-05-21T10:$(printf '%02d' $((i % 60))):05Z\",\"source\":\"robo-contratos\",\"type\":\"$([ $((i % 3)) -eq 0 ] && echo 'error' || echo 'success')\",\"identifier\":\"contrato-$i\",\"data\":\"Log $i\",\"location\":\"ProcessadorContratos\",\"environment\":\"prod\",\"identifier_2\":\"municipio-$(($i % 5))\"}" &
done
```

- [ ] Comando completa sem erros
- [ ] Dashboard continua responsivo
- [ ] Agregações são calculadas corretamente

## Testes com Banco de Dados

### Verificar dados no PostgreSQL
```sql
-- Conectar ao banco
docker exec -it observabilidade_logs_postgres psql -U postgres -d observabilidade_logs

-- Queries para validar
SELECT COUNT(*) FROM logs;
SELECT COUNT(*) FROM dashboards;
SELECT DISTINCT source FROM logs;
SELECT DISTINCT type FROM logs;
```

- [ ] Total de logs corresponde (50+ após testes)
- [ ] Total de dashboards = 1 (o criado)
- [ ] Source lista: robo-contratos
- [ ] Types listam: error, success, etc

## Testes de Segurança

### CORS
- [ ] Frontend consegue chamar Backend
- [ ] Erro CORS não aparece no console
- [ ] curl com Origin header funciona

### Input Validation
- [ ] Enviar log com campo vazio:
  ```bash
  curl -X POST http://localhost:8000/api/logs \
    -H "Content-Type: application/json" \
    -d '{"start":"2026-05-21T10:30:00Z","end":"2026-05-21T10:30:05Z","source":"","type":"error",...}'
  ```
- [ ] Deve retornar 422 (validation error)

### SQL Injection
- [ ] Enviar identifier com SQL injection attempt:
  ```bash
  curl -X POST http://localhost:8000/api/logs \
    -H "Content-Type: application/json" \
    -d '{"identifier":"'; DROP TABLE logs; --",...}'
  ```
- [ ] Log criado com identifier como string literal (seguro)
- [ ] Table `logs` não foi deletada

## Performance

### Verificar Índices
- [ ] `docker exec observabilidade_logs_postgres psql -U postgres -d observabilidade_logs -c "\d+ logs"`
- [ ] Índices aparecem para: start_time, source, type, created_at

### Tempo de Query
- [ ] Query simples (<100ms): `SELECT COUNT(*) FROM logs`
- [ ] Agregação complexa (~500ms): GROUP BY com múltiplos filtros

## Cleanup & Reset

### Parar containers
- [ ] `docker-compose down`
- [ ] Todos os containers param sem erro

### Resetar banco
- [ ] `docker volume rm observabilidade-logs_postgres_data`
- [ ] `docker-compose up`
- [ ] Banco começa vazio

### Limpar imagens
- [ ] `docker-compose down --rmi all`
- [ ] `docker image prune`

## Documentação

- [ ] README.md é acessível e compreensível
- [ ] SETUP.md tem instruções passo-a-passo
- [ ] ARQUITETURA.md explica design
- [ ] DESENVOLVIMENTO.md tem dicas
- [ ] Swagger em /docs lista todos endpoints

## Próximos Passos (Pós-MVP)

- [ ] Implementar testes unitários
- [ ] Adicionar CI/CD pipeline
- [ ] Integração com Keycloak
- [ ] Alertas customizados
- [ ] Exportar PDF
- [ ] Versionamento de dashboards

## Sign-off

- [ ] Todos os itens acima foram validados
- [ ] Aplicação funcionando como esperado
- [ ] Pronto para apresentação/uso

**Data de Validação:** ___/___/______

**Validado por:** _____________________

**Observações:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
