import json
import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import requests
from langchain_community.chat_models import ChatOllama

class ConversationState:
    """Gerencia o estado de uma conversa de pedido"""
    
    def __init__(self, user_id: str, store_id: str):
        self.user_id = user_id
        self.store_id = store_id
        self.current_step = "greeting"  # greeting, menu_browsing, ordering, confirming, payment
        self.cart = []
        self.customer_info = {}
        self.delivery_info = {}
        self.payment_method = None
        self.conversation_history = []
        self.context = {}
        self.created_at = datetime.now()
        
    def add_to_cart(self, item: Dict):
        """Adiciona item ao carrinho"""
        self.cart.append(item)
        
    def remove_from_cart(self, item_index: int):
        """Remove item do carrinho"""
        if 0 <= item_index < len(self.cart):
            return self.cart.pop(item_index)
        return None
        
    def get_cart_total(self) -> float:
        """Calcula total do carrinho"""
        return sum(item.get('price', 0) * item.get('quantity', 1) for item in self.cart)
        
    def to_dict(self) -> Dict:
        """Converte estado para dicionário"""
        return {
            'user_id': self.user_id,
            'store_id': self.store_id,
            'current_step': self.current_step,
            'cart': self.cart,
            'customer_info': self.customer_info,
            'delivery_info': self.delivery_info,
            'payment_method': self.payment_method,
            'conversation_history': self.conversation_history,
            'context': self.context,
            'created_at': self.created_at.isoformat()
        }

class ConversationalOrderManager:
    """Gerenciador de pedidos conversacionais usando Ollama"""
    
    def __init__(self, backend_api_url: str):
        self.backend_api_url = backend_api_url.rstrip('/')
        self.active_conversations = {}  # user_id -> ConversationState
        
        # Inicializar modelo Ollama
        self.llm = ChatOllama(
            model="llama3.2:1b",
            temperature=0.7,
            base_url="http://localhost:11434"
        )
        
        # Carregar templates de resposta
        self.load_response_templates()
        
    def load_response_templates(self):
        """Carrega templates de resposta personalizados"""
        try:
            templates_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), 
                'delivery_training', 
                'response_templates.json'
            )
            with open(templates_path, 'r', encoding='utf-8') as f:
                self.templates = json.load(f)
        except FileNotFoundError:
            self.templates = {"templates": {}, "quick_replies": {}}
            
    def get_or_create_conversation(self, user_id: str, store_id: str) -> ConversationState:
        """Obtém ou cria uma nova conversa"""
        if user_id not in self.active_conversations:
            self.active_conversations[user_id] = ConversationState(user_id, store_id)
        return self.active_conversations[user_id]
        
    def get_store_menu(self, store_id: str) -> List[Dict]:
        """Busca cardápio da loja"""
        try:
            response = requests.get(f"{self.backend_api_url}/api/store/public/id/{store_id}/menu")
            if response.status_code == 200:
                return response.json().get('menu', [])
        except Exception as e:
            print(f"Erro ao buscar cardápio: {e}")
        return []
        
    def extract_order_intent(self, message: str, menu: List[Dict]) -> Dict:
        """Extrai intenção de pedido usando Ollama"""
        menu_text = "\n".join([f"- {item['name']}: R$ {item['price']} ({item.get('description', '')})" for item in menu])
        
        prompt = f"""
        Você é um assistente especializado em extrair informações de pedidos de comida.
        
        CARDÁPIO DISPONÍVEL:
        {menu_text}
        
        MENSAGEM DO CLIENTE: "{message}"
        
        Analise a mensagem e extraia as seguintes informações em formato JSON:
        {{
            "items_mentioned": [lista de itens do cardápio mencionados],
            "quantities": [quantidades mencionadas],
            "preferences": [preferências ou observações],
            "intent_type": "add_item" | "remove_item" | "modify_item" | "view_menu" | "other",
            "confidence": 0.0-1.0
        }}
        
        Responda APENAS com o JSON, sem explicações.
        """
        
        try:
            response = self.llm.invoke(prompt)
            return json.loads(response.content)
        except Exception as e:
            print(f"Erro ao extrair intenção: {e}")
            return {"intent_type": "other", "confidence": 0.0}
            
    def generate_contextual_response(self, conversation: ConversationState, user_message: str) -> str:
        """Gera resposta contextual usando Ollama"""
        
        # Contexto da conversa
        cart_summary = "\n".join([f"- {item['name']} (Qtd: {item['quantity']}) - R$ {item['price']}" 
                                 for item in conversation.cart]) if conversation.cart else "Carrinho vazio"
        
        conversation_context = "\n".join([f"{msg['role']}: {msg['content']}" 
                                        for msg in conversation.conversation_history[-5:]])
        
        prompt = f"""
        Você é Liza, uma assistente virtual especializada em delivery de comida. Seja natural, amigável e eficiente.
        
        CONTEXTO DA CONVERSA:
        - Etapa atual: {conversation.current_step}
        - Carrinho atual: {cart_summary}
        - Total atual: R$ {conversation.get_cart_total():.2f}
        
        HISTÓRICO RECENTE:
        {conversation_context}
        
        MENSAGEM ATUAL DO CLIENTE: "{user_message}"
        
        Responda de forma natural e útil, considerando o contexto. Se o cliente mencionar itens do cardápio, 
        confirme e pergunte sobre detalhes (tamanho, observações, etc.). Se o carrinho tiver itens, 
        ocasionalmente sugira complementos relevantes.
        
        Mantenha o tom conversacional e amigável. Responda em português brasileiro.
        """
        
        try:
            response = self.llm.invoke(prompt)
            return response.content
        except Exception as e:
            print(f"Erro ao gerar resposta: {e}")
            return "Desculpe, tive um problema técnico. Pode repetir sua mensagem?"
            
    def process_conversational_message(self, user_id: str, store_id: str, message: str) -> Dict:
        """Processa mensagem conversacional completa"""
        conversation = self.get_or_create_conversation(user_id, store_id)
        menu = self.get_store_menu(store_id)
        
        # Adicionar mensagem ao histórico
        conversation.conversation_history.append({
            'role': 'user',
            'content': message,
            'timestamp': datetime.now().isoformat()
        })
        
        # Extrair intenção de pedido
        order_intent = self.extract_order_intent(message, menu)
        
        # Processar intenção
        if order_intent['intent_type'] == 'add_item' and order_intent['confidence'] > 0.7:
            # Adicionar itens ao carrinho
            for item_name in order_intent.get('items_mentioned', []):
                menu_item = next((item for item in menu if item_name.lower() in item['name'].lower()), None)
                if menu_item:
                    conversation.add_to_cart({
                        'id': menu_item['_id'],
                        'name': menu_item['name'],
                        'price': menu_item['price'],
                        'quantity': 1,
                        'preferences': order_intent.get('preferences', [])
                    })
                    conversation.current_step = 'ordering'
        
        # Gerar resposta contextual
        response = self.generate_contextual_response(conversation, message)
        
        # Adicionar resposta ao histórico
        conversation.conversation_history.append({
            'role': 'assistant',
            'content': response,
            'timestamp': datetime.now().isoformat()
        })
        
        return {
            'response': response,
            'conversation_state': conversation.to_dict(),
            'order_intent': order_intent,
            'suggested_actions': self._get_suggested_actions(conversation)
        }
        
    def _get_suggested_actions(self, conversation: ConversationState) -> List[str]:
        """Gera ações sugeridas baseadas no estado da conversa"""
        actions = []
        
        if conversation.current_step == 'greeting':
            actions = ['Ver cardápio', 'Fazer pedido', 'Falar com atendente']
        elif conversation.current_step == 'ordering' and conversation.cart:
            actions = ['Adicionar mais itens', 'Finalizar pedido', 'Ver carrinho']
        elif conversation.current_step == 'confirming':
            actions = ['Confirmar pedido', 'Modificar pedido', 'Cancelar']
            
        return actions
        
    def finalize_order(self, user_id: str) -> Dict:
        """Finaliza pedido e envia para o backend"""
        if user_id not in self.active_conversations:
            return {'success': False, 'error': 'Conversa não encontrada'}
            
        conversation = self.active_conversations[user_id]
        
        if not conversation.cart:
            return {'success': False, 'error': 'Carrinho vazio'}
            
        # Preparar dados do pedido
        order_data = {
            'storeId': conversation.store_id,
            'items': conversation.cart,
            'customerInfo': conversation.customer_info,
            'deliveryInfo': conversation.delivery_info,
            'paymentMethod': conversation.payment_method,
            'total': conversation.get_cart_total(),
            'conversationId': user_id
        }
        
        try:
            # Enviar pedido para o backend
            response = requests.post(f"{self.backend_api_url}/api/order", json=order_data)
            
            if response.status_code == 201:
                # Limpar conversa após pedido finalizado
                del self.active_conversations[user_id]
                return {'success': True, 'order': response.json()}
            else:
                return {'success': False, 'error': 'Erro ao processar pedido'}
                
        except Exception as e:
            return {'success': False, 'error': f'Erro de conexão: {str(e)}'}