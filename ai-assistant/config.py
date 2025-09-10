"""Configurações centralizadas da IA Liza"""

import os
from typing import Optional, List
from pydantic import BaseSettings, Field
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

class LizaConfig(BaseSettings):
    """Configurações principais da IA Liza"""
    
    # === CONFIGURAÇÕES GERAIS ===
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=True, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # === CHAINLIT ===
    chainlit_host: str = Field(default="localhost", env="CHAINLIT_HOST")
    chainlit_port: int = Field(default=8000, env="CHAINLIT_PORT")
    chainlit_auth_secret: str = Field(default="liza-secret-key", env="CHAINLIT_AUTH_SECRET")
    
    # === API DO SISTEMA DE DELIVERY ===
    delivery_api_base_url: str = Field(default="http://localhost:3000/api", env="DELIVERY_API_BASE_URL")
    delivery_api_token: Optional[str] = Field(default=None, env="DELIVERY_API_TOKEN")
    delivery_api_timeout: int = Field(default=30, env="DELIVERY_API_TIMEOUT")
    
    # === WHATSAPP BUSINESS API ===
    whatsapp_business_account_id: Optional[str] = Field(default=None, env="WHATSAPP_BUSINESS_ACCOUNT_ID")
    whatsapp_access_token: Optional[str] = Field(default=None, env="WHATSAPP_ACCESS_TOKEN")
    whatsapp_phone_number_id: Optional[str] = Field(default=None, env="WHATSAPP_PHONE_NUMBER_ID")
    whatsapp_webhook_verify_token: Optional[str] = Field(default=None, env="WHATSAPP_WEBHOOK_VERIFY_TOKEN")
    whatsapp_webhook_secret: Optional[str] = Field(default=None, env="WHATSAPP_WEBHOOK_SECRET")
    
    # === CONFIGURAÇÕES DE IA ===
    intent_model_path: str = Field(default="./models/intent_classifier.pkl", env="INTENT_MODEL_PATH")
    intent_confidence_threshold: float = Field(default=0.7, env="INTENT_CONFIDENCE_THRESHOLD")
    max_response_length: int = Field(default=1000, env="MAX_RESPONSE_LENGTH")
    default_language: str = Field(default="pt-BR", env="DEFAULT_LANGUAGE")
    fallback_to_human: bool = Field(default=True, env="FALLBACK_TO_HUMAN")
    
    # === CACHE E SESSÃO ===
    redis_url: Optional[str] = Field(default=None, env="REDIS_URL")
    redis_password: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    redis_db: int = Field(default=0, env="REDIS_DB")
    session_timeout: int = Field(default=1800, env="SESSION_TIMEOUT")  # 30 minutos
    max_sessions: int = Field(default=1000, env="MAX_SESSIONS")
    
    # === CONFIGURAÇÕES DE LOJA ===
    default_store_id: int = Field(default=1, env="DEFAULT_STORE_ID")
    default_store_name: str = Field(default="Loja Teste", env="DEFAULT_STORE_NAME")
    
    # === CONFIGURAÇÕES DE LOGGING ===
    log_file_path: str = Field(default="./logs/liza.log", env="LOG_FILE_PATH")
    log_max_size: str = Field(default="10MB", env="LOG_MAX_SIZE")
    log_backup_count: int = Field(default=5, env="LOG_BACKUP_COUNT")
    
    # === CONFIGURAÇÕES DE PERFORMANCE ===
    max_concurrent_requests: int = Field(default=10, env="MAX_CONCURRENT_REQUESTS")
    request_timeout: int = Field(default=30, env="REQUEST_TIMEOUT")
    retry_attempts: int = Field(default=3, env="RETRY_ATTEMPTS")
    retry_delay: int = Field(default=1, env="RETRY_DELAY")
    
    # === CONFIGURAÇÕES DE SEGURANÇA ===
    allowed_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000"], 
        env="ALLOWED_ORIGINS"
    )
    api_rate_limit: int = Field(default=100, env="API_RATE_LIMIT")  # requests per minute
    
    # === CONFIGURAÇÕES DE DESENVOLVIMENTO ===
    auto_reload: bool = Field(default=True, env="AUTO_RELOAD")
    debug_webhook: bool = Field(default=True, env="DEBUG_WEBHOOK")
    save_conversation_history: bool = Field(default=True, env="SAVE_CONVERSATION_HISTORY")
    
    # === CONFIGURAÇÕES OPCIONAIS ===
    google_application_credentials: Optional[str] = Field(default=None, env="GOOGLE_APPLICATION_CREDENTIALS")
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    groq_api_key: Optional[str] = Field(default=None, env="GROQ_API_KEY")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Criar diretórios necessários se não existirem"""
        import os
        
        # Diretório de logs
        log_dir = os.path.dirname(self.log_file_path)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
        
        # Diretório de modelos
        model_dir = os.path.dirname(self.intent_model_path)
        if model_dir and not os.path.exists(model_dir):
            os.makedirs(model_dir, exist_ok=True)
    
    @property
    def is_production(self) -> bool:
        """Verificar se está em ambiente de produção"""
        return self.environment.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Verificar se está em ambiente de desenvolvimento"""
        return self.environment.lower() == "development"
    
    def get_allowed_origins_list(self) -> List[str]:
        """Obter lista de origens permitidas"""
        if isinstance(self.allowed_origins, str):
            return [origin.strip() for origin in self.allowed_origins.split(",")]
        return self.allowed_origins
    
    def validate_whatsapp_config(self) -> bool:
        """Validar se as configurações do WhatsApp estão completas"""
        required_fields = [
            self.whatsapp_business_account_id,
            self.whatsapp_access_token,
            self.whatsapp_phone_number_id,
            self.whatsapp_webhook_verify_token
        ]
        return all(field is not None and field.strip() != "" for field in required_fields)
    
    def validate_delivery_api_config(self) -> bool:
        """Validar se as configurações da API de delivery estão completas"""
        return (
            self.delivery_api_base_url is not None and 
            self.delivery_api_base_url.strip() != ""
        )

# Instância global de configuração
config = LizaConfig()

# Configurações específicas por ambiente
class DevelopmentConfig(LizaConfig):
    """Configurações para desenvolvimento"""
    debug: bool = True
    log_level: str = "DEBUG"
    auto_reload: bool = True
    debug_webhook: bool = True

class ProductionConfig(LizaConfig):
    """Configurações para produção"""
    debug: bool = False
    log_level: str = "INFO"
    auto_reload: bool = False
    debug_webhook: bool = False
    save_conversation_history: bool = True

class TestingConfig(LizaConfig):
    """Configurações para testes"""
    debug: bool = True
    log_level: str = "DEBUG"
    session_timeout: int = 300  # 5 minutos para testes
    save_conversation_history: bool = False

def get_config() -> LizaConfig:
    """Obter configuração baseada no ambiente"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionConfig()
    elif env == "testing":
        return TestingConfig()
    else:
        return DevelopmentConfig()

# Exportar configuração ativa
active_config = get_config()

if __name__ == "__main__":
    # Teste das configurações
    print("=== Configurações da IA Liza ===")
    print(f"Ambiente: {active_config.environment}")
    print(f"Debug: {active_config.debug}")
    print(f"Chainlit: {active_config.chainlit_host}:{active_config.chainlit_port}")
    print(f"API Delivery: {active_config.delivery_api_base_url}")
    print(f"WhatsApp configurado: {active_config.validate_whatsapp_config()}")
    print(f"API Delivery configurada: {active_config.validate_delivery_api_config()}")
    print(f"Diretório de logs: {active_config.log_file_path}")
    print(f"Modelo de intenções: {active_config.intent_model_path}")