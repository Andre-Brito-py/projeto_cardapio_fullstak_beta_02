import os
from typing import Dict, Optional
import json

class WhatsAppConfig:
    """Configurações para integração WhatsApp"""
    
    def __init__(self):
        # Configurações do WhatsApp Business API
        self.WHATSAPP_TOKEN = os.getenv('WHATSAPP_TOKEN')
        self.WHATSAPP_PHONE_NUMBER_ID = os.getenv('WHATSAPP_PHONE_NUMBER_ID')
        self.WHATSAPP_VERIFY_TOKEN = os.getenv('WHATSAPP_VERIFY_TOKEN', 'liza_delivery_webhook')
        self.WHATSAPP_API_VERSION = os.getenv('WHATSAPP_API_VERSION', 'v18.0')
        
        # URLs da API
        self.WHATSAPP_API_URL = f"https://graph.facebook.com/{self.WHATSAPP_API_VERSION}"
        
        # Configurações do backend
        self.BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://localhost:3000')
        self.STORE_ID = os.getenv('STORE_ID')
        
        # Configurações da IA
        self.OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434')
        self.OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.1')
        
        # Configurações de logging
        self.LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
        self.LOG_FILE = os.getenv('LOG_FILE', 'whatsapp_integration.log')
        
        # Configurações de cache
        self.CACHE_TTL = int(os.getenv('CACHE_TTL', '300'))  # 5 minutos
        
        # Configurações de rate limiting
        self.RATE_LIMIT_MESSAGES = int(os.getenv('RATE_LIMIT_MESSAGES', '10'))
        self.RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', '60'))  # 1 minuto
        
        # Configurações de timeout
        self.REQUEST_TIMEOUT = int(os.getenv('REQUEST_TIMEOUT', '30'))
        
        # Configurações de retry
        self.MAX_RETRIES = int(os.getenv('MAX_RETRIES', '3'))
        self.RETRY_DELAY = int(os.getenv('RETRY_DELAY', '1'))
        
        # Configurações de webhook
        self.WEBHOOK_URL = os.getenv('WEBHOOK_URL')
        self.WEBHOOK_PORT = int(os.getenv('WEBHOOK_PORT', '8080'))
        
        # Configurações de segurança
        self.ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*').split(',')
        
    def validate(self) -> Dict[str, bool]:
        """Valida configurações obrigatórias"""
        validations = {
            'whatsapp_token': bool(self.WHATSAPP_TOKEN),
            'phone_number_id': bool(self.WHATSAPP_PHONE_NUMBER_ID),
            'store_id': bool(self.STORE_ID),
            'backend_url': bool(self.BACKEND_API_URL)
        }
        
        return validations
    
    def is_valid(self) -> bool:
        """Verifica se todas as configurações obrigatórias estão presentes"""
        validations = self.validate()
        return all(validations.values())
    
    def get_missing_configs(self) -> list:
        """Retorna lista de configurações faltantes"""
        validations = self.validate()
        return [key for key, valid in validations.items() if not valid]
    
    def to_dict(self) -> Dict:
        """Converte configurações para dicionário (sem dados sensíveis)"""
        return {
            'whatsapp_api_version': self.WHATSAPP_API_VERSION,
            'backend_api_url': self.BACKEND_API_URL,
            'store_id': self.STORE_ID,
            'ollama_url': self.OLLAMA_URL,
            'ollama_model': self.OLLAMA_MODEL,
            'log_level': self.LOG_LEVEL,
            'cache_ttl': self.CACHE_TTL,
            'rate_limit_messages': self.RATE_LIMIT_MESSAGES,
            'rate_limit_window': self.RATE_LIMIT_WINDOW,
            'request_timeout': self.REQUEST_TIMEOUT,
            'max_retries': self.MAX_RETRIES,
            'retry_delay': self.RETRY_DELAY,
            'webhook_port': self.WEBHOOK_PORT
        }
    
    @classmethod
    def from_file(cls, config_file: str) -> 'WhatsAppConfig':
        """Carrega configurações de arquivo JSON"""
        if os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8') as f:
                config_data = json.load(f)
            
            # Definir variáveis de ambiente temporariamente
            for key, value in config_data.items():
                if value is not None:
                    os.environ[key.upper()] = str(value)
        
        return cls()
    
    def save_to_file(self, config_file: str, include_sensitive: bool = False):
        """Salva configurações em arquivo JSON"""
        config_data = self.to_dict()
        
        if include_sensitive:
            config_data.update({
                'whatsapp_token': self.WHATSAPP_TOKEN,
                'whatsapp_phone_number_id': self.WHATSAPP_PHONE_NUMBER_ID,
                'whatsapp_verify_token': self.WHATSAPP_VERIFY_TOKEN
            })
        
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=2, ensure_ascii=False)

class DeliveryConfig:
    """Configurações específicas para delivery"""
    
    def __init__(self):
        # Configurações de entrega
        self.DEFAULT_DELIVERY_TIME = os.getenv('DEFAULT_DELIVERY_TIME', '30-45')
        self.DEFAULT_DELIVERY_FEE = float(os.getenv('DEFAULT_DELIVERY_FEE', '5.00'))
        self.FREE_DELIVERY_MINIMUM = float(os.getenv('FREE_DELIVERY_MINIMUM', '50.00'))
        
        # Configurações de área de entrega
        self.DELIVERY_RADIUS_KM = float(os.getenv('DELIVERY_RADIUS_KM', '10.0'))
        self.DELIVERY_AREAS = os.getenv('DELIVERY_AREAS', '').split(',') if os.getenv('DELIVERY_AREAS') else []
        
        # Configurações de horário
        self.OPENING_TIME = os.getenv('OPENING_TIME', '08:00')
        self.CLOSING_TIME = os.getenv('CLOSING_TIME', '22:00')
        self.CLOSED_DAYS = os.getenv('CLOSED_DAYS', '').split(',') if os.getenv('CLOSED_DAYS') else []
        
        # Configurações de pedido
        self.MINIMUM_ORDER_VALUE = float(os.getenv('MINIMUM_ORDER_VALUE', '15.00'))
        self.MAX_ITEMS_PER_ORDER = int(os.getenv('MAX_ITEMS_PER_ORDER', '20'))
        
        # Configurações de pagamento
        self.ACCEPTED_PAYMENT_METHODS = os.getenv('ACCEPTED_PAYMENT_METHODS', 'dinheiro,cartao,pix').split(',')
        self.PIX_KEY = os.getenv('PIX_KEY')
        
        # Configurações de notificação
        self.NOTIFY_NEW_ORDER = os.getenv('NOTIFY_NEW_ORDER', 'true').lower() == 'true'
        self.NOTIFY_ORDER_UPDATES = os.getenv('NOTIFY_ORDER_UPDATES', 'true').lower() == 'true'
        
    def is_open_now(self) -> bool:
        """Verifica se a loja está aberta agora"""
        from datetime import datetime, time
        
        now = datetime.now()
        current_time = now.time()
        current_day = now.strftime('%A').lower()
        
        # Verificar se hoje é dia de funcionamento
        if current_day in [day.lower().strip() for day in self.CLOSED_DAYS]:
            return False
        
        # Verificar horário
        opening = time.fromisoformat(self.OPENING_TIME)
        closing = time.fromisoformat(self.CLOSING_TIME)
        
        return opening <= current_time <= closing
    
    def get_delivery_fee(self, order_value: float, distance_km: float = 0) -> float:
        """Calcula taxa de entrega"""
        if order_value >= self.FREE_DELIVERY_MINIMUM:
            return 0.0
        
        base_fee = self.DEFAULT_DELIVERY_FEE
        
        # Adicionar taxa por distância (se aplicável)
        if distance_km > 5:
            base_fee += (distance_km - 5) * 1.0  # R$ 1,00 por km adicional
        
        return base_fee
    
    def to_dict(self) -> Dict:
        """Converte configurações para dicionário"""
        return {
            'default_delivery_time': self.DEFAULT_DELIVERY_TIME,
            'default_delivery_fee': self.DEFAULT_DELIVERY_FEE,
            'free_delivery_minimum': self.FREE_DELIVERY_MINIMUM,
            'delivery_radius_km': self.DELIVERY_RADIUS_KM,
            'delivery_areas': self.DELIVERY_AREAS,
            'opening_time': self.OPENING_TIME,
            'closing_time': self.CLOSING_TIME,
            'closed_days': self.CLOSED_DAYS,
            'minimum_order_value': self.MINIMUM_ORDER_VALUE,
            'max_items_per_order': self.MAX_ITEMS_PER_ORDER,
            'accepted_payment_methods': self.ACCEPTED_PAYMENT_METHODS,
            'pix_key': self.PIX_KEY,
            'notify_new_order': self.NOTIFY_NEW_ORDER,
            'notify_order_updates': self.NOTIFY_ORDER_UPDATES
        }

class AIConfig:
    """Configurações da IA"""
    
    def __init__(self):
        # Configurações do modelo
        self.MODEL_CONFIDENCE_THRESHOLD = float(os.getenv('MODEL_CONFIDENCE_THRESHOLD', '0.7'))
        self.FALLBACK_TO_HUMAN = os.getenv('FALLBACK_TO_HUMAN', 'true').lower() == 'true'
        
        # Configurações de contexto
        self.MAX_CONTEXT_MESSAGES = int(os.getenv('MAX_CONTEXT_MESSAGES', '10'))
        self.CONTEXT_WINDOW_HOURS = int(os.getenv('CONTEXT_WINDOW_HOURS', '24'))
        
        # Configurações de personalização
        self.PERSONALIZATION_ENABLED = os.getenv('PERSONALIZATION_ENABLED', 'true').lower() == 'true'
        self.REMEMBER_PREFERENCES = os.getenv('REMEMBER_PREFERENCES', 'true').lower() == 'true'
        
        # Configurações de resposta
        self.MAX_RESPONSE_LENGTH = int(os.getenv('MAX_RESPONSE_LENGTH', '1000'))
        self.RESPONSE_DELAY_MS = int(os.getenv('RESPONSE_DELAY_MS', '1000'))
        
        # Configurações de aprendizado
        self.LEARNING_ENABLED = os.getenv('LEARNING_ENABLED', 'false').lower() == 'true'
        self.FEEDBACK_COLLECTION = os.getenv('FEEDBACK_COLLECTION', 'true').lower() == 'true'
    
    def to_dict(self) -> Dict:
        """Converte configurações para dicionário"""
        return {
            'model_confidence_threshold': self.MODEL_CONFIDENCE_THRESHOLD,
            'fallback_to_human': self.FALLBACK_TO_HUMAN,
            'max_context_messages': self.MAX_CONTEXT_MESSAGES,
            'context_window_hours': self.CONTEXT_WINDOW_HOURS,
            'personalization_enabled': self.PERSONALIZATION_ENABLED,
            'remember_preferences': self.REMEMBER_PREFERENCES,
            'max_response_length': self.MAX_RESPONSE_LENGTH,
            'response_delay_ms': self.RESPONSE_DELAY_MS,
            'learning_enabled': self.LEARNING_ENABLED,
            'feedback_collection': self.FEEDBACK_COLLECTION
        }

# Instâncias globais
whatsapp_config = WhatsAppConfig()
delivery_config = DeliveryConfig()
ai_config = AIConfig()

# Função para carregar todas as configurações
def load_all_configs(config_file: Optional[str] = None) -> Dict:
    """Carrega todas as configurações"""
    if config_file and os.path.exists(config_file):
        # Carregar configurações do arquivo
        whatsapp_config = WhatsAppConfig.from_file(config_file)
    else:
        whatsapp_config = WhatsAppConfig()
    
    return {
        'whatsapp': whatsapp_config,
        'delivery': DeliveryConfig(),
        'ai': AIConfig()
    }

# Função para validar todas as configurações
def validate_all_configs() -> Dict[str, Dict]:
    """Valida todas as configurações"""
    return {
        'whatsapp': whatsapp_config.validate(),
        'delivery': {'valid': True},  # DeliveryConfig não tem validações obrigatórias
        'ai': {'valid': True}  # AIConfig não tem validações obrigatórias
    }

if __name__ == "__main__":
    # Teste das configurações
    print("=== Configurações WhatsApp ===")
    print(f"Válido: {whatsapp_config.is_valid()}")
    if not whatsapp_config.is_valid():
        print(f"Configurações faltantes: {whatsapp_config.get_missing_configs()}")
    
    print("\n=== Configurações Delivery ===")
    print(f"Loja aberta: {delivery_config.is_open_now()}")
    print(f"Taxa de entrega (R$ 30): R$ {delivery_config.get_delivery_fee(30.0):.2f}")
    print(f"Taxa de entrega (R$ 60): R$ {delivery_config.get_delivery_fee(60.0):.2f}")
    
    print("\n=== Configurações IA ===")
    print(f"Threshold de confiança: {ai_config.MODEL_CONFIDENCE_THRESHOLD}")
    print(f"Personalização habilitada: {ai_config.PERSONALIZATION_ENABLED}")