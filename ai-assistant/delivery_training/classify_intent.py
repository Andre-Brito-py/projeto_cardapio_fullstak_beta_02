#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Classificação de Intenções para IA Liza

Este script é chamado pelo backend Node.js para classificar
intenções de mensagens recebidas via WhatsApp.

Autor: Sistema IA Liza
Data: Janeiro 2025
"""

import sys
import json
import re
from typing import Dict, List, Tuple, Any
from intent_classification import DeliveryIntentClassifier
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IntentClassificationService:
    """Serviço de classificação de intenções para delivery"""
    
    def __init__(self):
        self.classifier = None
        self.intent_patterns = {
            'greeting': [
                r'\b(oi|olá|ola|hey|e aí|eai|bom dia|boa tarde|boa noite)\b',
                r'\b(tchau|até|falou|bye)\b'
            ],
            'menu_inquiry': [
                r'\b(cardápio|cardapio|menu|carta|opções|opcoes|tem|serve)\b',
                r'\b(pizza|hamburguer|lanche|bebida|sobremesa|comida)\b',
                r'\b(que vocês têm|o que tem|quais|mostrar|ver)\b'
            ],
            'order_intent': [
                r'\b(quero|gostaria|vou querer|pode ser|me dá|me da)\b',
                r'\b(pedir|pedido|comprar|levar)\b',
                r'\b(adicionar|incluir|colocar)\b'
            ],
            'order_status': [
                r'\b(meu pedido|status|situação|situacao|onde está|cadê)\b',
                r'\b(quanto tempo|demora|previsão|previsao)\b',
                r'\b(chegou|entregou|saiu)\b'
            ],
            'delivery_info': [
                r'\b(entrega|entregar|delivery|taxa|frete)\b',
                r'\b(endereço|endereco|local|onde|região|regiao)\b',
                r'\b(tempo|demora|quanto tempo)\b'
            ],
            'payment_info': [
                r'\b(pagamento|pagar|dinheiro|cartão|cartao|pix)\b',
                r'\b(quanto|preço|preco|valor|custa)\b',
                r'\b(débito|debito|crédito|credito)\b'
            ],
            'complaint': [
                r'\b(reclamação|reclamacao|problema|errado|ruim)\b',
                r'\b(demorou|atrasou|frio|queimado|péssimo|pessimo)\b',
                r'\b(cancelar|devolver|reembolso)\b'
            ],
            'goodbye': [
                r'\b(tchau|até|falou|bye|obrigado|obrigada|valeu)\b',
                r'\b(até mais|até logo|nos vemos)\b'
            ]
        }
        
        # Palavras-chave para extração de entidades
        self.entity_patterns = {
            'product_names': [
                r'\b(pizza|hamburguer|lanche|sanduiche|hot dog|batata)\b',
                r'\b(refrigerante|suco|água|agua|cerveja|bebida)\b',
                r'\b(sobremesa|doce|pudim|sorvete|açaí|acai)\b'
            ],
            'quantities': [
                r'\b(\d+)\s*(pizza|hamburguer|lanche|refrigerante)s?\b',
                r'\b(um|uma|dois|duas|três|tres|quatro|cinco)\b'
            ],
            'sizes': [
                r'\b(pequena|média|media|grande|gigante|família|familia)\b',
                r'\b(p|m|g|gg)\b'
            ],
            'addresses': [
                r'\b(rua|av|avenida|travessa|alameda)\s+[\w\s,]+\d+\b',
                r'\b\d{5}-?\d{3}\b'  # CEP
            ]
        }
    
    def classify_message(self, message: str, store_id: str = None) -> Dict[str, Any]:
        """Classificar intenção da mensagem"""
        try:
            # Normalizar mensagem
            normalized_message = self._normalize_message(message)
            
            # Classificar usando padrões regex (fallback rápido)
            regex_result = self._classify_with_patterns(normalized_message)
            
            # Se temos um classificador treinado, usar ele também
            ml_result = None
            if self.classifier:
                try:
                    ml_result = self.classifier.classify_intent(message)
                except Exception as e:
                    logger.warning(f"Erro no classificador ML: {e}")
            
            # Combinar resultados
            final_intent, confidence = self._combine_results(regex_result, ml_result)
            
            # Extrair entidades
            entities = self._extract_entities(normalized_message)
            
            return {
                'intent': final_intent,
                'confidence': confidence,
                'entities': entities,
                'normalized_message': normalized_message,
                'methods_used': {
                    'regex': regex_result is not None,
                    'ml': ml_result is not None
                }
            }
            
        except Exception as e:
            logger.error(f"Erro na classificação: {e}")
            return {
                'intent': 'unknown',
                'confidence': 0.0,
                'entities': [],
                'error': str(e)
            }
    
    def _normalize_message(self, message: str) -> str:
        """Normalizar mensagem para processamento"""
        # Converter para minúsculas
        normalized = message.lower().strip()
        
        # Remover acentos básicos
        replacements = {
            'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a',
            'é': 'e', 'ê': 'e',
            'í': 'i', 'î': 'i',
            'ó': 'o', 'ô': 'o', 'õ': 'o',
            'ú': 'u', 'û': 'u',
            'ç': 'c'
        }
        
        for old, new in replacements.items():
            normalized = normalized.replace(old, new)
        
        # Remover caracteres especiais excessivos
        normalized = re.sub(r'[!]{2,}', '!', normalized)
        normalized = re.sub(r'[?]{2,}', '?', normalized)
        
        return normalized
    
    def _classify_with_patterns(self, message: str) -> Tuple[str, float]:
        """Classificar usando padrões regex"""
        scores = {}
        
        for intent, patterns in self.intent_patterns.items():
            score = 0
            matches = 0
            
            for pattern in patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    matches += 1
                    score += 1
            
            if matches > 0:
                # Normalizar score baseado no número de padrões
                scores[intent] = score / len(patterns)
        
        if not scores:
            return 'unknown', 0.0
        
        # Retornar intenção com maior score
        best_intent = max(scores.keys(), key=lambda k: scores[k])
        confidence = min(scores[best_intent], 1.0)  # Limitar a 1.0
        
        return best_intent, confidence
    
    def _combine_results(self, regex_result: Tuple[str, float], ml_result: Dict = None) -> Tuple[str, float]:
        """Combinar resultados de diferentes métodos"""
        if ml_result and ml_result.get('confidence', 0) > 0.7:
            # Se ML tem alta confiança, usar ele
            return ml_result['intent'], ml_result['confidence']
        
        if regex_result[1] > 0.5:
            # Se regex tem boa confiança, usar ele
            return regex_result
        
        if ml_result:
            # Usar ML como fallback
            return ml_result['intent'], ml_result['confidence']
        
        # Usar regex mesmo com baixa confiança
        return regex_result
    
    def _extract_entities(self, message: str) -> List[Dict[str, Any]]:
        """Extrair entidades da mensagem"""
        entities = []
        
        for entity_type, patterns in self.entity_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, message, re.IGNORECASE)
                for match in matches:
                    entities.append({
                        'type': entity_type,
                        'value': match.group(),
                        'start': match.start(),
                        'end': match.end(),
                        'confidence': 0.8  # Confiança fixa para regex
                    })
        
        return entities
    
    def load_ml_classifier(self, model_path: str = None):
        """Carregar classificador ML se disponível"""
        try:
            self.classifier = DeliveryIntentClassifier()
            if model_path:
                self.classifier.load_model(model_path)
            else:
                # Tentar carregar modelo padrão
                self.classifier.load_model('delivery_intent_model.pkl')
            logger.info("Classificador ML carregado com sucesso")
        except Exception as e:
            logger.warning(f"Não foi possível carregar classificador ML: {e}")
            self.classifier = None

def main():
    """Função principal para execução via linha de comando"""
    try:
        # Ler dados do stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        message = data.get('message', '')
        store_id = data.get('storeId')
        
        if not message:
            raise ValueError("Mensagem não fornecida")
        
        # Inicializar serviço
        service = IntentClassificationService()
        
        # Tentar carregar classificador ML
        service.load_ml_classifier()
        
        # Classificar mensagem
        result = service.classify_message(message, store_id)
        
        # Retornar resultado como JSON
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        # Retornar erro como JSON
        error_result = {
            'intent': 'unknown',
            'confidence': 0.0,
            'entities': [],
            'error': str(e)
        }
        print(json.dumps(error_result, ensure_ascii=False, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()