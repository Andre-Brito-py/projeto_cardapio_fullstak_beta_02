#!/usr/bin/env python3
"""
Script de Inferência da IA Liza para Sistema de Delivery
Processa pedidos em tempo real usando o modelo treinado
"""

import os
import json
import yaml
import logging
import requests
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
import asyncio
import aiohttp
from dataclasses import dataclass

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class OrderItem:
    """Representa um item do pedido"""
    name: str
    price: float
    quantity: int = 1
    modifications: List[str] = None
    
    def __post_init__(self):
        if self.modifications is None:
            self.modifications = []
    
    @property
    def total_price(self) -> float:
        return self.price * self.quantity

@dataclass
class Order:
    """Representa um pedido completo"""
    order_id: str
    customer_name: str = ""
    customer_phone: str = ""
    address: str = ""
    items: List[OrderItem] = None
    status: str = "recebido"
    payment_method: str = ""
    delivery_fee: float = 5.0
    created_at: datetime = None
    
    def __post_init__(self):
        if self.items is None:
            self.items = []
        if self.created_at is None:
            self.created_at = datetime.now()
    
    @property
    def subtotal(self) -> float:
        return sum(item.total_price for item in self.items)
    
    @property
    def total(self) -> float:
        return self.subtotal + self.delivery_fee
    
    def add_item(self, item: OrderItem):
        """Adiciona item ao pedido"""
        self.items.append(item)
    
    def to_dict(self) -> Dict:
        """Converte pedido para dicionário"""
        return {
            'order_id': self.order_id,
            'customer_name': self.customer_name,
            'customer_phone': self.customer_phone,
            'address': self.address,
            'items': [{
                'name': item.name,
                'price': item.price,
                'quantity': item.quantity,
                'modifications': item.modifications,
                'total_price': item.total_price
            } for item in self.items],
            'status': self.status,
            'payment_method': self.payment_method,
            'subtotal': self.subtotal,
            'delivery_fee': self.delivery_fee,
            'total': self.total,
            'created_at': self.created_at.isoformat()
        }

class DeliveryAIInference:
    """
    Classe para inferência da IA de delivery
    """
    
    def __init__(self, config_path: str = "../config/config.yaml"):
        """
        Inicializa o sistema de inferência
        
        Args:
            config_path: Caminho para o arquivo de configuração
        """
        self.config_path = config_path
        self.config = self.load_config()
        self.ollama_url = f"http://{self.config['ollama']['host']}:{self.config['ollama']['port']}"
        self.current_orders = {}  # Armazena pedidos em andamento
        self.conversation_context = {}  # Contexto das conversas
        
        # Carrega cardápio e preços
        self.menu = self.load_menu()
        
    def load_config(self) -> Dict[str, Any]:
        """
        Carrega configurações do arquivo YAML
        
        Returns:
            Dicionário com configurações
        """
        try:
            with open(self.config_path, 'r', encoding='utf-8') as file:
                config = yaml.safe_load(file)
            logger.info(f"Configurações carregadas de {self.config_path}")
            return config
        except Exception as e:
            logger.error(f"Erro ao carregar configurações: {e}")
            raise
    
    def load_menu(self) -> Dict[str, Dict]:
        """
        Carrega cardápio com preços (simulado)
        
        Returns:
            Dicionário com itens do cardápio
        """
        return {
            'pizzas': {
                'calabresa_grande': {'name': 'Pizza Grande Calabresa', 'price': 35.0, 'time': 45},
                'calabresa_media': {'name': 'Pizza Média Calabresa', 'price': 28.0, 'time': 45},
                'margherita_grande': {'name': 'Pizza Grande Margherita', 'price': 32.0, 'time': 45},
                'margherita_media': {'name': 'Pizza Média Margherita', 'price': 25.0, 'time': 45},
                'portuguesa_grande': {'name': 'Pizza Grande Portuguesa', 'price': 38.0, 'time': 45},
                'frango_catupiry_grande': {'name': 'Pizza Grande Frango c/ Catupiry', 'price': 36.0, 'time': 45},
                'vegana_grande': {'name': 'Pizza Grande Vegana', 'price': 38.0, 'time': 45}
            },
            'hamburgueres': {
                'completo': {'name': 'Hambúrguer Completo', 'price': 18.0, 'time': 30},
                'simples': {'name': 'Hambúrguer Simples', 'price': 12.0, 'time': 25},
                'duplo': {'name': 'Hambúrguer Duplo', 'price': 25.0, 'time': 35}
            },
            'bebidas': {
                'refrigerante_2l': {'name': 'Refrigerante 2L', 'price': 8.0, 'time': 5},
                'refrigerante_lata': {'name': 'Refrigerante Lata', 'price': 4.0, 'time': 5},
                'cerveja_long_neck': {'name': 'Cerveja Long Neck', 'price': 5.0, 'time': 5},
                'agua': {'name': 'Água 500ml', 'price': 3.0, 'time': 5}
            },
            'sobremesas': {
                'pudim': {'name': 'Pudim', 'price': 8.0, 'time': 10},
                'brigadeirao': {'name': 'Brigadeirão', 'price': 12.0, 'time': 15},
                'petit_gateau': {'name': 'Petit Gateau', 'price': 18.0, 'time': 15}
            },
            'saladas': {
                'caesar': {'name': 'Salada Caesar', 'price': 22.0, 'time': 20},
                'caesar_frango': {'name': 'Salada Caesar c/ Frango', 'price': 30.0, 'time': 20}
            }
        }
    
    async def generate_response(self, user_input: str, context: Dict = None) -> str:
        """
        Gera resposta usando o modelo treinado
        
        Args:
            user_input: Entrada do usuário
            context: Contexto da conversa
            
        Returns:
            Resposta gerada pela IA
        """
        try:
            # Prepara o prompt com contexto
            prompt = self.prepare_prompt(user_input, context)
            
            # Configurações para geração
            generate_data = {
                "model": self.config['model']['fine_tuned_model'],
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": self.config['model']['temperature'],
                    "top_p": self.config['model']['top_p'],
                    "num_ctx": self.config['model']['context_length']
                }
            }
            
            # Faz requisição para Ollama
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.ollama_url}/api/generate",
                    json=generate_data,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result.get('response', 'Desculpe, não consegui processar sua solicitação.')
                    else:
                        logger.error(f"Erro na API Ollama: {response.status}")
                        return "Desculpe, estou com dificuldades técnicas. Tente novamente."
                        
        except Exception as e:
            logger.error(f"Erro ao gerar resposta: {e}")
            return "Desculpe, ocorreu um erro. Tente novamente em alguns instantes."
    
    def prepare_prompt(self, user_input: str, context: Dict = None) -> str:
        """
        Prepara prompt com contexto para o modelo
        
        Args:
            user_input: Entrada do usuário
            context: Contexto da conversa
            
        Returns:
            Prompt formatado
        """
        base_prompt = "Você é a Liza, assistente de delivery. Responda de forma natural e útil.\n\n"
        
        # Adiciona contexto se disponível
        if context:
            if 'current_order' in context:
                order = context['current_order']
                base_prompt += f"Pedido atual: {order}\n\n"
            
            if 'conversation_history' in context:
                history = context['conversation_history'][-3:]  # Últimas 3 mensagens
                for msg in history:
                    base_prompt += f"Cliente: {msg['user']}\nLiza: {msg['assistant']}\n\n"
        
        # Adiciona entrada atual
        base_prompt += f"Cliente: {user_input}\nLiza: "
        
        return base_prompt
    
    def extract_order_info(self, user_input: str, response: str) -> Dict:
        """
        Extrai informações de pedido da conversa
        
        Args:
            user_input: Entrada do usuário
            response: Resposta da IA
            
        Returns:
            Informações extraídas do pedido
        """
        extracted_info = {
            'items': [],
            'customer_info': {},
            'modifications': [],
            'action': 'none'  # add_item, confirm_order, cancel_order, etc.
        }
        
        user_lower = user_input.lower()
        
        # Detecta itens do cardápio
        for category, items in self.menu.items():
            for item_key, item_info in items.items():
                item_name_lower = item_info['name'].lower()
                
                # Verifica se o item foi mencionado
                if any(word in user_lower for word in item_name_lower.split()):
                    extracted_info['items'].append({
                        'key': item_key,
                        'info': item_info,
                        'category': category
                    })
        
        # Detecta informações do cliente
        if 'nome' in user_lower or 'chamo' in user_lower:
            # Extrai nome (simplificado)
            words = user_input.split()
            for i, word in enumerate(words):
                if word.lower() in ['nome', 'chamo'] and i + 1 < len(words):
                    extracted_info['customer_info']['name'] = words[i + 1]
        
        # Detecta telefone
        import re
        phone_pattern = r'\b\d{10,11}\b'
        phone_match = re.search(phone_pattern, user_input)
        if phone_match:
            extracted_info['customer_info']['phone'] = phone_match.group()
        
        # Detecta endereço
        if 'rua' in user_lower or 'avenida' in user_lower or 'endereço' in user_lower:
            extracted_info['customer_info']['address'] = user_input
        
        # Detecta ações
        if 'confirmo' in user_lower or 'confirmar' in user_lower:
            extracted_info['action'] = 'confirm_order'
        elif 'cancelar' in user_lower or 'cancelo' in user_lower:
            extracted_info['action'] = 'cancel_order'
        elif any(word in user_lower for word in ['quero', 'adicionar', 'pedir']):
            extracted_info['action'] = 'add_item'
        
        return extracted_info
    
    def process_order_action(self, user_id: str, extracted_info: Dict) -> Dict:
        """
        Processa ações relacionadas ao pedido
        
        Args:
            user_id: ID do usuário
            extracted_info: Informações extraídas
            
        Returns:
            Estado atualizado do pedido
        """
        # Inicializa pedido se não existir
        if user_id not in self.current_orders:
            order_id = f"ORD{int(time.time())}"
            self.current_orders[user_id] = Order(order_id=order_id)
        
        order = self.current_orders[user_id]
        
        # Processa ação
        if extracted_info['action'] == 'add_item':
            for item_data in extracted_info['items']:
                item_info = item_data['info']
                order_item = OrderItem(
                    name=item_info['name'],
                    price=item_info['price']
                )
                order.add_item(order_item)
        
        elif extracted_info['action'] == 'confirm_order':
            order.status = 'confirmado'
        
        elif extracted_info['action'] == 'cancel_order':
            order.status = 'cancelado'
        
        # Atualiza informações do cliente
        if 'name' in extracted_info['customer_info']:
            order.customer_name = extracted_info['customer_info']['name']
        if 'phone' in extracted_info['customer_info']:
            order.customer_phone = extracted_info['customer_info']['phone']
        if 'address' in extracted_info['customer_info']:
            order.address = extracted_info['customer_info']['address']
        
        return order.to_dict()
    
    async def process_message(self, user_id: str, message: str) -> Dict[str, Any]:
        """
        Processa mensagem completa do usuário
        
        Args:
            user_id: ID único do usuário
            message: Mensagem do usuário
            
        Returns:
            Resposta completa com texto e dados do pedido
        """
        try:
            # Inicializa contexto se não existir
            if user_id not in self.conversation_context:
                self.conversation_context[user_id] = {
                    'conversation_history': [],
                    'current_order': None
                }
            
            context = self.conversation_context[user_id]
            
            # Gera resposta da IA
            ai_response = await self.generate_response(message, context)
            
            # Extrai informações do pedido
            extracted_info = self.extract_order_info(message, ai_response)
            
            # Processa ações do pedido
            order_data = None
            if extracted_info['action'] != 'none':
                order_data = self.process_order_action(user_id, extracted_info)
                context['current_order'] = order_data
            
            # Atualiza histórico da conversa
            context['conversation_history'].append({
                'user': message,
                'assistant': ai_response,
                'timestamp': datetime.now().isoformat()
            })
            
            # Mantém apenas últimas 10 mensagens
            if len(context['conversation_history']) > 10:
                context['conversation_history'] = context['conversation_history'][-10:]
            
            return {
                'response': ai_response,
                'order_data': order_data,
                'extracted_info': extracted_info,
                'user_id': user_id,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro ao processar mensagem: {e}")
            return {
                'response': 'Desculpe, ocorreu um erro ao processar sua mensagem.',
                'error': str(e),
                'user_id': user_id,
                'timestamp': datetime.now().isoformat()
            }
    
    def get_order_status(self, user_id: str) -> Optional[Dict]:
        """
        Retorna status do pedido atual
        
        Args:
            user_id: ID do usuário
            
        Returns:
            Dados do pedido ou None
        """
        if user_id in self.current_orders:
            return self.current_orders[user_id].to_dict()
        return None
    
    def clear_order(self, user_id: str):
        """
        Limpa pedido do usuário
        
        Args:
            user_id: ID do usuário
        """
        if user_id in self.current_orders:
            del self.current_orders[user_id]
        if user_id in self.conversation_context:
            self.conversation_context[user_id]['current_order'] = None

# Exemplo de uso
async def main():
    """
    Exemplo de uso do sistema de inferência
    """
    inference = DeliveryAIInference()
    
    # Simula conversa
    user_id = "user_123"
    
    messages = [
        "Oi, quero fazer um pedido",
        "Quero uma pizza grande de calabresa",
        "Adicionar um refrigerante de 2L",
        "Meu nome é João Silva",
        "Meu telefone é 11999887766",
        "Confirmo o pedido"
    ]
    
    for message in messages:
        print(f"\nUsuário: {message}")
        result = await inference.process_message(user_id, message)
        print(f"Liza: {result['response']}")
        
        if result.get('order_data'):
            print(f"Pedido atual: {result['order_data']}")

if __name__ == "__main__":
    asyncio.run(main())