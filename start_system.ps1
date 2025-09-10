# Script para iniciar o sistema completo - IA Liza
# Execute este script no PowerShell

Write-Host "=== Iniciando Sistema IA Liza ===" -ForegroundColor Green
Write-Host "Preparando para iniciar todos os serviços..." -ForegroundColor Yellow

# Função para verificar se uma porta está em uso
function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

# Função para aguardar que um serviço esteja pronto
function Wait-ForService {
    param([int]$Port, [string]$ServiceName, [int]$MaxWait = 60)
    
    Write-Host "Aguardando $ServiceName na porta $Port..." -ForegroundColor Yellow
    $waited = 0
    
    while ($waited -lt $MaxWait) {
        if (Test-Port -Port $Port) {
            Write-Host "$ServiceName está pronto!" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 2
        $waited += 2
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    
    Write-Host "\nTempo limite atingido para $ServiceName" -ForegroundColor Red
    return $false
}

# Verificar dependências
Write-Host "\n1. Verificando dependências..." -ForegroundColor Cyan

# Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js não encontrado" -ForegroundColor Red
    exit 1
}

# Python
try {
    $pythonVersion = python --version
    Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python não encontrado" -ForegroundColor Red
    exit 1
}

# Verificar arquivos de configuração
Write-Host "\n2. Verificando configurações..." -ForegroundColor Cyan

if (Test-Path "./backend/.env") {
    Write-Host "✓ Backend .env encontrado" -ForegroundColor Green
} else {
    Write-Host "✗ Backend .env não encontrado" -ForegroundColor Red
    Write-Host "Execute primeiro: .\install_dependencies.ps1" -ForegroundColor Yellow
    exit 1
}

if (Test-Path "./ai-assistant/.env") {
    Write-Host "✓ IA Assistant .env encontrado" -ForegroundColor Green
} else {
    Write-Host "✗ IA Assistant .env não encontrado" -ForegroundColor Red
    Write-Host "Execute primeiro: .\install_dependencies.ps1" -ForegroundColor Yellow
    exit 1
}

# Verificar se as portas estão disponíveis
Write-Host "\n3. Verificando portas disponíveis..." -ForegroundColor Cyan

$backendPort = 3000
$aiPort = 8000

if (Test-Port -Port $backendPort) {
    Write-Host "✗ Porta $backendPort já está em uso" -ForegroundColor Red
    Write-Host "Finalize o processo que está usando a porta $backendPort" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✓ Porta $backendPort disponível" -ForegroundColor Green
}

if (Test-Port -Port $aiPort) {
    Write-Host "✗ Porta $aiPort já está em uso" -ForegroundColor Red
    Write-Host "Finalize o processo que está usando a porta $aiPort" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✓ Porta $aiPort disponível" -ForegroundColor Green
}

# Criar array para armazenar jobs
$jobs = @()

# Iniciar Backend
Write-Host "\n4. Iniciando Backend (Node.js)..." -ForegroundColor Cyan
Set-Location -Path "./backend"

$backendJob = Start-Job -ScriptBlock {
    Set-Location -Path $using:PWD
    Set-Location -Path "./backend"
    npm start
}

$jobs += $backendJob
Write-Host "Backend iniciado em background (Job ID: $($backendJob.Id))" -ForegroundColor Green

# Voltar ao diretório raiz
Set-Location -Path ".."

# Aguardar backend estar pronto
if (Wait-ForService -Port $backendPort -ServiceName "Backend") {
    Write-Host "Backend está rodando em http://localhost:$backendPort" -ForegroundColor Green
} else {
    Write-Host "ERRO: Backend não conseguiu iniciar" -ForegroundColor Red
    # Parar jobs
    $jobs | Stop-Job
    $jobs | Remove-Job
    exit 1
}

# Iniciar IA Assistant
Write-Host "\n5. Iniciando IA Assistant (Python)..." -ForegroundColor Cyan
Set-Location -Path "./ai-assistant"

# Verificar se o ambiente virtual existe
if (Test-Path "./venv/Scripts/Activate.ps1") {
    Write-Host "Ativando ambiente virtual Python..." -ForegroundColor Yellow
    
    $aiJob = Start-Job -ScriptBlock {
        Set-Location -Path $using:PWD
        Set-Location -Path "./ai-assistant"
        & ".\venv\Scripts\Activate.ps1"
        python -m chainlit run app.py --port 8000 --host localhost
    }
    
    $jobs += $aiJob
    Write-Host "IA Assistant iniciada em background (Job ID: $($aiJob.Id))" -ForegroundColor Green
} else {
    Write-Host "AVISO: Ambiente virtual não encontrado. Tentando executar diretamente..." -ForegroundColor Yellow
    
    $aiJob = Start-Job -ScriptBlock {
        Set-Location -Path $using:PWD
        Set-Location -Path "./ai-assistant"
        python -m chainlit run app.py --port 8000 --host localhost
    }
    
    $jobs += $aiJob
    Write-Host "IA Assistant iniciada em background (Job ID: $($aiJob.Id))" -ForegroundColor Green
}

# Voltar ao diretório raiz
Set-Location -Path ".."

# Aguardar IA Assistant estar pronta
if (Wait-ForService -Port $aiPort -ServiceName "IA Assistant") {
    Write-Host "IA Assistant está rodando em http://localhost:$aiPort" -ForegroundColor Green
} else {
    Write-Host "AVISO: IA Assistant pode estar iniciando ainda..." -ForegroundColor Yellow
}

# Mostrar status dos serviços
Write-Host "\n=== SISTEMA INICIADO ===" -ForegroundColor Green
Write-Host "\nServiços rodando:" -ForegroundColor Cyan
Write-Host "• Backend (API):     http://localhost:$backendPort" -ForegroundColor White
Write-Host "• IA Assistant:      http://localhost:$aiPort" -ForegroundColor White
Write-Host "• Webhook WhatsApp:  http://localhost:$backendPort/api/whatsapp-webhook" -ForegroundColor White

Write-Host "\nTeste das APIs:" -ForegroundColor Cyan
Write-Host "• Status Backend:    http://localhost:$backendPort/api/test" -ForegroundColor White
Write-Host "• Health Check:      http://localhost:$backendPort/health" -ForegroundColor White

Write-Host "\nJobs em execução:" -ForegroundColor Cyan
foreach ($job in $jobs) {
    $status = $job.State
    $color = if ($status -eq "Running") { "Green" } else { "Red" }
    Write-Host "• Job $($job.Id): $status" -ForegroundColor $color
}

Write-Host "\n=== COMANDOS ÚTEIS ===" -ForegroundColor Yellow
Write-Host "Para parar o sistema:     .\stop_system.ps1" -ForegroundColor White
Write-Host "Para ver logs:            Get-Job | Receive-Job" -ForegroundColor White
Write-Host "Para ver status:          Get-Job" -ForegroundColor White
Write-Host "Para parar um job:        Stop-Job -Id <ID>" -ForegroundColor White

Write-Host "\n=== MONITORAMENTO ===" -ForegroundColor Yellow
Write-Host "Pressione Ctrl+C para parar o monitoramento (serviços continuarão rodando)" -ForegroundColor Gray
Write-Host "Ou execute .\stop_system.ps1 para parar tudo" -ForegroundColor Gray

# Loop de monitoramento
try {
    while ($true) {
        Start-Sleep -Seconds 10
        
        # Verificar status dos jobs
        $runningJobs = $jobs | Where-Object { $_.State -eq "Running" }
        $failedJobs = $jobs | Where-Object { $_.State -eq "Failed" }
        
        if ($failedJobs.Count -gt 0) {
            Write-Host "\n⚠️  ALERTA: $($failedJobs.Count) serviço(s) falharam!" -ForegroundColor Red
            foreach ($failedJob in $failedJobs) {
                Write-Host "Job $($failedJob.Id) falhou. Logs:" -ForegroundColor Red
                Receive-Job -Job $failedJob
            }
        }
        
        # Mostrar status resumido
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "[$timestamp] Serviços ativos: $($runningJobs.Count)/$($jobs.Count)" -ForegroundColor Green
    }
} catch {
    Write-Host "\nMonitoramento interrompido." -ForegroundColor Yellow
    Write-Host "Serviços continuam rodando em background." -ForegroundColor Green
    Write-Host "Use .\stop_system.ps1 para parar todos os serviços." -ForegroundColor Yellow
}