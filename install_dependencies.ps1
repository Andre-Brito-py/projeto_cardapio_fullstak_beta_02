# Script de instalação de dependências - IA Liza
# Execute este script no PowerShell como Administrador

Write-Host "=== Instalação de Dependências - IA Liza ===" -ForegroundColor Green
Write-Host "Iniciando instalação das dependências necessárias..." -ForegroundColor Yellow

# Verificar se o Node.js está instalado
Write-Host "\n1. Verificando Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Node.js não encontrado. Por favor, instale o Node.js primeiro." -ForegroundColor Red
    Write-Host "Download: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar se o Python está instalado
Write-Host "\n2. Verificando Python..." -ForegroundColor Cyan
try {
    $pythonVersion = python --version
    Write-Host "Python encontrado: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Python não encontrado. Por favor, instale o Python primeiro." -ForegroundColor Red
    Write-Host "Download: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Instalar dependências do Backend (Node.js)
Write-Host "\n3. Instalando dependências do Backend..." -ForegroundColor Cyan
Set-Location -Path "./backend"

if (Test-Path "package.json") {
    Write-Host "Executando npm install no backend..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dependências do backend instaladas com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "ERRO: Falha na instalação das dependências do backend." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "AVISO: package.json não encontrado no diretório backend." -ForegroundColor Yellow
}

# Voltar ao diretório raiz
Set-Location -Path ".."

# Instalar dependências da IA (Python)
Write-Host "\n4. Instalando dependências da IA Liza..." -ForegroundColor Cyan
Set-Location -Path "./ai-assistant"

if (Test-Path "requirements.txt") {
    Write-Host "Criando ambiente virtual Python..." -ForegroundColor Yellow
    python -m venv venv
    
    Write-Host "Ativando ambiente virtual..." -ForegroundColor Yellow
    & ".\venv\Scripts\Activate.ps1"
    
    Write-Host "Atualizando pip..." -ForegroundColor Yellow
    python -m pip install --upgrade pip
    
    Write-Host "Instalando dependências Python..." -ForegroundColor Yellow
    pip install -r requirements.txt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dependências da IA instaladas com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "ERRO: Falha na instalação das dependências da IA." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "AVISO: requirements.txt não encontrado no diretório ai-assistant." -ForegroundColor Yellow
}

# Voltar ao diretório raiz
Set-Location -Path ".."

# Instalar dependências do Frontend (se existir)
Write-Host "\n5. Verificando Frontend..." -ForegroundColor Cyan
if (Test-Path "./frontend/package.json") {
    Write-Host "Instalando dependências do Frontend..." -ForegroundColor Yellow
    Set-Location -Path "./frontend"
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dependências do frontend instaladas com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "ERRO: Falha na instalação das dependências do frontend." -ForegroundColor Red
    }
    
    Set-Location -Path ".."
} else {
    Write-Host "Frontend não encontrado ou não possui package.json." -ForegroundColor Yellow
}

# Criar diretórios necessários
Write-Host "\n6. Criando diretórios necessários..." -ForegroundColor Cyan

$directories = @(
    "./ai-assistant/logs",
    "./ai-assistant/models",
    "./ai-assistant/data",
    "./backend/logs",
    "./backend/uploads"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "Diretório criado: $dir" -ForegroundColor Green
    } else {
        Write-Host "Diretório já existe: $dir" -ForegroundColor Yellow
    }
}

# Configurar arquivos de ambiente
Write-Host "\n7. Configurando arquivos de ambiente..." -ForegroundColor Cyan

# Backend .env
if (!(Test-Path "./backend/.env")) {
    if (Test-Path "./backend/.env.example") {
        Copy-Item "./backend/.env.example" "./backend/.env"
        Write-Host "Arquivo .env criado no backend (baseado no .env.example)" -ForegroundColor Green
        Write-Host "IMPORTANTE: Configure as variáveis no arquivo ./backend/.env" -ForegroundColor Yellow
    } else {
        Write-Host "AVISO: .env.example não encontrado no backend" -ForegroundColor Yellow
    }
} else {
    Write-Host "Arquivo .env já existe no backend" -ForegroundColor Green
}

# IA Assistant .env
if (!(Test-Path "./ai-assistant/.env")) {
    if (Test-Path "./ai-assistant/.env.example") {
        Copy-Item "./ai-assistant/.env.example" "./ai-assistant/.env"
        Write-Host "Arquivo .env criado na IA (baseado no .env.example)" -ForegroundColor Green
        Write-Host "IMPORTANTE: Configure as variáveis no arquivo ./ai-assistant/.env" -ForegroundColor Yellow
    } else {
        Write-Host "AVISO: .env.example não encontrado na IA" -ForegroundColor Yellow
    }
} else {
    Write-Host "Arquivo .env já existe na IA" -ForegroundColor Green
}

# Verificar se Redis está disponível (opcional)
Write-Host "\n8. Verificando Redis (opcional)..." -ForegroundColor Cyan
try {
    $redisTest = Test-NetConnection -ComputerName "localhost" -Port 6379 -WarningAction SilentlyContinue
    if ($redisTest.TcpTestSucceeded) {
        Write-Host "Redis encontrado na porta 6379" -ForegroundColor Green
    } else {
        Write-Host "Redis não encontrado. Cache em memória será usado." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Não foi possível verificar Redis. Cache em memória será usado." -ForegroundColor Yellow
}

# Resumo final
Write-Host "\n=== INSTALAÇÃO CONCLUÍDA ===" -ForegroundColor Green
Write-Host "\nPróximos passos:" -ForegroundColor Cyan
Write-Host "1. Configure os arquivos .env nos diretórios backend e ai-assistant" -ForegroundColor White
Write-Host "2. Configure as credenciais do WhatsApp Business API" -ForegroundColor White
Write-Host "3. Configure a conexão com o banco de dados" -ForegroundColor White
Write-Host "4. Execute os testes com: .\run_tests.ps1" -ForegroundColor White
Write-Host "5. Inicie o sistema com: .\start_system.ps1" -ForegroundColor White

Write-Host "\nPara mais informações, consulte o arquivo PROXIMOS_PASSOS_IA_LIZA.txt" -ForegroundColor Yellow

Write-Host "\n=== INSTALAÇÃO FINALIZADA COM SUCESSO ===" -ForegroundColor Green