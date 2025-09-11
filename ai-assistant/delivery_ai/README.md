# IA Liza - Sistema de Delivery com Integração Telegram

## 📋 Visão Geral

Este projeto adapta a IA Liza para funcionar como assistente de delivery, incluindo integração completa com Telegram para atendimento ao cliente e sistema de disparos promocionais.

## 🏗️ Estrutura do Projeto

```
ai-assistant/delivery_ai/
├── config/
│   └── config.yaml              # Configurações principais
├── datasets/
│   └── dataset.jsonl            # Dataset de treinamento
├── models/
│   └── vocab.txt                # Vocabulário especializado
├── scripts/
│   ├── train.py                 # Script de treinamento
│   └── inference.py             # Script de inferência
├── deploy/
│   ├── Dockerfile               # Container da aplicação
│   └── docker-compose.yml       # Orquestração de serviços
├── telegram_integration/
│   ├── telegram_bot.py          # Bot principal do Telegram
│   ├── promotional_system.py    # Sistema de campanhas
│   ├── run_telegram_bot.py      # Script de inicialização
│   └── telegram_config.yaml     # Configurações do Telegram
├── requirements.txt             # Dependências Python
└── README.md                    # Este arquivo
```

## 🚀 Funcionalidades

### 🤖 IA de Atendimento
- Processamento de pedidos em linguagem natural
- Integração com Ollama para respostas inteligentes
- Contexto de conversa persistente
- Validação automática de pedidos

### 📱 Bot Telegram
- Interface conversacional amigável
- Comandos interativos (/start, /menu, /help)
- Botões inline para ações rápidas
- Suporte a múltiplos administradores

### 📢 Sistema Promocional
- Criação de campanhas promocionais
- Segmentação de público-alvo
- Agendamento de envios
- Relatórios de performance
- Rate limiting para evitar spam

### 🐳 Deploy com Docker
- Containerização completa
- Orquestração com Docker Compose
- Serviços inclusos: Redis, PostgreSQL, Nginx
- Monitoramento com Prometheus e Grafana

## 📦 Instalação

### Pré-requisitos
- Python 3.11+
- Docker e Docker Compose
- Redis (para cache)
- Ollama (para IA)

### 1. Configuração do Ambiente

```bash
# Clone o repositório
git clone <seu-repositorio>
cd ai-assistant/delivery_ai

# Instale as dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 2. Configuração do Telegram Bot

1. Crie um bot no Telegram:
   - Converse com @BotFather
   - Use o comando `/newbot`
   - Escolha um nome e username
   - Copie o token fornecido

2. Configure o arquivo `telegram_integration/telegram_config.yaml`:
   ```yaml
   telegram:
     bot_token: "SEU_TOKEN_AQUI"
     admin_chat_ids:
       - SEU_ID_TELEGRAM
   ```

3. Obtenha seu ID do Telegram:
   - Converse com @userinfobot
   - Adicione o ID na lista de admins

### 3. Configuração do Ollama

```bash
# Instale o Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Baixe um modelo (exemplo: llama2)
ollama pull llama2

# Inicie o serviço
ollama serve
```

### 4. Configuração do Redis

```bash
# Via Docker
docker run -d --name redis -p 6379:6379 redis:alpine

# Ou instale localmente
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis
```

## 🏃‍♂️ Execução

### Desenvolvimento

```bash
# Inicie o bot Telegram
cd telegram_integration
python run_telegram_bot.py

# Em outro terminal, inicie a API da IA
cd scripts
python inference.py
```

### Produção com Docker

```bash
# Inicie todos os serviços
cd deploy
docker-compose up -d

# Verifique os logs
docker-compose logs -f

# Pare os serviços
docker-compose down
```

## 🎯 Como Usar

### Para Clientes

1. **Iniciar conversa**: `/start`
2. **Ver cardápio**: `/menu` ou "Quero ver o cardápio"
3. **Fazer pedido**: "Quero uma pizza grande de calabresa"
4. **Adicionar itens**: "Adicionar refrigerante de 2L"
5. **Confirmar pedido**: Usar botão "Confirmar Pedido"

### Para Administradores

1. **Acessar painel admin**: `/start` → "Admin"
2. **Enviar promoção**:
   ```
   📢 OFERTA ESPECIAL!
   Pizza grande + refrigerante por R$ 39,90
   Válida até às 23h!
   ```
3. **Ver estatísticas**: Painel admin → "Relatórios"
4. **Gerenciar clientes**: Painel admin → "Ver Clientes"

## 🔧 Configuração Avançada

### Personalização da IA

1. **Edite o dataset** (`datasets/dataset.jsonl`):
   ```json
   {"pedido": "Quero uma pizza vegana", "resposta": "Ótima escolha! Nossa pizza vegana custa R$ 38,00..."}
   ```

2. **Retreine o modelo**:
   ```bash
   cd scripts
   python train.py
   ```

3. **Ajuste o vocabulário** (`models/vocab.txt`):
   ```
   [PIZZA_VEGANA]
   [INGREDIENTE_ESPECIAL]
   [PROMOCAO_ATIVA]
   ```

### Configuração de Campanhas

```python
# Exemplo de campanha programática
from telegram_integration.promotional_system import PromotionalSystem, MessageType

promo_system = PromotionalSystem()
await promo_system.setup()

campaign = await promo_system.create_campaign(
    name="Promoção de Sexta",
    message_content="🍕 Sexta-feira é dia de pizza! 20% OFF em todas as pizzas!",
    message_type=MessageType.PROMOTION,
    created_by=admin_id,
    target_audience="active_customers"
)

await promo_system.execute_campaign(campaign.id)
```

## 📊 Monitoramento

### Métricas Disponíveis
- Número de mensagens processadas
- Taxa de sucesso de pedidos
- Performance das campanhas
- Tempo de resposta da IA
- Usuários ativos

### Dashboards
- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090

### Logs
```bash
# Logs do bot
tail -f telegram_bot.log

# Logs de campanhas
tail -f campaigns.log

# Logs de erro
tail -f telegram_errors.log
```

## 🔒 Segurança

### Rate Limiting
- 20 mensagens por minuto por usuário
- 10 comandos por minuto por usuário
- Proteção contra spam

### Validação
- Máximo 1000 caracteres por mensagem
- Filtro de palavras proibidas
- Blacklist de usuários

### Dados Sensíveis
- Tokens em variáveis de ambiente
- Criptografia de dados pessoais
- Logs sem informações sensíveis

## 🐛 Troubleshooting

### Problemas Comuns

1. **Bot não responde**:
   ```bash
   # Verifique o token
   echo $TELEGRAM_BOT_TOKEN
   
   # Teste a conectividade
   curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe
   ```

2. **IA não funciona**:
   ```bash
   # Verifique se o Ollama está rodando
   curl http://localhost:11434/api/tags
   
   # Reinicie o serviço
   ollama serve
   ```

3. **Redis não conecta**:
   ```bash
   # Teste a conexão
   redis-cli ping
   
   # Verifique a URL
   echo $REDIS_URL
   ```

4. **Campanhas não enviam**:
   ```bash
   # Verifique os logs
   tail -f campaigns.log
   
   # Verifique permissões do admin
   # ID deve estar na lista admin_chat_ids
   ```

### Logs de Debug

```bash
# Ative logs detalhados
export DEBUG=true

# Execute com logs verbosos
python run_telegram_bot.py --verbose
```

## 🚀 Próximos Passos

### Roadmap
- [ ] Integração com WhatsApp Business API
- [ ] Sistema de pagamentos (PIX, cartão)
- [ ] Geolocalização para entrega
- [ ] Chatbot por voz
- [ ] Analytics avançados
- [ ] Multi-idiomas

### Migração para WhatsApp

Quando a API do WhatsApp Business estiver disponível:

1. **Adapte o bot**:
   ```python
   # Substitua telegram por whatsapp
   from whatsapp_integration.whatsapp_bot import LizaWhatsAppBot
   ```

2. **Migre os dados**:
   ```bash
   python scripts/migrate_telegram_to_whatsapp.py
   ```

3. **Configure webhooks**:
   ```yaml
   whatsapp:
     webhook_url: "https://seu-dominio.com/whatsapp/webhook"
     verify_token: "seu_token_de_verificacao"
   ```

## 📞 Suporte

- **Documentação**: [Wiki do projeto]
- **Issues**: [GitHub Issues]
- **Telegram**: @seu_usuario_suporte
- **Email**: suporte@seudelivery.com

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ❤️ para revolucionar o delivery com IA**