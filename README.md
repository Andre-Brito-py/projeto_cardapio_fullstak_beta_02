# 🍕 Sistema de Delivery de Comida - Multi-Tenant Full Stack

Um sistema completo de delivery de comida com arquitetura multi-tenant, desenvolvido com tecnologias modernas. Permite que múltiplas lojas operem de forma independente em uma única plataforma, com gestão centralizada através de um Super Admin.

## ✨ Funcionalidades Principais

### 👥 Para Clientes
- **Navegação Intuitiva**: Interface moderna e responsiva
- **Catálogo de Produtos**: Visualização detalhada de pratos com imagens
- **Sistema de Carrinho**: Adicionar/remover itens com facilidade
- **Personalização**: Adicionais e extras para cada prato
- **Autenticação**: Sistema seguro de login e cadastro
- **Histórico de Pedidos**: Acompanhamento completo dos pedidos
- **Múltiplos Pagamentos**: Integração com Stripe e pagamento na entrega
- **Banners Interativos**: Banners que direcionam para produtos específicos
- **Páginas de Produto**: Visualização detalhada com extras personalizáveis

### 🔧 Para Administradores de Loja
- **Painel Administrativo**: Interface dedicada para gestão da loja
- **🌙 Modo Escuro/Claro**: Toggle de tema com persistência de preferência
- **Gerenciamento de Produtos**: CRUD completo de pratos e categorias
- **Gestão de Banners**: Sistema completo de banners com direcionamento para produtos
- **🏷️ Banners Padrão**: Identificação e gerenciamento especial de banners padrão
- **Controle de Pedidos**: Visualização e atualização de status
- **Gestão de Usuários**: Controle de clientes cadastrados
- **Upload de Imagens**: Sistema integrado para imagens de produtos e banners
- **Categorias Dinâmicas**: Sistema completo de categorias com status ativo/inativo
- **Configurações da Loja**: Personalização específica por loja
- **🤖 Assistente Liza**: IA integrada com OpenRouter para automação e suporte
  - Consulta de cardápio via comandos de voz
  - Relatórios automáticos do dia
  - Verificação de pedidos em andamento
  - Alteração de preços e disponibilidade
  - Processamento de linguagem natural local
- **📱 Bot Telegram Liza**: Integração completa com Telegram para automação
  - Recebimento de pedidos via Telegram
  - Notificações automáticas de novos pedidos
  - Consulta de cardápio e preços via bot
  - Relatórios de vendas e estatísticas
  - Gestão de pedidos através do chat
  - Configuração de webhooks automática
  - Interface administrativa para gerenciar bot

### 👑 Para Super Administradores
- **Gestão Multi-Tenant**: Controle centralizado de múltiplas lojas
- **Criação de Lojas**: Sistema completo para adicionar novas lojas
- **Gerenciamento de Store Admins**: Criação e gestão de administradores por loja
- **Configurações Globais**: Definições que afetam todo o sistema
- **Estatísticas Centralizadas**: Visão geral de todas as lojas
- **Controle de Status**: Ativar/suspender lojas individualmente
- **Planos de Assinatura**: Gestão de diferentes planos para as lojas

## 🛠️ Tecnologias Utilizadas

### Frontend (Cliente)
- **React 18** - Biblioteca principal
- **Vite** - Build tool moderna e rápida
- **React Router** - Navegação SPA
- **Axios** - Cliente HTTP
- **CSS3** - Estilização responsiva

### Backend (API)
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação segura
- **Bcrypt** - Criptografia de senhas
- **Multer** - Upload de arquivos
- **Stripe** - Gateway de pagamento
- **Multi-Tenancy Middleware** - Isolamento de dados por loja
- **Role-Based Access Control** - Sistema de permissões por função

### Admin Panel
- **React 18** - Interface administrativa
- **Vite** - Build tool
- **Axios** - Comunicação com API
- **CSS3** - Estilização dedicada
- **Super Admin Dashboard** - Painel para gestão multi-tenant
- **Store Management** - Interface para gerenciar lojas individuais

### 🤖 Assistente IA Liza
- **OpenRouter** - API para modelos de IA
- **Llama 3.1** - Modelo de linguagem natural
- **Processamento Local** - IA rodando sem dependência de APIs externas
- **Integração Backend** - Comunicação direta com APIs do sistema
- **Interface de Chat** - Interface moderna para interação
- **Comandos Inteligentes** - Reconhecimento de intenções e ações automáticas

### 📱 Bot Telegram Liza
- **Telegram Bot API** - Integração oficial com Telegram
- **Webhooks** - Recebimento em tempo real de mensagens
- **Node.js Backend** - Processamento de comandos do bot
- **MongoDB Integration** - Armazenamento de dados do bot
- **Automated Responses** - Respostas automáticas inteligentes
- **Order Management** - Gestão completa de pedidos via Telegram
- **Menu Integration** - Acesso completo ao cardápio da loja
- **Admin Controls** - Controles administrativos via chat

## 📦 Instalação e Configuração

### Pré-requisitos
- **Node.js** (v14 ou superior)
- **MongoDB** (local ou MongoDB Atlas)
- **Git** (para clonar o repositório)
- **Conta no Stripe** (opcional, para pagamentos)
- **OpenRouter API Key** (para a assistente IA Liza)
- Obtenha sua chave em: https://openrouter.ai/
- Configure a variável `VITE_OPENROUTER_API_KEY`
- **Telegram Bot Token** (para o Bot Telegram Liza)
- Crie um bot com @BotFather no Telegram
- Configure a variável `TELEGRAM_BOT_TOKEN`

### ⚡ Configuração Automática (Recomendado)

**1. Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/projeto_cardapio_fullstak_beta_02.git
cd projeto_cardapio_fullstak_beta_02
```

**2. Execute o setup automático:**
```bash
npm run setup
```

Este comando irá:
- ✅ Criar arquivos `.env` com configurações corretas
- ✅ Instalar todas as dependências
- ✅ Configurar URLs automaticamente
- ✅ Criar usuário Super Admin
- ✅ Validar configurações

**3. Inicie o projeto:**
```bash
# Windows PowerShell
.\start-project.ps1

# Windows Batch
start-project.bat

# Manual (4 terminais)
npm run dev:all
```

## 🔑 Credenciais de Teste

### Atendente de Balcão (Counter)
- **Email**: `atendente@teste.com`
- **Senha**: `123456789`
- **URL**: http://localhost:5176

### Super Admin
- **Email**: `admin@sistema.com`
- **Senha**: `admin123`
- **URL**: http://localhost:5174

### URLs do Sistema
- **Frontend (Clientes)**: http://localhost:5173
- **Admin (Lojas)**: http://localhost:5174
- **Counter (Balcão)**: http://localhost:5176
- **Backend (API)**: http://localhost:4001

## 🔄 Reinicialização do Projeto

### Inicialização Rápida
1. **Certifique-se que o MongoDB está rodando**
2. **Execute um dos scripts de inicialização:**
   - PowerShell: `.\start-project.ps1`
   - Batch: `start-project.bat`
3. **Aguarde todos os serviços carregarem (≈30 segundos)**
4. **Acesse as URLs listadas acima**

### Se houver problemas:
1. **Crie o atendente de teste** (se necessário):
   ```bash
   cd backend
   node create-test-attendant.js
   ```
2. **Verifique se todas as portas estão livres**:
   - Backend: 4001
   - Frontend: 5173
   - Admin: 5174
   - Counter: 5176
3. **Reinstale dependências se necessário**:
   ```bash
   npm run setup
   ```

### 🔧 Configuração Manual (Avançado)

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/projeto_cardapio_fullstak_beta_02.git
cd projeto_cardapio_fullstak_beta_02
```

### 2. Instale as dependências em cada módulo:
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# Admin
cd ../admin && npm install

# Counter
cd ../counter && npm install
```

### 2. Configuração do Backend
```bash
cd backend
npm install
```

**Crie um arquivo `.env` na pasta backend:**
```env
MONGODB_URI=mongodb://localhost:27017/food-delivery-multitenant
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
STRIPE_SECRET_KEY=sua_chave_stripe_aqui
PORT=4000
SUPER_ADMIN_EMAIL=superadmin@gmail.com
SUPER_ADMIN_PASSWORD=admin123
TELEGRAM_BOT_TOKEN=seu_token_do_bot_telegram_aqui
WEBHOOK_URL=https://seu-dominio.com/webhook/telegram
```

**Inicie o servidor backend:**
```bash
npm run server
```

### 3. Configuração do Frontend (Cliente)
**Em um novo terminal:**
```bash
cd frontend
npm install
npm run dev
```

### 4. Configuração do Admin Panel
**Em um novo terminal:**
```bash
cd admin
npm install
npm run dev
```

### 5. Configuração da Assistente IA (ai-assistant)
**Em um novo terminal:**
```bash
cd ai-assistant
pip install -r requirements.txt
```

**Configure o arquivo `.env` na pasta ai-assistant:**
```env
VITE_OPENROUTER_API_KEY=sua_chave_aqui
CHAINLIT_AUTH_SECRET=seu_chainlit_secret_aqui
```

**Inicie a assistente IA:**
```bash
chainlit run app.py -w
```

### 6. Configuração do Bot Telegram Liza
**Configure o Bot Telegram:**
```bash
# 1. Crie um bot no Telegram com @BotFather
# 2. Obtenha o token do bot
# 3. Configure as variáveis de ambiente no backend/.env:
TELEGRAM_BOT_TOKEN=seu_token_aqui
WEBHOOK_URL=https://seu-dominio.com/webhook/telegram

# 4. O webhook será configurado automaticamente na inicialização
```

**Funcionalidades do Bot:**
- 📋 Consulta de cardápio: `/menu`
- 📊 Relatórios de vendas: `/relatorio`
- 🛒 Gestão de pedidos: `/pedidos`
- ⚙️ Configurações: `/config`
- 💰 Preços e disponibilidade: `/precos`
- 📈 Estatísticas: `/stats`

### 7. Configurar Super Administrador
**Primeira execução - O Super Admin será criado automaticamente na primeira inicialização do sistema.**

**Ou crie manualmente:**
```bash
cd backend
node createAdmin.js
```

**Credenciais padrão do Super Admin:**
- **Email**: superadmin@gmail.com
- **Senha**: admin123
- **URL**: http://localhost:5173

## 🚀 Como Executar o Projeto

### 🎯 Inicialização Rápida (Recomendado)

**Para Windows:**
1. **Abra o PowerShell como Administrador**
2. **Execute o script de inicialização:**
```powershell
# Navegar para o diretório do projeto
cd "C:\caminho\para\Full-Stack-Food-Delivery-Web-Application"

# Executar script de inicialização (instala dependências e inicia tudo)
.\start-project.ps1
```

**Ou use o arquivo .bat:**
```cmd
# Duplo clique no arquivo ou execute:
start-project.bat
```

### 🔧 Execução Manual (3 terminais)

**Terminal 1 - Backend:**
```bash
cd backend
npm run server
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Admin:**
```bash
cd admin
npm run dev
```

### ✅ Verificação de Funcionamento

**Execute o health check:**
```powershell
.\health-check.ps1
```

**Verificação manual:**
1. **Backend**: Deve mostrar "Server started on http://localhost:4000" e "DB Connected Successfully"
2. **Frontend**: Deve estar disponível em http://localhost:5173
3. **Admin Panel**: Deve estar disponível em http://localhost:5174

## 🔑 Credenciais de Acesso

### Super Administrador (Gestão Multi-Tenant)
- **Email**: superadmin@fooddelivery.com
- **Senha**: superadmin123
- **URL**: http://localhost:5174

### Administrador de Loja
*Criado pelo Super Admin através do painel de gestão de lojas*
- **URL**: http://localhost:5174
- **Credenciais**: Definidas durante a criação da loja

*⚠️ **IMPORTANTE**: Altere as credenciais padrão após o primeiro login!*

## 🌐 URLs de Acesso

- **🛒 Frontend (Clientes)**: http://localhost:5173
- **🏪 Admin Panel (Lojas)**: http://localhost:5174
- **🔌 Backend API**: http://localhost:4000
- **🤖 Assistente Liza**: Integrada no Admin Panel (Chat com IA)
- **🧠 OpenRouter API**: https://openrouter.ai/api/v1 (IA Cloud)
- **📱 Bot Telegram**: Integrado com webhook automático
- **🔗 Telegram API**: https://api.telegram.org/bot{token} (Bot oficial)

### ⚠️ IMPORTANTE: Configuração de URLs

**O sistema utiliza configuração centralizada de URLs para garantir que os links sejam gerados corretamente:**

#### 📋 Configurações Padrão
- **Frontend (Cliente/Garçom)**: Porta 5173
- **Admin (Painel Administrativo)**: Porta 5174
- **Backend (API)**: Porta 4000

#### 🔧 Arquivos de Configuração
- `backend/config/urls.js` - Configuração centralizada do backend
- `admin/src/config/urls.js` - Configuração do painel administrativo
- `.env` - Variáveis de ambiente (criado automaticamente)

#### ✅ Validação de URLs
```bash
# Validar se todas as URLs estão corretas
npm run validate-urls

# Reconfigurar URLs se necessário
npm run setup-project
```

#### 🚨 Problemas Comuns
- **Link da loja abrindo painel admin**: URLs trocadas
- **QR Code da mesa não funcionando**: Configuração incorreta
- **Garçom não consegue acessar**: Token ou URL inválida

**Solução**: Execute `npm run setup-project` para reconfigurar automaticamente.

## 🔧 Scripts Utilitários

### 🚀 Inicialização Automática
- **start-project.ps1**: Script PowerShell completo com verificações
- **start-project.bat**: Script batch simples para Windows
- **health-check.ps1**: Verificação de saúde de todos os serviços
- **setup-test-data.js**: Criação de dados de teste

### 🛠️ Resolução de Problemas

#### ❌ Erro: "Loja não encontrada"
**Solução:**
```bash
# Execute o script de criação de dados de teste
node setup-test-data.js
```

#### ❌ Links gerando URL incorreta
**Causa:** Configuração de URL incorreta
**Solução:** Os links são gerados automaticamente usando:
- Frontend (clientes): `http://localhost:5173/loja/{slug}`
- Admin (lojas): `http://localhost:5174`

#### ❌ Serviços não iniciam
**Soluções:**
1. Verificar se o MongoDB está rodando
2. Verificar se as portas estão livres (4000, 5173, 5174)
3. Executar `health-check.ps1` para diagnóstico
4. Reinstalar dependências: `npm install` em cada pasta

#### ❌ Erro de conexão com banco
**Soluções:**
1. Verificar se o MongoDB está rodando: `mongod --version`
2. Verificar conexão: `mongo mongodb://localhost:27017/food-del`
3. Reiniciar o serviço do MongoDB

### 📋 Dados de Teste Padrão
Após executar `setup-test-data.js`:
- **Loja:** Loja Teste - Food Delivery
- **Slug:** loja-teste
- **URL:** http://localhost:5173/loja/loja-teste
- **Admin:** admin@loja-teste.com / admin123

## 📱 Guia de Uso

### 👤 Para Clientes
1. **Acesso**: Vá para http://localhost:5173
2. **Cadastro**: Crie uma conta ou faça login
3. **Navegação**: Explore o menu por categorias
4. **Carrinho**: Adicione itens e personalize com extras
5. **Checkout**: Finalize com Stripe ou pagamento na entrega
6. **Acompanhamento**: Monitore pedidos em "Meus Pedidos"

### 👑 Para Super Administradores
1. **Login**: Acesse http://localhost:5175 com as credenciais do Super Admin
2. **Criar Loja**: Use "Store Management" para adicionar novas lojas
3. **Gerenciar Lojas**: Visualize, edite e controle status das lojas
4. **Configurações Globais**: Defina configurações que afetam todo o sistema
5. **Estatísticas**: Monitore performance geral de todas as lojas

### 🔧 Para Administradores de Loja
1. **Login**: Acesse http://localhost:5174 com as credenciais da loja
2. **Produtos**: Gerencie cardápio na seção "Add Items"
3. **Categorias**: Controle categorias em "Categories"
4. **Banners**: Configure banners promocionais em "Banners"
5. **Pedidos**: Monitore e atualize status em "Orders"
6. **Usuários**: Visualize clientes em "Users"
7. **Bot Telegram**: Configure e monitore o bot na seção "Telegram Bot"
8. **Assistente IA**: Interaja com a Liza através do chat integrado
9. **Configurações**: Personalize configurações específicas da loja

### 📱 Para Usar o Bot Telegram
1. **Configuração**: Configure o token do bot no painel administrativo
2. **Comandos Básicos**:
   - `/start` - Iniciar conversa com o bot
   - `/menu` - Ver cardápio completo
   - `/pedidos` - Consultar pedidos em andamento
   - `/relatorio` - Relatório de vendas do dia
   - `/help` - Lista de comandos disponíveis
3. **Notificações**: Receba alertas automáticos de novos pedidos
4. **Gestão**: Gerencie pedidos diretamente pelo chat

## 🏗️ Estrutura Detalhada do Projeto

```
📁 Full-Stack-Food-Delivery-Web-Application/
├── 📁 backend/                    # API Node.js/Express Multi-Tenant
│   ├── 📁 config/
│   │   └── db.js                  # Configuração MongoDB
│   ├── 📁 controllers/
│   │   ├── foodController.js      # Gestão de produtos (multi-tenant)
│   │   ├── categoryController.js  # Gestão de categorias (multi-tenant)
│   │   ├── bannerController.js    # Gestão de banners (multi-tenant)
│   │   ├── userController.js      # Autenticação (multi-tenant)
│   │   ├── orderController.js     # Gestão de pedidos (multi-tenant)
│   │   ├── storeController.js     # Gestão de lojas individuais
│   │   ├── systemController.js    # Gestão do Super Admin
│   │   ├── deliveryController.js  # Cálculo de entrega
│   │   └── telegramController.js  # Controlador do Bot Telegram
│   ├── 📁 middleware/
│   │   ├── auth.js               # Middleware de autenticação
│   │   └── multiTenancy.js       # Middleware multi-tenant
│   ├── 📁 models/
│   │   ├── foodModel.js          # Modelo de produtos
│   │   ├── categoryModel.js      # Modelo de categorias
│   │   ├── bannerModel.js        # Modelo de banners
│   │   ├── userModel.js          # Modelo de usuários (com roles)
│   │   ├── orderModel.js         # Modelo de pedidos
│   │   ├── storeModel.js         # Modelo de lojas
│   │   ├── systemSettingsModel.js # Configurações globais
│   │   └── telegramBotModel.js   # Modelo do Bot Telegram
│   ├── 📁 routes/
│   │   ├── foodRoute.js          # Rotas de produtos
│   │   ├── categoryRoute.js      # Rotas de categorias
│   │   ├── bannerRoute.js        # Rotas de banners
│   │   ├── userRoute.js          # Rotas de usuários
│   │   ├── orderRoute.js         # Rotas de pedidos
│   │   ├── storeRoute.js         # Rotas de lojas
│   │   ├── systemRoute.js        # Rotas do Super Admin
│   │   ├── deliveryRoute.js      # Rotas de entrega
│   │   └── telegramRoute.js      # Rotas do Bot Telegram
│   ├── 📁 services/
│   │   ├── distanceService.js    # Serviço de cálculo de distância
│   │   └── telegramService.js    # Serviço do Bot Telegram
│   ├── 📁 uploads/               # Imagens enviadas
│   ├── server.js                 # Servidor principal
│   ├── createAdmin.js            # Script para criar admin
│   ├── telegramBot.js            # Configuração do Bot Telegram
│   └── package.json              # Dependências backend
├── 📁 frontend/                   # Aplicação React (Clientes)
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── Header/           # Cabeçalho e navegação
│   │   │   ├── FoodItem/         # Item de produto
│   │   │   ├── FoodDisplay/      # Lista de produtos
│   │   │   ├── LoginPopup/       # Modal de login
│   │   │   └── Footer/           # Rodapé
│   │   ├── 📁 pages/
│   │   │   ├── Home/             # Página inicial
│   │   │   ├── Cart/             # Carrinho de compras
│   │   │   ├── PlaceOrder/       # Finalizar pedido
│   │   │   ├── MyOrders/         # Meus pedidos
│   │   │   └── ProductDetail/    # Detalhes do produto
│   │   ├── 📁 context/
│   │   │   └── StoreContext.jsx  # Context API
│   │   └── App.jsx               # Componente principal
│   └── package.json              # Dependências frontend
├── 📁 admin/                      # Painel Administrativo Multi-Tenant
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── Navbar/           # Navegação admin
│   │   │   ├── Sidebar/          # Menu lateral (Store Admin)
│   │   │   ├── SuperAdminLogin/  # Login Super Admin
│   │   │   └── SuperAdminSidebar/ # Menu lateral Super Admin
│   │   ├── 📁 pages/
│   │   │   ├── Add/              # Adicionar produtos
│   │   │   ├── List/             # Listar produtos
│   │   │   ├── Orders/           # Gerenciar pedidos
│   │   │   ├── Categories/       # Gerenciar categorias
│   │   │   ├── Banners/          # Gerenciar banners
│   │   │   ├── Users/            # Visualizar usuários
│   │   │   ├── TelegramBot/      # Gerenciar Bot Telegram
│   │   │   └── SuperAdmin/       # Páginas Super Admin
│   │   │       ├── StoreManagement/ # Gestão de lojas
│   │   │       └── SystemSettings/  # Configurações globais
│   │   └── App.jsx               # App administrativo
│   └── package.json              # Dependências admin
└── 📁 ai-assistant/               # Assistente IA Liza
    ├── 📁 .chainlit/             # Configurações Chainlit
    ├── 📁 delivery_ai/           # Módulos da IA
    ├── 📁 src/                   # Código fonte da IA
    ├── .env                      # Variáveis de ambiente
    ├── app.py                    # Aplicação principal Chainlit
    ├── config.py                 # Configurações da IA
    ├── requirements.txt          # Dependências Python
    └── README.md                 # Documentação da IA
```

## 🔧 Scripts Disponíveis

### Backend
```bash
npm start          # Produção
npm run server     # Desenvolvimento (nodemon)
node createAdmin.js # Criar usuário admin
```

### Frontend/Admin
```bash
npm run dev        # Desenvolvimento
npm run build      # Build produção
npm run preview    # Preview build
```

## 🏢 Arquitetura Multi-Tenant

### Conceito
O sistema utiliza uma arquitetura multi-tenant que permite que múltiplas lojas operem de forma independente em uma única instância da aplicação. Cada loja possui:

- **Isolamento de Dados**: Cada loja acessa apenas seus próprios dados
- **Configurações Independentes**: Cada loja pode ter suas próprias configurações
- **Administração Separada**: Cada loja tem seus próprios administradores
- **Gestão Centralizada**: Super Admin controla todas as lojas

### Roles e Permissões

#### Super Admin
- **Acesso Total**: Controle completo sobre todas as lojas
- **Gestão de Lojas**: Criar, editar, ativar/suspender lojas
- **Configurações Globais**: Definir configurações que afetam todo o sistema
- **Estatísticas Centralizadas**: Visão geral de performance

#### Store Admin
- **Acesso Restrito**: Apenas dados da própria loja
- **Gestão da Loja**: Produtos, categorias, pedidos, usuários
- **Configurações Locais**: Personalizar configurações específicas
- **Relatórios**: Estatísticas apenas da própria loja

#### Customer
- **Acesso por Loja**: Visualiza apenas produtos da loja selecionada
- **Pedidos**: Histórico específico por loja
- **Perfil**: Dados compartilhados entre lojas

### Middleware Multi-Tenancy
O sistema utiliza um middleware especializado que:

- **Identifica a Loja**: Através de headers ou contexto
- **Filtra Dados**: Garante isolamento entre lojas
- **Valida Permissões**: Controla acesso baseado em roles
- **Injeta Contexto**: Adiciona informações da loja nas requisições

## 🔍 Funcionalidades Detalhadas

### Sistema de Banners
- **Criação**: Upload de imagem e configuração de título/descrição
- **Direcionamento**: Banners podem direcionar para produtos específicos
- **Status**: Controle de banners ativos/inativos
- **Ordenação**: Sistema de ordem de exibição

### Sistema de Categorias
- **CRUD Completo**: Criar, editar, visualizar e excluir
- **Status Dinâmico**: Ativar/desativar categorias
- **Imagens**: Upload de imagens para cada categoria
- **Filtros**: Filtrar produtos por categoria no frontend

### Sistema de Produtos
- **Gestão Completa**: CRUD com upload de imagens
- **Extras**: Sistema de adicionais personalizáveis
- **Categorização**: Vinculação com sistema de categorias
- **Páginas Individuais**: Cada produto tem sua página detalhada

### Sistema de Pedidos
- **Rastreamento**: Status em tempo real
- **Pagamentos**: Integração Stripe + pagamento na entrega
- **Histórico**: Completo para clientes e administradores

## 🚨 Solução de Problemas

### Erro de Conexão MongoDB
```bash
# Verifique se o MongoDB está rodando
mongod --version

# Ou use MongoDB Atlas (nuvem)
# Altere MONGODB_URI no .env
```

### Portas em Uso
```bash
# Verifique portas ocupadas
netstat -ano | findstr :4000
netstat -ano | findstr :5173
netstat -ano | findstr :5174
```

### Problemas de Dependências
```bash
# Limpe cache e reinstale
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Contato

Se você tiver alguma dúvida ou sugestão, sinta-se à vontade para entrar em contato!

---

⭐ **Se este projeto foi útil para você, considere dar uma estrela!**
