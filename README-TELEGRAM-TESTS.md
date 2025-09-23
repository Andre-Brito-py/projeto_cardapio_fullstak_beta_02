# Testes do Atendimento da Liza via Telegram

Este documento descreve como executar e interpretar os testes do sistema de atendimento ao cliente da assistente de IA Liza via Telegram.

## 📋 Funcionalidades Testadas

### 1. **Identificação da Loja pelo Telefone**
- ✅ Reconhecimento automático da loja baseado no telefone do cliente
- ✅ Isolamento correto entre diferentes lojas
- ✅ Fallback para primeira loja ativa quando não identificada

### 2. **Envio de Link Específico da Loja**
- ✅ Geração de links personalizados por loja
- ✅ Detecção automática de palavras-chave que requerem link
- ✅ Formatação correta dos links (subdomain/slug/ID)

### 3. **Respostas a Mensagens de Texto**
- ✅ Processamento via IA Liza com prompt personalizado
- ✅ Respostas contextualizadas para cada loja
- ✅ Tratamento de erros e fallbacks

### 4. **Suporte a Dúvidas do Cliente**
- ✅ Informações sobre horário de funcionamento
- ✅ Dados da loja (endereço, telefone, etc.)
- ✅ Respostas sobre cardápio e delivery

## 🚀 Como Executar os Testes

### Testes Automáticos

```bash
# Navegar para o diretório backend
cd backend

# Executar todos os testes automatizados
npm run test:telegram
```

### Testes Manuais Interativos

```bash
# Executar interface interativa de testes
npm run test:telegram:manual
```

### Execução Direta

```bash
# Teste automático
node scripts/run-telegram-tests.js

# Teste manual
node tests/telegram-manual-test.js
```

## 📊 Interpretação dos Resultados

### Testes Automáticos

O sistema executará 6 categorias de testes:

1. **Identificação da Loja** - Verifica se o sistema identifica corretamente a loja pelo telefone do cliente
2. **Geração de Links** - Testa a criação de URLs específicas para cada loja
3. **Detecção de Palavras-chave** - Valida quando incluir links nas respostas
4. **Prompt Personalizado** - Confirma que o prompt da IA contém informações da loja
5. **Horário de Funcionamento** - Testa lógica de horários de atendimento
6. **Fluxo Completo** - Simula conversas reais end-to-end

### Exemplo de Saída Esperada

```
🚀 Iniciando testes do atendimento da Liza via Telegram...

🧪 Teste 1: Identificação da loja pelo telefone do cliente
  ✅ Identificação da loja 1: PASSOU - Loja identificada corretamente: Pizzaria Bella Vista
  ✅ Identificação da loja 2: PASSOU - Loja identificada corretamente: Hamburgueria do João

📊 RELATÓRIO DOS TESTES
==================================================
Total de testes: 15
✅ Passou: 15
❌ Falhou: 0
🔥 Erros: 0
📈 Taxa de sucesso: 100.0%

🎉 TODOS OS TESTES PASSARAM! A Liza está pronta para atender via Telegram!
```

## 🧪 Testes Manuais Interativos

O teste manual oferece um menu interativo:

```
📋 MENU PRINCIPAL
================
1. Listar lojas disponíveis
2. Listar clientes cadastrados
3. Simular conversa com cliente
4. Testar identificação de loja
5. Testar geração de links
6. Executar testes automáticos
0. Sair
```

### Simulação de Conversa

Permite testar conversas reais:

```
💬 SIMULAÇÃO DE CONVERSA
Cliente selecionado: Maria Silva

Maria Silva: Quais opções vocês têm no cardápio?
🏪 Loja identificada: Pizzaria Bella Vista
🤖 Liza: Olá Maria! 😊 Temos várias opções deliciosas de pizzas! 🍕 Quer que eu envie o link do nosso cardápio?

🔗 Acesse nosso cardápio: http://localhost:5173/pizzaria-bella-vista
```

## 📝 Exemplos de Testes

### Casos de Teste Padrão

| Mensagem do Cliente | Loja Esperada | Link Incluído | Resposta Esperada |
|-------------------|---------------|---------------|-------------------|
| "Quais opções vocês têm no cardápio?" | Pizzaria Bella Vista | ✅ Sim | Resposta + Link do cardápio |
| "Vocês entregam no meu bairro?" | Hamburgueria do João | ❌ Não | Informações sobre delivery |
| "Até que horas vocês funcionam hoje?" | Pizzaria Bella Vista | ❌ Não | Horário de funcionamento |

### Palavras-chave que Acionam Links

- cardápio, menu, link, site, página
- pedido, pedir, delivery, entrega
- fazer pedido, ver cardápio, opções

## ⚙️ Configuração dos Dados de Teste

Os testes criam automaticamente:

### Lojas de Teste
```javascript
// Loja 1
{
  name: 'Pizzaria Bella Vista',
  telegram: { phoneNumber: '+5511999887766' },
  slug: 'pizzaria-bella-vista'
}

// Loja 2  
{
  name: 'Hamburgueria do João',
  telegram: { phoneNumber: '+5511888776655' },
  slug: 'hamburgueria-joao'
}
```

### Clientes de Teste
```javascript
// Cliente 1 - Pizzaria
{
  name: 'Maria Silva',
  phone: '+5511987654321',
  storeId: pizzaria._id
}

// Cliente 2 - Hamburgueria
{
  name: 'João Santos', 
  phone: '+5511876543210',
  storeId: hamburgueria._id
}
```

## 🔧 Solução de Problemas

### Erro: "Loja não identificada"
- Verificar se existem lojas com `telegram.isActive: true`
- Confirmar se os clientes estão associados às lojas corretas
- Validar se os números de telefone estão no formato correto

### Erro: "OpenRouter API error"
- Verificar se a chave da API está configurada
- Confirmar conectividade com a internet
- Validar se o modelo está disponível

### Erro de Conexão com Banco
- Verificar se o MongoDB está rodando
- Confirmar string de conexão no `.env`
- Validar permissões de acesso ao banco

## 📈 Métricas de Sucesso

Para considerar o sistema pronto para produção:

- ✅ **Taxa de sucesso ≥ 95%** nos testes automáticos
- ✅ **Identificação correta** da loja em 100% dos casos com clientes cadastrados
- ✅ **Geração de links** funcionando para todas as lojas
- ✅ **Respostas da Liza** coerentes e personalizadas
- ✅ **Tratamento de erros** adequado

## 🚀 Próximos Passos

Após os testes passarem:

1. **Configurar webhook** do Telegram em produção
2. **Cadastrar lojas reais** com números de telefone corretos
3. **Importar clientes** existentes para o sistema
4. **Monitorar logs** nas primeiras conversas reais
5. **Ajustar prompts** baseado no feedback dos clientes

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verificar logs do console durante os testes
2. Consultar documentação da API do Telegram
3. Validar configurações no arquivo `.env`
4. Testar conectividade com serviços externos