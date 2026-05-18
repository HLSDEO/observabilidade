#!/bin/bash
# Script para iniciar stack de observabilidade

set -e

echo "🚀 Iniciando stack de observabilidade..."
echo ""

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker e tente novamente."
    exit 1
fi

# Build e start
echo "📦 Iniciando containers..."
docker-compose up -d

echo ""
echo "⏳ Aguardando serviços iniciarem (30s)..."
sleep 30

# Verificar status
echo ""
echo "✅ Status dos containers:"
docker-compose ps

echo ""
echo "📊 Acessar interfaces:"
echo "   • Grafana:       http://localhost:3000 (admin/admin)"
echo "   • Prometheus:    http://localhost:9090"
echo "   • AlertManager:  http://localhost:9093"
echo "   • Node Exporter: http://localhost:9100"
echo "   • cAdvisor:      http://localhost:8080"
echo ""
echo "📝 Ver logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Parar stack:"
echo "   docker-compose down"
echo ""
