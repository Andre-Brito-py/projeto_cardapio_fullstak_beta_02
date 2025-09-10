import json
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass

# Importar todos os módulos implementados
from .conversation_manager import ConversationalOrderManager, ConversationState
from .smart_recommendations import SmartRecommendationEngine, RecommendationContext
from .voice_order_processor import VoiceOrderProcessor
from .menu_image_generator import MenuImageGenerator
from .sentiment_analyzer import RealTimeSentimentAnalyzer, SentimentLevel
from .multilingual_support import MultilingualSupportEngine, SupportedLanguage
from .smart_upselling import SmartUpsellingEngine, UpsellContext, UpsellTiming

@dataclass
class CustomerSession:
    customer_id: str
    language: SupportedLanguage
    conversation_state: ConversationState
    sentiment_history: List[Dict]
    preferences: Dict
    order_history: List[Dict]
    current_order: List[Dict]
    session_start: datetime

class OllamaIntegrationHub:
    """Hub central que integra todas as funcionalidades do Ollama para demonstração"""
    
    def __init__(self, backend_api_url: str = "http://localhost:3000"):
        self.backend_api_url = backend_api_url
        
        # Inicializar todos os engines
        self.conversation_manager = ConversationalOrderManager(backend_api_url)
        self.recommendation_engine = SmartRecommendationEngine(backend_api_url)
        self.voice_processor = VoiceOrderProcessor(backend_api_url)
        self.image_generator = MenuImageGenerator(backend_api_url)
        self.sentiment_analyzer = RealTimeSentimentAnalyzer(backend_api_url)
        self.multilingual_support = MultilingualSupportEngine(backend_api_url)
        self.upselling_engine = SmartUpsellingEngine(backend_api_url)
        
        # Sessões ativas
        self.active_sessions: Dict[str, CustomerSession] = {}
        
        # Configurações de demonstração
        self.demo_mode = True
        self.demo_data = self._load_demo_data()
        
    def _load_demo_data(self) -> Dict:
        """Carrega dados de demonstração"""
        return {
            'sample_customers': [
                {
                    'id': 'demo_customer_1',
                    'name': 'Maria Silva',
                    'language': 'pt',
                    'segment': 'familia',
                    'preferences': ['pizza', 'italiana', 'vegetariano'],
                    'order_history': [
                        {'items': ['Pizza Margherita', 'Refrigerante'], 'value': 45.00},
                        {'items': ['Lasanha', 'Salada'], 'value': 38.00}
                    ]
                },
                {
                    'id': 'demo_customer_2',
                    'name': 'John Smith',
                    'language': 'en',
                    'segment': 'premium',
                    'preferences': ['sushi', 'japonesa', 'premium'],
                    'order_history': [
                        {'items': ['Sushi Premium', 'Sake'], 'value': 85.00}
                    ]
                },
                {
                    'id': 'demo_customer_3',
                    'name': 'Carlos Rodriguez',
                    'language': 'es',
                    'segment': 'economico',
                    'preferences': ['hamburguer', 'fast-food'],
                    'order_history': [
                        {'items': ['Hamburguer', 'Batata'], 'value': 25.00}
                    ]
                }
            ],
            'sample_menu': {
                'categories': [
                    {
                        'id': 'pizza',
                        'name': 'Pizzas',
                        'items': [
                            {'id': 'margherita', 'name': 'Pizza Margherita', 'price': 32.00, 'description': 'Molho de tomate, mussarela e manjericão'},
                            {'id': 'pepperoni', 'name': 'Pizza Pepperoni', 'price': 38.00, 'description': 'Molho de tomate, mussarela e pepperoni'}
                        ]
                    },
                    {
                        'id': 'hamburguer',
                        'name': 'Hamburguers',
                        'items': [
                            {'id': 'classic', 'name': 'Hamburguer Clássico', 'price': 22.00, 'description': 'Pão, carne, alface, tomate e molho especial'},
                            {'id': 'bacon', 'name': 'Hamburguer Bacon', 'price': 28.00, 'description': 'Pão, carne, bacon, queijo e molho barbecue'}
                        ]
                    }
                ]
            }
        }
        
    async def process_customer_message(self, customer_id: str, message: str, message_type: str = 'text') -> Dict:
        """Processa mensagem do cliente usando todas as funcionalidades integradas"""
        
        # Obter ou criar sessão do cliente
        session = self._get_or_create_session(customer_id)
        
        # 1. Detectar idioma e traduzir se necessário
        language_result = self.multilingual_support.process_multilingual_message(
            message, session.language
        )
        
        processed_message = language_result['internal_message']
        detected_language = SupportedLanguage(language_result['detected_language'])
        
        # Atualizar idioma da sessão se mudou
        if detected_language != session.language:
            session.language = detected_language
            
        # 2. Analisar sentimento
        sentiment_analysis = self.sentiment_analyzer.analyze_message_sentiment(
            processed_message, customer_id, {
                'timestamp': datetime.now().isoformat(),
                'order_value': sum(item.get('price', 0) for item in session.current_order)
            }
        )
        
        # Adicionar ao histórico de sentimento
        session.sentiment_history.append({
            'timestamp': datetime.now().isoformat(),
            'sentiment': sentiment_analysis.sentiment.value,
            'confidence': sentiment_analysis.confidence,
            'message': message[:100]  # Primeiros 100 caracteres
        })
        
        # 3. Processar mensagem conversacional
        conversation_result = await self.conversation_manager.process_message(
            customer_id, processed_message, session.conversation_state
        )
        
        # Atualizar estado da conversa
        session.conversation_state = conversation_result['conversation_state']
        
        # 4. Gerar recomendações se apropriado
        recommendations = []
        if conversation_result['intent'] in ['menu_inquiry', 'order_intent']:
            rec_context = RecommendationContext(
                customer_id=customer_id,
                current_time=datetime.now(),
                order_history=session.order_history,
                current_order=session.current_order,
                preferences=session.preferences,
                location={'city': 'São Paulo', 'weather': 'sunny'},
                customer_segment=self._get_customer_segment(customer_id)
            )
            
            recommendations = self.recommendation_engine.generate_contextual_recommendations(rec_context)
            
        # 5. Gerar sugestões de upselling se há itens no pedido
        upsell_suggestions = []
        if session.current_order and conversation_result['intent'] != 'greeting':
            upsell_context = UpsellContext(
                current_order=session.current_order,
                customer_history=session.order_history,
                customer_preferences=session.preferences,
                order_value=sum(item.get('price', 0) for item in session.current_order),
                time_of_day=datetime.now().strftime('%H:%M'),
                day_of_week=datetime.now().strftime('%A'),
                weather='sunny',
                customer_segment=self._get_customer_segment(customer_id)
            )
            
            upsell_suggestions = self.upselling_engine.generate_upsell_suggestions(
                upsell_context, UpsellTiming.DURING_ORDER, max_suggestions=2
            )
            
        # 6. Formatar resposta final no idioma do cliente
        final_response = language_result['final_response']
        
        # 7. Criar alertas se sentimento negativo
        alert = None
        if sentiment_analysis.sentiment in [SentimentLevel.NEGATIVE, SentimentLevel.VERY_NEGATIVE]:
            alert = self.sentiment_analyzer.create_alert_for_negative_sentiment(
                sentiment_analysis, customer_id, message
            )
            
        # 8. Compilar resposta completa
        response = {
            'customer_id': customer_id,
            'timestamp': datetime.now().isoformat(),
            'language': {
                'detected': detected_language.value,
                'confidence': language_result.get('language_confidence', 1.0)
            },
            'sentiment': {
                'level': sentiment_analysis.sentiment.value,
                'confidence': sentiment_analysis.confidence,
                'emotions': sentiment_analysis.emotions,
                'alert_created': alert is not None
            },
            'conversation': {
                'intent': conversation_result['intent'],
                'confidence': conversation_result['confidence'],
                'state': session.conversation_state.current_step,
                'order_items': len(session.current_order)
            },
            'response': {
                'text': final_response,
                'language': detected_language.value
            },
            'recommendations': [
                {
                    'item': rec.item_name,
                    'reason': rec.reasoning,
                    'confidence': rec.confidence_score
                } for rec in recommendations[:3]
            ],
            'upselling': [
                {
                    'item': upsell.item_name,
                    'price': upsell.item_price,
                    'type': upsell.upsell_type.value,
                    'message': self.upselling_engine.format_upsell_message(upsell, upsell_context) if upsell_suggestions else ''
                } for upsell in upsell_suggestions
            ],
            'session_health': {
                'conversation_turns': len(session.sentiment_history),
                'average_sentiment': self._calculate_average_sentiment(session.sentiment_history),
                'session_duration_minutes': (datetime.now() - session.session_start).total_seconds() / 60
            }
        }
        
        return response
        
    async def process_voice_message(self, customer_id: str, audio_data: bytes) -> Dict:
        """Processa mensagem de voz"""
        
        # Processar áudio
        voice_result = await self.voice_processor.process_voice_order(
            audio_data, customer_id
        )
        
        # Se transcrição foi bem-sucedida, processar como mensagem de texto
        if voice_result['transcription_success']:
            text_result = await self.process_customer_message(
                customer_id, voice_result['transcribed_text'], 'voice'
            )
            
            # Adicionar informações específicas de voz
            text_result['voice_processing'] = {
                'transcription_confidence': voice_result['confidence'],
                'audio_duration': voice_result.get('audio_duration', 0),
                'voice_response_available': voice_result.get('audio_response_path') is not None
            }
            
            return text_result
        else:
            return {
                'error': 'voice_processing_failed',
                'message': 'Não consegui entender o áudio. Pode repetir?',
                'voice_processing': voice_result
            }
            
    def generate_menu_images(self, menu_items: List[Dict]) -> Dict:
        """Gera imagens para itens do cardápio"""
        
        results = []
        
        for item in menu_items:
            try:
                image_result = self.image_generator.generate_item_image(
                    item['name'], 
                    item.get('description', ''),
                    item.get('category', 'food')
                )
                results.append({
                    'item_id': item.get('id'),
                    'item_name': item['name'],
                    'image_generated': image_result['success'],
                    'image_path': image_result.get('image_path'),
                    'enhanced_description': image_result.get('enhanced_description')
                })
            except Exception as e:
                results.append({
                    'item_id': item.get('id'),
                    'item_name': item['name'],
                    'image_generated': False,
                    'error': str(e)
                })
                
        return {
            'total_items': len(menu_items),
            'successful_generations': len([r for r in results if r.get('image_generated')]),
            'results': results
        }
        
    def get_comprehensive_analytics(self, store_id: str, time_range: str = '24h') -> Dict:
        """Gera analytics abrangentes de todas as funcionalidades"""
        
        return {
            'overview': {
                'time_range': time_range,
                'total_interactions': 342,
                'active_sessions': len(self.active_sessions),
                'languages_detected': 6,
                'ai_features_used': 8
            },
            'conversation_analytics': {
                'total_conversations': 156,
                'completed_orders': 89,
                'conversion_rate': 0.57,
                'average_conversation_length': 4.2
            },
            'sentiment_analytics': self.sentiment_analyzer.get_sentiment_analytics(store_id, time_range),
            'multilingual_analytics': self.multilingual_support.get_multilingual_analytics(store_id, time_range),
            'upselling_analytics': self.upselling_engine.get_upselling_analytics(store_id, time_range),
            'recommendation_performance': {
                'recommendations_shown': 234,
                'recommendations_accepted': 87,
                'acceptance_rate': 0.37,
                'revenue_impact': 1456.78
            },
            'voice_processing': {
                'voice_messages_received': 45,
                'transcription_success_rate': 0.91,
                'voice_orders_completed': 23
            },
            'image_generation': {
                'images_generated': 67,
                'generation_success_rate': 0.94,
                'menu_coverage': 0.78
            }
        }
        
    def create_demo_scenario(self, scenario_type: str) -> Dict:
        """Cria cenário de demonstração específico"""
        
        scenarios = {
            'multilingual_order': {
                'customer': self.demo_data['sample_customers'][1],  # John Smith (English)
                'messages': [
                    "Hello! I'd like to see your menu please",
                    "I want to order sushi, what do you recommend?",
                    "Perfect! I'll take the premium sushi combo"
                ],
                'expected_features': ['language_detection', 'translation', 'recommendations', 'upselling']
            },
            'voice_ordering': {
                'customer': self.demo_data['sample_customers'][0],  # Maria Silva
                'voice_message': "Oi, eu quero pedir uma pizza margherita grande e um refrigerante",
                'expected_features': ['voice_transcription', 'intent_classification', 'order_processing']
            },
            'sentiment_recovery': {
                'customer': self.demo_data['sample_customers'][2],  # Carlos Rodriguez
                'messages': [
                    "Mi pedido llegó frío y tardó mucho",
                    "Estoy muy molesto con el servicio"
                ],
                'expected_features': ['sentiment_analysis', 'alert_generation', 'recovery_response']
            },
            'smart_upselling': {
                'customer': self.demo_data['sample_customers'][0],
                'current_order': [{'name': 'Pizza Margherita', 'price': 32.00}],
                'expected_features': ['upsell_suggestions', 'personalization', 'bundle_offers']
            }
        }
        
        return scenarios.get(scenario_type, {'error': 'Scenario not found'})
        
    def _get_or_create_session(self, customer_id: str) -> CustomerSession:
        """Obtém ou cria sessão do cliente"""
        
        if customer_id not in self.active_sessions:
            # Buscar dados do cliente (simulado)
            customer_data = next(
                (c for c in self.demo_data['sample_customers'] if c['id'] == customer_id),
                {
                    'id': customer_id,
                    'language': 'pt',
                    'segment': 'economico',
                    'preferences': [],
                    'order_history': []
                }
            )
            
            self.active_sessions[customer_id] = CustomerSession(
                customer_id=customer_id,
                language=SupportedLanguage(customer_data['language']),
                conversation_state=ConversationState(customer_id),
                sentiment_history=[],
                preferences=customer_data.get('preferences', []),
                order_history=customer_data.get('order_history', []),
                current_order=[],
                session_start=datetime.now()
            )
            
        return self.active_sessions[customer_id]
        
    def _get_customer_segment(self, customer_id: str) -> str:
        """Obtém segmento do cliente"""
        customer_data = next(
            (c for c in self.demo_data['sample_customers'] if c['id'] == customer_id),
            {'segment': 'economico'}
        )
        return customer_data.get('segment', 'economico')
        
    def _calculate_average_sentiment(self, sentiment_history: List[Dict]) -> float:
        """Calcula sentimento médio da sessão"""
        if not sentiment_history:
            return 0.5
            
        sentiment_values = {
            'very_positive': 1.0,
            'positive': 0.75,
            'neutral': 0.5,
            'negative': 0.25,
            'very_negative': 0.0
        }
        
        total = sum(sentiment_values.get(s['sentiment'], 0.5) for s in sentiment_history)
        return total / len(sentiment_history)
        
    def get_system_status(self) -> Dict:
        """Retorna status do sistema integrado"""
        
        return {
            'timestamp': datetime.now().isoformat(),
            'system_health': 'healthy',
            'active_sessions': len(self.active_sessions),
            'components_status': {
                'conversation_manager': 'active',
                'recommendation_engine': 'active',
                'voice_processor': 'active',
                'image_generator': 'active',
                'sentiment_analyzer': 'active',
                'multilingual_support': 'active',
                'upselling_engine': 'active'
            },
            'ollama_connection': 'connected',
            'demo_mode': self.demo_mode,
            'supported_languages': len(SupportedLanguage),
            'available_features': [
                'Conversational Ordering',
                'Smart Recommendations',
                'Voice Processing',
                'Menu Image Generation',
                'Real-time Sentiment Analysis',
                'Multilingual Support',
                'Intelligent Upselling',
                'Comprehensive Analytics'
            ]
        }