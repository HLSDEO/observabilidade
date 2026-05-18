# Integração: Robo Contratos + Stack de Observabilidade

Guia completo para integrar o **Robo Contratos Transparência** com o **Stack de Observabilidade (Prometheus + Grafana)**.

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│        Robo Contratos (porta 8000)                      │
│  ├─ Processa contratos                                 │
│  ├─ Expõe métricas em /metrics                         │
│  └─ Envia dados para API                               │
└────────────────┬────────────────────────────────────────┘
                 │ Prometheus scrape (port 8000)
                 ▼
┌─────────────────────────────────────────────────────────┐
│    Prometheus (porta 9090)                              │
│  ├─ Coleta métricas a cada 30s                         │
│  ├─ Armazena em time series (30 dias)                  │
│  └─ Fornece dados para Grafana                         │
└─────────────┬───────────────────────────────────────────┘
              │ HTTP queries
              ▼
┌─────────────────────────────────────────────────────────┐
│    Grafana (porta 3000)                                 │
│  ├─ Visualiza dashboards                               │
│  ├─ Cria alertas                                       │
│  └─ Integra com Slack/PagerDuty                        │
└─────────────────────────────────────────────────────────┘
```

## Opção 1: Tudo com Docker Compose (Recomendado)

### 1.1 Estrutura de Diretórios

```
~/projetos/
├── robo_contratos_transparencia/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── ... (arquivos da app)
└── observabilidade/
    ├── docker-compose.yml
    ├── prometheus.yml
    └── ... (arquivos do stack)
```

### 1.2 Network Compartilhada

Criar arquivo `docker-compose.override.yml` em **robo_contratos_transparencia**:

```yaml
version: '3.8'

services:
  robo-contratos:
    networks:
      - observability-network

networks:
  observability-network:
    external: true
    name: observabilidade_default  # Nome da network do observabilidade
```

### 1.3 Iniciar Stack

```bash
# Terminal 1: Iniciar observabilidade
cd ~/projetos/observabilidade
docker-compose up

# Terminal 2: Iniciar robo contratos
cd ~/projetos/robo_contratos_transparencia
docker-compose up
```

### 1.4 Verificar Conexão

```bash
# Acessar Prometheus
curl http://localhost:9090/api/v1/query?query=contratos_processados_total

# Acessar Grafana
open http://localhost:3000
```

## Opção 2: Stack Unificado

Criar arquivo único `docker-compose-completo.yml` em **observabilidade**:

```yaml
version: '3.8'

services:
  robo-contratos:
    build:
      context: ../robo_contratos_transparencia
    container_name: robo-contratos
    ports:
      - "8000:8000"
    environment:
      - THREAD_COUNT=4
      - AMBIENTE=prod
    volumes:
      - ../robo_contratos_transparencia/files:/app/files
    depends_on:
      - prometheus

  prometheus:
    # ... (copiar configuração do observabilidade/docker-compose.yml)

  grafana:
    # ... (copiar configuração do observabilidade/docker-compose.yml)

  # ... outros serviços
```

Rodar:

```bash
docker-compose -f docker-compose-completo.yml up
```

## Opção 3: Kubernetes (Produção)

### 3.1 Deployments Kubernetes

**robo-contratos-deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: robo-contratos
  labels:
    app: robo-contratos
spec:
  replicas: 1
  selector:
    matchLabels:
      app: robo-contratos
  template:
    metadata:
      labels:
        app: robo-contratos
    spec:
      containers:
      - name: robo-contratos
        image: seu-registry/robo-contratos:latest
        ports:
        - containerPort: 8000
        env:
        - name: THREAD_COUNT
          value: "4"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
---
apiVersion: v1
kind: Service
metadata:
  name: robo-contratos
spec:
  selector:
    app: robo-contratos
  ports:
  - protocol: TCP
    port: 8000
    targetPort: 8000
  type: ClusterIP
```

**prometheus-configmap.yaml:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 30s
    scrape_configs:
      - job_name: 'robo-contratos'
        static_configs:
          - targets: ['robo-contratos:8000']
```

### 3.2 Deploy

```bash
kubectl apply -f robo-contratos-deployment.yaml
kubectl apply -f prometheus-configmap.yaml
# ... deployments do Prometheus e Grafana
```

## Verificação de Conectividade

### Teste 1: Prometheus consegue coletar métricas?

```bash
# Acessar Prometheus
http://localhost:9090/targets

# Verificar status do job "robo-contratos"
# Deve estar "UP" se está coletando métricas
```

### Teste 2: Métricas estão chegando?

```bash
# Query no Prometheus
http://localhost:9090/graph?query=contratos_processados_total

# Deve retornar valores não vazios
```

### Teste 3: Grafana está visualizando?

```bash
# Acessar Grafana
http://localhost:3000

# Dashboard "Robo Contratos - Monitoramento" deve mostrar gráficos
```

### Teste 4: Verificar logs

```bash
# Robo Contratos
docker-compose logs -f robo-contratos

# Prometheus
docker-compose logs -f prometheus

# Grafana
docker-compose logs -f grafana
```

## Troubleshooting

### Prometheus não consegue scrape do Robo Contratos

**Sintoma:** `DOWN` em http://localhost:9090/targets

**Solução:**

```bash
# 1. Verificar se robo-contratos está rodando
docker-compose ps robo-contratos

# 2. Verificar conectividade (dentro de prometheus)
docker exec prometheus curl -v http://robo-contratos:8000/metrics

# 3. Verificar prometheus.yml (path/targets corretos)
# - targets deve ser ['robo-contratos:8000'] em Docker Compose
# - targets deve ser ['seu-ip:8000'] se não está em network compartilhada
```

### Grafana não consegue conectar Prometheus

**Sintoma:** "Error in data source" em Grafana

**Solução:**

```bash
# 1. Verificar datasource em Grafana
# Ir para: Configuration > Data Sources > Prometheus

# 2. Testar conexão (clicar em "Test")

# 3. URL deve ser http://prometheus:9090 (em Docker Compose)

# 4. Restartar Grafana
docker-compose restart grafana
```

### Métricas não aparecem no dashboard

**Sintoma:** Gráficos vazios em Grafana

**Solução:**

```bash
# 1. Verificar se robo-contratos está enviando métricas
curl http://localhost:8000/metrics | grep contratos_processados_total

# 2. Aguardar 1-2 minutos para Prometheus coletar dados

# 3. Verificar time range no Grafana (canto superior direito)

# 4. Editar painel e verificar query Prometheus
```

## Métricas Principais

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `contratos_processados_total` | Counter | Total de contratos processados |
| `contratos_falha_total` | Counter | Total de falhas |
| `api_requisicoes_total` | Counter | Requisições à API |
| `tempo_processamento_contrato_segundos` | Histogram | Tempo por contrato |
| `threads_ativas` | Gauge | Threads ativas |

## Alertas Úteis

### Criar alerta de erro de API

Em Prometheus (prometheus.yml):

```yaml
rule_files:
  - 'alerts.yml'
```

Em `alerts.yml`:

```yaml
groups:
  - name: robo_contratos
    rules:
      - alert: AltoTaxaErroAPI
        expr: rate(api_requisicoes_total{status="erro"}[5m]) > 0.1
        for: 5m
        annotations:
          summary: "Taxa de erro de API acima de 10%"
```

## Performance

### Recomendações

- **Threads**: 4-6 (ajuste em config/parametros.py)
- **Prometheus scrape**: 30s (ajuste em prometheus.yml)
- **Retenção Prometheus**: 30 dias (padrão)
- **RAM Prometheus**: ~1-2GB
- **RAM Grafana**: ~512MB
- **RAM Robo Contratos**: ~2-4GB (4 threads)

### Monitorar Performance

```bash
# Uso de memória por container
docker stats

# Métricas do Prometheus
http://localhost:9090/metrics
```

## Backup

### Backup Prometheus

```bash
docker exec prometheus tar -czf - /prometheus > prometheus-backup.tar.gz
```

### Backup Grafana

```bash
docker exec grafana tar -czf - /var/lib/grafana > grafana-backup.tar.gz
```

### Backup Robo Contratos (CSV)

```bash
tar -czf robo-contratos-backup.tar.gz ~/projetos/robo_contratos_transparencia/files/
```

## Deploy em Produção

1. **Certificados SSL**: Nginx reverse proxy com Let's Encrypt
2. **Autenticação**: OAuth2 no Grafana
3. **Alertas**: Slack, PagerDuty ou Email
4. **Backup**: Automático diário para S3/NAS
5. **Monitoramento**: Alertas de down-time
6. **Logs**: Centralizados (ELK/Loki)

## Próximos Passos

- [ ] Configurar alertas no Slack
- [ ] Customizar dashboard Grafana
- [ ] Adicionar mais métricas (CPU, memória, I/O)
- [ ] Setup de backup automático
- [ ] Deploy em Kubernetes
- [ ] Integração com CI/CD

## Referências

- [Prometheus Integration](https://prometheus.io/docs/)
- [Grafana Data Source](https://grafana.com/docs/grafana/latest/datasources/prometheus/)
- [Docker Compose Networks](https://docs.docker.com/compose/networking/)
- [Kubernetes](https://kubernetes.io/docs/)
