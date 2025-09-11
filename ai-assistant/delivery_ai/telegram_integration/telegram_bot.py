#!/usr/bin/env python3
"""
Bot do Telegram para IA Liza - Sistema de Delivery
Integração completa com atendimento ao cliente e disparos promocionais
"""

import os
import json
import yaml
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

import aiohttp
import aioredis
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, MessageHandler, 
    CallbackQueryHandler, ContextTypes, filters
)
from telegram.constants import ParseMode

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class Customer:
    """Representa um cliente no sistema"""
    user_id: int
    username: str
    first_name: str
    last_name: str = ""
    phone: str = ""
    address: str = ""
    is_admin: bool = False
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()
    
    def to_dict(self) -> Dict:
        return {
            'user_id': self.user_id,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'address': self.address,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat()
        }

class LizaTelegramBot:
    """
    Bot do Telegram para atendimento de delivery
    """
    
    def __init__(self, config_path: str = "../config/config.yaml"):
        """
        Inicializa o bot do Telegram
        
        Args:
            config_path: Caminho para configurações
        """
        self.config = self.load_config(config_path)
        self.token = self.config['telegram']['bot_token']
        self.admin_ids = set(self.config['telegram']['admin_chat_ids'])
        self.redis_client = None
        self.customers = {}  # Cache de clientes
        
        # URLs da API
        self.ai_api_url = "http://localhost:8000"  # URL da API da IA
        
    def load_config(self, config_path: str) -> Dict[str, Any]:
        """
        Carrega configurações
        
        Args:
            config_path: Caminho do arquivo de configuração
            
        Returns:
            Configurações carregadas
        """
        try:
            with open(config_path, 'r', encoding='utf-8') as file:
                return yaml.safe_load(file)
        except Exception as e:
            logger.error(f"Erro ao carregar configurações: {e}")
            raise
    
    async def setup_redis(self):
        """
        Configura conexão com Redis
        """
        try:
            redis_url = self.config['cache']['url']
            self.redis_client = aioredis.from_url(redis_url)
            await self.redis_client.ping()
            logger.info("Conexão com Redis estabelecida")
        except Exception as e:
            logger.error(f"Erro ao conectar com Redis: {e}")
    
    async def get_ai_response(self, user_id: str, message: str) -> Dict[str, Any]:
        """
        Obtém resposta da IA
        
        Args:
            user_id: ID do usuário
            message: Mensagem do usuário
            
        Returns:
            Resposta da IA
        """
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    'user_id': user_id,
                    'message': message
                }
                
                async with session.post(
                    f"{self.ai_api_url}/chat",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.error(f"Erro na API da IA: {response.status}")
                        return {
                            'response': 'Desculpe, estou com dificuldades técnicas. Tente novamente.',
                            'error': f'API Error: {response.status}'
                        }
        except Exception as e:
            logger.error(f"Erro ao comunicar com IA: {e}")
            return {
                'response': 'Desculpe, não consegui processar sua mensagem no momento.',
                'error': str(e)
            }
    
    async def register_customer(self, update: Update) -> Customer:
        """
        Registra ou atualiza cliente
        
        Args:
            update: Update do Telegram
            
        Returns:
            Objeto Customer
        """
        user = update.effective_user
        
        customer = Customer(
            user_id=user.id,
            username=user.username or "",
            first_name=user.first_name or "",
            last_name=user.last_name or "",
            is_admin=user.id in self.admin_ids
        )
        
        # Salva no cache
        self.customers[user.id] = customer
        
        # Salva no Redis
        if self.redis_client:
            try:
                await self.redis_client.set(
                    f"customer:{user.id}",
                    json.dumps(customer.to_dict()),
                    ex=86400  # 24 horas
                )
            except Exception as e:
                logger.error(f"Erro ao salvar cliente no Redis: {e}")
        
        return customer
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        Comando /start
        """
        customer = await self.register_customer(update)
        
        welcome_message = self.config['telegram']['templates']['welcome']
        
        # Teclado inline com opções
        keyboard = [
            [InlineKeyboardButton("🍕 Fazer Pedido", callback_data="make_order")],
            [InlineKeyboardButton("📋 Cardápio", callback_data="menu")],
            [InlineKeyboardButton("📞 Contato", callback_data="contact")]
        ]
        
        if customer.is_admin:
            keyboard.append([InlineKeyboardButton("👑 Admin", callback_data="admin_panel")])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            welcome_message,
            reply_markup=reply_markup,
            parse_mode=ParseMode.MARKDOWN
        )
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        Comando /help
        """
        help_text = """
🤖 *Comandos Disponíveis:*

/start - Iniciar conversa
/help - Mostrar esta ajuda
/menu - Ver cardápio
/pedido - Status do pedido atual
/contato - Informações de contato

📱 *Como usar:*
• Digite sua mensagem naturalmente
• A Liza entenderá seu pedido
• Confirme os dados antes de finalizar

🍕 *Exemplos:*
• "Quero uma pizza grande de calabresa"
• "Adicionar refrigerante ao pedido"
• "Qual o tempo de entrega?"
        """
        
        await update.message.reply_text(
            help_text,
            parse_mode=ParseMode.MARKDOWN
        )
    
    async def menu_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        Comando /menu - Mostra cardápio
        """
        menu_text = """
🍕 *CARDÁPIO DELIVERY*

*PIZZAS GRANDES:*
• Calabresa - R$ 35,00
• Margherita - R$ 32,00
• Portuguesa - R$ 38,00
• Frango c/ Catupiry - R$ 36,00
• Vegana - R$ 38,00

🍔 *HAMBÚRGUERES:*
• Completo - R$ 18,00
• Simples - R$ 12,00
• Duplo - R$ 25,00

🥤 *BEBIDAS:*
• Refrigerante 2L - R$ 8,00
• Refrigerante Lata - R$ 4,00
• Cerveja Long Neck - R$ 5,00

🍰 *SOBREMESAS:*
• Pudim - R$ 8,00
• Brigadeirão - R$ 12,00
• Petit Gateau - R$ 18,00

📍 *Taxa de entrega: R$ 5,00*
⏰ *Pedido mínimo: R$ 25,00*
        """
        
        keyboard = [
            [InlineKeyboardButton("🛒 Fazer Pedido", callback_data="make_order")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            menu_text,
            reply_markup=reply_markup,
            parse_mode=ParseMode.MARKDOWN
        )
    
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        Processa mensagens de texto
        """
        user_id = str(update.effective_user.id)
        message = update.message.text
        
        # Registra cliente se necessário
        await self.register_customer(update)
        
        # Obtém resposta da IA
        ai_result = await self.get_ai_response(user_id, message)
        
        # Envia resposta
        response_text = ai_result.get('response', 'Desculpe, não entendi.')
        
        # Adiciona teclado se houver pedido ativo
        keyboard = None
        if ai_result.get('order_data'):
            keyboard = [
                [InlineKeyboardButton("✅ Confirmar Pedido", callback_data="confirm_order")],
                [InlineKeyboardButton("❌ Cancelar Pedido", callback_data="cancel_order")],
                [InlineKeyboardButton("📋 Ver Pedido", callback_data="view_order")]
            ]
        
        reply_markup = InlineKeyboardMarkup(keyboard) if keyboard else None
        
        await update.message.reply_text(
            response_text,
            reply_markup=reply_markup,
            parse_mode=ParseMode.MARKDOWN
        )
    
    async def handle_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        Processa callbacks dos botões inline
        """
        query = update.callback_query
        await query.answer()
        
        data = query.data
        user_id = str(query.from_user.id)
        
        if data == "make_order":
            await query.edit_message_text(
                "🛒 *Fazer Pedido*\n\nDigite o que gostaria de pedir. Exemplo:\n\n• \"Quero uma pizza grande de calabresa\"\n• \"Adicionar refrigerante de 2L\"",
                parse_mode=ParseMode.MARKDOWN
            )
        
        elif data == "menu":
            await self.menu_command(update, context)
        
        elif data == "contact":
            contact_text = """
📞 *CONTATO*

🕐 *Horário:* 18h às 23h30
📱 *WhatsApp:* (11) 99999-9999
📧 *Email:* contato@delivery.com
📍 *Endereço:* Rua das Pizzas, 123

⚡ *Entrega rápida em toda a cidade!*
            """
            await query.edit_message_text(
                contact_text,
                parse_mode=ParseMode.MARKDOWN
            )
        
        elif data == "admin_panel":
            if query.from_user.id in self.admin_ids:
                await self.show_admin_panel(query)
            else:
                await query.edit_message_text("❌ Acesso negado.")
        
        elif data == "confirm_order":
            # Confirma pedido via IA
            ai_result = await self.get_ai_response(user_id, "Confirmo o pedido")
            await query.edit_message_text(
                ai_result.get('response', 'Pedido confirmado!'),
                parse_mode=ParseMode.MARKDOWN
            )
        
        elif data == "cancel_order":
            # Cancela pedido via IA
            ai_result = await self.get_ai_response(user_id, "Quero cancelar o pedido")
            await query.edit_message_text(
                ai_result.get('response', 'Pedido cancelado.'),
                parse_mode=ParseMode.MARKDOWN
            )
        
        elif data.startswith("promo_"):
            # Gerencia promoções (admin)
            if query.from_user.id in self.admin_ids:
                await self.handle_promo_action(query, data)
    
    async def show_admin_panel(self, query):
        """
        Mostra painel administrativo
        """
        admin_text = """
👑 *PAINEL ADMINISTRATIVO*

📊 *Estatísticas do Dia:*
• Pedidos: 15
• Faturamento: R$ 650,00
• Clientes ativos: 8

🎯 *Ações Disponíveis:*
        """
        
        keyboard = [
            [InlineKeyboardButton("📢 Enviar Promoção", callback_data="promo_send")],
            [InlineKeyboardButton("👥 Ver Clientes", callback_data="promo_customers")],
            [InlineKeyboardButton("📊 Relatórios", callback_data="promo_reports")],
            [InlineKeyboardButton("⚙️ Configurações", callback_data="promo_settings")]
        ]
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            admin_text,
            reply_markup=reply_markup,
            parse_mode=ParseMode.MARKDOWN
        )
    
    async def handle_promo_action(self, query, data: str):
        """
        Processa ações promocionais do admin
        """
        if data == "promo_send":
            # Interface para enviar promoção
            promo_text = """
📢 *ENVIAR PROMOÇÃO*

Digite a mensagem promocional que deseja enviar para todos os clientes:

*Exemplo:*
🍕 Oferta especial! Pizza grande + refrigerante por apenas R$ 39,90! Válida até 23h.
            """
            
            await query.edit_message_text(
                promo_text,
                parse_mode=ParseMode.MARKDOWN
            )
        
        elif data == "promo_customers":
            # Lista clientes
            customers_count = len(self.customers)
            customers_text = f"""
👥 *CLIENTES CADASTRADOS*

📊 Total: {customers_count} clientes

*Últimos cadastros:*
            """
            
            # Adiciona últimos 5 clientes
            recent_customers = list(self.customers.values())[-5:]
            for customer in recent_customers:
                customers_text += f"• {customer.full_name} (@{customer.username})\n"
            
            await query.edit_message_text(
                customers_text,
                parse_mode=ParseMode.MARKDOWN
            )
    
    async def send_promotional_message(self, message: str, target_users: List[int] = None):
        """
        Envia mensagem promocional para usuários
        
        Args:
            message: Mensagem a ser enviada
            target_users: Lista de IDs de usuários (None = todos)
        """
        if target_users is None:
            target_users = list(self.customers.keys())
        
        config = self.config['telegram']['promotional']
        max_batch = config['max_recipients_per_batch']
        delay = config['delay_between_messages']
        
        sent_count = 0
        failed_count = 0
        
        # Envia em lotes
        for i in range(0, len(target_users), max_batch):
            batch = target_users[i:i + max_batch]
            
            for user_id in batch:
                try:
                    await self.application.bot.send_message(
                        chat_id=user_id,
                        text=message,
                        parse_mode=ParseMode.MARKDOWN
                    )
                    sent_count += 1
                    
                    # Delay entre mensagens
                    await asyncio.sleep(delay)
                    
                except Exception as e:
                    logger.error(f"Erro ao enviar para {user_id}: {e}")
                    failed_count += 1
        
        logger.info(f"Promoção enviada: {sent_count} sucessos, {failed_count} falhas")
        return sent_count, failed_count
    
    async def error_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        Trata erros do bot
        """
        logger.error(f"Erro no bot: {context.error}")
        
        if update and update.effective_message:
            await update.effective_message.reply_text(
                "😅 Ops! Algo deu errado. Tente novamente em alguns instantes."
            )
    
    def setup_handlers(self, application: Application):
        """
        Configura handlers do bot
        
        Args:
            application: Aplicação do Telegram
        """
        # Comandos
        application.add_handler(CommandHandler("start", self.start_command))
        application.add_handler(CommandHandler("help", self.help_command))
        application.add_handler(CommandHandler("menu", self.menu_command))
        
        # Mensagens de texto
        application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
        
        # Callbacks
        application.add_handler(CallbackQueryHandler(self.handle_callback))
        
        # Error handler
        application.add_error_handler(self.error_handler)
    
    async def run(self):
        """
        Executa o bot
        """
        # Configura Redis
        await self.setup_redis()
        
        # Cria aplicação
        self.application = Application.builder().token(self.token).build()
        
        # Configura handlers
        self.setup_handlers(self.application)
        
        logger.info("Bot do Telegram iniciado")
        
        # Inicia o bot
        await self.application.run_polling()

async def main():
    """
    Função principal
    """
    bot = LizaTelegramBot()
    await bot.run()

if __name__ == "__main__":
    asyncio.run(main())