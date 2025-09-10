import asyncio
import logging
import json
from typing import Dict, Optional, List
from datetime import datetime
import os
import sys

# Adicionar o diretório pai ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from whatsapp_integration.whatsapp_client import WhatsAppClient
from whatsapp_integration.message_processor import MessageProcessor
from whatsapp_integration.config import whatsapp_config, delivery_config, ai_config
from delivery_training.intent_classification import DeliveryIntentClassifier

class WhatsAppIntegrationService:
    """Serviço principal de integração WhatsApp com IA Liza"""
    
    def __init__(self, store_id: str, backend_api_url: str):
        self.store_id = store_id
        self.backend_api_url = backend_api_url
        
        # Configurar logging
        self.setup_logging()
        
        # Inicializar componentes
        self.whatsapp_client = None
        self.message_processor = None
        self.is_initialized = False
        
        # Cache e controle de rate limiting
        self.message_cache = {}
        self.rate_limit_cache = {}
        
        self.logger.info(f"Serviço de integração inicializado para loja: {store_id}")
    
    def setup_logging(self):
        """Configura sistema de logging"""
        logging.basicConfig(
            level=getattr(logging, ai_config.LOG_LEVEL),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('whatsapp_integration.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    async def initialize(self) -> bool:
        """Inicializa todos os componentes do serviço"""
        try:
            self.logger.info("Iniciando inicialização do serviço...")
            
            # Validar configurações
            if not self.validate_config():
                return False
            
            # Inicializar cliente WhatsApp
            self.whatsapp_client = WhatsAppClient(
                access_token=whatsapp_config.WHATSAPP_TOKEN,
                phone_number_id=whatsapp_config.WHATSAPP_PHONE_NUMBER_ID
            )
            
            # Inicializar processador de mensagens
            self.message_processor = MessageProcessor(
                backend_api_url=self.backend_api_url,
                store_id=self.store_id
            )
            
            # Conectar processador com cliente WhatsApp
            self.message_processor.set_whatsapp_client(self.whatsapp_client)
            
            # Testar conexões
            if not await self.test_connections():
                return False
            
            self.is_initialized = True
            self.logger.info("Serviço inicializado com sucesso!")
            return True
            
        except Exception as e:
            self.logger.error(f"Erro na inicialização: {e}")
            return False
    
    def validate_config(self) -> bool:
        """Valida configurações necessárias"""
        if not whatsapp_config.is_valid():
            missing = whatsapp_config.get_missing_configs()
            self.logger.error(f"Configurações WhatsApp faltantes: {missing}")
            return False
        
        if not self.store_id:
            self.logger.error("Store ID não fornecido")
            return False
        
        if not self.backend_api_url:
            self.logger.error("URL do backend não fornecida")
            return False
        
        return True
    
    async def test_connections(self) -> bool:
        """Testa conexões com APIs externas"""
        try:
            # Testar conexão com WhatsApp API
            if not self.whatsapp_client.test_connection():
                self.logger.error("Falha na conexão com WhatsApp API")
                return False
            
            # Testar conexão com backend
            import requests
            response = requests.get(
                f"{self.backend_api_url}/api/health",
                timeout=whatsapp_config.REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                self.logger.warning("Backend pode não estar disponível")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Erro ao testar conexões: {e}")
            return False
    
    async def process_webhook_message(self, webhook_data: Dict) -> Dict:
        """Processa mensagem recebida via webhook"""
        try:
            if not self.is_initialized:
                return {"error": "Serviço não inicializado"}
            
            # Extrair dados da mensagem
            entry = webhook_data.get('entry', [])
            if not entry:
                return {"error": "Dados de entrada inválidos"}
            
            changes = entry[0].get('changes', [])
            if not changes:
                return {"error": "Nenhuma mudança encontrada"}
            
            value = changes[0].get('value', {})
            messages = value.get('messages', [])
            
            if not messages:
                # Pode ser status update ou outro tipo de notificação
                return await self.handle_status_update(value)
            
            # Processar cada mensagem
            results = []
            for message in messages:
                result = await self.process_single_message(message)
                results.append(result)
            
            return {
                "success": True,
                "processed_messages": len(results),
                "results": results
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao processar webhook: {e}")
            return {"error": str(e)}
    
    async def process_single_message(self, message_data: Dict) -> Dict:
        """Processa uma única mensagem"""
        try:
            message_id = message_data.get('id')
            from_number = message_data.get('from')
            
            # Verificar rate limiting
            if not self.check_rate_limit(from_number):
                self.logger.warning(f"Rate limit excedido para {from_number}")
                return {"error": "Rate limit excedido"}
            
            # Verificar se já processamos esta mensagem
            if self.is_duplicate_message(message_id):
                self.logger.info(f"Mensagem duplicada ignorada: {message_id}")
                return {"success": True, "duplicate": True}
            
            # Registrar mensagem como processada
            self.mark_message_processed(message_id)
            
            # Processar mensagem
            result = await self.message_processor.process_message(message_data)
            
            # Log da atividade
            self.log_message_activity(message_data, result)
            
            return result
            
        except Exception as e:
            self.logger.error(f"Erro ao processar mensagem individual: {e}")
            return {"error": str(e)}
    
    async def handle_status_update(self, value: Dict) -> Dict:
        """Trata atualizações de status (entrega de mensagem, etc.)"""
        try:
            statuses = value.get('statuses', [])
            
            for status in statuses:
                message_id = status.get('id')
                status_type = status.get('status')
                recipient_id = status.get('recipient_id')
                
                self.logger.info(f"Status update: {message_id} -> {status_type} para {recipient_id}")
                
                # Aqui você pode implementar lógica específica para cada tipo de status
                # Por exemplo: delivered, read, failed, etc.
            
            return {"success": True, "status_updates_processed": len(statuses)}
            
        except Exception as e:
            self.logger.error(f"Erro ao processar status update: {e}")
            return {"error": str(e)}
    
    def check_rate_limit(self, phone_number: str) -> bool:
        """Verifica rate limiting por número de telefone"""
        now = datetime.now()
        
        if phone_number not in self.rate_limit_cache:
            self.rate_limit_cache[phone_number] = []
        
        # Remover timestamps antigos
        cutoff = now.timestamp() - whatsapp_config.RATE_LIMIT_WINDOW
        self.rate_limit_cache[phone_number] = [
            ts for ts in self.rate_limit_cache[phone_number] if ts > cutoff
        ]
        
        # Verificar se excedeu o limite
        if len(self.rate_limit_cache[phone_number]) >= whatsapp_config.RATE_LIMIT_MESSAGES:
            return False
        
        # Adicionar timestamp atual
        self.rate_limit_cache[phone_number].append(now.timestamp())
        return True
    
    def is_duplicate_message(self, message_id: str) -> bool:
        """Verifica se a mensagem já foi processada"""
        return message_id in self.message_cache
    
    def mark_message_processed(self, message_id: str):
        """Marca mensagem como processada"""
        self.message_cache[message_id] = datetime.now().timestamp()
        
        # Limpar cache antigo (manter apenas últimas 1000 mensagens)
        if len(self.message_cache) > 1000:
            oldest_keys = sorted(self.message_cache.keys(), 
                               key=lambda k: self.message_cache[k])[:100]
            for key in oldest_keys:
                del self.message_cache[key]
    
    def log_message_activity(self, message_data: Dict, result: Dict):
        """Registra atividade de mensagem para análise"""
        activity = {
            "timestamp": datetime.now().isoformat(),
            "store_id": self.store_id,
            "from": message_data.get('from'),
            "message_type": message_data.get('type'),
            "message_id": message_data.get('id'),
            "success": result.get('success', False),
            "error": result.get('error')
        }
        
        # Aqui você pode salvar no banco de dados ou arquivo de log
        self.logger.info(f"Activity: {json.dumps(activity)}")
    
    async def send_proactive_message(self, phone_number: str, message: str, 
                                   message_type: str = 'text') -> Dict:
        """Envia mensagem proativa para cliente"""
        try:
            if not self.is_initialized:
                return {"error": "Serviço não inicializado"}
            
            if message_type == 'text':
                result = self.whatsapp_client.send_text_message(phone_number, message)
            else:
                return {"error": f"Tipo de mensagem não suportado: {message_type}"}
            
            self.logger.info(f"Mensagem proativa enviada para {phone_number}")
            return {"success": True, "result": result}
            
        except Exception as e:
            self.logger.error(f"Erro ao enviar mensagem proativa: {e}")
            return {"error": str(e)}
    
    async def broadcast_message(self, phone_numbers: List[str], message: str) -> Dict:
        """Envia mensagem para múltiplos clientes"""
        try:
            if not self.is_initialized:
                return {"error": "Serviço não inicializado"}
            
            results = []
            for phone in phone_numbers:
                result = await self.send_proactive_message(phone, message)
                results.append({"phone": phone, "result": result})
                
                # Delay entre mensagens para evitar rate limiting
                await asyncio.sleep(0.5)
            
            successful = sum(1 for r in results if r['result'].get('success'))
            
            return {
                "success": True,
                "total_sent": len(phone_numbers),
                "successful": successful,
                "failed": len(phone_numbers) - successful,
                "results": results
            }
            
        except Exception as e:
            self.logger.error(f"Erro no broadcast: {e}")
            return {"error": str(e)}
    
    def get_service_status(self) -> Dict:
        """Retorna status do serviço"""
        return {
            "initialized": self.is_initialized,
            "store_id": self.store_id,
            "backend_url": self.backend_api_url,
            "whatsapp_connected": bool(self.whatsapp_client),
            "processor_ready": bool(self.message_processor),
            "config_valid": whatsapp_config.is_valid(),
            "cache_size": len(self.message_cache),
            "rate_limit_entries": len(self.rate_limit_cache)
        }
    
    async def shutdown(self):
        """Encerra o serviço graciosamente"""
        self.logger.info("Encerrando serviço de integração...")
        
        # Limpar caches
        self.message_cache.clear()
        self.rate_limit_cache.clear()
        
        # Resetar estado
        self.is_initialized = False
        
        self.logger.info("Serviço encerrado")

# Função para criar instância do serviço
def create_integration_service(store_id: str, backend_api_url: str) -> WhatsAppIntegrationService:
    """Cria e retorna instância do serviço de integração"""
    return WhatsAppIntegrationService(store_id, backend_api_url)

# Exemplo de uso
if __name__ == "__main__":
    async def main():
        # Criar serviço
        service = create_integration_service(
            store_id="store123",
            backend_api_url="http://localhost:3000"
        )
        
        # Inicializar
        if await service.initialize():
            print("Serviço inicializado com sucesso!")
            
            # Verificar status
            status = service.get_service_status()
            print(f"Status: {json.dumps(status, indent=2)}")
            
            # Simular processamento de mensagem
            test_webhook = {
                "entry": [{
                    "changes": [{
                        "value": {
                            "messages": [{
                                "from": "5511999999999",
                                "id": "test_msg_123",
                                "type": "text",
                                "text": {"body": "Olá, gostaria de fazer um pedido"}
                            }]
                        }
                    }]
                }]
            }
            
            result = await service.process_webhook_message(test_webhook)
            print(f"Resultado do processamento: {json.dumps(result, indent=2)}")
            
        else:
            print("Falha na inicialização do serviço")
    
    # Executar exemplo
    asyncio.run(main())