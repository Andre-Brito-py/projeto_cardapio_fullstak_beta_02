#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Serviço de Telegram para IA Liza

Este módulo fornece funcionalidades para a IA Liza enviar mensagens
diretamente aos clientes via Telegram, incluindo mensagens promocionais,
notificações de pedidos e comunicação personalizada.

Autor: Sistema IA Liza
Data: Janeiro 2025
"""

import asyncio
import logging
import json
import aiohttp
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from dataclasses import dataclass
from urllib.parse import urljoin

from liza_customer_service import LizaCustomerService, DEFAULT_CONFIG

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TelegramMessage:
    """Estrutura de uma mensagem do Telegram"""
    chat_id: str
    text: str
    parse_mode: str = "HTML"
    reply_markup: Optional[Dict] = None
    disable_web_page_preview: bool = True

@dataclass
class TelegramConfig:
    """Configuração do serviço Telegram"""
    bot_token: str
    api_base_url: str = "https://api.telegram.org"
    timeout: int = 30
    max_retries: int = 3
    rate_limit_delay: float = 0.1  # Delay entre mensagens para evitar rate limit

class LizaTelegramService:
    """Serviço especializado para envio de mensagens via Telegram pela Liza"""
    
    def __init__(self, telegram_config: TelegramConfig, customer_service: LizaCustomerService):
        self.config = telegram_config
        self.customer_service = customer_service
        self.session = None
        self.base_url = f"{self.config.api_base_url}/bot{self.config.bot_token}"
        
        # Templates de mensagens
        self.message_templates = {
            'welcome': """🤖 <b>Olá {name}!</b>

Eu sou a <b>Liza</b>, sua assistente virtual de delivery! 🍕

Estou aqui para tornar seus pedidos mais fáceis e rápidos.

<b>🎯 O que posso fazer por você:</b>
• 📋 Receber seus pedidos
• 🍽️ Mostrar nosso cardápio
• 💰 Informar preços e promoções
• 📦 Acompanhar status do pedido
• ❓ Responder suas dúvidas

Digite sua mensagem ou use os botões abaixo! 👇""",

            'order_update': """📦 <b>Atualização do seu pedido #{order_id}</b>

👋 Olá {name}!

🔄 <b>Status:</b> {status}
⏰ <b>Tempo estimado:</b> {estimated_time}

{additional_info}

Qualquer dúvida, estou aqui para ajudar! 😊""",

            'promotion': """🎉 <b>Promoção Especial para Você!</b>

👋 Olá {name}!

{promotion_content}

⏰ <b>Válido até:</b> {valid_until}

Não perca essa oportunidade! Faça já seu pedido! 🚀""",

            'feedback_request': """⭐ <b>Como foi sua experiência?</b>

👋 Olá {name}!

Esperamos que tenha gostado do seu pedido! 😊

Sua opinião é muito importante para nós. Que tal nos contar como foi?

<b>🌟 Avalie nosso atendimento:</b>
• Qualidade dos produtos
• Tempo de entrega
• Atendimento

Sua avaliação nos ajuda a melhorar sempre! 💪""",

            'reactivation': """💔 <b>Sentimos sua falta!</b>

👋 Olá {name}!

Notamos que faz um tempo que você não faz um pedido conosco...

🎁 <b>Que tal voltar com uma oferta especial?</b>

{special_offer}

Estamos ansiosos para atendê-lo novamente! 🤗"""
        }
    
    async def __aenter__(self):
        """Context manager para inicializar sessão HTTP"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.config.timeout)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Finalizar sessão HTTP"""
        if self.session:
            await self.session.close()
    
    async def _make_telegram_request(self, method: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Fazer requisição para API do Telegram
        
        Args:
            method: Método da API do Telegram
            data: Dados da requisição
            
        Returns:
            Resposta da API ou None em caso de erro
        """
        url = f"{self.base_url}/{method}"
        
        for attempt in range(self.config.max_retries):
            try:
                async with self.session.post(url, json=data) as response:
                    result = await response.json()
                    
                    if response.status == 200 and result.get('ok'):
                        return result
                    else:
                        error_msg = result.get('description', 'Erro desconhecido')
                        logger.warning(f"Erro na API do Telegram (tentativa {attempt + 1}): {error_msg}")
                        
                        if attempt == self.config.max_retries - 1:
                            logger.error(f"Falha após {self.config.max_retries} tentativas: {error_msg}")
                            return None
                        
                        await asyncio.sleep(2 ** attempt)  # Backoff exponencial
                        
            except Exception as e:
                logger.error(f"Erro na requisição Telegram (tentativa {attempt + 1}): {e}")
                if attempt == self.config.max_retries - 1:
                    return None
                await asyncio.sleep(2 ** attempt)
        
        return None
    
    async def send_message(self, message: TelegramMessage) -> bool:
        """
        Enviar mensagem via Telegram
        
        Args:
            message: Objeto TelegramMessage com dados da mensagem
            
        Returns:
            True se enviado com sucesso, False caso contrário
        """
        try:
            data = {
                'chat_id': message.chat_id,
                'text': message.text,
                'parse_mode': message.parse_mode,
                'disable_web_page_preview': message.disable_web_page_preview
            }
            
            if message.reply_markup:
                data['reply_markup'] = json.dumps(message.reply_markup)
            
            result = await self._make_telegram_request('sendMessage', data)
            
            if result:
                logger.info(f"Mensagem enviada com sucesso para {message.chat_id}")
                return True
            else:
                logger.error(f"Falha ao enviar mensagem para {message.chat_id}")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem: {e}")
            return False
    
    async def send_message_to_customer(
        self, 
        customer_phone: str, 
        store_id: str,
        message_text: str,
        message_type: str = 'custom',
        template_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Enviar mensagem para cliente específico
        
        Args:
            customer_phone: Telefone do cliente
            store_id: ID da loja
            message_text: Texto da mensagem (ou template se message_type != 'custom')
            message_type: Tipo da mensagem ('custom', 'welcome', 'order_update', etc.)
            template_data: Dados para preencher template
            
        Returns:
            True se enviado com sucesso, False caso contrário
        """
        try:
            # Buscar dados do cliente
            customer = await self.customer_service.find_customer_by_phone(customer_phone, store_id)
            
            if not customer:
                logger.warning(f"Cliente não encontrado: {customer_phone}")
                return False
            
            # Verificar se cliente tem Telegram configurado
            telegram_username = customer.get('telegramUsername')
            telegram_chat_id = customer.get('telegramChatId')
            
            if not telegram_chat_id and not telegram_username:
                logger.warning(f"Cliente {customer_phone} não tem Telegram configurado")
                return False
            
            # Verificar se permite contato via Telegram
            if not customer.get('allowTelegramContact', False):
                logger.info(f"Cliente {customer_phone} não permite contato via Telegram")
                return False
            
            # Preparar mensagem
            if message_type != 'custom' and message_type in self.message_templates:
                template = self.message_templates[message_type]
                template_data = template_data or {}
                template_data['name'] = customer.get('name', 'Cliente')
                
                try:
                    formatted_message = template.format(**template_data)
                except KeyError as e:
                    logger.warning(f"Dados faltando no template {message_type}: {e}")
                    formatted_message = message_text
            else:
                formatted_message = message_text
            
            # Criar mensagem
            chat_id = telegram_chat_id or f"@{telegram_username}"
            message = TelegramMessage(
                chat_id=chat_id,
                text=formatted_message
            )
            
            # Enviar mensagem
            success = await self.send_message(message)
            
            if success:
                logger.info(f"Mensagem {message_type} enviada para {customer.get('name')} ({customer_phone})")
            
            return success
            
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem para cliente {customer_phone}: {e}")
            return False
    
    async def send_bulk_messages(
        self,
        store_id: str,
        message_text: str,
        customer_segment: str = 'all',
        message_type: str = 'custom',
        template_data: Optional[Dict[str, Any]] = None,
        max_recipients: int = 100
    ) -> Dict[str, Any]:
        """
        Enviar mensagens em massa para clientes
        
        Args:
            store_id: ID da loja
            message_text: Texto da mensagem
            customer_segment: Segmento de clientes ('all', 'new', 'loyal', 'inactive', 'vip')
            message_type: Tipo da mensagem
            template_data: Dados para template
            max_recipients: Máximo de destinatários
            
        Returns:
            Relatório do envio
        """
        try:
            # Buscar clientes contactáveis via Telegram
            customers = await self.customer_service.get_contactable_customers(
                store_id=store_id,
                segment=customer_segment,
                contact_method='telegram',
                limit=max_recipients
            )
            
            if not customers:
                logger.warning(f"Nenhum cliente contactável via Telegram encontrado para segmento: {customer_segment}")
                return {
                    'success': False,
                    'message': 'Nenhum cliente contactável encontrado',
                    'total_customers': 0,
                    'sent': 0,
                    'failed': 0,
                    'errors': []
                }
            
            logger.info(f"Iniciando envio em massa para {len(customers)} clientes")
            
            sent_count = 0
            failed_count = 0
            errors = []
            
            for customer in customers:
                try:
                    # Aplicar rate limiting
                    await asyncio.sleep(self.config.rate_limit_delay)
                    
                    success = await self.send_message_to_customer(
                        customer_phone=customer.get('phone'),
                        store_id=store_id,
                        message_text=message_text,
                        message_type=message_type,
                        template_data=template_data
                    )
                    
                    if success:
                        sent_count += 1
                    else:
                        failed_count += 1
                        errors.append(f"Falha ao enviar para {customer.get('name')} ({customer.get('phone')})")
                        
                except Exception as e:
                    failed_count += 1
                    error_msg = f"Erro ao processar {customer.get('name', 'Cliente')} ({customer.get('phone', 'N/A')}): {e}"
                    errors.append(error_msg)
                    logger.error(error_msg)
            
            result = {
                'success': True,
                'message': f'Envio concluído: {sent_count} enviadas, {failed_count} falharam',
                'total_customers': len(customers),
                'sent': sent_count,
                'failed': failed_count,
                'errors': errors[:10]  # Limitar erros no retorno
            }
            
            logger.info(f"Envio em massa concluído: {sent_count}/{len(customers)} mensagens enviadas")
            return result
            
        except Exception as e:
            logger.error(f"Erro no envio em massa: {e}")
            return {
                'success': False,
                'message': f'Erro no envio em massa: {e}',
                'total_customers': 0,
                'sent': 0,
                'failed': 0,
                'errors': [str(e)]
            }
    
    async def send_order_notification(
        self,
        customer_phone: str,
        store_id: str,
        order_data: Dict[str, Any]
    ) -> bool:
        """
        Enviar notificação de pedido
        
        Args:
            customer_phone: Telefone do cliente
            store_id: ID da loja
            order_data: Dados do pedido
            
        Returns:
            True se enviado com sucesso
        """
        template_data = {
            'order_id': order_data.get('id', 'N/A'),
            'status': order_data.get('status', 'Confirmado'),
            'estimated_time': order_data.get('estimatedTime', '30-45 minutos'),
            'additional_info': order_data.get('additionalInfo', 'Seu pedido está sendo preparado com carinho!')
        }
        
        return await self.send_message_to_customer(
            customer_phone=customer_phone,
            store_id=store_id,
            message_text='',  # Será usado o template
            message_type='order_update',
            template_data=template_data
        )
    
    async def send_promotion(
        self,
        store_id: str,
        promotion_data: Dict[str, Any],
        customer_segment: str = 'all',
        max_recipients: int = 100
    ) -> Dict[str, Any]:
        """
        Enviar promoção para clientes
        
        Args:
            store_id: ID da loja
            promotion_data: Dados da promoção
            customer_segment: Segmento de clientes
            max_recipients: Máximo de destinatários
            
        Returns:
            Relatório do envio
        """
        template_data = {
            'promotion_content': promotion_data.get('content', 'Oferta especial disponível!'),
            'valid_until': promotion_data.get('validUntil', 'Tempo limitado')
        }
        
        return await self.send_bulk_messages(
            store_id=store_id,
            message_text='',  # Será usado o template
            customer_segment=customer_segment,
            message_type='promotion',
            template_data=template_data,
            max_recipients=max_recipients
        )
    
    async def send_feedback_request(
        self,
        customer_phone: str,
        store_id: str,
        order_id: str
    ) -> bool:
        """
        Solicitar feedback do cliente
        
        Args:
            customer_phone: Telefone do cliente
            store_id: ID da loja
            order_id: ID do pedido
            
        Returns:
            True se enviado com sucesso
        """
        template_data = {
            'order_id': order_id
        }
        
        return await self.send_message_to_customer(
            customer_phone=customer_phone,
            store_id=store_id,
            message_text='',  # Será usado o template
            message_type='feedback_request',
            template_data=template_data
        )
    
    async def get_bot_info(self) -> Optional[Dict[str, Any]]:
        """
        Obter informações do bot
        
        Returns:
            Informações do bot ou None em caso de erro
        """
        try:
            result = await self._make_telegram_request('getMe', {})
            if result:
                return result.get('result')
            return None
        except Exception as e:
            logger.error(f"Erro ao obter informações do bot: {e}")
            return None

# Função de conveniência para criar serviço
async def create_liza_telegram_service(bot_token: str) -> LizaTelegramService:
    """
    Criar instância do serviço Telegram da Liza
    
    Args:
        bot_token: Token do bot Telegram
        
    Returns:
        Instância configurada do serviço
    """
    telegram_config = TelegramConfig(bot_token=bot_token)
    customer_service = LizaCustomerService(DEFAULT_CONFIG)
    
    return LizaTelegramService(telegram_config, customer_service)

if __name__ == "__main__":
    # Teste do serviço
    async def test_telegram_service():
        """Função de teste do serviço Telegram"""
        # Configuração de teste (substitua pelo token real)
        bot_token = "SEU_TOKEN_AQUI"
        store_id = "test_store_123"
        
        if bot_token == "SEU_TOKEN_AQUI":
            print("❌ Configure o token do bot para executar os testes")
            return
        
        service = await create_liza_telegram_service(bot_token)
        
        async with service:
            print("🤖 Testando serviço Telegram da Liza...")
            
            # Teste 1: Informações do bot
            print("\n1. Obtendo informações do bot...")
            bot_info = await service.get_bot_info()
            if bot_info:
                print(f"✅ Bot: {bot_info.get('first_name')} (@{bot_info.get('username')})")
            else:
                print("❌ Erro ao obter informações do bot")
            
            # Teste 2: Enviar mensagem para cliente específico
            print("\n2. Testando envio de mensagem...")
            success = await service.send_message_to_customer(
                customer_phone="11999999999",
                store_id=store_id,
                message_text="Teste de mensagem da Liza!",
                message_type="custom"
            )
            print(f"{'✅' if success else '❌'} Envio de mensagem: {'Sucesso' if success else 'Falhou'}")
            
            # Teste 3: Envio em massa
            print("\n3. Testando envio em massa...")
            result = await service.send_bulk_messages(
                store_id=store_id,
                message_text="Mensagem promocional de teste!",
                customer_segment="all",
                max_recipients=5
            )
            print(f"✅ Envio em massa: {result['sent']} enviadas, {result['failed']} falharam")
    
    # Executar teste
    asyncio.run(test_telegram_service())