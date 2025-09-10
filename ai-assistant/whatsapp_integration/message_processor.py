import json
import os
import sys
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import requests
import logging

# Adicionar o diretório pai ao path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from delivery_training.intent_classification import DeliveryIntentClassifier
from whatsapp_integration.whatsapp_client import WhatsAppClient

class MessageProcessor:
    def __init__(self, backend_api_url: str, store_id: str):
        self.backend_api_url = backend_api_url.rstrip('/')
        self.store_id = store_id
        self.classifier = DeliveryIntentClassifier()
        self.whatsapp_client = None
        
        # Carregar templates de resposta
        self.load_response_templates()
        
        # Inicializar classificador
        self.initialize_classifier()
        
        # Configurar logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Cache para dados da loja
        self.store_cache = {}
        self.menu_cache = {}
        
    def load_response_templates(self):
        """Carrega templates de resposta"""
        try:
            templates_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), 
                'delivery_training', 
                'response_templates.json'
            )
            with open(templates_path, 'r', encoding='utf-8') as f:
                self.templates = json.load(f)
        except FileNotFoundError:
            self.logger.error("Templates de resposta não encontrados")
            self.templates = {"templates": {}, "quick_replies": {}}
    
    def initialize_classifier(self):
        """Inicializa o classificador de intenções"""
        try:
            # Tentar carregar modelo treinado
            model_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), 
                'delivery_training', 
                'delivery_intent_model.pkl'
            )
            
            if os.path.exists(model_path):
                self.classifier.load_model(model_path)
                self.logger.info("Modelo de classificação carregado")
            else:
                # Treinar modelo se não existir
                if self.classifier.train_model():
                    self.classifier.save_model(model_path)
                    self.logger.info("Modelo treinado e salvo")
                else:
                    self.logger.error("Falha no treinamento do modelo")
        except Exception as e:
            self.logger.error(f"Erro ao inicializar classificador: {e}")
    
    def set_whatsapp_client(self, client: WhatsAppClient):
        """Define o cliente WhatsApp"""
        self.whatsapp_client = client
    
    async def process_message(self, message_data: Dict) -> Dict:
        """Processa mensagem recebida do WhatsApp"""
        try:
            # Extrair dados da mensagem
            customer_phone = message_data.get('from')
            message_text = message_data.get('text', {}).get('body', '')
            message_type = message_data.get('type', 'text')
            message_id = message_data.get('id')
            
            # Marcar como lida
            if self.whatsapp_client and message_id:
                self.whatsapp_client.mark_as_read(message_id)
            
            # Obter contexto do cliente
            customer_context = await self.get_customer_context(customer_phone)
            
            # Processar baseado no tipo de mensagem
            if message_type == 'text':
                response = await self.process_text_message(message_text, customer_context)
            elif message_type == 'interactive':
                response = await self.process_interactive_message(message_data, customer_context)
            else:
                response = await self.process_media_message(message_data, customer_context)
            
            # Enviar resposta
            if response and self.whatsapp_client:
                await self.send_response(customer_phone, response)
            
            return {
                "success": True,
                "processed": True,
                "response_sent": bool(response)
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao processar mensagem: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def process_text_message(self, text: str, customer_context: Dict) -> Dict:
        """Processa mensagem de texto"""
        # Classificar intenção
        classification = self.classifier.classify_intent(text)
        intent = classification['intent']
        confidence = classification['confidence']
        
        # Extrair entidades
        entities = self.classifier.extract_entities(text)
        
        self.logger.info(f"Intent: {intent}, Confidence: {confidence:.2f}, Entities: {entities}")
        
        # Processar baseado na intenção
        if intent == 'greeting':
            return await self.handle_greeting(customer_context)
        elif intent == 'menu_request':
            return await self.handle_menu_request(customer_context)
        elif intent == 'order_request':
            return await self.handle_order_request(text, entities, customer_context)
        elif intent == 'delivery_info':
            return await self.handle_delivery_info(customer_context)
        elif intent == 'payment_info':
            return await self.handle_payment_info(customer_context)
        elif intent == 'order_status':
            return await self.handle_order_status(text, customer_context)
        elif intent == 'recommendation':
            return await self.handle_recommendation(customer_context)
        elif intent == 'complaint':
            return await self.handle_complaint(text, customer_context)
        elif intent == 'thanks':
            return await self.handle_thanks(customer_context)
        else:
            return await self.handle_unknown_intent(text, customer_context)
    
    async def handle_greeting(self, customer_context: Dict) -> Dict:
        """Trata saudações"""
        store_info = await self.get_store_info()
        
        # Verificar se é cliente recorrente
        if customer_context.get('order_count', 0) > 0:
            template = self.templates['templates']['greeting']['returning_customer']
            message = template.format(
                customer_name=customer_context.get('name', 'Cliente'),
                store_name=store_info.get('name', 'nossa loja')
            )
        else:
            template = self.templates['templates']['greeting']['default']
            message = template.format(
                store_name=store_info.get('name', 'nossa loja')
            )
        
        return {
            "type": "text",
            "message": message,
            "quick_replies": self.templates['quick_replies']['main_menu']
        }
    
    async def handle_menu_request(self, customer_context: Dict) -> Dict:
        """Trata solicitações de cardápio"""
        menu_data = await self.get_menu_data()
        
        if not menu_data:
            return {
                "type": "text",
                "message": "Desculpe, não consegui carregar o cardápio no momento. Tente novamente em alguns instantes."
            }
        
        # Formatar categorias
        categories_list = ""
        for i, category in enumerate(menu_data.get('categories', []), 1):
            categories_list += f"{i}. {category['name']} ({len(category.get('products', []))} itens)\n"
        
        template = self.templates['templates']['menu_display']['categories']
        store_info = await self.get_store_info()
        
        message = template.format(
            store_name=store_info.get('name', 'nossa loja'),
            categories_list=categories_list
        )
        
        return {
            "type": "text",
            "message": message,
            "quick_replies": [cat['name'] for cat in menu_data.get('categories', [])[:4]]
        }
    
    async def handle_order_request(self, text: str, entities: Dict, customer_context: Dict) -> Dict:
        """Trata solicitações de pedido"""
        # Verificar se mencionou produto específico
        food_entities = entities.get('food_types', [])
        
        if food_entities:
            # Buscar produtos relacionados
            products = await self.search_products(food_entities[0])
            if products:
                return await self.show_product_options(products)
        
        # Resposta genérica para pedido
        template = self.templates['templates']['greeting']['default']
        store_info = await self.get_store_info()
        
        message = "Perfeito! Vou ajudar você com seu pedido. 🛒\n\nO que gostaria de pedir hoje?"
        
        return {
            "type": "text",
            "message": message,
            "quick_replies": self.templates['quick_replies']['main_menu']
        }
    
    async def handle_delivery_info(self, customer_context: Dict) -> Dict:
        """Trata informações de entrega"""
        store_info = await self.get_store_info()
        
        message = f"📍 *INFORMAÇÕES DE ENTREGA*\n\n"
        message += f"⏰ Tempo estimado: {store_info.get('delivery_time', '30-45')} minutos\n"
        message += f"🚚 Taxa de entrega: A partir de R$ {store_info.get('delivery_fee', '5,00')}\n"
        message += f"📍 Área de atendimento: {store_info.get('delivery_area', 'Consulte disponibilidade')}\n\n"
        message += "Para calcular o valor exato da entrega, preciso do seu endereço. Pode me informar?"
        
        return {
            "type": "text",
            "message": message
        }
    
    async def handle_payment_info(self, customer_context: Dict) -> Dict:
        """Trata informações de pagamento"""
        template = self.templates['templates']['payment']['methods']
        
        return {
            "type": "text",
            "message": template,
            "quick_replies": self.templates['quick_replies']['payment_methods']
        }
    
    async def handle_order_status(self, text: str, customer_context: Dict) -> Dict:
        """Trata consulta de status de pedido"""
        # Tentar extrair número do pedido ou usar telefone do cliente
        order_info = await self.get_order_status(customer_context['phone'])
        
        if order_info:
            template = self.templates['templates']['order_status']['status_info']
            message = template.format(
                order_number=order_info.get('number', 'N/A'),
                status=order_info.get('status', 'Em processamento'),
                order_time=order_info.get('created_at', 'N/A'),
                estimated_delivery=order_info.get('estimated_delivery', 'Calculando...'),
                total=order_info.get('total', '0,00'),
                status_message=self.get_status_message(order_info.get('status'))
            )
        else:
            message = self.templates['templates']['order_status']['not_found']
        
        return {
            "type": "text",
            "message": message
        }
    
    async def handle_recommendation(self, customer_context: Dict) -> Dict:
        """Trata solicitações de recomendação"""
        popular_items = await self.get_popular_items()
        
        if popular_items:
            items_text = ""
            for i, item in enumerate(popular_items[:5], 1):
                items_text += f"{i}. {item['name']} - R$ {item['price']}\n"
            
            template = self.templates['templates']['recommendations']['popular']
            message = template.format(popular_items=items_text)
        else:
            message = "Todos os nossos pratos são deliciosos! Que tipo de comida você prefere?"
        
        return {
            "type": "text",
            "message": message
        }
    
    async def handle_complaint(self, text: str, customer_context: Dict) -> Dict:
        """Trata reclamações"""
        template = self.templates['templates']['complaints']['initial_response']
        
        return {
            "type": "text",
            "message": template,
            "escalate_to_human": True
        }
    
    async def handle_thanks(self, customer_context: Dict) -> Dict:
        """Trata agradecimentos"""
        store_info = await self.get_store_info()
        template = self.templates['templates']['thanks']['default']
        
        message = template.format(
            store_name=store_info.get('name', 'nossa loja')
        )
        
        return {
            "type": "text",
            "message": message
        }
    
    async def handle_unknown_intent(self, text: str, customer_context: Dict) -> Dict:
        """Trata intenções não reconhecidas"""
        template = self.templates['templates']['errors']['not_understood']
        
        return {
            "type": "text",
            "message": template,
            "quick_replies": self.templates['quick_replies']['support']
        }
    
    # Métodos auxiliares para integração com backend
    
    async def get_customer_context(self, phone: str) -> Dict:
        """Obtém contexto do cliente"""
        try:
            response = requests.get(
                f"{self.backend_api_url}/api/customers/by-phone/{phone}",
                headers={"x-store-id": self.store_id}
            )
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            self.logger.error(f"Erro ao obter contexto do cliente: {e}")
        
        return {"phone": phone, "name": "Cliente", "order_count": 0}
    
    async def get_store_info(self) -> Dict:
        """Obtém informações da loja"""
        if self.store_id in self.store_cache:
            return self.store_cache[self.store_id]
        
        try:
            response = requests.get(
                f"{self.backend_api_url}/api/stores/{self.store_id}"
            )
            if response.status_code == 200:
                store_info = response.json()
                self.store_cache[self.store_id] = store_info
                return store_info
        except Exception as e:
            self.logger.error(f"Erro ao obter informações da loja: {e}")
        
        return {"name": "Nossa Loja", "delivery_time": "30-45", "delivery_fee": "5,00"}
    
    async def get_menu_data(self) -> Dict:
        """Obtém dados do cardápio"""
        if self.store_id in self.menu_cache:
            return self.menu_cache[self.store_id]
        
        try:
            response = requests.get(
                f"{self.backend_api_url}/api/categories",
                headers={"x-store-id": self.store_id}
            )
            if response.status_code == 200:
                menu_data = response.json()
                self.menu_cache[self.store_id] = menu_data
                return menu_data
        except Exception as e:
            self.logger.error(f"Erro ao obter cardápio: {e}")
        
        return {"categories": []}
    
    async def send_response(self, phone: str, response: Dict):
        """Envia resposta para o cliente"""
        if not self.whatsapp_client:
            return
        
        message_type = response.get('type', 'text')
        
        if message_type == 'text':
            result = self.whatsapp_client.send_text_message(
                phone, 
                response['message']
            )
            
            # Enviar quick replies se disponíveis
            quick_replies = response.get('quick_replies')
            if quick_replies and len(quick_replies) <= 3:
                buttons = []
                for i, reply in enumerate(quick_replies):
                    buttons.append({
                        "type": "reply",
                        "reply": {
                            "id": f"btn_{i}",
                            "title": reply[:20]  # Limite de 20 caracteres
                        }
                    })
                
                self.whatsapp_client.send_interactive_message(
                    phone,
                    "button",
                    body="Escolha uma opção:",
                    buttons=buttons
                )
    
    def get_status_message(self, status: str) -> str:
        """Obtém mensagem de status do pedido"""
        status_messages = {
            "pending": "Seu pedido foi recebido e está sendo processado.",
            "preparing": "Seu pedido está sendo preparado com carinho.",
            "ready": "Seu pedido está pronto e saindo para entrega!",
            "delivering": "Seu pedido está a caminho!",
            "delivered": "Seu pedido foi entregue. Bom apetite!",
            "cancelled": "Seu pedido foi cancelado."
        }
        return status_messages.get(status, "Status do pedido atualizado.")

# Exemplo de uso
if __name__ == "__main__":
    processor = MessageProcessor(
        backend_api_url="http://localhost:3000",
        store_id="store123"
    )
    
    # Teste de processamento
    test_message = {
        "from": "5511999999999",
        "id": "msg123",
        "type": "text",
        "text": {"body": "Olá, qual é o cardápio?"}
    }
    
    import asyncio
    result = asyncio.run(processor.process_message(test_message))
    print(f"Resultado: {result}")