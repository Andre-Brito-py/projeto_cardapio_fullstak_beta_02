# 🍕 Sistema de Delivery de Comida - Full Stack

Um sistema completo de delivery de comida desenvolvido com tecnologias modernas, oferecendo uma experiência completa para clientes e administradores.

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

### 🔧 Para Administradores
- **Painel Administrativo**: Interface dedicada para gestão
- **Gerenciamento de Produtos**: CRUD completo de pratos e categorias
- **Gestão de Banners**: Sistema completo de banners com direcionamento para produtos
- **Controle de Pedidos**: Visualização e atualização de status
- **Gestão de Usuários**: Controle de clientes cadastrados
- **Upload de Imagens**: Sistema integrado para imagens de produtos e banners
- **Categorias Dinâmicas**: Sistema completo de categorias com status ativo/inativo

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

### Admin Panel
- **React 18** - Interface administrativa
- **Vite** - Build tool
- **Axios** - Comunicação com API
- **CSS3** - Estilização dedicada

## 📦 Instalação e Configuração

### Pré-requisitos
- **Node.js** (v14 ou superior)
- **MongoDB** (local ou MongoDB Atlas)
- **Git** (para clonar o repositório)
- **Conta no Stripe** (opcional, para pagamentos)

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/projeto_cardapio_fullstak_beta_02.git
cd projeto_cardapio_fullstak_beta_02
```

### 2. Configuração do Backend
```bash
cd backend
npm install
```

**Crie um arquivo `.env` na pasta backend:**
```env
MONGODB_URI=mongodb://localhost:27017/food-delivery
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
STRIPE_SECRET_KEY=sua_chave_stripe_aqui
PORT=4000
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

### 5. Criar Usuário Administrador
**Em um novo terminal:**
```bash
cd backend
node createAdmin.js
```

## 🚀 Como Executar o Projeto

### Execução Completa (3 terminais)

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

### Verificação de Funcionamento
1. **Backend**: Deve mostrar "Server started on http://localhost:4000" e "DB Connected Successfully"
2. **Frontend**: Deve estar disponível em http://localhost:5173
3. **Admin**: Deve estar disponível em http://localhost:5174

## 🔑 Credenciais de Acesso

### Painel Administrativo
- **Email**: admin@fooddelivery.com
- **Senha**: admin123
- **URL**: http://localhost:5174

*⚠️ **IMPORTANTE**: Altere essas credenciais após o primeiro login!*

## 🌐 URLs de Acesso

- **🛒 Frontend (Clientes)**: http://localhost:5173
- **⚙️ Admin Panel**: http://localhost:5174
- **🔌 Backend API**: http://localhost:4000

## 📱 Guia de Uso

### 👤 Para Clientes
1. **Acesso**: Vá para http://localhost:5173
2. **Cadastro**: Crie uma conta ou faça login
3. **Navegação**: Explore o menu por categorias
4. **Carrinho**: Adicione itens e personalize com extras
5. **Checkout**: Finalize com Stripe ou pagamento na entrega
6. **Acompanhamento**: Monitore pedidos em "Meus Pedidos"

### 🔧 Para Administradores
1. **Login**: Acesse http://localhost:5174 com as credenciais
2. **Produtos**: Gerencie cardápio na seção "Add Items"
3. **Categorias**: Controle categorias em "Categories"
4. **Banners**: Configure banners promocionais em "Banners"
5. **Pedidos**: Monitore e atualize status em "Orders"
6. **Usuários**: Visualize clientes em "Users"

## 🏗️ Estrutura Detalhada do Projeto

```
📁 projeto_cardapio_fullstak_beta_02/
├── 📁 backend/                    # API Node.js/Express
│   ├── 📁 config/
│   │   └── db.js                  # Configuração MongoDB
│   ├── 📁 controllers/
│   │   ├── foodController.js      # Gestão de produtos
│   │   ├── categoryController.js  # Gestão de categorias
│   │   ├── bannerController.js    # Gestão de banners
│   │   ├── userController.js      # Autenticação
│   │   └── orderController.js     # Gestão de pedidos
│   ├── 📁 middleware/
│   │   └── auth.js               # Middleware de autenticação
│   ├── 📁 models/
│   │   ├── foodModel.js          # Modelo de produtos
│   │   ├── categoryModel.js      # Modelo de categorias
│   │   ├── bannerModel.js        # Modelo de banners
│   │   ├── userModel.js          # Modelo de usuários
│   │   └── orderModel.js         # Modelo de pedidos
│   ├── 📁 routes/
│   │   ├── foodRoute.js          # Rotas de produtos
│   │   ├── categoryRoute.js      # Rotas de categorias
│   │   ├── bannerRoute.js        # Rotas de banners
│   │   ├── userRoute.js          # Rotas de usuários
│   │   └── orderRoute.js         # Rotas de pedidos
│   ├── 📁 uploads/               # Imagens enviadas
│   ├── server.js                 # Servidor principal
│   ├── createAdmin.js            # Script para criar admin
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
└── 📁 admin/                      # Painel Administrativo
    ├── 📁 src/
    │   ├── 📁 components/
    │   │   ├── Navbar/           # Navegação admin
    │   │   └── Sidebar/          # Menu lateral
    │   ├── 📁 pages/
    │   │   ├── Add/              # Adicionar produtos
    │   │   ├── List/             # Listar produtos
    │   │   ├── Orders/           # Gerenciar pedidos
    │   │   ├── Categories/       # Gerenciar categorias
    │   │   ├── Banners/          # Gerenciar banners
    │   │   └── Users/            # Visualizar usuários
    │   └── App.jsx               # App administrativo
    └── package.json              # Dependências admin
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
