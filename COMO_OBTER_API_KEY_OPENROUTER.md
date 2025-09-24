# Como Obter uma API Key do OpenRouter

## ⚠️ IMPORTANTE
O erro `OPENROUTER_API_KEY não está configurada` indica que você precisa de uma **API Key REAL** do OpenRouter para que a Liza funcione.

## 📋 Passo a Passo Completo

### 1. Criar Conta no OpenRouter
1. Acesse: https://openrouter.ai/
2. Clique em **"Sign Up"** (Cadastrar)
3. Crie sua conta usando:
   - Email e senha, OU
   - Login com Google/GitHub

### 2. Verificar Créditos Gratuitos
- Novos usuários recebem **créditos gratuitos** para teste
- Você pode ver seus créditos no painel principal

### 3. Gerar API Key
1. Após fazer login, vá para **"API Keys"** no menu lateral
2. Clique em **"Create API Key"**
3. Dê um nome para sua chave (ex: "Liza-Chatbot")
4. Clique em **"Create"**
5. **COPIE A CHAVE IMEDIATAMENTE** - ela só será mostrada uma vez!

### 4. Configurar no Sistema
1. Abra o arquivo `admin/.env`
2. Substitua a linha:
   ```env
   VITE_OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
   ```
   
   Por:
   ```env
   VITE_OPENROUTER_API_KEY=sua-chave-real-aqui
   ```

### 5. Reiniciar o Sistema
- O servidor admin reiniciará automaticamente
- Teste a Liza no painel admin

## 💰 Informações sobre Créditos

### Modelos Gratuitos
- **meta-llama/llama-3.2-3b-instruct:free** (já configurado)
- **50 requisições/dia** (limite gratuito)
- **20 requisições/minuto**

### Aumentar Limites
- Compre pelo menos **10 créditos** ($1 USD)
- Limite aumenta para **1000 requisições/dia**

## 🔧 Exemplo de API Key Válida
```
sk-or-v1-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

## ❌ Problemas Comuns

### "User not found" (401)
- API Key inválida ou expirada
- Verifique se copiou a chave completa

### "Insufficient credits"
- Créditos esgotados
- Adicione mais créditos na conta

### "Rate limit exceeded"
- Muitas requisições
- Aguarde ou aumente os limites

## 🆘 Suporte
- Documentação: https://openrouter.ai/docs
- Discord: https://discord.gg/openrouter