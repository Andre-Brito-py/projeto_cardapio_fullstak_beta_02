"""Módulo de integração WhatsApp para IA Liza

Este módulo fornece funcionalidades completas para integração da IA Liza
com o WhatsApp Business API, incluindo:

- Cliente WhatsApp para envio de mensagens
- Processador de mensagens com classificação de intenções
- Serviço de integração principal
- Configurações e utilitários

Exemplo de uso:
    from whatsapp_integration import create_integration_service
    
    service = create_integration_service(
        store_id="sua_loja_123",
        backend_api_url="http://localhost:3000"
    )
    
    await service.initialize()
    result = await service.process_webhook_message(webhook_data)
"""

__version__ = "1.0.0"
__author__ = "Liza AI Team"

# Importações principais
from .whatsapp_client import WhatsAppClient
from .message_processor import MessageProcessor
from .integration_service import WhatsAppIntegrationService, create_integration_service
from .config import whatsapp_config, delivery_config, ai_config

# Exportar classes e funções principais
__all__ = [
    'WhatsAppClient',
    'MessageProcessor', 
    'WhatsAppIntegrationService',
    'create_integration_service',
    'whatsapp_config',
    'delivery_config',
    'ai_config'
]

# Verificar configurações na importação
import logging

logger = logging.getLogger(__name__)

def check_configuration():
    """Verifica se as configurações básicas estão presentes"""
    if not whatsapp_config.is_valid():
        missing = whatsapp_config.get_missing_configs()
        logger.warning(f"Configurações WhatsApp faltantes: {missing}")
        logger.warning("Configure as variáveis de ambiente necessárias antes de usar o módulo")
        return False
    return True

# Executar verificação na importação (opcional)
# check_configuration()