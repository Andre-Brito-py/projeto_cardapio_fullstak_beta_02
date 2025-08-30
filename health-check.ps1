# Food Delivery - Script de Verificação de Saúde
# Este script verifica se todos os serviços estão funcionando corretamente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    FOOD DELIVERY - HEALTH CHECK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Função para testar uma URL
function Test-Url($url, $name, $expectedStatus = 200) {
    try {
        Write-Host "🔍 Testando $name..." -ForegroundColor Yellow -NoNewline
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq $expectedStatus) {
            Write-Host " ✅ OK" -ForegroundColor Green
            return $true
        } else {
            Write-Host " ❌ FALHA (Status: $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host " ❌ FALHA ($($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# Função para testar API com JSON
function Test-ApiEndpoint($url, $name) {
    try {
        Write-Host "🔍 Testando $name..." -ForegroundColor Yellow -NoNewline
        $response = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 10
        Write-Host " ✅ OK" -ForegroundColor Green
        return $true
    } catch {
        Write-Host " ❌ FALHA ($($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# Função para verificar se uma porta está em uso
function Test-Port($port, $name) {
    try {
        Write-Host "🔍 Verificando porta $port ($name)..." -ForegroundColor Yellow -NoNewline
        $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($connection) {
            Write-Host " ✅ ATIVA" -ForegroundColor Green
            return $true
        } else {
            Write-Host " ❌ INATIVA" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host " ❌ ERRO" -ForegroundColor Red
        return $false
    }
}

$allHealthy = $true

Write-Host "[VERIFICAÇÃO DE PORTAS]" -ForegroundColor Cyan
$backendPort = Test-Port 4000 "Backend"
$frontendPort = Test-Port 5173 "Frontend"
$adminPort = Test-Port 5174 "Admin"

Write-Host ""
Write-Host "[VERIFICAÇÃO DE SERVIÇOS]" -ForegroundColor Cyan

# Testar Backend
if ($backendPort) {
    $backendHealth = Test-Url "http://localhost:4000" "Backend API"
    $allHealthy = $allHealthy -and $backendHealth
} else {
    $allHealthy = $false
}

# Testar Frontend
if ($frontendPort) {
    $frontendHealth = Test-Url "http://localhost:5173" "Frontend"
    $allHealthy = $allHealthy -and $frontendHealth
} else {
    $allHealthy = $false
}

# Testar Admin
if ($adminPort) {
    $adminHealth = Test-Url "http://localhost:5174" "Admin Panel"
    $allHealthy = $allHealthy -and $adminHealth
} else {
    $allHealthy = $false
}

Write-Host ""
Write-Host "[VERIFICAÇÃO DE APIs ESPECÍFICAS]" -ForegroundColor Cyan

if ($backendPort) {
    # Testar endpoints específicos
    Test-ApiEndpoint "http://localhost:4000/api/food/list" "API - Lista de Alimentos"
    Test-ApiEndpoint "http://localhost:4000/api/category/list" "API - Lista de Categorias"
    
    # Testar endpoint público de loja (se houver lojas cadastradas)
    Write-Host "🔍 Testando API pública de loja..." -ForegroundColor Yellow -NoNewline
    try {
        # Primeiro, tentar obter uma loja de teste
        $testResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/store/public/loja-teste" -Method GET -TimeoutSec 5
        if ($testResponse.success) {
            Write-Host " ✅ OK (Loja teste encontrada)" -ForegroundColor Green
        } else {
            Write-Host " ⚠️  Nenhuma loja teste encontrada" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " ⚠️  Endpoint disponível mas sem dados de teste" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "[VERIFICAÇÃO DE DEPENDÊNCIAS]" -ForegroundColor Cyan

# Verificar MongoDB
Write-Host "🔍 Verificando MongoDB..." -ForegroundColor Yellow -NoNewline
$mongoProcess = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
if ($mongoProcess) {
    Write-Host " ✅ RODANDO" -ForegroundColor Green
} else {
    Write-Host " ❌ NÃO ENCONTRADO" -ForegroundColor Red
    $allHealthy = $false
}

# Verificar Node.js
Write-Host "🔍 Verificando Node.js..." -ForegroundColor Yellow -NoNewline
try {
    $nodeVersion = node --version
    Write-Host " ✅ $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host " ❌ NÃO ENCONTRADO" -ForegroundColor Red
    $allHealthy = $false
}

# Verificar npm
Write-Host "🔍 Verificando npm..." -ForegroundColor Yellow -NoNewline
try {
    $npmVersion = npm --version
    Write-Host " ✅ v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host " ❌ NÃO ENCONTRADO" -ForegroundColor Red
    $allHealthy = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($allHealthy) {
    Write-Host "    ✅ SISTEMA SAUDÁVEL" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎉 Todos os serviços estão funcionando corretamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 URLs disponíveis:" -ForegroundColor Yellow
    Write-Host "   • Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "   • Admin:    http://localhost:5174" -ForegroundColor White
    Write-Host "   • API:      http://localhost:4000" -ForegroundColor White
} else {
    Write-Host "    ❌ PROBLEMAS DETECTADOS" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  Alguns serviços não estão funcionando corretamente." -ForegroundColor Yellow
    Write-Host "💡 Sugestões:" -ForegroundColor Yellow
    Write-Host "   1. Execute o script start-project.ps1 para iniciar todos os serviços" -ForegroundColor White
    Write-Host "   2. Verifique se o MongoDB está rodando" -ForegroundColor White
    Write-Host "   3. Verifique os logs dos serviços para erros específicos" -ForegroundColor White
}

Write-Host ""
Read-Host "Pressione Enter para finalizar"