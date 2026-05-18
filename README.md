# 📊 Stack de Observabilidade - Prometheus + Grafana

Stack completo de monitoramento para **Robo Contratos Transparência** e aplicações em geral. Inclui Prometheus, Grafana e Node Exporter em um docker-compose pronto para produção.

## 🎯 O que é

**Observabilidade** = Visibilidade total de como sua aplicação está se comportando:
- 📈 **Métricas** (números): requisições/s, tempo de resposta, erros, threads ativas
- 📝 **Logs** (eventos): o que aconteceu e quando
- 🔍 **Traces** (fluxos): seguir uma requisição pelo sistema

Este stack fornece **métricas + dashboards**.

## 🏗️ Arquitetura

```
┌──────────────────────────┐
│   Aplicações             │
│  (Robo Contratos etc)    │
│  :8000/metrics           │
└────────────┬─────────────┘
             │ HTTP (porta 8000)
             ↓
┌──────────────────────────┐
│    Prometheus            │
│    :9090                 │
│  - Scrape & store        │
│  - 2 anos retention      │
└─────────┬────────────────┘
          │ time series queries
          ↓
┌──────────────────────────┐
│     Grafana              │
│     :3000                │
│  - Dashboards            │
│  - Visualização          │
└──────────────────────────┘
```

## 🚀 Início Rápido

### 1. Iniciar Stack

```bash
# Build e start
docker-compose up -d

# Aguardar ~30s para tudo iniciar
sleep 30

# Ver status
docker-compose ps
```

### 2. Acessar Interfaces

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Grafana** | http://localhost:3000 | admin / admin |
| **Prometheus** | http://localhost:9090 | - |
| **Node Exporter** | http://localhost:9100 | - |

### 3. Conectar Robo Contratos

```bash
# Em outro terminal
cd ../robo_contratos_transparencia
docker-compose up
```

Prometheus scrapeará automaticamente `http://robo-contratos:8000/metrics`.

## 📦 Serviços Inclusos

| Serviço | Porta | CPU | RAM | Descrição |
|---------|-------|-----|-----|-----------|
| **Prometheus** | 9090 | 0.5 | 4GB | Armazena métricas time-series (2 anos) |
| **Grafana** | 3000 | 0.2 | 512MB | Visualização e dashboards |
| **Node Exporter** | 9100 | 0.1 | 50MB | Métricas do SO |

**Total:** ~4.5GB RAM, ~0.8 CPU (em repouso)

## ⚙️ Configuração

### Conectar Robo Contratos (Docker Compose)

Automático via `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'robo-contratos'
    static_configs:
      - targets: ['robo-contratos:8000']
```

### Conectar Host Externo

Editar `prometheus.yml`:

```yaml
- targets: ['seu-ip:8000']
```

Então: `docker-compose restart prometheus`

## 📊 Métricas Principais (Robo Contratos)

```
contratos_processados_total{unidade="...",status="sucesso"}
contratos_falha_total{unidade="..."}
tempo_processamento_unidade_segundos
tempo_api_post_segundos
threads_ativas
```

## 📈 Usar Grafana

### Ver Dashboards

1. Acesse http://localhost:3000
2. Vá para **Dashboards** (menu esquerdo)
3. Clique **Robo Contratos - Monitoramento**

Pronto! Você verá em tempo real:
- Taxa de contratos/s
- Tempo de processamento
- Taxa de sucesso/erro
- Threads ativas

### Criar Query Customizada

1. Novo painel
2. Selecione datasource **Prometheus**
3. Digite query:
   ```promql
   rate(contratos_processados_total[5m])  # Taxa (contratos/segundo)
   ```

### Alertas em Grafana

1. Edite painel
2. Clique "Alert"
3. Configure threshold
4. Salve

## 📝 Queries Úteis (Prometheus)

```promql
# Taxa de sucesso (%)
rate(contratos_processados_total{status="sucesso"}[5m]) / rate(contratos_processados_total[5m]) * 100

# Contratos por segundo
rate(contratos_processados_total[1m])

# Tempo médio (p95)
histogram_quantile(0.95, tempo_processamento_unidade_segundos_bucket)

# Erros por minuto
rate(contratos_falha_total[1m])

# Threads ativas agora
threads_ativas
```

Cole em http://localhost:9090/graph

## 🔄 Logs

Ver logs em tempo real:

```bash
docker-compose logs -f prometheus
docker-compose logs -f grafana
```

## 🛠️ Troubleshooting

### Prometheus não scrapeando Robo Contratos

```bash
# Verificar targets
http://localhost:9090/targets

# Deve estar "UP"
# Se "DOWN", ver erro ao lado

# Testar conectividade
docker exec prometheus curl -v http://robo-contratos:8000/metrics
```

### Grafana não vê Prometheus

```bash
# Verificar datasource
1. Configuration → Data Sources
2. Clique Prometheus
3. Test → deve dizer "Database Connection OK"

# Se falhar, URL deve ser:
# http://prometheus:9090  (Docker Compose)
```

### Alto uso de memória

```bash
# Reduzir retenção em prometheus.yml
'--storage.tsdb.retention.time=7d'  # De 30 dias para 7

docker-compose down
docker volume rm observabilidade_prometheus_data
docker-compose up -d
```

## 📂 Estrutura de Arquivos

```
observabilidade/
├── docker-compose.yml           # Serviços (Prometheus, Grafana)
├── prometheus.yml               # Config Prometheus (scrape targets)
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/prometheus.yml    # Datasource auto
│   │   └── dashboards/dashboards.yml     # Provisioning
│   └── dashboards/
│       └── robo-contratos.json           # Dashboard pronto
├── start.sh / start.ps1         # Scripts inicialização
├── README.md                    # Este arquivo
├── INTEGRACAO.md                # Guia com Robo Contratos
└── .dockerignore
```

## 🔐 Segurança em Produção

- [ ] **Trocar senha Grafana** (atual: admin/admin)
- [ ] **HTTPS** com Nginx reverse proxy
- [ ] **Autenticação** (OAuth2 no Grafana)
- [ ] **Backup** diário para S3/NAS
- [ ] **Firewall** (porta 9090 apenas interna)

Veja [INTEGRACAO.md](INTEGRACAO.md) para instruções completas.

## 💾 Backup e Restore

### Backup

```bash
# Prometheus data
docker exec prometheus tar -czf - /prometheus > prometheus.tar.gz

# Grafana data
docker exec grafana tar -czf - /var/lib/grafana > grafana.tar.gz
```

### Restore

```bash
# Limpar volumes
docker-compose down -v

# Restore
docker-compose up -d
docker exec prometheus tar -xzf - < prometheus.tar.gz -C /
docker exec grafana tar -xzf - < grafana.tar.gz -C /
```

## 🚀 Deploy em Produção

1. **Certificados SSL** → nginx com Let's Encrypt
2. **Senhas fortes** → trocar credenciais Grafana
3. **Backup automático** → cron job ou S3
4. **Alertas** → configurar Slack/PagerDuty
5. **Recursos** → ajustar limits conforme escala
6. **Monitoramento** → alertar de down-time

Veja [INTEGRACAO.md](INTEGRACAO.md) - seção "Deployment em Produção".

## 🧹 Limpeza

```bash
# Parar containers
docker-compose down

# Parar + remover volumes (CUIDADO - deleta dados!)
docker-compose down -v

# Remover imagens
docker-compose down --rmi all
```

## 📚 Referências

- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/grafana/)
- [AlertManager](https://prometheus.io/docs/alerting/latest/overview/)
- [PromQL](https://prometheus.io/docs/prometheus/latest/querying/basics/)

## 🤝 Suporte

Problemas? Veja:
1. Logs: `docker-compose logs -f`
2. Targets Prometheus: http://localhost:9090/targets
3. Teste conectividade: `docker exec prometheus curl -v http://robo-contratos:8000/metrics`

## 📄 Licença

MIT

---

**Versão:** 1.0.0 | **Status:** ✅ Produção | **Atualizado:** 2026-05-18
