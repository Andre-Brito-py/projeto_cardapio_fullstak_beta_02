"""Módulo de treinamento especializado para delivery

Este módulo contém funcionalidades para treinar e usar modelos de IA
especializados em atendimento de delivery, incluindo:

- Classificação de intenções específicas para delivery
- Dataset especializado com exemplos de conversas
- Templates de resposta personalizados
- Extração de entidades relacionadas a pedidos

Exemplo de uso:
    from delivery_training import DeliveryIntentClassifier
    
    classifier = DeliveryIntentClassifier()
    classifier.train_model()
    
    result = classifier.classify_intent("Quero pedir uma pizza")
    print(f"Intenção: {result['intent']}, Confiança: {result['confidence']}")
"""

__version__ = "1.0.0"
__author__ = "Liza AI Team"

# Importações principais
from .intent_classification import DeliveryIntentClassifier

# Exportar classes principais
__all__ = [
    'DeliveryIntentClassifier'
]

# Constantes úteis
SUPPORTED_INTENTS = [
    'greeting',
    'menu_request', 
    'order_request',
    'delivery_info',
    'payment_info',
    'order_status',
    'recommendation',
    'complaint',
    'thanks',
    'goodbye'
]

SUPPORTED_ENTITIES = [
    'food_types',
    'sizes', 
    'payment_methods',
    'urgency',
    'quantities',
    'addresses'
]

# Função utilitária para verificar arquivos necessários
import os
import logging

logger = logging.getLogger(__name__)

def check_training_files():
    """Verifica se os arquivos de treinamento estão presentes"""
    current_dir = os.path.dirname(__file__)
    
    required_files = [
        'food_delivery_dataset.json',
        'response_templates.json'
    ]
    
    missing_files = []
    for file in required_files:
        file_path = os.path.join(current_dir, file)
        if not os.path.exists(file_path):
            missing_files.append(file)
    
    if missing_files:
        logger.warning(f"Arquivos de treinamento faltantes: {missing_files}")
        return False
    
    return True

def get_dataset_info():
    """Retorna informações sobre o dataset"""
    try:
        import json
        current_dir = os.path.dirname(__file__)
        dataset_path = os.path.join(current_dir, 'food_delivery_dataset.json')
        
        if os.path.exists(dataset_path):
            with open(dataset_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            intents_count = len(data.get('intents', []))
            entities_count = len(data.get('entities', []))
            
            total_examples = sum(
                len(intent.get('examples', [])) 
                for intent in data.get('intents', [])
            )
            
            return {
                'intents': intents_count,
                'entities': entities_count,
                'total_examples': total_examples,
                'dataset_available': True
            }
    except Exception as e:
        logger.error(f"Erro ao ler informações do dataset: {e}")
    
    return {
        'intents': 0,
        'entities': 0, 
        'total_examples': 0,
        'dataset_available': False
    }

# Executar verificação na importação
if not check_training_files():
    logger.info("Alguns arquivos de treinamento podem estar faltando")
    logger.info("Execute o setup completo para garantir que todos os arquivos estejam presentes")