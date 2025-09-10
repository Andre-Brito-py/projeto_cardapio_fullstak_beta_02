import json
import os
import tempfile
from typing import Dict, List, Optional, Any
import speech_recognition as sr
import pyttsx3
from pydub import AudioSegment
from langchain_community.chat_models import ChatOllama
import requests
from datetime import datetime

class VoiceOrderProcessor:
    """Processador de pedidos por voz usando Ollama"""
    
    def __init__(self, backend_api_url: str):
        self.backend_api_url = backend_api_url.rstrip('/')
        
        # Inicializar modelo Ollama
        self.llm = ChatOllama(
            model="llama3.1",
            temperature=0.3,  # Menor temperatura para maior precisão
            base_url="http://localhost:11434"
        )
        
        # Inicializar reconhecimento de voz
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
        # Inicializar síntese de voz
        self.tts_engine = pyttsx3.init()
        self.tts_engine.setProperty('rate', 150)  # Velocidade da fala
        self.tts_engine.setProperty('volume', 0.8)  # Volume
        
        # Configurar reconhecedor
        with self.microphone as source:
            self.recognizer.adjust_for_ambient_noise(source)
            
    def transcribe_audio(self, audio_file_path: str) -> str:
        """Transcreve áudio para texto usando speech_recognition"""
        try:
            with sr.AudioFile(audio_file_path) as source:
                audio = self.recognizer.record(source)
                
            # Tentar múltiplos engines de reconhecimento
            try:
                # Primeiro: Google (mais preciso)
                text = self.recognizer.recognize_google(audio, language='pt-BR')
                return text
            except sr.UnknownValueError:
                try:
                    # Fallback: Sphinx (offline)
                    text = self.recognizer.recognize_sphinx(audio, language='pt-BR')
                    return text
                except:
                    return ""
                    
        except Exception as e:
            print(f"Erro na transcrição: {e}")
            return ""
            
    def process_voice_message(self, audio_data: bytes, store_id: str, customer_id: str = None) -> Dict:
        """Processa mensagem de voz completa"""
        # Salvar áudio temporariamente
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name
            
        try:
            # Transcrever áudio
            transcribed_text = self.transcribe_audio(temp_file_path)
            
            if not transcribed_text:
                return {
                    'success': False,
                    'error': 'Não foi possível entender o áudio',
                    'suggestion': 'Tente falar mais claramente ou use texto'
                }
                
            # Processar texto transcrito
            result = self.process_voice_order(transcribed_text, store_id, customer_id)
            result['transcribed_text'] = transcribed_text
            
            return result
            
        finally:
            # Limpar arquivo temporário
            try:
                os.unlink(temp_file_path)
            except:
                pass
                
    def process_voice_order(self, transcribed_text: str, store_id: str, customer_id: str = None) -> Dict:
        """Processa pedido por voz usando Ollama"""
        
        # Obter cardápio da loja
        menu = self.get_store_menu(store_id)
        
        if not menu:
            return {
                'success': False,
                'error': 'Cardápio não disponível',
                'response_text': 'Desculpe, não consegui acessar o cardápio no momento.'
            }
            
        # Preparar contexto do cardápio
        menu_context = "\n".join([
            f"- {item['name']}: R$ {item['price']} ({item.get('description', '')[:50]}...)"
            for item in menu[:30]  # Limitar para não sobrecarregar
        ])
        
        prompt = f"""
        Você é um assistente especializado em processar pedidos de comida por voz.
        
        TEXTO TRANSCRITO: "{transcribed_text}"
        
        CARDÁPIO DISPONÍVEL:
        {menu_context}
        
        Analise o texto e identifique:
        1. Intenção (fazer pedido, consultar cardápio, cancelar, etc.)
        2. Itens mencionados (mesmo com pronúncia aproximada)
        3. Quantidades
        4. Modificações/observações
        5. Informações de entrega
        
        Responda em JSON:
        {{
            "intent": "order" | "menu_inquiry" | "cancel" | "modify" | "delivery_info" | "other",
            "confidence": 0.0-1.0,
            "identified_items": [
                {{
                    "menu_item_name": "nome exato do cardápio",
                    "mentioned_as": "como foi mencionado",
                    "quantity": 1,
                    "modifications": ["sem cebola", "extra queijo"],
                    "confidence": 0.0-1.0
                }}
            ],
            "delivery_info": {{
                "address": "endereço mencionado",
                "phone": "telefone mencionado",
                "urgency": "normal" | "urgent"
            }},
            "clarifications_needed": ["o que precisa ser esclarecido"],
            "response_text": "resposta natural para o cliente",
            "suggested_actions": ["ações sugeridas"]
        }}
        
        IMPORTANTE:
        - Seja tolerante com pronúncias aproximadas
        - Se não entender algo, peça esclarecimento
        - Confirme itens identificados
        - Seja natural e amigável
        
        Responda APENAS com o JSON.
        """
        
        try:
            response = self.llm.invoke(prompt)
            result = json.loads(response.content)
            
            # Processar resultado baseado na intenção
            if result['intent'] == 'order' and result['identified_items']:
                result = self.process_order_items(result, store_id, customer_id)
            elif result['intent'] == 'menu_inquiry':
                result = self.handle_menu_inquiry(result, menu)
                
            result['success'] = True
            result['processed_at'] = datetime.now().isoformat()
            
            return result
            
        except Exception as e:
            print(f"Erro ao processar pedido por voz: {e}")
            return {
                'success': False,
                'error': str(e),
                'response_text': 'Desculpe, tive dificuldade para processar seu pedido. Pode repetir?'
            }
            
    def process_order_items(self, voice_result: Dict, store_id: str, customer_id: str = None) -> Dict:
        """Processa itens identificados no pedido"""
        processed_items = []
        total_value = 0
        
        for item in voice_result['identified_items']:
            # Buscar item no cardápio
            menu_item = self.find_menu_item(item['menu_item_name'], store_id)
            
            if menu_item:
                item_total = menu_item['price'] * item['quantity']
                total_value += item_total
                
                processed_items.append({
                    'id': menu_item['id'],
                    'name': menu_item['name'],
                    'price': menu_item['price'],
                    'quantity': item['quantity'],
                    'modifications': item.get('modifications', []),
                    'subtotal': item_total
                })
                
        voice_result['processed_items'] = processed_items
        voice_result['total_value'] = total_value
        
        # Gerar resposta de confirmação
        if processed_items:
            items_text = ", ".join([f"{item['quantity']}x {item['name']}" for item in processed_items])
            voice_result['response_text'] = f"Entendi! Você quer: {items_text}. Total: R$ {total_value:.2f}. Confirma o pedido?"
        else:
            voice_result['response_text'] = "Não consegui identificar os itens do cardápio. Pode repetir os nomes dos produtos?"
            
        return voice_result
        
    def handle_menu_inquiry(self, voice_result: Dict, menu: List[Dict]) -> Dict:
        """Trata consultas sobre o cardápio"""
        # Usar IA para gerar resposta sobre o cardápio
        menu_summary = "\n".join([f"- {item['name']}: R$ {item['price']}" for item in menu[:10]])
        
        prompt = f"""
        O cliente fez uma consulta sobre o cardápio: "{voice_result.get('response_text', '')}"
        
        CARDÁPIO (amostra):
        {menu_summary}
        
        Gere uma resposta natural e útil sobre o cardápio, destacando:
        - Categorias disponíveis
        - Itens populares
        - Faixas de preço
        - Especialidades
        
        Resposta (máximo 100 palavras):
        """
        
        try:
            response = self.llm.invoke(prompt)
            voice_result['response_text'] = response.content
        except:
            voice_result['response_text'] = "Temos várias opções deliciosas! Que tipo de comida você está procurando?"
            
        return voice_result
        
    def get_store_menu(self, store_id: str) -> List[Dict]:
        """Busca cardápio da loja"""
        try:
            response = requests.get(f"{self.backend_api_url}/api/stores/{store_id}/menu")
            if response.status_code == 200:
                return response.json().get('menu', [])
        except Exception as e:
            print(f"Erro ao buscar cardápio: {e}")
        return []
        
    def find_menu_item(self, item_name: str, store_id: str) -> Optional[Dict]:
        """Encontra item no cardápio por nome (com tolerância)"""
        menu = self.get_store_menu(store_id)
        
        # Busca exata primeiro
        for item in menu:
            if item['name'].lower() == item_name.lower():
                return item
                
        # Busca por similaridade
        for item in menu:
            if item_name.lower() in item['name'].lower() or item['name'].lower() in item_name.lower():
                return item
                
        return None
        
    def generate_voice_response(self, text: str) -> bytes:
        """Gera resposta em áudio usando TTS"""
        try:
            # Salvar áudio em arquivo temporário
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                temp_file_path = temp_file.name
                
            self.tts_engine.save_to_file(text, temp_file_path)
            self.tts_engine.runAndWait()
            
            # Ler arquivo e retornar bytes
            with open(temp_file_path, 'rb') as f:
                audio_data = f.read()
                
            # Limpar arquivo temporário
            try:
                os.unlink(temp_file_path)
            except:
                pass
                
            return audio_data
            
        except Exception as e:
            print(f"Erro ao gerar áudio: {e}")
            return b''
            
    def process_continuous_conversation(self, conversation_history: List[Dict], 
                                      new_voice_input: str, 
                                      store_id: str, 
                                      customer_id: str = None) -> Dict:
        """Processa conversa contínua por voz"""
        
        # Preparar contexto da conversa
        context = "\n".join([
            f"Cliente: {msg.get('customer_message', '')}\nAssistente: {msg.get('assistant_response', '')}"
            for msg in conversation_history[-3:]  # Últimas 3 interações
        ])
        
        prompt = f"""
        Você está em uma conversa contínua por voz com um cliente.
        
        CONTEXTO DA CONVERSA:
        {context}
        
        NOVA MENSAGEM: "{new_voice_input}"
        
        Considerando o contexto, responda de forma natural e continue a conversa.
        Se o cliente está fazendo um pedido, mantenha o foco nos itens.
        Se está tirando dúvidas, seja prestativo.
        
        Responda em JSON:
        {{
            "response_text": "resposta natural",
            "action_needed": "continue" | "finalize_order" | "clarify" | "redirect",
            "context_understanding": "o que você entendeu do contexto"
        }}
        
        Seja conversacional e natural, como se fosse uma conversa real.
        
        Responda APENAS com o JSON.
        """
        
        try:
            response = self.llm.invoke(prompt)
            result = json.loads(response.content)
            result['success'] = True
            return result
        except Exception as e:
            return {
                'success': False,
                'response_text': 'Desculpe, pode repetir?',
                'action_needed': 'clarify'
            }
            
    def extract_delivery_info_from_voice(self, text: str) -> Dict:
        """Extrai informações de entrega da fala"""
        prompt = f"""
        Extraia informações de entrega desta fala: "{text}"
        
        Identifique:
        - Endereço (rua, número, bairro, referências)
        - Telefone
        - Nome do cliente
        - Instruções especiais
        - Urgência
        
        Responda em JSON:
        {{
            "address": {{
                "street": "rua",
                "number": "número",
                "neighborhood": "bairro",
                "reference": "ponto de referência",
                "full_address": "endereço completo"
            }},
            "phone": "telefone",
            "customer_name": "nome",
            "special_instructions": "instruções",
            "urgency": "normal" | "urgent",
            "confidence": 0.0-1.0
        }}
        
        Se alguma informação não foi mencionada, deixe como null.
        
        Responda APENAS com o JSON.
        """
        
        try:
            response = self.llm.invoke(prompt)
            return json.loads(response.content)
        except Exception as e:
            return {'confidence': 0.0, 'error': str(e)}