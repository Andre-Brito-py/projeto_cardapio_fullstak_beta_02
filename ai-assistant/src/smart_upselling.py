import json
import re
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from langchain_community.chat_models import ChatOllama
import requests
from dataclasses import dataclass
from enum import Enum
import random

class UpsellType(Enum):
    COMPLEMENT = "complement"  # Complementos (bebida, sobremesa)
    UPGRADE = "upgrade"        # Upgrade de tamanho/qualidade
    ADDON = "addon"            # Adicionais (queijo extra, bacon)
    BUNDLE = "bundle"          # Combos/pacotes
    CROSS_SELL = "cross_sell"  # Produtos relacionados

class UpsellTiming(Enum):
    DURING_ORDER = "during_order"    # Durante o pedido
    AFTER_ITEM = "after_item"        # Após adicionar item
    BEFORE_CHECKOUT = "before_checkout"  # Antes de finalizar
    POST_ORDER = "post_order"        # Após pedido (próxima vez)

@dataclass
class UpsellSuggestion:
    item_id: str
    item_name: str
    item_description: str
    item_price: float
    upsell_type: UpsellType
    confidence_score: float
    reasoning: str
    discount_percentage: Optional[float]
    bundle_savings: Optional[float]
    personalization_factors: List[str]
    urgency_level: str
    success_probability: float

@dataclass
class UpsellContext:
    current_order: List[Dict]
    customer_history: List[Dict]
    customer_preferences: Dict
    order_value: float
    time_of_day: str
    day_of_week: str
    weather: Optional[str]
    customer_segment: str

class SmartUpsellingEngine:
    """Sistema inteligente de upselling que sugere complementos baseado no pedido atual"""
    
    def __init__(self, backend_api_url: str):
        self.backend_api_url = backend_api_url.rstrip('/')
        
        # Inicializar modelo Ollama
        self.llm = ChatOllama(
            model="llama3.1",
            temperature=0.4,  # Criatividade moderada para sugestões
            base_url="http://localhost:11434"
        )
        
        # Regras de upselling baseadas em categorias
        self.upsell_rules = {
            'pizza': {
                'complements': ['refrigerante', 'suco', 'cerveja', 'sobremesa'],
                'upgrades': ['borda recheada', 'tamanho família', 'queijo extra'],
                'addons': ['bacon', 'calabresa', 'azeitona', 'orégano'],
                'bundles': ['combo pizza + refrigerante', 'combo família']
            },
            'hamburguer': {
                'complements': ['batata frita', 'refrigerante', 'milkshake', 'onion rings'],
                'upgrades': ['hamburguer duplo', 'bacon extra', 'queijo cheddar'],
                'addons': ['picles', 'molho especial', 'cebola caramelizada'],
                'bundles': ['combo hamburguer + batata + refrigerante']
            },
            'sushi': {
                'complements': ['sopa miso', 'sake', 'chá verde', 'sobremesa japonesa'],
                'upgrades': ['sashimi premium', 'combo especial', 'peixes nobres'],
                'addons': ['wasabi', 'gengibre', 'molho tarê'],
                'bundles': ['rodízio', 'combo sushi + temaki']
            },
            'massa': {
                'complements': ['salada', 'pão de alho', 'vinho', 'sobremesa'],
                'upgrades': ['massa artesanal', 'molho especial', 'queijo parmesão'],
                'addons': ['frango grelhado', 'camarão', 'cogumelos'],
                'bundles': ['combo massa + salada + bebida']
            },
            'salada': {
                'complements': ['suco natural', 'água', 'pão integral', 'sobremesa fit'],
                'upgrades': ['proteína extra', 'mix de folhas premium', 'molho gourmet'],
                'addons': ['abacate', 'nuts', 'queijo', 'croutons'],
                'bundles': ['combo salada + suco + sobremesa fit']
            }
        }
        
        # Padrões de comportamento do cliente
        self.customer_segments = {
            'economico': {
                'max_upsell_percentage': 0.15,  # Máximo 15% do valor do pedido
                'preferred_types': [UpsellType.BUNDLE, UpsellType.COMPLEMENT],
                'discount_sensitivity': 'high',
                'messaging': 'econômico e com desconto'
            },
            'premium': {
                'max_upsell_percentage': 0.40,
                'preferred_types': [UpsellType.UPGRADE, UpsellType.ADDON],
                'discount_sensitivity': 'low',
                'messaging': 'qualidade e experiência premium'
            },
            'familia': {
                'max_upsell_percentage': 0.25,
                'preferred_types': [UpsellType.BUNDLE, UpsellType.UPGRADE],
                'discount_sensitivity': 'medium',
                'messaging': 'compartilhamento e economia familiar'
            },
            'saudavel': {
                'max_upsell_percentage': 0.20,
                'preferred_types': [UpsellType.COMPLEMENT, UpsellType.ADDON],
                'discount_sensitivity': 'medium',
                'messaging': 'opções saudáveis e nutritivas'
            },
            'gourmet': {
                'max_upsell_percentage': 0.50,
                'preferred_types': [UpsellType.UPGRADE, UpsellType.ADDON],
                'discount_sensitivity': 'very_low',
                'messaging': 'experiência gastronômica única'
            }
        }
        
        # Timing otimizado para sugestões
        self.timing_strategies = {
            UpsellTiming.DURING_ORDER: {
                'trigger': 'item_added',
                'delay_seconds': 2,
                'max_suggestions': 2,
                'success_rate': 0.35
            },
            UpsellTiming.AFTER_ITEM: {
                'trigger': 'item_confirmed',
                'delay_seconds': 1,
                'max_suggestions': 3,
                'success_rate': 0.42
            },
            UpsellTiming.BEFORE_CHECKOUT: {
                'trigger': 'checkout_initiated',
                'delay_seconds': 0,
                'max_suggestions': 4,
                'success_rate': 0.28
            }
        }
        
    def generate_upsell_suggestions(self, context: UpsellContext, timing: UpsellTiming, max_suggestions: int = 3) -> List[UpsellSuggestion]:
        """Gera sugestões de upselling baseadas no contexto"""
        
        suggestions = []
        
        # Analisar itens do pedido atual
        for item in context.current_order:
            item_suggestions = self._analyze_item_for_upsell(item, context)
            suggestions.extend(item_suggestions)
            
        # Analisar padrões do histórico do cliente
        history_suggestions = self._analyze_customer_history(context)
        suggestions.extend(history_suggestions)
        
        # Sugestões baseadas em contexto temporal/sazonal
        contextual_suggestions = self._generate_contextual_suggestions(context)
        suggestions.extend(contextual_suggestions)
        
        # Usar IA para sugestões personalizadas
        ai_suggestions = self._generate_ai_suggestions(context)
        suggestions.extend(ai_suggestions)
        
        # Filtrar e ranquear sugestões
        filtered_suggestions = self._filter_and_rank_suggestions(
            suggestions, context, timing, max_suggestions
        )
        
        return filtered_suggestions
        
    def _analyze_item_for_upsell(self, item: Dict, context: UpsellContext) -> List[UpsellSuggestion]:
        """Analisa item específico para sugestões de upsell"""
        
        suggestions = []
        item_category = item.get('category', '').lower()
        item_name = item.get('name', '').lower()
        item_price = item.get('price', 0)
        
        # Buscar regras para a categoria
        category_rules = None
        for category, rules in self.upsell_rules.items():
            if category in item_category or category in item_name:
                category_rules = rules
                break
                
        if not category_rules:
            return suggestions
            
        # Gerar sugestões de complementos
        for complement in category_rules.get('complements', []):
            suggestions.append(UpsellSuggestion(
                item_id=f"complement_{complement.replace(' ', '_')}",
                item_name=complement.title(),
                item_description=f"Perfeito para acompanhar seu {item['name']}",
                item_price=item_price * 0.3,  # 30% do preço do item principal
                upsell_type=UpsellType.COMPLEMENT,
                confidence_score=0.8,
                reasoning=f"Complemento clássico para {item_category}",
                discount_percentage=10.0 if context.customer_segment == 'economico' else None,
                bundle_savings=None,
                personalization_factors=[f"categoria_{item_category}"],
                urgency_level="medium",
                success_probability=0.65
            ))
            
        # Gerar sugestões de upgrade
        for upgrade in category_rules.get('upgrades', []):
            suggestions.append(UpsellSuggestion(
                item_id=f"upgrade_{upgrade.replace(' ', '_')}",
                item_name=f"{item['name']} + {upgrade.title()}",
                item_description=f"Upgrade seu {item['name']} com {upgrade}",
                item_price=item_price * 0.4,  # 40% adicional
                upsell_type=UpsellType.UPGRADE,
                confidence_score=0.7,
                reasoning=f"Upgrade popular para {item_category}",
                discount_percentage=None,
                bundle_savings=None,
                personalization_factors=[f"categoria_{item_category}", "upgrade"],
                urgency_level="low",
                success_probability=0.45
            ))
            
        return suggestions
        
    def _analyze_customer_history(self, context: UpsellContext) -> List[UpsellSuggestion]:
        """Analisa histórico do cliente para sugestões personalizadas"""
        
        suggestions = []
        
        if not context.customer_history:
            return suggestions
            
        # Analisar itens frequentemente pedidos juntos
        frequent_combinations = self._find_frequent_combinations(context.customer_history)
        
        for combo in frequent_combinations:
            # Verificar se algum item do combo não está no pedido atual
            current_items = [item['name'].lower() for item in context.current_order]
            missing_items = [item for item in combo if item.lower() not in current_items]
            
            for missing_item in missing_items:
                suggestions.append(UpsellSuggestion(
                    item_id=f"history_{missing_item.replace(' ', '_')}",
                    item_name=missing_item.title(),
                    item_description=f"Você costuma pedir isso junto! Que tal adicionar?",
                    item_price=15.0,  # Preço estimado
                    upsell_type=UpsellType.CROSS_SELL,
                    confidence_score=0.9,
                    reasoning="Baseado no seu histórico de pedidos",
                    discount_percentage=15.0,  # Desconto por fidelidade
                    bundle_savings=None,
                    personalization_factors=["histórico", "fidelidade"],
                    urgency_level="high",
                    success_probability=0.75
                ))
                
        return suggestions
        
    def _find_frequent_combinations(self, history: List[Dict]) -> List[List[str]]:
        """Encontra combinações frequentes no histórico"""
        
        # Simulação de análise de combinações frequentes
        # Em produção, usaria algoritmos como Apriori ou FP-Growth
        
        common_combos = [
            ['Pizza Margherita', 'Coca-Cola', 'Sorvete'],
            ['Hamburguer', 'Batata Frita', 'Milkshake'],
            ['Sushi', 'Sopa Miso', 'Sake'],
            ['Salada Caesar', 'Suco de Laranja', 'Pão de Alho']
        ]
        
        return random.sample(common_combos, min(2, len(common_combos)))
        
    def _generate_contextual_suggestions(self, context: UpsellContext) -> List[UpsellSuggestion]:
        """Gera sugestões baseadas em contexto temporal e ambiental"""
        
        suggestions = []
        
        # Sugestões baseadas no horário
        hour = datetime.now().hour
        
        if 6 <= hour <= 10:  # Manhã
            suggestions.append(UpsellSuggestion(
                item_id="morning_coffee",
                item_name="Café Especial",
                item_description="Perfeito para começar o dia!",
                item_price=8.0,
                upsell_type=UpsellType.COMPLEMENT,
                confidence_score=0.7,
                reasoning="Sugestão matinal",
                discount_percentage=None,
                bundle_savings=None,
                personalization_factors=["horário_manhã"],
                urgency_level="medium",
                success_probability=0.55
            ))
            
        elif 18 <= hour <= 22:  # Noite
            suggestions.append(UpsellSuggestion(
                item_id="evening_dessert",
                item_name="Sobremesa da Casa",
                item_description="Para finalizar a noite com chave de ouro!",
                item_price=12.0,
                upsell_type=UpsellType.COMPLEMENT,
                confidence_score=0.6,
                reasoning="Sugestão noturna",
                discount_percentage=None,
                bundle_savings=None,
                personalization_factors=["horário_noite"],
                urgency_level="low",
                success_probability=0.40
            ))
            
        # Sugestões baseadas no clima
        if context.weather:
            if 'chuva' in context.weather.lower() or 'frio' in context.weather.lower():
                suggestions.append(UpsellSuggestion(
                    item_id="warm_drink",
                    item_name="Bebida Quente",
                    item_description="Perfeito para este clima!",
                    item_price=6.0,
                    upsell_type=UpsellType.COMPLEMENT,
                    confidence_score=0.8,
                    reasoning="Sugestão baseada no clima",
                    discount_percentage=None,
                    bundle_savings=None,
                    personalization_factors=["clima_frio"],
                    urgency_level="medium",
                    success_probability=0.60
                ))
                
        return suggestions
        
    def _generate_ai_suggestions(self, context: UpsellContext) -> List[UpsellSuggestion]:
        """Gera sugestões usando IA"""
        
        current_items = [item['name'] for item in context.current_order]
        order_value = context.order_value
        customer_segment = context.customer_segment
        
        prompt = f"""
        Gere sugestões inteligentes de upselling para este pedido:
        
        PEDIDO ATUAL: {', '.join(current_items)}
        VALOR ATUAL: R$ {order_value:.2f}
        PERFIL DO CLIENTE: {customer_segment}
        HORÁRIO: {context.time_of_day}
        DIA DA SEMANA: {context.day_of_week}
        
        Considere:
        - Complementos que fazem sentido com os itens pedidos
        - Upgrades que agregam valor
        - Bundles que oferecem economia
        - Preferências do perfil do cliente
        - Contexto temporal
        
        Gere até 3 sugestões em JSON:
        {{
            "suggestions": [
                {{
                    "item_name": "nome do item",
                    "description": "descrição atrativa",
                    "price": 0.0,
                    "type": "complement|upgrade|addon|bundle|cross_sell",
                    "reasoning": "por que esta sugestão faz sentido",
                    "success_probability": 0.0-1.0,
                    "personalization_factors": ["fatores que tornam esta sugestão pessoal"]
                }}
            ]
        }}
        
        Seja criativo mas realista. Foque em sugestões que realmente agreguem valor.
        
        Responda APENAS com o JSON.
        """
        
        try:
            response = self.llm.invoke(prompt)
            ai_data = json.loads(response.content)
            
            suggestions = []
            for suggestion in ai_data.get('suggestions', []):
                suggestions.append(UpsellSuggestion(
                    item_id=f"ai_{suggestion['item_name'].replace(' ', '_').lower()}",
                    item_name=suggestion['item_name'],
                    item_description=suggestion['description'],
                    item_price=suggestion['price'],
                    upsell_type=UpsellType(suggestion['type']),
                    confidence_score=0.8,
                    reasoning=suggestion['reasoning'],
                    discount_percentage=None,
                    bundle_savings=None,
                    personalization_factors=suggestion.get('personalization_factors', []),
                    urgency_level="medium",
                    success_probability=suggestion.get('success_probability', 0.5)
                ))
                
            return suggestions
            
        except Exception as e:
            print(f"Erro na geração de sugestões por IA: {e}")
            return []
            
    def _filter_and_rank_suggestions(self, suggestions: List[UpsellSuggestion], context: UpsellContext, timing: UpsellTiming, max_suggestions: int) -> List[UpsellSuggestion]:
        """Filtra e ranqueia sugestões baseado no contexto"""
        
        # Filtrar por segmento do cliente
        segment_config = self.customer_segments.get(context.customer_segment, self.customer_segments['economico'])
        max_upsell_value = context.order_value * segment_config['max_upsell_percentage']
        
        # Filtrar sugestões que excedem o limite de valor
        filtered = [s for s in suggestions if s.item_price <= max_upsell_value]
        
        # Filtrar por tipos preferidos do segmento
        preferred_types = segment_config['preferred_types']
        filtered = [s for s in filtered if s.upsell_type in preferred_types or s.confidence_score > 0.8]
        
        # Remover duplicatas
        seen_items = set()
        unique_suggestions = []
        for suggestion in filtered:
            if suggestion.item_name not in seen_items:
                seen_items.add(suggestion.item_name)
                unique_suggestions.append(suggestion)
                
        # Calcular score final para ranqueamento
        for suggestion in unique_suggestions:
            suggestion.final_score = self._calculate_suggestion_score(suggestion, context, timing)
            
        # Ordenar por score e retornar top N
        ranked_suggestions = sorted(unique_suggestions, key=lambda x: x.final_score, reverse=True)
        
        return ranked_suggestions[:max_suggestions]
        
    def _calculate_suggestion_score(self, suggestion: UpsellSuggestion, context: UpsellContext, timing: UpsellTiming) -> float:
        """Calcula score final da sugestão"""
        
        base_score = suggestion.confidence_score * suggestion.success_probability
        
        # Bonus por personalização
        personalization_bonus = len(suggestion.personalization_factors) * 0.1
        
        # Bonus por timing
        timing_config = self.timing_strategies.get(timing, {})
        timing_bonus = timing_config.get('success_rate', 0.3) * 0.2
        
        # Bonus por desconto (se cliente é sensível a preço)
        discount_bonus = 0
        if suggestion.discount_percentage and context.customer_segment in ['economico', 'familia']:
            discount_bonus = suggestion.discount_percentage / 100 * 0.3
            
        # Penalty por preço alto para segmentos econômicos
        price_penalty = 0
        if context.customer_segment == 'economico' and suggestion.item_price > context.order_value * 0.1:
            price_penalty = -0.2
            
        final_score = base_score + personalization_bonus + timing_bonus + discount_bonus + price_penalty
        
        return max(0, min(1, final_score))
        
    def format_upsell_message(self, suggestion: UpsellSuggestion, context: UpsellContext) -> str:
        """Formata mensagem de upselling"""
        
        segment_config = self.customer_segments.get(context.customer_segment, {})
        messaging_style = segment_config.get('messaging', 'padrão')
        
        prompt = f"""
        Crie uma mensagem atrativa de upselling para:
        
        ITEM: {suggestion.item_name}
        DESCRIÇÃO: {suggestion.item_description}
        PREÇO: R$ {suggestion.item_price:.2f}
        TIPO: {suggestion.upsell_type.value}
        MOTIVO: {suggestion.reasoning}
        
        CONTEXTO DO CLIENTE:
        - Perfil: {context.customer_segment}
        - Estilo de mensagem: {messaging_style}
        - Valor do pedido atual: R$ {context.order_value:.2f}
        
        DIRETRIZES:
        - Seja persuasivo mas não insistente
        - Destaque o valor agregado
        - Use linguagem natural e amigável
        - Inclua call-to-action claro
        - Se houver desconto, destaque-o
        
        Responda apenas com a mensagem, sem aspas ou formatação extra.
        """
        
        try:
            response = self.llm.invoke(prompt)
            return response.content.strip()
        except Exception as e:
            print(f"Erro ao formatar mensagem: {e}")
            
            # Mensagem padrão em caso de erro
            discount_text = f" com {suggestion.discount_percentage}% de desconto" if suggestion.discount_percentage else ""
            return f"Que tal adicionar {suggestion.item_name} por apenas R$ {suggestion.item_price:.2f}{discount_text}? {suggestion.item_description}"
            
    def track_upsell_performance(self, suggestion_id: str, customer_id: str, accepted: bool, order_value_increase: float = 0) -> Dict:
        """Rastreia performance das sugestões de upsell"""
        
        performance_data = {
            'suggestion_id': suggestion_id,
            'customer_id': customer_id,
            'timestamp': datetime.now().isoformat(),
            'accepted': accepted,
            'order_value_increase': order_value_increase,
            'success_rate_impact': 1 if accepted else 0
        }
        
        # Enviar dados para analytics
        try:
            requests.post(
                f"{self.backend_api_url}/api/analytics/upsell",
                json=performance_data
            )
        except Exception as e:
            print(f"Erro ao enviar dados de performance: {e}")
            
        return performance_data
        
    def get_upselling_analytics(self, store_id: str, time_range: str = '7d') -> Dict:
        """Gera analytics de upselling"""
        
        # Em produção, buscaria dados reais
        return {
            'time_range': time_range,
            'total_upsell_attempts': 1247,
            'successful_upsells': 445,
            'success_rate': 0.357,  # 35.7%
            'average_order_increase': 18.50,
            'total_additional_revenue': 8232.50,
            'top_performing_suggestions': [
                {'item': 'Refrigerante', 'success_rate': 0.68, 'avg_increase': 8.00},
                {'item': 'Batata Frita', 'success_rate': 0.52, 'avg_increase': 12.00},
                {'item': 'Sobremesa', 'success_rate': 0.34, 'avg_increase': 15.00}
            ],
            'performance_by_timing': {
                'during_order': {'attempts': 423, 'success_rate': 0.35},
                'after_item': {'attempts': 512, 'success_rate': 0.42},
                'before_checkout': {'attempts': 312, 'success_rate': 0.28}
            },
            'performance_by_segment': {
                'economico': {'success_rate': 0.45, 'avg_increase': 12.30},
                'premium': {'success_rate': 0.38, 'avg_increase': 28.70},
                'familia': {'success_rate': 0.41, 'avg_increase': 22.10},
                'saudavel': {'success_rate': 0.29, 'avg_increase': 16.80},
                'gourmet': {'success_rate': 0.33, 'avg_increase': 35.20}
            },
            'optimization_suggestions': [
                'Focar em sugestões de complementos para segmento econômico',
                'Aumentar desconto em bundles para melhorar conversão',
                'Testar timing "after_item" para mais categorias',
                'Personalizar mensagens por histórico do cliente'
            ]
        }