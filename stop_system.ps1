# Script para parar o sistema completo - IA Liza
# Execute este script no PowerShell

Write-Host "=== Parando Sistema IA Liza ===" -ForegroundColor Red
Write-Host "Finalizando todos os serviços..." -ForegroundColor Yellow

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

# Função para finalizar processo por porta
function Stop-ProcessByPort {
    param([int]$Port, [string]$ServiceName)
    
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                    Select-Object -ExpandProperty OwningProcess -Unique
        
        if ($processes) {
            foreach ($processId in $processes) {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Finalizando $ServiceName (PID: $processId, Nome: $($process.ProcessName))..." -ForegroundColor Yellow
                    Stop-Process -Id $processId -Force
                    Write-Host "✓ $ServiceName finalizado" -ForegroundColor Green
                }
            }
        } else {
            Write-Host "$ServiceName não está rodando na porta $Port" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Erro ao finalizar $ServiceName na porta $Port" -ForegroundColor Red
    }
}

# Parar jobs do PowerShell
Write-Host "\n1. Parando jobs do PowerShell..." -ForegroundColor Cyan

$jobs = Get-Job -ErrorAction SilentlyContinue
if ($jobs) {
    Write-Host "Encontrados $($jobs.Count) job(s) em execução" -ForegroundColor Yellow
    
    foreach ($job in $jobs) {
        Write-Host "Parando Job $($job.Id) ($($job.Name))..." -ForegroundColor Yellow
        Stop-Job -Job $job -ErrorAction SilentlyContinue
        Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host "✓ Todos os jobs foram finalizados" -ForegroundColor Green
} else {
    Write-Host "Nenhum job encontrado" -ForegroundColor Gray
}

# Parar serviços por porta
Write-Host "\n2. Finalizando serviços por porta..." -ForegroundColor Cyan

# Backend (porta 3000)
if (Test-Port -Port 3000) {
    Stop-ProcessByPort -Port 3000 -ServiceName "Backend (Node.js)"
} else {
    Write-Host "Backend não está rodando na porta 3000" -ForegroundColor Gray
}

# IA Assistant (porta 8000)
if (Test-Port -Port 8000) {
    Stop-ProcessByPort -Port 8000 -ServiceName "IA Assistant (Python)"
} else {
    Write-Host "IA Assistant não está rodando na porta 8000" -ForegroundColor Gray
}

# Parar processos específicos por nome
Write-Host "\n3. Finalizando processos específicos..." -ForegroundColor Cyan

# Processos Node.js relacionados ao projeto
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | 
                Where-Object { $_.Path -like "*projeto_cardapio*" -or $_.CommandLine -like "*projeto_cardapio*" }

if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        Write-Host "Finalizando processo Node.js (PID: $($process.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "✓ Processos Node.js finalizados" -ForegroundColor Green
} else {
    Write-Host "Nenhum processo Node.js do projeto encontrado" -ForegroundColor Gray
}

# Processos Python relacionados ao Chainlit
$pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue | 
                  Where-Object { $_.CommandLine -like "*chainlit*" -or $_.CommandLine -like "*app.py*" }

if ($pythonProcesses) {
    foreach ($process in $pythonProcesses) {
        Write-Host "Finalizando processo Python/Chainlit (PID: $($process.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "✓ Processos Python/Chainlit finalizados" -ForegroundColor Green
} else {
    Write-Host "Nenhum processo Python/Chainlit encontrado" -ForegroundColor Gray
}

# Aguardar um pouco para os processos finalizarem
Write-Host "\n4. Aguardando finalização..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Verificar se as portas foram liberadas
Write-Host "\n5. Verificando portas liberadas..." -ForegroundColor Cyan

if (Test-Port -Port 3000) {
    Write-Host "⚠️  Porta 3000 ainda está em uso" -ForegroundColor Yellow
} else {
    Write-Host "✓ Porta 3000 liberada" -ForegroundColor Green
}

if (Test-Port -Port 8000) {
    Write-Host "⚠️  Porta 8000 ainda está em uso" -ForegroundColor Yellow
} else {
    Write-Host "✓ Porta 8000 liberada" -ForegroundColor Green
}

# Limpeza adicional
Write-Host "\n6. Limpeza adicional..." -ForegroundColor Cyan

# Limpar jobs órfãos
try {
    Get-Job -State Completed -ErrorAction SilentlyContinue | Remove-Job -Force -ErrorAction SilentlyContinue
    Get-Job -State Failed -ErrorAction SilentlyContinue | Remove-Job -Force -ErrorAction SilentlyContinue
    Get-Job -State Stopped -ErrorAction SilentlyContinue | Remove-Job -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Jobs órfãos removidos" -ForegroundColor Green
} catch {
    Write-Host "Erro na limpeza de jobs" -ForegroundColor Yellow
}

# Verificar se ainda há jobs rodando
$remainingJobs = Get-Job -ErrorAction SilentlyContinue
if ($remainingJobs) {
    Write-Host "⚠️  Ainda há $($remainingJobs.Count) job(s) em execução:" -ForegroundColor Yellow
    foreach ($job in $remainingJobs) {
        Write-Host "   • Job $($job.Id): $($job.State)" -ForegroundColor Gray
    }
    Write-Host "Execute 'Get-Job | Stop-Job; Get-Job | Remove-Job -Force' se necessário" -ForegroundColor Yellow
} else {
    Write-Host "✓ Nenhum job restante" -ForegroundColor Green
}

# Mostrar processos que ainda podem estar rodando
Write-Host "\n7. Verificação final..." -ForegroundColor Cyan

$remainingNode = Get-Process -Name "node" -ErrorAction SilentlyContinue | Measure-Object
$remainingPython = Get-Process -Name "python" -ErrorAction SilentlyContinue | Measure-Object

Write-Host "Processos Node.js restantes: $($remainingNode.Count)" -ForegroundColor Gray
Write-Host "Processos Python restantes: $($remainingPython.Count)" -ForegroundColor Gray

# Resumo final
Write-Host "\n=== SISTEMA FINALIZADO ===" -ForegroundColor Green
Write-Host "\nTodos os serviços da IA Liza foram finalizados." -ForegroundColor White
Write-Host "\nPara reiniciar o sistema:" -ForegroundColor Cyan
Write-Host "• Execute: .\start_system.ps1" -ForegroundColor White

Write-Host "\nPara verificar se algum processo ainda está rodando:" -ForegroundColor Cyan
Write-Host "• Portas: netstat -an | findstr ':3000\|:8000'" -ForegroundColor White
Write-Host "• Jobs: Get-Job" -ForegroundColor White
Write-Host "• Processos: Get-Process node, python" -ForegroundColor White

Write-Host "\n=== FINALIZAÇÃO CONCLUÍDA ===" -ForegroundColor Green

# Opcional: Perguntar se quer limpar logs
$cleanLogs = Read-Host "\nDeseja limpar os arquivos de log? (s/N)"
if ($cleanLogs -eq "s" -or $cleanLogs -eq "S") {
    Write-Host "\nLimpando logs..." -ForegroundColor Yellow
    
    $logPaths = @(
        "./backend/logs/*.log",
        "./ai-assistant/logs/*.log",
        "./logs/*.log"
    )
    
    foreach ($logPath in $logPaths) {
        if (Test-Path $logPath) {
            Remove-Item $logPath -Force -ErrorAction SilentlyContinue
            Write-Host "✓ Logs removidos: $logPath" -ForegroundColor Green
        }
    }
    
    Write-Host "✓ Limpeza de logs concluída" -ForegroundColor Green
} else {
    Write-Host "Logs mantidos" -ForegroundColor Gray
}