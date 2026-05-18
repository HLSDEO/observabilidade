# Stack de Observabilidade - Prometheus + Grafana

Stack completo para monitoramento da aplicação **Robo Contratos Transparência** com Prometheus e Grafana.

## Serviços Incluídos

| Serviço | Porta | URL | Descrição |
|---------|-------|-----|-----------|
| **Prometheus** | 9090 | http://localhost:9090 | Armazenamento e consulta de métricas |
| **Grafana** | 3000 | http://localhost:3000 | Visualização e dashboards |
| **AlertManager** | 9093 | http://localhost:9093 | Gerenciamento de alertas |
| **Node Exporter** | 9100 | http://localhost:9100 | Métricas do sistema operacional |
| **cAdvisor** | 8080 | http://localhost:8080 | Métricas de containers |

## Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM mínimo
- Robo Contratos rodando e expondo métricas na porta 8000

## Início Rápido

### 1. Build e Start

```bash
docker-compose up -d
```

Aguarde ~30 segundos para todos os serviços iniciarem.

### 2. Acessar Interfaces

**Grafana Dashboard:**
- URL: http://localhost:3000
- Usuário: `admin`
- Senha: `admin` (mude após primeiro login!)

**Prometheus Console:**
- URL: http://localhost:9090
- Testar query: `contratos_processados_total`

**AlertManager:**
- URL: http://localhost:9093

## Estrutura de Arquivos

```
observabilidade/
├── docker-compose.yml           # Orquestração de containers
├── prometheus.yml               # Configuração Prometheus
├── alertmanager.yml             # Configuração AlertManager
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── prometheus.yml   # Datasource automático
│   │   └── dashboards/
│   │       └── dashboards.yml   # Provisioning de dashboards
│   └── dashboards/
│       └── robo-contratos.json  # Dashboard do Robo Contratos
└── README.md
```

## Métricas Disponíveis

### Contratos

- `contratos_processados_total` - Total de contratos processados (labels: unidade, status)
- `contratos_falha_total` - Contratos com falha (labels: unidade, tipo_erro)
- `tempo_processamento_contrato_segundos` - Histograma de tempo por contrato

### API

- `api_requisicoes_total` - Requisições à API (labels: endpoint, status)
- `tempo_api_post_segundos` - Histograma de tempo de API POST

### Sistema

- `threads_ativas` - Número de threads ativas no momento
- `unidades_processadas` - Contador de unidades processadas
- `unidades_falhadas` - Contador de unidades com erro
- `tempo_processamento_unidade_segundos` - Histograma por unidade
- `tempo_execucao_total_segundos` - Tempo total de execução

## Configuração

### Conectar Robo Contratos

A conexão é feita via `docker-compose.yml`:

```yaml
static_configs:
  - targets: ['robo-contratos:8000']  # Nome do serviço
```

Se o Robo Contratos está em outro host ou rede:

```yaml
# prometheus.yml
- job_name: 'robo-contratos'
  static_configs:
    - targets: ['seu-ip:8000']  # IP/hostname do Robo Contratos
```

### Mudar Senha do Grafana

```bash
# Acessar container Grafana
docker exec -it grafana bash

# Usar grafana-cli para mudar senha
grafana-cli admin reset-admin-password nova-senha
```

### Alertas (Slack)

1. Criar Slack Webhook: https://api.slack.com/messaging/webhooks
2. Editar `alertmanager.yml`:
   ```yaml
   global:
     slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
   ```
3. Descomentare configurar receivers de Slack
4. Reiniciar: `docker-compose restart alertmanager`

## Queries Úteis

### Taxa de Sucesso

```promql
rate(contratos_processados_total{status="sucesso"}[5m]) /
(rate(contratos_processados_total[5m]) + 0.001)
```

### Contratos por Segundo

```promql
rate(contratos_processados_total[1m])
```

### Tempo Médio de Processamento

```promql
histogram_quantile(0.95, tempo_processamento_unidade_segundos_bucket)
```

### Taxa de Erro de API

```promql
rate(api_requisicoes_total{status="erro"}[5m])
```

## Logs e Troubleshooting

### Ver logs de um serviço

```bash
docker-compose logs -f prometheus
docker-compose logs -f grafana
```

### Verificar status

```bash
docker-compose ps
```

### Reiniciar um serviço

```bash
docker-compose restart prometheus
```

### Limpar volumes (CUIDADO!)

```bash
docker-compose down -v
```

## Performance e Recursos

### Retenção de Dados

Por padrão, Prometheus retém 30 dias. Para ajustar:

```bash
# docker-compose.yml - comando Prometheus
'--storage.tsdb.retention.time=90d'  # 90 dias
```

### Limite de Memória

Ajuste em `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 2G
```

## Backup

### Backup de dados Prometheus

```bash
docker exec prometheus tar -czf - /prometheus | gzip > prometheus-backup.tar.gz
```

### Backup de dados Grafana

```bash
docker exec grafana tar -czf - /var/lib/grafana | gzip > grafana-backup.tar.gz
```

## Deploy em Produção

1. **Mude a senha do Grafana**
2. **Configure autenticação LDAP/OAuth** em Grafana
3. **Configure alertas** via Slack/PagerDuty
4. **Adicione reverse proxy** (Nginx/Caddy) com SSL
5. **Configure backups** automáticos
6. **Use volumes persistentes** em produção
7. **Configure logs centralizados** (ELK, Loki)

Exemplo nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name monitoring.example.com;
    
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Parar Stack

```bash
docker-compose down
```

Para remover volumes também:

```bash
docker-compose down -v
```

## Referências

- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/grafana/)
- [AlertManager](https://prometheus.io/docs/alerting/latest/overview/)
- [Prometheus Client Libraries](https://prometheus.io/docs/instrumenting/clientlibs/)

## Suporte

Para problemas:

1. Verificar logs: `docker-compose logs -f`
2. Verificar targets Prometheus: http://localhost:9090/targets
3. Testar conectividade: `docker exec prometheus curl -v http://robo-contratos:8000/metrics`

