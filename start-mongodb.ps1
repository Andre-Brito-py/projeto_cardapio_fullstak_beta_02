# Script para inicializar MongoDB via Docker
# Este script verifica se o Docker esta instalado e inicia o MongoDB

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    MONGODB - INICIALIZACAO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Funcao para verificar se um comando existe
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Verificar Docker
Write-Host "[VERIFICACAO] Verificando Docker..." -ForegroundColor Yellow
if (-not (Test-Command "docker")) {
    Write-Host "ERRO: Docker nao encontrado." -ForegroundColor Red
    Write-Host "Por favor, instale o Docker Desktop:" -ForegroundColor Yellow
    Write-Host "https://www.docker.com/products/docker-desktop/" -ForegroundColor Blue
    Write-Host "" 
    Write-Host "Alternativa: Instale o MongoDB localmente:" -ForegroundColor Yellow
    Write-Host "https://www.mongodb.com/try/download/community" -ForegroundColor Blue
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se o Docker esta rodando
try {
    docker version | Out-Null
    Write-Host "Docker encontrado e rodando" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Docker nao esta rodando." -ForegroundColor Red
    Write-Host "Por favor, inicie o Docker Desktop primeiro." -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se o MongoDB ja esta rodando
$mongoContainer = docker ps --filter "name=food-delivery-mongodb" --format "table {{.Names}}" 2>$null
if ($mongoContainer -match "food-delivery-mongodb") {
    Write-Host "MongoDB ja esta rodando" -ForegroundColor Green
    Write-Host "URLs disponiveis:" -ForegroundColor Yellow
    Write-Host "   MongoDB: mongodb://localhost:27017" -ForegroundColor White
    Write-Host "   Mongo Express: http://localhost:8081" -ForegroundColor White
    Write-Host ""
    Read-Host "Pressione Enter para continuar"
    exit 0
}

# Iniciar MongoDB via Docker Compose
Write-Host "Iniciando MongoDB via Docker..." -ForegroundColor Green
Write-Host "Isso pode levar alguns minutos na primeira execucao..." -ForegroundColor Yellow
Write-Host ""

try {
    docker-compose up -d mongodb
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "MongoDB iniciado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "URLs disponiveis:" -ForegroundColor Yellow
        Write-Host "   MongoDB: mongodb://localhost:27017" -ForegroundColor White
        Write-Host "   Mongo Express: http://localhost:8081" -ForegroundColor White
        Write-Host ""
        Write-Host "Credenciais:" -ForegroundColor Yellow
        Write-Host "   Usuario Admin: admin" -ForegroundColor White
        Write-Host "   Senha Admin: admin123" -ForegroundColor White
        Write-Host "   Usuario App: fooddelivery" -ForegroundColor White
        Write-Host "   Senha App: fooddelivery123" -ForegroundColor White
        Write-Host ""
        Write-Host "Aguardando MongoDB inicializar..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        # Verificar se esta realmente rodando
        $mongoRunning = docker ps --filter "name=food-delivery-mongodb" --format "table {{.Names}}" 2>$null
        if ($mongoRunning -match "food-delivery-mongodb") {
            Write-Host "MongoDB esta rodando e pronto para uso!" -ForegroundColor Green
            
            # Opcional: Iniciar Mongo Express tambem
            Write-Host "Iniciando Mongo Express (Interface Web)..." -ForegroundColor Green
            docker-compose up -d mongo-express
            Start-Sleep -Seconds 5
            
            Write-Host "Mongo Express disponivel em: http://localhost:8081" -ForegroundColor Green
        } else {
            Write-Host "MongoDB pode estar ainda inicializando..." -ForegroundColor Yellow
            Write-Host "Verifique os logs com: docker-compose logs mongodb" -ForegroundColor White
        }
    } else {
        Write-Host "ERRO: Falha ao iniciar MongoDB" -ForegroundColor Red
        Write-Host "Verifique os logs com: docker-compose logs mongodb" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Para parar o MongoDB: docker-compose down" -ForegroundColor Yellow
Write-Host "Para ver logs: docker-compose logs mongodb" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Pressione Enter para finalizar"