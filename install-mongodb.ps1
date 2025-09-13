# Script para instalar MongoDB Community Edition no Windows
# Este script baixa e instala o MongoDB localmente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    MONGODB - INSTALACAO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se esta rodando como administrador
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERRO: Este script precisa ser executado como Administrador." -ForegroundColor Red
    Write-Host "Clique com o botao direito no PowerShell e selecione 'Executar como administrador'" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se o MongoDB ja esta instalado
$mongoPath = "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
if (Test-Path $mongoPath) {
    Write-Host "MongoDB ja esta instalado em: $mongoPath" -ForegroundColor Green
    
    # Verificar se o servico esta rodando
    $mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    if ($mongoService -and $mongoService.Status -eq "Running") {
        Write-Host "Servico MongoDB ja esta rodando" -ForegroundColor Green
    } else {
        Write-Host "Iniciando servico MongoDB..." -ForegroundColor Yellow
        try {
            Start-Service -Name "MongoDB"
            Write-Host "Servico MongoDB iniciado com sucesso" -ForegroundColor Green
        } catch {
            Write-Host "Erro ao iniciar servico: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host "MongoDB esta pronto para uso em: mongodb://localhost:27017" -ForegroundColor Green
    Read-Host "Pressione Enter para continuar"
    exit 0
}

Write-Host "MongoDB nao encontrado. Iniciando instalacao..." -ForegroundColor Yellow
Write-Host ""

# Criar diretorio temporario
$tempDir = "$env:TEMP\mongodb-install"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

# URL do MongoDB Community Edition 7.0
$mongoUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.14-signed.msi"
$mongoInstaller = "$tempDir\mongodb-installer.msi"

Write-Host "Baixando MongoDB Community Edition..." -ForegroundColor Yellow
Write-Host "URL: $mongoUrl" -ForegroundColor Gray
Write-Host "Isso pode levar alguns minutos..." -ForegroundColor Yellow
Write-Host ""

try {
    # Baixar o instalador
    Invoke-WebRequest -Uri $mongoUrl -OutFile $mongoInstaller -UseBasicParsing
    Write-Host "Download concluido" -ForegroundColor Green
    
    # Instalar MongoDB
    Write-Host "Instalando MongoDB..." -ForegroundColor Yellow
    Write-Host "Aguarde, isso pode levar varios minutos..." -ForegroundColor Yellow
    
    $installArgs = @(
        "/i", $mongoInstaller,
        "/quiet",
        "INSTALLLOCATION=C:\Program Files\MongoDB\Server\7.0\",
        "ADDLOCAL=ServerService,Client,MonitoringTools,ImportExportTools",
        "SERVICE_NAME=MongoDB",
        "SERVICE_DISPLAY_NAME=MongoDB",
        "SERVICE_DESCRIPTION=MongoDB Database Server",
        "SERVICE_START_TYPE=2"
    )
    
    Start-Process -FilePath "msiexec.exe" -ArgumentList $installArgs -Wait -NoNewWindow
    
    # Verificar se a instalacao foi bem-sucedida
    if (Test-Path $mongoPath) {
        Write-Host "MongoDB instalado com sucesso!" -ForegroundColor Green
        
        # Criar diretorios de dados
        $dataDir = "C:\data\db"
        if (-not (Test-Path $dataDir)) {
            New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
            Write-Host "Diretorio de dados criado: $dataDir" -ForegroundColor Green
        }
        
        # Iniciar servico
        Write-Host "Iniciando servico MongoDB..." -ForegroundColor Yellow
        try {
            Start-Service -Name "MongoDB"
            Write-Host "Servico MongoDB iniciado com sucesso" -ForegroundColor Green
        } catch {
            Write-Host "Aviso: Erro ao iniciar servico automaticamente" -ForegroundColor Yellow
            Write-Host "Voce pode iniciar manualmente com: net start MongoDB" -ForegroundColor White
        }
        
        # Adicionar ao PATH
        $mongoDir = "C:\Program Files\MongoDB\Server\7.0\bin"
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
        if ($currentPath -notlike "*$mongoDir*") {
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$mongoDir", "Machine")
            Write-Host "MongoDB adicionado ao PATH do sistema" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "INSTALACAO CONCLUIDA COM SUCESSO!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "MongoDB esta disponivel em:" -ForegroundColor Yellow
        Write-Host "  URL: mongodb://localhost:27017" -ForegroundColor White
        Write-Host "  Diretorio: C:\Program Files\MongoDB\Server\7.0" -ForegroundColor White
        Write-Host "  Dados: C:\data\db" -ForegroundColor White
        Write-Host ""
        Write-Host "Comandos uteis:" -ForegroundColor Yellow
        Write-Host "  Iniciar: net start MongoDB" -ForegroundColor White
        Write-Host "  Parar: net stop MongoDB" -ForegroundColor White
        Write-Host "  Cliente: mongo" -ForegroundColor White
        Write-Host ""
        
    } else {
        Write-Host "ERRO: Instalacao falhou" -ForegroundColor Red
        Write-Host "Tente baixar e instalar manualmente de:" -ForegroundColor Yellow
        Write-Host "https://www.mongodb.com/try/download/community" -ForegroundColor Blue
    }
    
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Tente baixar e instalar manualmente de:" -ForegroundColor Yellow
    Write-Host "https://www.mongodb.com/try/download/community" -ForegroundColor Blue
} finally {
    # Limpar arquivos temporarios
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Read-Host "Pressione Enter para finalizar"