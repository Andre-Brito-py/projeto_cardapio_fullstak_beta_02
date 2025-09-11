#!/usr/bin/env python3
"""
Sistema de Disparos Promocionais - Telegram Bot
Gerenciamento de campanhas promocionais para delivery
"""

import os
import json
import yaml
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

import aioredis
import aiofiles
from telegram import Bot
from telegram.constants import ParseMode
from telegram.error import TelegramError

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CampaignStatus(Enum):
    """Status das campanhas promocionais"""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"

class MessageType(Enum):
    """Tipos de mensagem promocional"""
    PROMOTION = "promotion"
    ANNOUNCEMENT = "announcement"
    REMINDER = "reminder"
    SURVEY = "survey"
    WELCOME = "welcome"

@dataclass
class PromoMessage:
    """Representa uma mensagem promocional"""
    id: str
    title: str
    content: str
    message_type: MessageType
    created_by: int
    created_at: datetime
    scheduled_for: Optional[datetime] = None
    target_audience: str = "all"  # all, new_customers, active_customers, vip
    max_recipients: Optional[int] = None
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'message_type': self.message_type.value,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat(),
            'scheduled_for': self.scheduled_for.isoformat() if self.scheduled_for else None,
            'target_audience': self.target_audience,
            'max_recipients': self.max_recipients
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'PromoMessage':
        return cls(
            id=data['id'],
            title=data['title'],
            content=data['content'],
            message_type=MessageType(data['message_type']),
            created_by=data['created_by'],
            created_at=datetime.fromisoformat(data['created_at']),
            scheduled_for=datetime.fromisoformat(data['scheduled_for']) if data.get('scheduled_for') else None,
            target_audience=data.get('target_audience', 'all'),
            max_recipients=data.get('max_recipients')
        )

@dataclass
class Campaign:
    """Representa uma campanha promocional"""
    id: str
    name: str
    message: PromoMessage
    status: CampaignStatus
    created_by: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_recipients: int = 0
    sent_count: int = 0
    failed_count: int = 0
    click_count: int = 0
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'name': self.name,
            'message': self.message.to_dict(),
            'status': self.status.value,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'total_recipients': self.total_recipients,
            'sent_count': self.sent_count,
            'failed_count': self.failed_count,
            'click_count': self.click_count
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Campaign':
        return cls(
            id=data['id'],
            name=data['name'],
            message=PromoMessage.from_dict(data['message']),
            status=CampaignStatus(data['status']),
            created_by=data['created_by'],
            created_at=datetime.fromisoformat(data['created_at']),
            started_at=datetime.fromisoformat(data['started_at']) if data.get('started_at') else None,
            completed_at=datetime.fromisoformat(data['completed_at']) if data.get('completed_at') else None,
            total_recipients=data.get('total_recipients', 0),
            sent_count=data.get('sent_count', 0),
            failed_count=data.get('failed_count', 0),
            click_count=data.get('click_count', 0)
        )

class PromotionalSystem:
    """
    Sistema de gerenciamento de campanhas promocionais
    """
    
    def __init__(self, config_path: str = "../config/config.yaml"):
        """
        Inicializa o sistema promocional
        
        Args:
            config_path: Caminho para configurações
        """
        self.config = self.load_config(config_path)
        self.bot_token = self.config['telegram']['bot_token']
        self.admin_ids = set(self.config['telegram']['admin_chat_ids'])
        self.redis_client = None
        self.bot = None
        
        # Configurações de envio
        self.promo_config = self.config['telegram']['promotional']
        self.max_batch_size = self.promo_config['max_recipients_per_batch']
        self.delay_between_messages = self.promo_config['delay_between_messages']
        self.delay_between_batches = self.promo_config['delay_between_batches']
        
        # Armazenamento
        self.campaigns_file = "campaigns.json"
        self.templates_file = "message_templates.json"
        
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
    
    async def setup(self):
        """
        Configura o sistema
        """
        # Configura Redis
        try:
            redis_url = self.config['cache']['url']
            self.redis_client = aioredis.from_url(redis_url)
            await self.redis_client.ping()
            logger.info("Conexão com Redis estabelecida")
        except Exception as e:
            logger.error(f"Erro ao conectar com Redis: {e}")
        
        # Configura bot
        self.bot = Bot(token=self.bot_token)
        
        # Carrega templates padrão
        await self.load_default_templates()
    
    async def load_default_templates(self):
        """
        Carrega templates padrão de mensagens
        """
        default_templates = {
            "welcome_new_customer": {
                "title": "Boas-vindas",
                "content": "🎉 Bem-vindo ao nosso delivery! Aproveite 10% de desconto no seu primeiro pedido com o código BEMVINDO10",
                "type": "welcome"
            },
            "daily_promotion": {
                "title": "Promoção do Dia",
                "content": "🍕 OFERTA ESPECIAL! Pizza grande + refrigerante por apenas R$ 39,90! Válida até às 23h. Peça já!",
                "type": "promotion"
            },
            "weekend_special": {
                "title": "Especial de Final de Semana",
                "content": "🎊 FINAL DE SEMANA! Combo família: 2 pizzas grandes + 2 refrigerantes 2L por R$ 79,90. Aproveite!",
                "type": "promotion"
            },
            "order_reminder": {
                "title": "Lembrete de Pedido",
                "content": "😋 Sentindo fome? Que tal repetir aquele pedido delicioso? Estamos aqui para te atender!",
                "type": "reminder"
            },
            "feedback_request": {
                "title": "Avaliação",
                "content": "⭐ Como foi sua experiência conosco? Sua opinião é muito importante! Responda em 1 minuto.",
                "type": "survey"
            }
        }
        
        try:
            async with aiofiles.open(self.templates_file, 'w', encoding='utf-8') as file:
                await file.write(json.dumps(default_templates, indent=2, ensure_ascii=False))
            logger.info("Templates padrão carregados")
        except Exception as e:
            logger.error(f"Erro ao salvar templates: {e}")
    
    async def get_customer_list(self, target_audience: str = "all") -> List[int]:
        """
        Obtém lista de clientes baseada no público-alvo
        
        Args:
            target_audience: Tipo de público (all, new_customers, active_customers, vip)
            
        Returns:
            Lista de IDs de usuários
        """
        try:
            if not self.redis_client:
                return []
            
            # Busca todos os clientes
            customer_keys = await self.redis_client.keys("customer:*")
            customers = []
            
            for key in customer_keys:
                customer_data = await self.redis_client.get(key)
                if customer_data:
                    customer = json.loads(customer_data)
                    customers.append(customer)
            
            # Filtra baseado no público-alvo
            if target_audience == "all":
                return [c['user_id'] for c in customers]
            
            elif target_audience == "new_customers":
                # Clientes cadastrados nos últimos 7 dias
                week_ago = datetime.now() - timedelta(days=7)
                return [
                    c['user_id'] for c in customers
                    if datetime.fromisoformat(c['created_at']) > week_ago
                ]
            
            elif target_audience == "active_customers":
                # Clientes que fizeram pedido nos últimos 30 dias
                # Por enquanto, retorna todos (implementar lógica de pedidos)
                return [c['user_id'] for c in customers]
            
            elif target_audience == "vip":
                # Clientes VIP (implementar lógica específica)
                return [c['user_id'] for c in customers if c.get('is_vip', False)]
            
            return []
            
        except Exception as e:
            logger.error(f"Erro ao obter lista de clientes: {e}")
            return []
    
    async def create_campaign(self, 
                            name: str,
                            message_content: str,
                            message_type: MessageType,
                            created_by: int,
                            target_audience: str = "all",
                            scheduled_for: Optional[datetime] = None) -> Campaign:
        """
        Cria uma nova campanha
        
        Args:
            name: Nome da campanha
            message_content: Conteúdo da mensagem
            message_type: Tipo da mensagem
            created_by: ID do admin que criou
            target_audience: Público-alvo
            scheduled_for: Data/hora para envio (None = imediato)
            
        Returns:
            Campanha criada
        """
        campaign_id = f"camp_{int(datetime.now().timestamp())}"
        message_id = f"msg_{int(datetime.now().timestamp())}"
        
        # Cria mensagem
        message = PromoMessage(
            id=message_id,
            title=name,
            content=message_content,
            message_type=message_type,
            created_by=created_by,
            created_at=datetime.now(),
            scheduled_for=scheduled_for,
            target_audience=target_audience
        )
        
        # Cria campanha
        campaign = Campaign(
            id=campaign_id,
            name=name,
            message=message,
            status=CampaignStatus.SCHEDULED if scheduled_for else CampaignStatus.DRAFT,
            created_by=created_by,
            created_at=datetime.now()
        )
        
        # Salva campanha
        await self.save_campaign(campaign)
        
        logger.info(f"Campanha criada: {campaign_id}")
        return campaign
    
    async def save_campaign(self, campaign: Campaign):
        """
        Salva campanha no arquivo
        
        Args:
            campaign: Campanha a ser salva
        """
        try:
            # Carrega campanhas existentes
            campaigns = await self.load_campaigns()
            
            # Adiciona/atualiza campanha
            campaigns[campaign.id] = campaign.to_dict()
            
            # Salva arquivo
            async with aiofiles.open(self.campaigns_file, 'w', encoding='utf-8') as file:
                await file.write(json.dumps(campaigns, indent=2, ensure_ascii=False))
                
        except Exception as e:
            logger.error(f"Erro ao salvar campanha: {e}")
    
    async def load_campaigns(self) -> Dict[str, Dict]:
        """
        Carrega campanhas do arquivo
        
        Returns:
            Dicionário com campanhas
        """
        try:
            if os.path.exists(self.campaigns_file):
                async with aiofiles.open(self.campaigns_file, 'r', encoding='utf-8') as file:
                    content = await file.read()
                    return json.loads(content)
            return {}
        except Exception as e:
            logger.error(f"Erro ao carregar campanhas: {e}")
            return {}
    
    async def execute_campaign(self, campaign_id: str) -> Tuple[int, int]:
        """
        Executa uma campanha
        
        Args:
            campaign_id: ID da campanha
            
        Returns:
            Tupla (enviados, falharam)
        """
        try:
            # Carrega campanha
            campaigns = await self.load_campaigns()
            if campaign_id not in campaigns:
                raise ValueError(f"Campanha {campaign_id} não encontrada")
            
            campaign = Campaign.from_dict(campaigns[campaign_id])
            
            # Verifica se pode executar
            if campaign.status not in [CampaignStatus.DRAFT, CampaignStatus.SCHEDULED]:
                raise ValueError(f"Campanha {campaign_id} não pode ser executada (status: {campaign.status})")
            
            # Atualiza status
            campaign.status = CampaignStatus.RUNNING
            campaign.started_at = datetime.now()
            await self.save_campaign(campaign)
            
            # Obtém lista de destinatários
            recipients = await self.get_customer_list(campaign.message.target_audience)
            
            if campaign.message.max_recipients:
                recipients = recipients[:campaign.message.max_recipients]
            
            campaign.total_recipients = len(recipients)
            
            logger.info(f"Iniciando envio da campanha {campaign_id} para {len(recipients)} destinatários")
            
            # Envia mensagens
            sent_count, failed_count = await self.send_bulk_messages(
                recipients,
                campaign.message.content
            )
            
            # Atualiza estatísticas
            campaign.sent_count = sent_count
            campaign.failed_count = failed_count
            campaign.status = CampaignStatus.COMPLETED if failed_count == 0 else CampaignStatus.FAILED
            campaign.completed_at = datetime.now()
            
            await self.save_campaign(campaign)
            
            logger.info(f"Campanha {campaign_id} concluída: {sent_count} enviados, {failed_count} falharam")
            
            return sent_count, failed_count
            
        except Exception as e:
            logger.error(f"Erro ao executar campanha {campaign_id}: {e}")
            # Marca campanha como falhada
            try:
                campaigns = await self.load_campaigns()
                if campaign_id in campaigns:
                    campaign = Campaign.from_dict(campaigns[campaign_id])
                    campaign.status = CampaignStatus.FAILED
                    await self.save_campaign(campaign)
            except:
                pass
            raise
    
    async def send_bulk_messages(self, recipients: List[int], message: str) -> Tuple[int, int]:
        """
        Envia mensagens em lote
        
        Args:
            recipients: Lista de IDs de destinatários
            message: Mensagem a ser enviada
            
        Returns:
            Tupla (enviados, falharam)
        """
        sent_count = 0
        failed_count = 0
        
        # Processa em lotes
        for i in range(0, len(recipients), self.max_batch_size):
            batch = recipients[i:i + self.max_batch_size]
            
            logger.info(f"Processando lote {i//self.max_batch_size + 1}: {len(batch)} destinatários")
            
            # Envia para cada destinatário do lote
            for user_id in batch:
                try:
                    await self.bot.send_message(
                        chat_id=user_id,
                        text=message,
                        parse_mode=ParseMode.MARKDOWN
                    )
                    sent_count += 1
                    
                    # Delay entre mensagens
                    await asyncio.sleep(self.delay_between_messages)
                    
                except TelegramError as e:
                    logger.warning(f"Erro ao enviar para {user_id}: {e}")
                    failed_count += 1
                except Exception as e:
                    logger.error(f"Erro inesperado ao enviar para {user_id}: {e}")
                    failed_count += 1
            
            # Delay entre lotes
            if i + self.max_batch_size < len(recipients):
                await asyncio.sleep(self.delay_between_batches)
        
        return sent_count, failed_count
    
    async def get_campaign_stats(self, campaign_id: str) -> Dict[str, Any]:
        """
        Obtém estatísticas de uma campanha
        
        Args:
            campaign_id: ID da campanha
            
        Returns:
            Estatísticas da campanha
        """
        try:
            campaigns = await self.load_campaigns()
            if campaign_id not in campaigns:
                return {}
            
            campaign = Campaign.from_dict(campaigns[campaign_id])
            
            stats = {
                'id': campaign.id,
                'name': campaign.name,
                'status': campaign.status.value,
                'total_recipients': campaign.total_recipients,
                'sent_count': campaign.sent_count,
                'failed_count': campaign.failed_count,
                'success_rate': (campaign.sent_count / campaign.total_recipients * 100) if campaign.total_recipients > 0 else 0,
                'created_at': campaign.created_at.isoformat(),
                'started_at': campaign.started_at.isoformat() if campaign.started_at else None,
                'completed_at': campaign.completed_at.isoformat() if campaign.completed_at else None
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas da campanha {campaign_id}: {e}")
            return {}
    
    async def list_campaigns(self, admin_id: int) -> List[Dict[str, Any]]:
        """
        Lista campanhas de um admin
        
        Args:
            admin_id: ID do admin
            
        Returns:
            Lista de campanhas
        """
        try:
            campaigns = await self.load_campaigns()
            
            admin_campaigns = []
            for campaign_data in campaigns.values():
                if campaign_data['created_by'] == admin_id:
                    admin_campaigns.append({
                        'id': campaign_data['id'],
                        'name': campaign_data['name'],
                        'status': campaign_data['status'],
                        'created_at': campaign_data['created_at'],
                        'total_recipients': campaign_data.get('total_recipients', 0),
                        'sent_count': campaign_data.get('sent_count', 0)
                    })
            
            # Ordena por data de criação (mais recente primeiro)
            admin_campaigns.sort(key=lambda x: x['created_at'], reverse=True)
            
            return admin_campaigns
            
        except Exception as e:
            logger.error(f"Erro ao listar campanhas do admin {admin_id}: {e}")
            return []
    
    async def schedule_campaign_check(self):
        """
        Verifica campanhas agendadas que devem ser executadas
        """
        try:
            campaigns = await self.load_campaigns()
            now = datetime.now()
            
            for campaign_data in campaigns.values():
                campaign = Campaign.from_dict(campaign_data)
                
                # Verifica se é uma campanha agendada que deve ser executada
                if (campaign.status == CampaignStatus.SCHEDULED and 
                    campaign.message.scheduled_for and 
                    campaign.message.scheduled_for <= now):
                    
                    logger.info(f"Executando campanha agendada: {campaign.id}")
                    await self.execute_campaign(campaign.id)
                    
        except Exception as e:
            logger.error(f"Erro ao verificar campanhas agendadas: {e}")
    
    async def cleanup_old_campaigns(self, days: int = 30):
        """
        Remove campanhas antigas
        
        Args:
            days: Número de dias para manter campanhas
        """
        try:
            campaigns = await self.load_campaigns()
            cutoff_date = datetime.now() - timedelta(days=days)
            
            campaigns_to_remove = []
            for campaign_id, campaign_data in campaigns.items():
                created_at = datetime.fromisoformat(campaign_data['created_at'])
                if created_at < cutoff_date:
                    campaigns_to_remove.append(campaign_id)
            
            for campaign_id in campaigns_to_remove:
                del campaigns[campaign_id]
                logger.info(f"Campanha antiga removida: {campaign_id}")
            
            if campaigns_to_remove:
                async with aiofiles.open(self.campaigns_file, 'w', encoding='utf-8') as file:
                    await file.write(json.dumps(campaigns, indent=2, ensure_ascii=False))
                    
        except Exception as e:
            logger.error(f"Erro ao limpar campanhas antigas: {e}")

async def main():
    """
    Função principal para testes
    """
    promo_system = PromotionalSystem()
    await promo_system.setup()
    
    # Exemplo de uso
    campaign = await promo_system.create_campaign(
        name="Promoção de Teste",
        message_content="🍕 Oferta especial! Pizza grande por R$ 25,00!",
        message_type=MessageType.PROMOTION,
        created_by=123456789,
        target_audience="all"
    )
    
    print(f"Campanha criada: {campaign.id}")

if __name__ == "__main__":
    asyncio.run(main())