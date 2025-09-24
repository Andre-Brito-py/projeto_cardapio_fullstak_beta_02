# Configuração da API Key do OpenRouter

## Como obter uma API Key do OpenRouter

### Passo 1: Criar uma conta
1. Acesse [https://openrouter.ai/](https://openrouter.ai/)
2. Clique em "Sign Up" para criar uma conta gratuita
3. Confirme seu email

### Passo 2: Obter créditos gratuitos
1. Faça login na sua conta
2. Vá para a página "Credits"
3. Novos usuários recebem uma pequena quantidade de créditos gratuitos para teste
4. **Opcional**: Adicione pelo menos $10 em créditos para aumentar o limite diário de 50 para 1000 requisições nos modelos gratuitos

### Passo 3: Criar uma API Key
1. Vá para a página "API Keys" no painel
2. Clique em "Create API Key"
3. Dê um nome para sua chave (ex: "Liza Chat")
4. **Opcional**: Defina um limite de créditos para a chave
5. Copie a chave gerada (ela começa com `sk-or-v1-`)

### Passo 4: Configurar no projeto
1. Abra o arquivo `admin/.env`
2. Substitua `sk-or-v1-your-api-key-here` pela sua chave real:
   ```
   VITE_OPENROUTER_API_KEY=sk-or-v1-sua-chave-aqui
   ```
3. Salve o arquivo

### Passo 5: Reiniciar o servidor
1. Pare o servidor admin (Ctrl+C no terminal)
2. Execute novamente: `npm run dev`
3. O Vite detectará a mudança no .env e reiniciará automaticamente

## Modelos Gratuitos Disponíveis

O sistema está configurado para usar o modelo `meta-llama/llama-3.2-3b-instruct:free`, que é gratuito e adequado para a Liza.

### Outros modelos gratuitos disponíveis:
- `meta-llama/llama-3.2-1b-instruct:free`
- `google/gemma-2-9b-it:free`
- `microsoft/phi-3-mini-128k-instruct:free`
- `qwen/qwen-2-7b-instruct:free`

## Limites dos Modelos Gratuitos

- **Sem créditos**: 50 requisições por dia
- **Com pelo menos $10 em créditos**: 1000 requisições por dia
- **Rate limit**: 20 requisições por minuto

## Testando a Configuração

1. Acesse o painel admin em `http://localhost:5174`
2. Vá para a seção "Chat com Liza"
3. Envie uma mensagem de teste
4. Se a API Key estiver correta, a Liza responderá normalmente
5. Se houver erro, verifique:
   - Se a chave está correta no arquivo `.env`
   - Se você tem créditos suficientes na conta OpenRouter
   - Se não excedeu o limite de requisições

## Solução de Problemas

### Erro 401 (Unauthorized)
- Verifique se a API Key está correta
- Confirme que a chave não foi revogada no painel OpenRouter

### Erro 402 (Payment Required)
- Sua conta está com saldo negativo
- Adicione créditos na página "Credits"

### Erro 429 (Rate Limited)
- Você excedeu o limite de requisições
- Aguarde ou adicione créditos para aumentar o limite

### Erro de conexão
- Verifique sua conexão com a internet
- Confirme que o OpenRouter está acessível

## Segurança

⚠️ **IMPORTANTE**: 
- Nunca compartilhe sua API Key
- Não faça commit da chave no Git
- O arquivo `.env` já está no `.gitignore`
- Se a chave for comprometida, revogue-a imediatamente no painel OpenRouter