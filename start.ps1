# Script para iniciar stack de observabilidade (Windows PowerShell)

Write-Host "🚀 Iniciando stack de observabilidade..." -ForegroundColor Green
Write-Host ""

# Verificar se Docker está rodando
try {
    docker info > $null 2>&1
} catch {
    Write-Host "❌ Docker não está rodando. Inicie o Docker e tente novamente." -ForegroundColor Red
    exit 1
}

# Build e start
Write-Host "📦 Iniciando containers..." -ForegroundColor Cyan
docker-compose up -d

Write-Host ""
Write-Host "⏳ Aguardando serviços iniciarem (30s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verificar status
Write-Host ""
Write-Host "✅ Status dos containers:" -ForegroundColor Green
docker-compose ps

Write-Host ""
Write-Host "📊 Acessar interfaces:" -ForegroundColor Cyan
Write-Host "   • Grafana:       http://localhost:3000 (admin/admin)"
Write-Host "   • Prometheus:    http://localhost:9090"
Write-Host "   • AlertManager:  http://localhost:9093"
Write-Host "   • Node Exporter: http://localhost:9100"
Write-Host "   • cAdvisor:      http://localhost:8080"
Write-Host ""
Write-Host "📝 Ver logs:" -ForegroundColor Cyan
Write-Host "   docker-compose logs -f"
Write-Host ""
Write-Host "🛑 Parar stack:" -ForegroundColor Cyan
Write-Host "   docker-compose down"
Write-Host ""
