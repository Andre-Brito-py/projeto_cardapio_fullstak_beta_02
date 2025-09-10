import json
import re
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from langchain_community.chat_models import ChatOllama
import requests
from dataclasses import dataclass
from enum import Enum

class SupportedLanguage(Enum):
    PORTUGUESE = "pt"
    ENGLISH = "en"
    SPANISH = "es"
    FRENCH = "fr"
    ITALIAN = "it"
    GERMAN = "de"
    CHINESE = "zh"
    JAPANESE = "ja"
    KOREAN = "ko"
    ARABIC = "ar"

@dataclass
class LanguageDetectionResult:
    detected_language: SupportedLanguage
    confidence: float
    alternative_languages: List[Tuple[SupportedLanguage, float]]
    is_mixed_language: bool
    dominant_script: str

@dataclass
class TranslationResult:
    original_text: str
    translated_text: str
    source_language: SupportedLanguage
    target_language: SupportedLanguage
    confidence: float
    context_preserved: bool

class MultilingualSupportEngine:
    """Sistema de suporte multilíngue automático para atender clientes estrangeiros"""
    
    def __init__(self, backend_api_url: str, default_language: SupportedLanguage = SupportedLanguage.PORTUGUESE):
        self.backend_api_url = backend_api_url.rstrip('/')
        self.default_language = default_language
        
        # Inicializar modelo Ollama
        self.llm = ChatOllama(
            model="llama3.1",
            temperature=0.3,
            base_url="http://localhost:11434"
        )
        
        # Padrões de detecção de idioma
        self.language_patterns = {
            SupportedLanguage.ENGLISH: [
                r'\b(hello|hi|hey|good morning|good afternoon|good evening|thank you|thanks|please|order|food|delivery)\b',
                r'\b(I want|I would like|Can I|Could you|What is|How much|Where is)\b'
            ],
            SupportedLanguage.SPANISH: [
                r'\b(hola|buenos días|buenas tardes|buenas noches|gracias|por favor|quiero|necesito|cuánto|dónde)\b',
                r'\b(me gustaría|puedo|podrías|qué es|cuánto cuesta|comida|entrega)\b'
            ],
            SupportedLanguage.FRENCH: [
                r'\b(bonjour|bonsoir|merci|s\'il vous plaît|je veux|j\'aimerais|combien|où|nourriture|livraison)\b',
                r'\b(pouvez-vous|qu\'est-ce que|comment|pourquoi)\b'
            ],
            SupportedLanguage.ITALIAN: [
                r'\b(ciao|buongiorno|buonasera|grazie|per favore|vorrei|quanto|dove|cibo|consegna)\b',
                r'\b(puoi|potresti|che cosa|come|perché)\b'
            ],
            SupportedLanguage.GERMAN: [
                r'\b(hallo|guten morgen|guten tag|guten abend|danke|bitte|ich möchte|wieviel|wo|essen|lieferung)\b',
                r'\b(können sie|was ist|wie|warum)\b'
            ],
            SupportedLanguage.CHINESE: [
                r'[你好您早上好下午好晚上好谢谢请我想要多少钱在哪里食物外卖]',
                r'[可以吗什么怎么为什么]'
            ],
            SupportedLanguage.JAPANESE: [
                r'[こんにちはおはようございますこんばんはありがとうございますお願いします欲しい食べ物配達]',
                r'[できますか何ですかどうしてなぜ]'
            ],
            SupportedLanguage.KOREAN: [
                r'[안녕하세요좋은아침좋은저녁감사합니다부탁드립니다원합니다얼마음식배달]',
                r'[할수있나요무엇입니까어떻게왜]'
            ],
            SupportedLanguage.ARABIC: [
                r'[مرحباصباحالخيرمساءالخيرشكرامنفضلكأريدكمأينطعامتوصيل]',
                r'[يمكنكماذاكيفلماذا]'
            ]
        }
        
        # Templates de resposta por idioma
        self.response_templates = {
            SupportedLanguage.ENGLISH: {
                'greeting': "Hello! Welcome to our restaurant. How can I help you today?",
                'menu_request': "Here's our menu. What would you like to order?",
                'order_confirmation': "Thank you for your order! Your order number is {order_id}. Estimated delivery time: {delivery_time} minutes.",
                'order_status': "Your order #{order_id} is {status}. Estimated delivery: {time}.",
                'apology': "We apologize for any inconvenience. Let us resolve this for you.",
                'goodbye': "Thank you for choosing us! Have a great day!",
                'language_switch': "I've switched to English. How can I assist you?"
            },
            SupportedLanguage.SPANISH: {
                'greeting': "¡Hola! Bienvenido a nuestro restaurante. ¿Cómo puedo ayudarte hoy?",
                'menu_request': "Aquí está nuestro menú. ¿Qué te gustaría pedir?",
                'order_confirmation': "¡Gracias por tu pedido! Tu número de pedido es {order_id}. Tiempo estimado de entrega: {delivery_time} minutos.",
                'order_status': "Tu pedido #{order_id} está {status}. Entrega estimada: {time}.",
                'apology': "Nos disculpamos por cualquier inconveniente. Permítenos resolver esto para ti.",
                'goodbye': "¡Gracias por elegirnos! ¡Que tengas un gran día!",
                'language_switch': "He cambiado al español. ¿Cómo puedo asistirte?"
            },
            SupportedLanguage.FRENCH: {
                'greeting': "Bonjour! Bienvenue dans notre restaurant. Comment puis-je vous aider aujourd'hui?",
                'menu_request': "Voici notre menu. Que souhaiteriez-vous commander?",
                'order_confirmation': "Merci pour votre commande! Votre numéro de commande est {order_id}. Temps de livraison estimé: {delivery_time} minutes.",
                'order_status': "Votre commande #{order_id} est {status}. Livraison estimée: {time}.",
                'apology': "Nous nous excusons pour tout inconvénient. Laissez-nous résoudre cela pour vous.",
                'goodbye': "Merci de nous avoir choisis! Passez une excellente journée!",
                'language_switch': "J'ai basculé en français. Comment puis-je vous aider?"
            },
            SupportedLanguage.ITALIAN: {
                'greeting': "Ciao! Benvenuto nel nostro ristorante. Come posso aiutarti oggi?",
                'menu_request': "Ecco il nostro menu. Cosa vorresti ordinare?",
                'order_confirmation': "Grazie per il tuo ordine! Il tuo numero d'ordine è {order_id}. Tempo di consegna stimato: {delivery_time} minuti.",
                'order_status': "Il tuo ordine #{order_id} è {status}. Consegna stimata: {time}.",
                'apology': "Ci scusiamo per qualsiasi inconveniente. Lascia che risolviamo questo per te.",
                'goodbye': "Grazie per averci scelto! Buona giornata!",
                'language_switch': "Ho cambiato in italiano. Come posso assisterti?"
            },
            SupportedLanguage.GERMAN: {
                'greeting': "Hallo! Willkommen in unserem Restaurant. Wie kann ich Ihnen heute helfen?",
                'menu_request': "Hier ist unsere Speisekarte. Was möchten Sie bestellen?",
                'order_confirmation': "Vielen Dank für Ihre Bestellung! Ihre Bestellnummer ist {order_id}. Geschätzte Lieferzeit: {delivery_time} Minuten.",
                'order_status': "Ihre Bestellung #{order_id} ist {status}. Geschätzte Lieferung: {time}.",
                'apology': "Wir entschuldigen uns für etwaige Unannehmlichkeiten. Lassen Sie uns das für Sie lösen.",
                'goodbye': "Vielen Dank, dass Sie uns gewählt haben! Haben Sie einen schönen Tag!",
                'language_switch': "Ich habe auf Deutsch umgestellt. Wie kann ich Ihnen helfen?"
            },
            SupportedLanguage.PORTUGUESE: {
                'greeting': "Olá! Bem-vindo ao nosso restaurante. Como posso ajudá-lo hoje?",
                'menu_request': "Aqui está nosso cardápio. O que gostaria de pedir?",
                'order_confirmation': "Obrigado pelo seu pedido! Seu número de pedido é {order_id}. Tempo estimado de entrega: {delivery_time} minutos.",
                'order_status': "Seu pedido #{order_id} está {status}. Entrega estimada: {time}.",
                'apology': "Pedimos desculpas por qualquer inconveniente. Vamos resolver isso para você.",
                'goodbye': "Obrigado por nos escolher! Tenha um ótimo dia!",
                'language_switch': "Mudei para português. Como posso ajudá-lo?"
            }
        }
        
        # Contextos culturais específicos
        self.cultural_contexts = {
            SupportedLanguage.ENGLISH: {
                'currency': 'USD',
                'time_format': '12h',
                'date_format': 'MM/DD/YYYY',
                'politeness_level': 'medium',
                'common_greetings': ['Hello', 'Hi', 'Good morning', 'Good afternoon']
            },
            SupportedLanguage.SPANISH: {
                'currency': 'EUR',
                'time_format': '24h',
                'date_format': 'DD/MM/YYYY',
                'politeness_level': 'high',
                'common_greetings': ['Hola', 'Buenos días', 'Buenas tardes']
            },
            SupportedLanguage.FRENCH: {
                'currency': 'EUR',
                'time_format': '24h',
                'date_format': 'DD/MM/YYYY',
                'politeness_level': 'very_high',
                'common_greetings': ['Bonjour', 'Bonsoir', 'Salut']
            },
            SupportedLanguage.JAPANESE: {
                'currency': 'JPY',
                'time_format': '24h',
                'date_format': 'YYYY/MM/DD',
                'politeness_level': 'very_high',
                'common_greetings': ['こんにちは', 'おはようございます', 'こんばんは']
            }
        }
        
    def detect_language(self, text: str) -> LanguageDetectionResult:
        """Detecta o idioma do texto"""
        
        text_lower = text.lower()
        language_scores = {}
        
        # Análise por padrões regex
        for language, patterns in self.language_patterns.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, text_lower, re.IGNORECASE))
                score += matches
            language_scores[language] = score
            
        # Análise adicional com IA para casos complexos
        ai_detection = self._ai_language_detection(text)
        
        # Combinar resultados
        if ai_detection:
            detected_lang = ai_detection.get('language')
            if detected_lang in [lang.value for lang in SupportedLanguage]:
                ai_lang = SupportedLanguage(detected_lang)
                language_scores[ai_lang] = language_scores.get(ai_lang, 0) + 5
                
        # Determinar idioma principal
        if not language_scores or max(language_scores.values()) == 0:
            # Se não detectou nada, usar português como padrão
            detected_language = self.default_language
            confidence = 0.3
        else:
            detected_language = max(language_scores, key=language_scores.get)
            max_score = language_scores[detected_language]
            total_score = sum(language_scores.values())
            confidence = max_score / max(total_score, 1)
            
        # Criar lista de alternativas
        alternatives = [(lang, score/max(sum(language_scores.values()), 1)) 
                      for lang, score in sorted(language_scores.items(), 
                                              key=lambda x: x[1], reverse=True)[1:4]]
        
        # Detectar se é texto misto
        is_mixed = len([score for score in language_scores.values() if score > 0]) > 1
        
        return LanguageDetectionResult(
            detected_language=detected_language,
            confidence=confidence,
            alternative_languages=alternatives,
            is_mixed_language=is_mixed,
            dominant_script=self._detect_script(text)
        )
        
    def _ai_language_detection(self, text: str) -> Optional[Dict]:
        """Detecção de idioma usando IA"""
        
        prompt = f"""
        Detecte o idioma principal deste texto:
        
        "{text}"
        
        Idiomas suportados: português (pt), inglês (en), espanhol (es), francês (fr), 
        italiano (it), alemão (de), chinês (zh), japonês (ja), coreano (ko), árabe (ar)
        
        Responda em JSON:
        {{
            "language": "código do idioma (pt, en, es, etc.)",
            "confidence": 0.0-1.0,
            "reasoning": "breve explicação da detecção",
            "mixed_languages": ["lista de outros idiomas detectados"]
        }}
        
        Responda APENAS com o JSON.
        """
        
        try:
            response = self.llm.invoke(prompt)
            return json.loads(response.content)
        except Exception as e:
            print(f"Erro na detecção de idioma por IA: {e}")
            return None
            
    def _detect_script(self, text: str) -> str:
        """Detecta o sistema de escrita dominante"""
        
        # Contar caracteres por script
        latin_count = len(re.findall(r'[a-zA-ZÀ-ÿ]', text))
        chinese_count = len(re.findall(r'[\u4e00-\u9fff]', text))
        japanese_count = len(re.findall(r'[\u3040-\u309f\u30a0-\u30ff]', text))
        korean_count = len(re.findall(r'[\uac00-\ud7af]', text))
        arabic_count = len(re.findall(r'[\u0600-\u06ff]', text))
        
        script_counts = {
            'latin': latin_count,
            'chinese': chinese_count,
            'japanese': japanese_count,
            'korean': korean_count,
            'arabic': arabic_count
        }
        
        return max(script_counts, key=script_counts.get) if max(script_counts.values()) > 0 else 'latin'
        
    def translate_text(self, text: str, target_language: SupportedLanguage, source_language: Optional[SupportedLanguage] = None) -> TranslationResult:
        """Traduz texto para o idioma alvo"""
        
        # Detectar idioma de origem se não fornecido
        if not source_language:
            detection = self.detect_language(text)
            source_language = detection.detected_language
            
        # Se já está no idioma alvo, retornar original
        if source_language == target_language:
            return TranslationResult(
                original_text=text,
                translated_text=text,
                source_language=source_language,
                target_language=target_language,
                confidence=1.0,
                context_preserved=True
            )
            
        # Traduzir usando IA
        translation = self._ai_translation(text, source_language, target_language)
        
        return TranslationResult(
            original_text=text,
            translated_text=translation.get('translated_text', text),
            source_language=source_language,
            target_language=target_language,
            confidence=translation.get('confidence', 0.7),
            context_preserved=translation.get('context_preserved', True)
        )
        
    def _ai_translation(self, text: str, source_lang: SupportedLanguage, target_lang: SupportedLanguage) -> Dict:
        """Tradução usando IA com preservação de contexto"""
        
        # Mapear códigos para nomes completos
        lang_names = {
            SupportedLanguage.PORTUGUESE: "português brasileiro",
            SupportedLanguage.ENGLISH: "inglês",
            SupportedLanguage.SPANISH: "espanhol",
            SupportedLanguage.FRENCH: "francês",
            SupportedLanguage.ITALIAN: "italiano",
            SupportedLanguage.GERMAN: "alemão",
            SupportedLanguage.CHINESE: "chinês mandarim",
            SupportedLanguage.JAPANESE: "japonês",
            SupportedLanguage.KOREAN: "coreano",
            SupportedLanguage.ARABIC: "árabe"
        }
        
        source_name = lang_names.get(source_lang, source_lang.value)
        target_name = lang_names.get(target_lang, target_lang.value)
        
        prompt = f"""
        Traduza este texto de {source_name} para {target_name}, preservando:
        - Contexto de delivery/restaurante
        - Tom e formalidade
        - Termos específicos de comida
        - Expressões culturais apropriadas
        
        TEXTO ORIGINAL: "{text}"
        
        Considerações especiais:
        - Se for pedido de comida, manter nomes de pratos quando apropriado
        - Adaptar saudações e cortesias para a cultura alvo
        - Preservar números, horários e informações técnicas
        - Usar linguagem natural e fluente
        
        Responda em JSON:
        {{
            "translated_text": "texto traduzido",
            "confidence": 0.0-1.0,
            "context_preserved": true/false,
            "cultural_adaptations": ["lista de adaptações culturais feitas"],
            "preserved_terms": ["termos mantidos no idioma original"]
        }}
        
        Responda APENAS com o JSON.
        """
        
        try:
            response = self.llm.invoke(prompt)
            return json.loads(response.content)
        except Exception as e:
            print(f"Erro na tradução por IA: {e}")
            return {
                'translated_text': text,
                'confidence': 0.3,
                'context_preserved': False,
                'cultural_adaptations': [],
                'preserved_terms': []
            }
            
    def process_multilingual_message(self, message: str, customer_language: Optional[SupportedLanguage] = None) -> Dict:
        """Processa mensagem multilíngue completa"""
        
        # Detectar idioma se não fornecido
        if not customer_language:
            detection = self.detect_language(message)
            customer_language = detection.detected_language
            language_confidence = detection.confidence
        else:
            language_confidence = 1.0
            
        # Traduzir para português para processamento interno
        if customer_language != SupportedLanguage.PORTUGUESE:
            translation_to_pt = self.translate_text(message, SupportedLanguage.PORTUGUESE, customer_language)
            internal_message = translation_to_pt.translated_text
        else:
            internal_message = message
            translation_to_pt = None
            
        # Processar mensagem (aqui integraria com outros sistemas)
        processing_result = self._process_internal_message(internal_message)
        
        # Traduzir resposta de volta para o idioma do cliente
        if customer_language != SupportedLanguage.PORTUGUESE:
            response_translation = self.translate_text(
                processing_result['response'], 
                customer_language, 
                SupportedLanguage.PORTUGUESE
            )
            final_response = response_translation.translated_text
        else:
            final_response = processing_result['response']
            response_translation = None
            
        return {
            'original_message': message,
            'detected_language': customer_language.value,
            'language_confidence': language_confidence,
            'internal_message': internal_message,
            'translation_to_portuguese': translation_to_pt.__dict__ if translation_to_pt else None,
            'processing_result': processing_result,
            'final_response': final_response,
            'response_translation': response_translation.__dict__ if response_translation else None,
            'cultural_context': self.cultural_contexts.get(customer_language, {})
        }
        
    def _process_internal_message(self, message: str) -> Dict:
        """Processa mensagem internamente (simulação)"""
        
        # Aqui integraria com o sistema de classificação de intenções
        # Por enquanto, simulamos uma resposta
        
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['cardápio', 'menu', 'comida', 'pratos']):
            intent = 'menu_request'
            response = "Aqui está nosso cardápio. O que gostaria de pedir?"
        elif any(word in message_lower for word in ['pedido', 'pedir', 'quero']):
            intent = 'order_intent'
            response = "Perfeito! Vou anotar seu pedido. O que gostaria?"
        elif any(word in message_lower for word in ['status', 'onde está', 'demora']):
            intent = 'order_status'
            response = "Vou verificar o status do seu pedido para você."
        elif any(word in message_lower for word in ['olá', 'oi', 'bom dia']):
            intent = 'greeting'
            response = "Olá! Bem-vindo ao nosso restaurante. Como posso ajudá-lo?"
        else:
            intent = 'general'
            response = "Obrigado pela sua mensagem. Como posso ajudá-lo?"
            
        return {
            'intent': intent,
            'response': response,
            'confidence': 0.8
        }
        
    def get_localized_template(self, template_key: str, language: SupportedLanguage, **kwargs) -> str:
        """Obtém template localizado"""
        
        templates = self.response_templates.get(language, self.response_templates[SupportedLanguage.PORTUGUESE])
        template = templates.get(template_key, templates.get('greeting', 'Hello!'))
        
        try:
            return template.format(**kwargs)
        except KeyError:
            return template
            
    def adapt_menu_for_language(self, menu_data: Dict, target_language: SupportedLanguage) -> Dict:
        """Adapta cardápio para idioma específico"""
        
        if target_language == SupportedLanguage.PORTUGUESE:
            return menu_data
            
        adapted_menu = menu_data.copy()
        
        # Traduzir categorias
        if 'categories' in adapted_menu:
            for category in adapted_menu['categories']:
                if 'name' in category:
                    translation = self.translate_text(category['name'], target_language)
                    category['translated_name'] = translation.translated_text
                    
                if 'description' in category:
                    translation = self.translate_text(category['description'], target_language)
                    category['translated_description'] = translation.translated_text
                    
        # Traduzir itens
        if 'items' in adapted_menu:
            for item in adapted_menu['items']:
                if 'name' in item:
                    translation = self.translate_text(item['name'], target_language)
                    item['translated_name'] = translation.translated_text
                    
                if 'description' in item:
                    translation = self.translate_text(item['description'], target_language)
                    item['translated_description'] = translation.translated_text
                    
                # Adaptar preços para moeda local
                if 'price' in item:
                    cultural_context = self.cultural_contexts.get(target_language, {})
                    currency = cultural_context.get('currency', 'BRL')
                    item['localized_currency'] = currency
                    
        return adapted_menu
        
    def generate_language_switch_response(self, target_language: SupportedLanguage) -> str:
        """Gera resposta para mudança de idioma"""
        return self.get_localized_template('language_switch', target_language)
        
    def get_supported_languages_list(self) -> List[Dict]:
        """Retorna lista de idiomas suportados"""
        
        return [
            {
                'code': lang.value,
                'name': {
                    'en': name_en,
                    'pt': name_pt
                },
                'native_name': native_name,
                'flag': flag
            }
            for lang, (name_en, name_pt, native_name, flag) in {
                SupportedLanguage.PORTUGUESE: ('Portuguese', 'Português', 'Português', '🇧🇷'),
                SupportedLanguage.ENGLISH: ('English', 'Inglês', 'English', '🇺🇸'),
                SupportedLanguage.SPANISH: ('Spanish', 'Espanhol', 'Español', '🇪🇸'),
                SupportedLanguage.FRENCH: ('French', 'Francês', 'Français', '🇫🇷'),
                SupportedLanguage.ITALIAN: ('Italian', 'Italiano', 'Italiano', '🇮🇹'),
                SupportedLanguage.GERMAN: ('German', 'Alemão', 'Deutsch', '🇩🇪'),
                SupportedLanguage.CHINESE: ('Chinese', 'Chinês', '中文', '🇨🇳'),
                SupportedLanguage.JAPANESE: ('Japanese', 'Japonês', '日本語', '🇯🇵'),
                SupportedLanguage.KOREAN: ('Korean', 'Coreano', '한국어', '🇰🇷'),
                SupportedLanguage.ARABIC: ('Arabic', 'Árabe', 'العربية', '🇸🇦')
            }.items()
        ]
        
    def get_multilingual_analytics(self, store_id: str, time_range: str = '24h') -> Dict:
        """Gera analytics multilíngue"""
        
        # Em produção, buscaria dados reais
        return {
            'time_range': time_range,
            'total_multilingual_interactions': 89,
            'language_distribution': {
                'pt': 156,  # 62%
                'en': 45,   # 18%
                'es': 28,   # 11%
                'fr': 12,   # 5%
                'it': 8,    # 3%
                'de': 3     # 1%
            },
            'translation_accuracy': 0.94,
            'customer_satisfaction_by_language': {
                'pt': 8.7,
                'en': 8.9,
                'es': 8.5,
                'fr': 8.8,
                'it': 8.6,
                'de': 8.4
            },
            'most_requested_translations': [
                'Menu items',
                'Order status',
                'Delivery information',
                'Payment methods'
            ],
            'cultural_adaptations_made': 67,
            'language_switch_requests': 23
        }