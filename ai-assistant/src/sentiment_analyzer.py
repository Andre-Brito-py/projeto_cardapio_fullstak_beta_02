import json
import re
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from langchain_community.chat_models import ChatOllama
import requests
from dataclasses import dataclass
from enum import Enum

class SentimentLevel(Enum):
    VERY_POSITIVE = "very_positive"
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    VERY_NEGATIVE = "very_negative"

class UrgencyLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class SentimentAnalysis:
    sentiment: SentimentLevel
    confidence: float
    urgency: UrgencyLevel
    emotions: List[str]
    key_issues: List[str]
    suggested_actions: List[str]
    escalation_needed: bool
    response_tone: str
    priority_score: int

class RealTimeSentimentAnalyzer:
    """Analisador de sentimento em tempo real para detectar clientes insatisfeitos"""
    
    def __init__(self, backend_api_url: str):
        self.backend_api_url = backend_api_url.rstrip('/')
        
        # Inicializar modelo Ollama
        self.llm = ChatOllama(
            model="llama3.1",
            temperature=0.2,  # Baixa temperatura para análise mais precisa
            base_url="http://localhost:11434"
        )
        
        # Palavras-chave para detecção rápida
        self.negative_keywords = {
            'muito_negativo': [
                'horrível', 'péssimo', 'nojento', 'inaceitável', 'revoltante',
                'nunca mais', 'cancelar', 'reembolso', 'processo', 'advogado',
                'procon', 'reclamação formal', 'indignado', 'furioso'
            ],
            'negativo': [
                'ruim', 'demorado', 'frio', 'atrasado', 'errado', 'problema',
                'reclamar', 'insatisfeito', 'decepcionado', 'chateado',
                'irritado', 'não gostei', 'qualidade baixa'
            ],
            'neutro_negativo': [
                'ok', 'mais ou menos', 'poderia ser melhor', 'esperava mais',
                'não é o que esperava', 'comum', 'normal'
            ]
        }
        
        self.positive_keywords = {
            'muito_positivo': [
                'excelente', 'perfeito', 'maravilhoso', 'incrível', 'fantástico',
                'adorei', 'amei', 'surpreendente', 'excepcional', 'nota 10'
            ],
            'positivo': [
                'bom', 'gostoso', 'saboroso', 'rápido', 'quente', 'fresco',
                'recomendo', 'satisfeito', 'feliz', 'obrigado'
            ]
        }
        
        # Indicadores de urgência
        self.urgency_indicators = {
            'critical': [
                'emergência', 'urgente', 'imediatamente', 'agora',
                'não posso esperar', 'preciso resolver já'
            ],
            'high': [
                'rápido', 'logo', 'quanto antes', 'prioridade',
                'importante', 'sério problema'
            ],
            'medium': [
                'quando possível', 'assim que puder', 'no seu tempo'
            ]
        }
        
    def analyze_message_sentiment(self, message: str, customer_id: str = None, context: Dict = None) -> SentimentAnalysis:
        """Analisa sentimento de uma mensagem específica"""
        
        # Análise rápida com keywords
        quick_sentiment = self._quick_sentiment_check(message)
        
        # Análise detalhada com IA
        detailed_analysis = self._detailed_sentiment_analysis(message, context)
        
        # Combinar resultados
        final_analysis = self._combine_analyses(quick_sentiment, detailed_analysis, message)
        
        # Adicionar contexto do cliente se disponível
        if customer_id:
            customer_context = self._get_customer_context(customer_id)
            final_analysis = self._adjust_for_customer_context(final_analysis, customer_context)
            
        return final_analysis
        
    def _quick_sentiment_check(self, message: str) -> Dict:
        """Análise rápida baseada em palavras-chave"""
        message_lower = message.lower()
        
        # Contar ocorrências de palavras negativas
        very_negative_count = sum(1 for word in self.negative_keywords['muito_negativo'] if word in message_lower)
        negative_count = sum(1 for word in self.negative_keywords['negativo'] if word in message_lower)
        neutral_negative_count = sum(1 for word in self.negative_keywords['neutro_negativo'] if word in message_lower)
        
        # Contar ocorrências de palavras positivas
        very_positive_count = sum(1 for word in self.positive_keywords['muito_positivo'] if word in message_lower)
        positive_count = sum(1 for word in self.positive_keywords['positivo'] if word in message_lower)
        
        # Calcular score
        negative_score = very_negative_count * 3 + negative_count * 2 + neutral_negative_count * 1
        positive_score = very_positive_count * 3 + positive_count * 2
        
        # Determinar sentimento
        if very_negative_count > 0 or negative_score > 3:
            sentiment = SentimentLevel.VERY_NEGATIVE if very_negative_count > 0 else SentimentLevel.NEGATIVE
        elif positive_score > negative_score and positive_score > 2:
            sentiment = SentimentLevel.VERY_POSITIVE if very_positive_count > 0 else SentimentLevel.POSITIVE
        elif negative_score > positive_score:
            sentiment = SentimentLevel.NEGATIVE
        else:
            sentiment = SentimentLevel.NEUTRAL
            
        # Detectar urgência
        urgency = UrgencyLevel.LOW
        for level, indicators in self.urgency_indicators.items():
            if any(indicator in message_lower for indicator in indicators):
                urgency = UrgencyLevel(level)
                break
                
        return {
            'sentiment': sentiment,
            'confidence': min(0.8, (abs(negative_score - positive_score) + 1) / 10),
            'urgency': urgency,
            'negative_score': negative_score,
            'positive_score': positive_score
        }
        
    def _detailed_sentiment_analysis(self, message: str, context: Dict = None) -> Dict:
        """Análise detalhada usando IA"""
        
        context_info = ""
        if context:
            context_info = f"""
            CONTEXTO ADICIONAL:
            - Horário: {context.get('timestamp', 'N/A')}
            - Tipo de pedido: {context.get('order_type', 'N/A')}
            - Valor do pedido: {context.get('order_value', 'N/A')}
            - Histórico do cliente: {context.get('customer_history', 'N/A')}
            """
            
        prompt = f"""
        Analise o sentimento desta mensagem de cliente de delivery de comida:
        
        MENSAGEM: "{message}"
        {context_info}
        
        Faça uma análise completa considerando:
        1. Sentimento geral (muito positivo, positivo, neutro, negativo, muito negativo)
        2. Emoções específicas identificadas
        3. Problemas ou questões mencionadas
        4. Nível de urgência para resposta
        5. Tom de resposta apropriado
        6. Ações sugeridas
        7. Se precisa escalação para supervisor
        
        Responda em JSON:
        {{
            "sentiment": "very_positive" | "positive" | "neutral" | "negative" | "very_negative",
            "confidence": 0.0-1.0,
            "emotions": ["lista de emoções identificadas"],
            "key_issues": ["problemas ou questões mencionadas"],
            "urgency_level": "low" | "medium" | "high" | "critical",
            "escalation_needed": true/false,
            "response_tone": "empathetic" | "professional" | "friendly" | "apologetic" | "celebratory",
            "suggested_actions": ["ações específicas recomendadas"],
            "priority_score": 1-10,
            "customer_mood": "descrição do humor do cliente",
            "satisfaction_indicators": ["indicadores de satisfação/insatisfação"]
        }}
        
        Seja preciso na análise e considere nuances culturais brasileiras.
        
        Responda APENAS com o JSON.
        """
        
        try:
            response = self.llm.invoke(prompt)
            return json.loads(response.content)
        except Exception as e:
            print(f"Erro na análise detalhada: {e}")
            return {
                'sentiment': 'neutral',
                'confidence': 0.5,
                'emotions': [],
                'key_issues': [],
                'urgency_level': 'medium',
                'escalation_needed': False,
                'response_tone': 'professional',
                'suggested_actions': ['Responder educadamente'],
                'priority_score': 5
            }
            
    def _combine_analyses(self, quick_analysis: Dict, detailed_analysis: Dict, message: str) -> SentimentAnalysis:
        """Combina análises rápida e detalhada"""
        
        # Usar análise detalhada como base, ajustar com análise rápida
        sentiment_mapping = {
            'very_positive': SentimentLevel.VERY_POSITIVE,
            'positive': SentimentLevel.POSITIVE,
            'neutral': SentimentLevel.NEUTRAL,
            'negative': SentimentLevel.NEGATIVE,
            'very_negative': SentimentLevel.VERY_NEGATIVE
        }
        
        urgency_mapping = {
            'low': UrgencyLevel.LOW,
            'medium': UrgencyLevel.MEDIUM,
            'high': UrgencyLevel.HIGH,
            'critical': UrgencyLevel.CRITICAL
        }
        
        # Determinar sentimento final
        detailed_sentiment = sentiment_mapping.get(detailed_analysis.get('sentiment'), SentimentLevel.NEUTRAL)
        quick_sentiment = quick_analysis.get('sentiment', SentimentLevel.NEUTRAL)
        
        # Se análise rápida detectou muito negativo, priorizar
        if quick_sentiment == SentimentLevel.VERY_NEGATIVE:
            final_sentiment = SentimentLevel.VERY_NEGATIVE
        else:
            final_sentiment = detailed_sentiment
            
        # Determinar urgência final
        detailed_urgency = urgency_mapping.get(detailed_analysis.get('urgency_level'), UrgencyLevel.MEDIUM)
        quick_urgency = quick_analysis.get('urgency', UrgencyLevel.LOW)
        
        final_urgency = max(detailed_urgency, quick_urgency, key=lambda x: list(UrgencyLevel).index(x))
        
        # Calcular confiança combinada
        combined_confidence = (detailed_analysis.get('confidence', 0.5) + quick_analysis.get('confidence', 0.5)) / 2
        
        return SentimentAnalysis(
            sentiment=final_sentiment,
            confidence=combined_confidence,
            urgency=final_urgency,
            emotions=detailed_analysis.get('emotions', []),
            key_issues=detailed_analysis.get('key_issues', []),
            suggested_actions=detailed_analysis.get('suggested_actions', []),
            escalation_needed=detailed_analysis.get('escalation_needed', False),
            response_tone=detailed_analysis.get('response_tone', 'professional'),
            priority_score=detailed_analysis.get('priority_score', 5)
        )
        
    def _get_customer_context(self, customer_id: str) -> Dict:
        """Busca contexto histórico do cliente"""
        try:
            response = requests.get(f"{self.backend_api_url}/api/customers/{customer_id}/context")
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"Erro ao buscar contexto do cliente: {e}")
        return {}
        
    def _adjust_for_customer_context(self, analysis: SentimentAnalysis, customer_context: Dict) -> SentimentAnalysis:
        """Ajusta análise baseada no contexto do cliente"""
        
        # Se cliente tem histórico de reclamações, aumentar prioridade
        complaint_history = customer_context.get('complaint_count', 0)
        if complaint_history > 2:
            analysis.priority_score = min(10, analysis.priority_score + 2)
            analysis.escalation_needed = True
            
        # Se cliente é VIP, aumentar prioridade
        if customer_context.get('vip_status', False):
            analysis.priority_score = min(10, analysis.priority_score + 1)
            
        # Se cliente tem pedidos recentes com problemas
        recent_issues = customer_context.get('recent_issues', 0)
        if recent_issues > 0:
            analysis.urgency = UrgencyLevel.HIGH if analysis.urgency == UrgencyLevel.MEDIUM else analysis.urgency
            
        return analysis
        
    def monitor_conversation_sentiment(self, conversation_history: List[Dict], customer_id: str) -> Dict:
        """Monitora sentimento ao longo de uma conversa"""
        
        sentiment_timeline = []
        overall_trend = "stable"
        escalation_points = []
        
        for i, message in enumerate(conversation_history):
            if message.get('sender') == 'customer':
                analysis = self.analyze_message_sentiment(
                    message.get('content', ''), 
                    customer_id,
                    {'timestamp': message.get('timestamp')}
                )
                
                sentiment_timeline.append({
                    'message_index': i,
                    'sentiment': analysis.sentiment.value,
                    'confidence': analysis.confidence,
                    'priority_score': analysis.priority_score,
                    'timestamp': message.get('timestamp')
                })
                
                # Detectar pontos de escalação
                if analysis.escalation_needed or analysis.priority_score >= 8:
                    escalation_points.append({
                        'message_index': i,
                        'reason': 'High priority or escalation needed',
                        'sentiment': analysis.sentiment.value,
                        'issues': analysis.key_issues
                    })
                    
        # Analisar tendência geral
        if len(sentiment_timeline) >= 2:
            recent_scores = [s['priority_score'] for s in sentiment_timeline[-3:]]
            if len(recent_scores) >= 2:
                if recent_scores[-1] > recent_scores[0] + 2:
                    overall_trend = "deteriorating"
                elif recent_scores[-1] < recent_scores[0] - 2:
                    overall_trend = "improving"
                    
        return {
            'sentiment_timeline': sentiment_timeline,
            'overall_trend': overall_trend,
            'escalation_points': escalation_points,
            'current_sentiment': sentiment_timeline[-1] if sentiment_timeline else None,
            'requires_immediate_attention': len(escalation_points) > 0,
            'conversation_health_score': self._calculate_conversation_health(sentiment_timeline)
        }
        
    def _calculate_conversation_health(self, timeline: List[Dict]) -> int:
        """Calcula score de saúde da conversa (1-10)"""
        if not timeline:
            return 5
            
        # Média dos scores de prioridade (invertida)
        avg_priority = sum(t['priority_score'] for t in timeline) / len(timeline)
        health_score = max(1, 11 - avg_priority)
        
        # Ajustar baseado na tendência
        if len(timeline) >= 2:
            if timeline[-1]['priority_score'] > timeline[0]['priority_score'] + 3:
                health_score -= 2  # Deteriorando rapidamente
            elif timeline[-1]['priority_score'] < timeline[0]['priority_score'] - 2:
                health_score += 1  # Melhorando
                
        return max(1, min(10, int(health_score)))
        
    def generate_response_suggestions(self, analysis: SentimentAnalysis, message: str) -> Dict:
        """Gera sugestões de resposta baseadas no sentimento"""
        
        prompt = f"""
        Baseado na análise de sentimento, gere sugestões de resposta para esta mensagem:
        
        MENSAGEM ORIGINAL: "{message}"
        
        ANÁLISE:
        - Sentimento: {analysis.sentiment.value}
        - Emoções: {', '.join(analysis.emotions)}
        - Problemas: {', '.join(analysis.key_issues)}
        - Tom recomendado: {analysis.response_tone}
        - Urgência: {analysis.urgency.value}
        
        Gere 3 opções de resposta em JSON:
        {{
            "responses": [
                {{
                    "option": 1,
                    "text": "resposta empática e solucionadora",
                    "tone": "tom da resposta",
                    "actions": ["ações específicas mencionadas"]
                }},
                {{
                    "option": 2,
                    "text": "resposta mais formal e profissional",
                    "tone": "tom da resposta",
                    "actions": ["ações específicas mencionadas"]
                }},
                {{
                    "option": 3,
                    "text": "resposta personalizada e calorosa",
                    "tone": "tom da resposta",
                    "actions": ["ações específicas mencionadas"]
                }}
            ],
            "recommended_option": 1,
            "additional_notes": "observações importantes para o atendente"
        }}
        
        Considere:
        - Seja empático com sentimentos negativos
        - Ofereça soluções concretas
        - Use linguagem brasileira natural
        - Mantenha tom profissional mas humano
        
        Responda APENAS com o JSON.
        """
        
        try:
            response = self.llm.invoke(prompt)
            return json.loads(response.content)
        except Exception as e:
            print(f"Erro ao gerar sugestões: {e}")
            return {
                'responses': [{
                    'option': 1,
                    'text': 'Obrigado pela sua mensagem. Vamos resolver isso para você!',
                    'tone': 'professional',
                    'actions': ['Responder educadamente']
                }],
                'recommended_option': 1,
                'additional_notes': 'Resposta padrão devido a erro no sistema'
            }
            
    def create_alert_for_negative_sentiment(self, analysis: SentimentAnalysis, customer_id: str, message: str) -> Dict:
        """Cria alerta para sentimentos negativos"""
        
        if analysis.sentiment in [SentimentLevel.NEGATIVE, SentimentLevel.VERY_NEGATIVE] or analysis.priority_score >= 7:
            alert = {
                'alert_id': f"alert_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{customer_id}",
                'timestamp': datetime.now().isoformat(),
                'customer_id': customer_id,
                'severity': 'high' if analysis.sentiment == SentimentLevel.VERY_NEGATIVE else 'medium',
                'sentiment_details': {
                    'sentiment': analysis.sentiment.value,
                    'confidence': analysis.confidence,
                    'priority_score': analysis.priority_score,
                    'emotions': analysis.emotions,
                    'key_issues': analysis.key_issues
                },
                'message_preview': message[:100] + '...' if len(message) > 100 else message,
                'suggested_actions': analysis.suggested_actions,
                'escalation_needed': analysis.escalation_needed,
                'response_deadline': (datetime.now() + timedelta(minutes=self._get_response_time_limit(analysis.urgency))).isoformat()
            }
            
            # Enviar alerta para sistema de monitoramento
            self._send_alert_to_monitoring(alert)
            
            return alert
            
        return None
        
    def _get_response_time_limit(self, urgency: UrgencyLevel) -> int:
        """Retorna limite de tempo para resposta em minutos"""
        limits = {
            UrgencyLevel.CRITICAL: 5,
            UrgencyLevel.HIGH: 15,
            UrgencyLevel.MEDIUM: 30,
            UrgencyLevel.LOW: 60
        }
        return limits.get(urgency, 30)
        
    def _send_alert_to_monitoring(self, alert: Dict) -> bool:
        """Envia alerta para sistema de monitoramento"""
        try:
            response = requests.post(
                f"{self.backend_api_url}/api/alerts/sentiment",
                json=alert
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Erro ao enviar alerta: {e}")
            return False
            
    def get_sentiment_analytics(self, store_id: str, time_range: str = '24h') -> Dict:
        """Gera analytics de sentimento para a loja"""
        
        # Em produção, buscaria dados reais do banco
        # Aqui simulamos dados para demonstração
        
        return {
            'time_range': time_range,
            'total_interactions': 247,
            'sentiment_distribution': {
                'very_positive': 89,  # 36%
                'positive': 98,       # 40%
                'neutral': 35,        # 14%
                'negative': 18,       # 7%
                'very_negative': 7    # 3%
            },
            'satisfaction_score': 8.2,
            'alerts_generated': 12,
            'escalations': 3,
            'response_time_avg': '4.2 min',
            'trending_issues': [
                'Demora na entrega',
                'Comida fria',
                'Erro no pedido'
            ],
            'improvement_suggestions': [
                'Melhorar tempo de entrega',
                'Verificar qualidade do empacotamento',
                'Implementar dupla checagem de pedidos'
            ]
        }