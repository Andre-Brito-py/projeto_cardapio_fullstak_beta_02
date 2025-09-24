# Guia de Instalação do MongoDB

## Opção 1: MongoDB Community Server (Recomendado)

### 1. Download e Instalação
1. Acesse: https://www.mongodb.com/try/download/community
2. Selecione:
   - Version: 7.0.x (Current)
   - Platform: Windows
   - Package: msi
3. Baixe e execute o instalador
4. Durante a instalação:
   - Marque "Install MongoDB as a Service"
   - Marque "Install MongoDB Compass" (interface gráfica)

### 2. Verificar Instalação
Abra o PowerShell como administrador e execute:
```powershell
mongod --version
```

### 3. Iniciar o Serviço (se não iniciou automaticamente)
```powershell
net start MongoDB
```

## Opção 2: MongoDB Atlas (Cloud - Gratuito)

### 1. Criar Conta
1. Acesse: https://www.mongodb.com/atlas
2. Crie uma conta gratuita
3. Crie um cluster gratuito (M0)

### 2. Configurar Acesso
1. Crie um usuário de banco de dados
2. Adicione seu IP à whitelist (ou 0.0.0.0/0 para desenvolvimento)
3. Copie a string de conexão

### 3. Atualizar .env
Substitua a MONGO_URI no arquivo .env:
```
MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/food-delivery-multitenant
```

## Opção 3: Docker (Se Docker Desktop estiver instalado)

### 1. Instalar Docker Desktop
1. Baixe: https://www.docker.com/products/docker-desktop
2. Instale e inicie o Docker Desktop

### 2. Executar MongoDB
No terminal do projeto:
```bash
docker-compose up -d mongodb
```

### 3. Atualizar .env
```
MONGO_URI=mongodb://admin:admin123@localhost:27017/food-delivery-multitenant?authSource=admin
```

## Testando a Conexão

Após configurar qualquer uma das opções, execute:
```bash
cd backend
node createAdmin.js
```

Se aparecer "✅ Super Admin criado com sucesso!", o MongoDB está funcionando!

## Troubleshooting

### Erro: "MongoNetworkError"
- Verifique se o MongoDB está rodando
- Verifique a string de conexão no .env

### Erro: "Authentication failed"
- Verifique usuário e senha na string de conexão
- Para MongoDB local, remova parâmetros de autenticação

### Porta 27017 em uso
```powershell
netstat -ano | findstr :27017
taskkill /PID [PID_NUMBER] /F
```