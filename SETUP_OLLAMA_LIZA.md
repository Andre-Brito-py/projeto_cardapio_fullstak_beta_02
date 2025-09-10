# 🤖 Setup da Assistente Liza com Ollama

## Pré-requisitos

### 1. Instalar o Ollama

**Windows:**
```bash
# Baixar e instalar do site oficial
# https://ollama.ai/download
```

**Linux/Mac:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Baixar o Modelo

```bash
# Modelo recomendado (3B parâmetros - rápido e eficiente)
ollama pull llama3.2:3b

# Alternativas:
# ollama pull llama3.2:1b  # Mais rápido, menos preciso
# ollama pull llama3.2:7b  # Mais preciso, mais lento
```

### 3. Iniciar o Ollama

```bash
# Iniciar o servidor Ollama
ollama serve

# O servidor rodará em http://localhost:11434
```

## Configuração da Liza

### 1. Verificar Conexão

A Liza verificará automaticamente se o Ollama está rodando. Se não estiver, você verá a mensagem:
```
"Ollama não está disponível. Certifique-se de que está rodando em localhost:11434"
```

### 2. Comandos Disponíveis

#### 📋 **Gerenciamento do Cardápio**
- `consultar cardápio` - Lista todos os produtos
- `disponibilizar [nome do item]` - Marca item como disponível
- `indisponibilizar [nome do item]` - Marca item como indisponível
- `alterar preço [nome do item] [valor]` - Altera preço do produto

#### 📦 **Consulta de Pedidos**
- `pedidos em andamento` - Lista pedidos ativos
- `todos os pedidos` - Lista todos os pedidos

#### 📊 **Relatórios**
- `relatório do dia` - Resumo completo do dia
- `resumo de hoje` - Estatísticas atuais

#### ❓ **Ajuda**
- `ajuda` - Lista todos os comandos disponíveis

### 3. Exemplos de Uso

```
# Consultar cardápio
Usuário: "consultar cardápio"
Liza: "📋 Cardápio (15 itens): ..."

# Alterar disponibilidade
Usuário: "indisponibilizar Pizza Margherita"
Liza: "✅ Pizza Margherita foi indisponibilizada com sucesso!"

# Alterar preço
Usuário: "alterar preço Hambúrguer Clássico 25.90"
Liza: "✅ Preço de Hambúrguer Clássico alterado para R$ 25.90!"

# Consultar pedidos
Usuário: "pedidos em andamento"
Liza: "📦 Pedidos em Andamento (3): ..."

# Gerar relatório
Usuário: "relatório do dia"
Liza: "📊 Relatório do Dia - 15/01/2024: ..."
```

## Arquitetura da Solução

### Fluxo de Comunicação

```
Admin Interface → LizaService → OllamaService + BackendService
                                      ↓
                              Ollama Local (llama3.2:3b)
                                      ↓
                              Backend APIs (MongoDB)
```

### Serviços Implementados

1. **OllamaService** (`/admin/src/services/ollamaService.js`)
   - Comunicação direta com Ollama
   - Processamento de linguagem natural
   - Construção de prompts contextuais

2. **BackendService** (`/admin/src/services/backendService.js`)
   - Integração com APIs do backend
   - Operações CRUD no cardápio
   - Consultas de pedidos e relatórios

3. **LizaService** (`/admin/src/services/lizaService.js`)
   - Orquestração entre Ollama e Backend
   - Reconhecimento de comandos
   - Formatação de respostas

## Troubleshooting

### Problema: "Ollama não está disponível"
**Solução:**
```bash
# Verificar se o Ollama está rodando
curl http://localhost:11434/api/tags

# Se não estiver, iniciar:
ollama serve
```

### Problema: "Modelo não encontrado"
**Solução:**
```bash
# Baixar o modelo
ollama pull llama3.2:3b

# Verificar modelos instalados
ollama list
```

### Problema: Respostas lentas
**Soluções:**
1. Usar modelo menor: `ollama pull llama3.2:1b`
2. Aumentar RAM disponível
3. Usar GPU se disponível

### Problema: Erro de autenticação no backend
**Solução:**
- Verificar se o token está válido no localStorage
- Fazer login novamente no admin

## Performance

### Requisitos Mínimos
- **RAM:** 8GB (recomendado 16GB)
- **CPU:** 4 cores
- **Armazenamento:** 5GB livres

### Otimizações
- Modelo `llama3.2:1b` para máquinas mais lentas
- Modelo `llama3.2:3b` para uso geral (recomendado)
- Modelo `llama3.2:7b` para máxima precisão

## Segurança

✅ **Vantagens da Solução Local:**
- Dados não saem do servidor
- Sem dependência de APIs externas
- Controle total sobre o processamento
- Sem custos por uso
- Funciona offline

## Monitoramento

### Logs do Ollama
```bash
# Ver logs do Ollama
ollama logs
```

### Logs da Liza
- Console do navegador (F12)
- Network tab para requisições
- Mensagens de erro no chat

## Próximos Passos

1. **Testar todos os comandos** listados acima
2. **Configurar modelo preferido** baseado na performance
3. **Treinar equipe** nos comandos disponíveis
4. **Monitorar performance** e ajustar conforme necessário

---

**🎉 A Liza está pronta para uso!**

Para suporte técnico, consulte os logs ou entre em contato com a equipe de desenvolvimento.