import json
import os
from typing import Dict, List, Optional, Any
from datetime import datetime, time
import requests
from langchain_community.chat_models import ChatOllama

class SmartRecommendationEngine:
    """Sistema de recomendações inteligentes usando Ollama"""
    
    def __init__(self, backend_api_url: str):
        self.backend_api_url = backend_api_url.rstrip('/')
        
        # Inicializar modelo Ollama
        self.llm = ChatOllama(
            model="llama3.1",
            temperature=0.8,
            base_url="http://localhost:11434"
        )
        
        # Contextos para recomendações
        self.time_contexts = {
            'breakfast': {'start': time(6, 0), 'end': time(11, 0)},
            'lunch': {'start': time(11, 0), 'end': time(15, 0)},
            'afternoon_snack': {'start': time(15, 0), 'end': time(18, 0)},
            'dinner': {'start': time(18, 0), 'end': time(23, 0)},
            'late_night': {'start': time(23, 0), 'end': time(6, 0)}
        }
        
    def get_current_time_context(self) -> str:
        """Determina contexto temporal atual"""
        current_time = datetime.now().time()
        
        for context, times in self.time_contexts.items():
            if times['start'] <= times['end']:  # Mesmo dia
                if times['start'] <= current_time <= times['end']:
                    return context
            else:  # Atravessa meia-noite
                if current_time >= times['start'] or current_time <= times['end']:
                    return context
                    
        return 'general'
        
    def get_weather_context(self) -> str:
        """Simula contexto climático (em produção, integraria com API de clima)"""
        # Simulação - em produção integraria com OpenWeatherMap ou similar
        import random
        weather_options = ['sunny', 'rainy', 'cold', 'hot', 'cloudy']
        return random.choice(weather_options)
        
    def get_customer_history(self, customer_id: str, store_id: str) -> List[Dict]:
        """Busca histórico de pedidos do cliente"""
        try:
            response = requests.get(
                f"{self.backend_api_url}/api/customers/{customer_id}/orders",
                params={'storeId': store_id, 'limit': 10}
            )
            if response.status_code == 200:
                return response.json().get('orders', [])
        except Exception as e:
            print(f"Erro ao buscar histórico: {e}")
        return []
        
    def get_popular_items(self, store_id: str, time_context: str = None) -> List[Dict]:
        """Busca itens populares da loja"""
        try:
            params = {'storeId': store_id}
            if time_context:
                params['timeContext'] = time_context
                
            response = requests.get(
                f"{self.backend_api_url}/api/analytics/popular-items",
                params=params
            )
            if response.status_code == 200:
                return response.json().get('items', [])
        except Exception as e:
            print(f"Erro ao buscar itens populares: {e}")
        return []
        
    def analyze_preferences(self, customer_history: List[Dict]) -> Dict:
        """Analisa preferências do cliente usando Ollama"""
        if not customer_history:
            return {'preferences': [], 'dietary_restrictions': [], 'favorite_categories': []}
            
        # Preparar dados do histórico
        history_text = "\n".join([
            f"Pedido {i+1}: {', '.join([item['name'] for item in order.get('items', [])])}"
            for i, order in enumerate(customer_history[:5])
        ])
        
        prompt = f"""
        Analise o histórico de pedidos do cliente e identifique padrões de preferência:
        
        HISTÓRICO DE PEDIDOS:
        {history_text}
        
        Baseado neste histórico, identifique:
        1. Tipos de comida preferidos
        2. Possíveis restrições alimentares
        3. Categorias favoritas
        4. Padrões de pedido (doces, salgados, bebidas, etc.)
        
        Responda em formato JSON:
        {{
            "preferences": ["lista de preferências identificadas"],
            "dietary_restrictions": ["possíveis restrições"],
            "favorite_categories": ["categorias mais pedidas"],
            "patterns": ["padrões observados"]
        }}
        
        Responda APENAS com o JSON.
        """
        
        try:
            response = self.llm.invoke(prompt)
            return json.loads(response.content)
        except Exception as e:
            print(f"Erro ao analisar preferências: {e}")
            return {'preferences': [], 'dietary_restrictions': [], 'favorite_categories': []}
            
    def generate_contextual_recommendations(self, 
                                          store_id: str,
                                          customer_id: str = None,
                                          current_cart: List[Dict] = None,
                                          menu: List[Dict] = None) -> Dict:
        """Gera recomendações contextuais inteligentes"""
        
        # Obter contextos
        time_context = self.get_current_time_context()
        weather_context = self.get_weather_context()
        
        # Obter dados
        customer_history = self.get_customer_history(customer_id, store_id) if customer_id else []
        popular_items = self.get_popular_items(store_id, time_context)
        
        # Analisar preferências
        preferences = self.analyze_preferences(customer_history)
        
        # Preparar contexto para IA
        cart_summary = "\n".join([f"- {item['name']}" for item in (current_cart or [])]) or "Carrinho vazio"
        menu_summary = "\n".join([f"- {item['name']}: R$ {item['price']} ({item.get('category', 'Sem categoria')})" 
                                 for item in (menu or [])[:20]])  # Limitar para não sobrecarregar
        
        prompt = f"""
        Você é um especialista em recomendações de comida. Gere recomendações personalizadas considerando:
        
        CONTEXTO TEMPORAL: {time_context}
        CONTEXTO CLIMÁTICO: {weather_context}
        
        PREFERÊNCIAS DO CLIENTE:
        {json.dumps(preferences, indent=2, ensure_ascii=False)}
        
        CARRINHO ATUAL:
        {cart_summary}
        
        CARDÁPIO DISPONÍVEL (amostra):
        {menu_summary}
        
        ITENS POPULARES:
        {json.dumps([item['name'] for item in popular_items[:5]], ensure_ascii=False)}
        
        Gere recomendações inteligentes em formato JSON:
        {{
            "primary_recommendations": [
                {{
                    "item_name": "nome do item",
                    "reason": "motivo da recomendação",
                    "confidence": 0.0-1.0
                }}
            ],
            "complementary_items": ["itens que combinam com o carrinho atual"],
            "seasonal_suggestions": ["sugestões baseadas no horário/clima"],
            "upselling_opportunities": ["oportunidades de venda adicional"],
            "personalized_message": "mensagem personalizada para o cliente"
        }}
        
        Considere:
        - Horário do dia (café da manhã, almoço, jantar, etc.)
        - Clima (bebidas quentes no frio, geladas no calor)
        - Preferências históricas
        - Complementos para itens no carrinho
        - Popularidade dos itens
        
        Responda APENAS com o JSON.
        """
        
        try:
            response = self.llm.invoke(prompt)
            recommendations = json.loads(response.content)
            
            # Adicionar metadados
            recommendations['metadata'] = {
                'time_context': time_context,
                'weather_context': weather_context,
                'has_history': len(customer_history) > 0,
                'cart_items': len(current_cart or []),
                'generated_at': datetime.now().isoformat()
            }
            
            return recommendations
            
        except Exception as e:
            print(f"Erro ao gerar recomendações: {e}")
            return self._get_fallback_recommendations(popular_items)
            
    def _get_fallback_recommendations(self, popular_items: List[Dict]) -> Dict:
        """Recomendações de fallback em caso de erro"""
        return {
            'primary_recommendations': [
                {
                    'item_name': item['name'],
                    'reason': 'Item popular entre nossos clientes',
                    'confidence': 0.8
                } for item in popular_items[:3]
            ],
            'complementary_items': [],
            'seasonal_suggestions': [],
            'upselling_opportunities': [],
            'personalized_message': 'Confira nossas opções mais populares!',
            'metadata': {
                'fallback': True,
                'generated_at': datetime.now().isoformat()
            }
        }
        
    def generate_smart_upselling(self, current_cart: List[Dict], menu: List[Dict]) -> Dict:
        """Gera sugestões inteligentes de upselling"""
        if not current_cart:
            return {'suggestions': [], 'message': ''}
            
        cart_summary = "\n".join([f"- {item['name']} (R$ {item['price']})" for item in current_cart])
        menu_summary = "\n".join([f"- {item['name']}: R$ {item['price']} ({item.get('category', '')})" 
                                 for item in menu])
        
        prompt = f"""
        Analise o carrinho atual e sugira complementos inteligentes:
        
        CARRINHO ATUAL:
        {cart_summary}
        
        CARDÁPIO COMPLETO:
        {menu_summary}
        
        Gere sugestões de upselling em JSON:
        {{
            "suggestions": [
                {{
                    "item_name": "nome do item",
                    "category": "categoria",
                    "reason": "por que combina",
                    "discount_opportunity": "possível desconto/combo"
                }}
            ],
            "combo_opportunities": ["oportunidades de combo"],
            "message": "mensagem persuasiva mas não invasiva"
        }}
        
        Foque em:
        - Bebidas para acompanhar comidas
        - Sobremesas após pratos principais
        - Acompanhamentos que fazem sentido
        - Combos que oferecem valor
        
        Seja sutil e útil, não insistente.
        
        Responda APENAS com o JSON.
        """
        
        try:
            response = self.llm.invoke(prompt)
            return json.loads(response.content)
        except Exception as e:
            print(f"Erro ao gerar upselling: {e}")
            return {'suggestions': [], 'message': 'Que tal uma bebida para acompanhar?'}
            
    def analyze_sentiment_and_recommend(self, customer_message: str, menu: List[Dict]) -> Dict:
        """Analisa sentimento da mensagem e recomenda baseado no humor"""
        prompt = f"""
        Analise o sentimento e humor da mensagem do cliente e faça recomendações apropriadas:
        
        MENSAGEM: "{customer_message}"
        
        CARDÁPIO DISPONÍVEL:
        {json.dumps([{'name': item['name'], 'category': item.get('category', '')} for item in menu[:15]], ensure_ascii=False)}
        
        Responda em JSON:
        {{
            "sentiment": "positive" | "negative" | "neutral" | "excited" | "stressed" | "sad",
            "mood_indicators": ["indicadores do humor"],
            "recommended_approach": "como abordar o cliente",
            "mood_based_recommendations": [
                {{
                    "item_name": "item recomendado",
                    "reason": "por que é apropriado para o humor"
                }}
            ],
            "response_tone": "tom de resposta apropriado"
        }}
        
        Considere:
        - Cliente estressado: comidas reconfortantes
        - Cliente animado: opções especiais/premium
        - Cliente triste: comfort food
        - Cliente neutro: recomendações padrão
        
        Responda APENAS com o JSON.
        """
        
        try:
            response = self.llm.invoke(prompt)
            return json.loads(response.content)
        except Exception as e:
            print(f"Erro ao analisar sentimento: {e}")
            return {
                'sentiment': 'neutral',
                'mood_indicators': [],
                'recommended_approach': 'friendly',
                'mood_based_recommendations': [],
                'response_tone': 'helpful'
            }