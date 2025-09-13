@echo off
echo ========================================
echo    FOOD DELIVERY - INICIALIZACAO
echo ========================================
echo.
echo Iniciando todos os servicos...
echo.

REM Verificar se o Node.js esta instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado. Instale o Node.js primeiro.
    pause
    exit /b 1
)

REM Verificar se o MongoDB esta rodando
echo Verificando MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo AVISO: MongoDB nao esta rodando. Certifique-se de iniciar o MongoDB primeiro.
    echo Pressione qualquer tecla para continuar mesmo assim...
    pause >nul
)

REM Criar diretorio de logs se nao existir
if not exist "logs" mkdir logs

REM Iniciar Backend
echo [1/4] Iniciando Backend (porta 4001)...
start "Backend" cmd /k "cd backend && npm start"
timeout /t 3 >nul

REM Iniciar Frontend
echo [2/4] Iniciando Frontend (porta 5173)...
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 >nul

REM Iniciar Admin
echo [3/4] Iniciando Admin (porta 5174)...
start "Admin" cmd /k "cd admin && npm run dev"
timeout /t 3 >nul

REM Iniciar Counter
echo [4/4] Iniciando Counter (porta 5176)...
start "Counter" cmd /k "cd counter && npm run dev"
timeout /t 3 >nul

echo.
echo ========================================
echo    SERVICOS INICIADOS COM SUCESSO!
echo ========================================
echo.
echo URLs de acesso:
echo - Frontend (Clientes): http://localhost:5173
echo - Admin (Lojas):       http://localhost:5174
echo - Counter (Balcao):    http://localhost:5176
echo - Backend (API):       http://localhost:4001
echo.
echo Aguarde alguns segundos para todos os servicos carregarem...
echo.
echo Pressione qualquer tecla para abrir as URLs no navegador...
pause >nul

REM Abrir URLs no navegador
start http://localhost:5173
start http://localhost:5174
start http://localhost:5176

echo.
echo Projeto iniciado! Verifique as janelas do terminal para logs.
echo Para parar todos os servicos, feche as janelas do terminal.
echo.
pause