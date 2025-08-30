# Food Delivery - Script de Inicialização Completo
# Este script verifica dependências, instala se necessário e inicia todos os serviços

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    FOOD DELIVERY - INICIALIZAÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Função para verificar se um comando existe
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Função para verificar se uma porta está em uso
function Test-Port($port) {
    $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
    return $connection
}

# Verificar Node.js
Write-Host "[VERIFICAÇÃO] Verificando Node.js..." -ForegroundColor Yellow
if (-not (Test-Command "node")) {
    Write-Host "ERRO: Node.js não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    Write-Host "Download: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}
$nodeVersion = node --version
Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green

# Verificar npm
if (-not (Test-Command "npm")) {
    Write-Host "ERRO: npm não encontrado." -ForegroundColor Red
    exit 1
}
$npmVersion = npm --version
Write-Host "✅ npm encontrado: v$npmVersion" -ForegroundColor Green

# Verificar MongoDB
Write-Host "[VERIFICAÇÃO] Verificando MongoDB..." -ForegroundColor Yellow
$mongoProcess = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
if (-not $mongoProcess) {
    Write-Host "⚠️  MongoDB não está rodando." -ForegroundColor Yellow
    Write-Host "   Certifique-se de iniciar o MongoDB antes de continuar." -ForegroundColor Yellow
    $continue = Read-Host "Deseja continuar mesmo assim? (s/n)"
    if ($continue -ne "s" -and $continue -ne "S") {
        exit 1
    }
} else {
    Write-Host "✅ MongoDB está rodando" -ForegroundColor Green
}

# Verificar se as portas estão livres
Write-Host "[VERIFICAÇÃO] Verificando portas..." -ForegroundColor Yellow
$ports = @(4000, 5173, 5174)
$portsInUse = @()

foreach ($port in $ports) {
    if (Test-Port $port) {
        $portsInUse += $port
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "⚠️  Portas em uso: $($portsInUse -join ', ')" -ForegroundColor Yellow
    Write-Host "   Os serviços podem usar portas alternativas." -ForegroundColor Yellow
}

# Função para instalar dependências se necessário
function Install-Dependencies($path, $name) {
    Write-Host "[DEPENDÊNCIAS] Verificando $name..." -ForegroundColor Yellow
    
    if (-not (Test-Path "$path\node_modules")) {
        Write-Host "📦 Instalando dependências do $name..." -ForegroundColor Cyan
        Set-Location $path
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERRO: Falha ao instalar dependências do $name" -ForegroundColor Red
            return $false
        }
        Write-Host "✅ Dependências do $name instaladas" -ForegroundColor Green
    } else {
        Write-Host "✅ Dependências do $name já instaladas" -ForegroundColor Green
    }
    return $true
}

# Voltar ao diretório raiz
Set-Location $PSScriptRoot

# Instalar dependências
$success = $true
$success = $success -and (Install-Dependencies "backend" "Backend")
$success = $success -and (Install-Dependencies "frontend" "Frontend")
$success = $success -and (Install-Dependencies "admin" "Admin")

if (-not $success) {
    Write-Host "ERRO: Falha na instalação de dependências" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Criar diretório de logs
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

Write-Host ""
Write-Host "[INICIALIZAÇÃO] Iniciando serviços..." -ForegroundColor Cyan

# Iniciar Backend
Write-Host "🚀 [1/3] Iniciando Backend (porta 4000)..." -ForegroundColor Green
Set-Location "$PSScriptRoot\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal
Start-Sleep -Seconds 3

# Iniciar Frontend
Write-Host "🚀 [2/3] Iniciando Frontend (porta 5173)..." -ForegroundColor Green
Set-Location "$PSScriptRoot\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 3

# Iniciar Admin
Write-Host "🚀 [3/3] Iniciando Admin (porta 5174)..." -ForegroundColor Green
Set-Location "$PSScriptRoot\admin"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 3

# Voltar ao diretório raiz
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    SERVIÇOS INICIADOS COM SUCESSO!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 URLs de acesso:" -ForegroundColor Yellow
Write-Host "   • Frontend (Clientes): http://localhost:5173" -ForegroundColor White
Write-Host "   • Admin (Lojas):       http://localhost:5174" -ForegroundColor White
Write-Host "   • Backend (API):       http://localhost:4000" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Aguardando serviços carregarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "🌐 Abrindo URLs no navegador..." -ForegroundColor Green
Start-Process "http://localhost:5173"
Start-Process "http://localhost:5174"

Write-Host ""
Write-Host "✅ Projeto iniciado com sucesso!" -ForegroundColor Green
Write-Host "📋 Verifique as janelas do PowerShell para logs dos serviços." -ForegroundColor Yellow
Write-Host "🛑 Para parar todos os serviços, feche as janelas do PowerShell." -ForegroundColor Yellow
Write-Host ""
Read-Host "Pressione Enter para finalizar este script"