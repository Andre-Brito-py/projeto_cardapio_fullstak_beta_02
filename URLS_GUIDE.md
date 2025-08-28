# 🌐 Guia de URLs e Portas - Food Delivery Application

## 📋 Resumo das Portas

| Aplicação | Porta | URL | Descrição |
|-----------|-------|-----|----------|
| **Frontend (Cliente)** | 5173 | http://localhost:5173 | Interface para clientes fazerem pedidos |
| **Admin (Loja)** | 5174 | http://localhost:5174 | Painel administrativo das lojas |
| **Backend (API)** | 4000 | http://localhost:4000 | Servidor da API |

## ⚠️ IMPORTANTE: Configuração Correta de Links

### ✅ Links Corretos
- **Links de loja para clientes**: Devem apontar para `http://localhost:5173/loja/{slug}`
- **Links de mesa (QR Code)**: Devem apontar para `http://localhost:5173/menu/{storeId}?table={tableId}`
- **Painel administrativo**: `http://localhost:5174`

### ❌ Erros Comuns
- ❌ Usar porta 5174 para links de cliente (isso leva ao admin)
- ❌ Usar porta 5173 para links de admin
- ❌ Hardcoding de URLs sem usar configuração centralizada

## 🔧 Configuração Centralizada

Para evitar erros de URL, use sempre a configuração centralizada:

### Frontend/Admin
```javascript
// admin/src/config/urls.js
import { FRONTEND_URL, ADMIN_URL, BACKEND_URL } from '../../config/urls';
```

### Backend
```javascript
// Use variáveis de ambiente com fallback correto
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const adminUrl = process.env.ADMIN_URL || 'http://localhost:5174';
```

## 🛠️ Arquivos Corrigidos

1. **admin/src/pages/StoreLinks/StoreLinks.jsx**
   - ✅ Corrigido para usar `FRONTEND_URL` (porta 5173)
   - ✅ Implementada configuração centralizada

2. **backend/models/tableModel.js**
   - ✅ Corrigido fallback para porta 5173

3. **backend/createAdmin.js**
   - ✅ Clarificado que é URL do admin

## 🔍 Como Verificar se Está Correto

### Teste Manual
1. Acesse o admin em `http://localhost:5174`
2. Vá para "Link da Loja"
3. Verifique se o link gerado usa porta 5173
4. Teste o link - deve abrir a página do cliente, não do admin

### Teste Automatizado
Execute o script de validação:
```bash
node scripts/validate-urls.js
```

## 🚀 Produção

Em produção, configure as variáveis de ambiente:
```bash
FRONTEND_URL=https://your-client-domain.com
ADMIN_URL=https://your-admin-domain.com
BACKEND_URL=https://your-api-domain.com
```

## 📞 Suporte

Se encontrar problemas com URLs:
1. Verifique se as portas estão corretas
2. Confirme se está usando a configuração centralizada
3. Execute o script de validação
4. Reinicie os servidores após mudanças