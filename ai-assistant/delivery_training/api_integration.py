#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Integração da IA Liza com API do Sistema de Delivery

Este módulo conecta a IA Liza com a API REST do sistema de delivery,
permitindo que a IA acesse informações de produtos, categorias, pedidos
e realize operações no sistema existente.

Autor: Sistema IA Liza
Data: Janeiro 2025
"""

import requests
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import asyncio
import aiohttp
from dataclasses import dataclass
from enum import Enum

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OrderStatus(Enum):
    """Status possíveis de um pedido"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

@dataclass
class DeliveryAPIConfig:
    """Configuração para conexão com a API"""
    base_url: str
    api_key: Optional[str] = None
    timeout: int = 30
    max_retries: int = 3
    
class DeliveryAPIClient:
    """Cliente para integração com a API do sistema de delivery"""
    
    def __init__(self, config: DeliveryAPIConfig):
        self.config = config
        self.session = None
        self._headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'IA-Liza/1.0'
        }
        
        if config.api_key:
            self._headers['Authorization'] = f'Bearer {config.api_key}'
    
    async def __aenter__(self):
        """Context manager para sessão async"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.config.timeout),
            headers=self._headers
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Fechar sessão async"""
        if self.session:
            await self.session.close()
    
    def _get_url(self, endpoint: str) -> str:
        """Construir URL completa"""
        return f"{self.config.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
    
    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Fazer requisição HTTP com retry"""
        url = self._get_url(endpoint)
        
        for attempt in range(self.config.max_retries):
            try:
                async with self.session.request(method, url, **kwargs) as response:
                    if response.status == 200:
                        return await response.json()
                    elif response.status == 404:
                        return None
                    else:
                        response.raise_for_status()
            
            except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                logger.warning(f"Tentativa {attempt + 1} falhou para {url}: {e}")
                if attempt == self.config.max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)  # Backoff exponencial
    
    # === MÉTODOS DE LOJA ===
    
    async def get_store_info(self, store_id: str) -> Optional[Dict[str, Any]]:
        """Obter informações da loja"""
        try:
            return await self._make_request('GET', f'api/stores/{store_id}')
        except Exception as e:
            logger.error(f"Erro ao buscar loja {store_id}: {e}")
            return None
    
    async def get_store_settings(self, store_id: str) -> Optional[Dict[str, Any]]:
        """Obter configurações da loja"""
        try:
            return await self._make_request('GET', f'api/stores/{store_id}/settings')
        except Exception as e:
            logger.error(f"Erro ao buscar configurações da loja {store_id}: {e}")
            return None
    
    # === MÉTODOS DE PRODUTOS ===
    
    async def get_categories(self, store_id: str) -> List[Dict[str, Any]]:
        """Obter categorias de produtos da loja"""
        try:
            result = await self._make_request('GET', f'api/categories', params={'storeId': store_id})
            return result.get('categories', []) if result else []
        except Exception as e:
            logger.error(f"Erro ao buscar categorias da loja {store_id}: {e}")
            return []
    
    async def get_products(self, store_id: str, category_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Obter produtos da loja, opcionalmente filtrados por categoria"""
        try:
            params = {'storeId': store_id}
            if category_id:
                params['categoryId'] = category_id
            
            result = await self._make_request('GET', f'api/foods', params=params)
            return result.get('foods', []) if result else []
        except Exception as e:
            logger.error(f"Erro ao buscar produtos da loja {store_id}: {e}")
            return []
    
    async def get_product_details(self, product_id: str) -> Optional[Dict[str, Any]]:
        """Obter detalhes de um produto específico"""
        try:
            return await self._make_request('GET', f'api/foods/{product_id}')
        except Exception as e:
            logger.error(f"Erro ao buscar produto {product_id}: {e}")
            return None
    
    async def search_products(self, store_id: str, query: str) -> List[Dict[str, Any]]:
        """Buscar produtos por nome ou descrição"""
        try:
            params = {'storeId': store_id, 'search': query}
            result = await self._make_request('GET', f'api/foods/search', params=params)
            return result.get('foods', []) if result else []
        except Exception as e:
            logger.error(f"Erro ao buscar produtos com query '{query}' na loja {store_id}: {e}")
            return []
    
    # === MÉTODOS DE CLIENTES ===
    
    async def get_customer_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        """Buscar cliente por número de telefone"""
        try:
            params = {'phone': phone}
            result = await self._make_request('GET', f'api/customers/search', params=params)
            customers = result.get('customers', []) if result else []
            return customers[0] if customers else None
        except Exception as e:
            logger.error(f"Erro ao buscar cliente por telefone {phone}: {e}")
            return None
    
    async def create_customer(self, customer_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Criar novo cliente"""
        try:
            return await self._make_request('POST', f'api/customers', json=customer_data)
        except Exception as e:
            logger.error(f"Erro ao criar cliente: {e}")
            return None
    
    async def get_customer_orders(self, customer_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Obter histórico de pedidos do cliente"""
        try:
            params = {'customerId': customer_id, 'limit': limit}
            result = await self._make_request('GET', f'api/orders', params=params)
            return result.get('orders', []) if result else []
        except Exception as e:
            logger.error(f"Erro ao buscar pedidos do cliente {customer_id}: {e}")
            return []
    
    # === MÉTODOS DE PEDIDOS ===
    
    async def create_order(self, order_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Criar novo pedido"""
        try:
            return await self._make_request('POST', f'api/orders', json=order_data)
        except Exception as e:
            logger.error(f"Erro ao criar pedido: {e}")
            return None
    
    async def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        """Obter detalhes de um pedido"""
        try:
            return await self._make_request('GET', f'api/orders/{order_id}')
        except Exception as e:
            logger.error(f"Erro ao buscar pedido {order_id}: {e}")
            return None
    
    async def update_order_status(self, order_id: str, status: OrderStatus) -> bool:
        """Atualizar status do pedido"""
        try:
            data = {'status': status.value}
            result = await self._make_request('PUT', f'api/orders/{order_id}/status', json=data)
            return result is not None
        except Exception as e:
            logger.error(f"Erro ao atualizar status do pedido {order_id}: {e}")
            return False
    
    async def cancel_order(self, order_id: str, reason: str = "") -> bool:
        """Cancelar pedido"""
        try:
            data = {'reason': reason}
            result = await self._make_request('POST', f'api/orders/{order_id}/cancel', json=data)
            return result is not None
        except Exception as e:
            logger.error(f"Erro ao cancelar pedido {order_id}: {e}")
            return False
    
    # === MÉTODOS DE CARRINHO ===
    
    async def add_to_cart(self, customer_id: str, store_id: str, item_data: Dict[str, Any]) -> bool:
        """Adicionar item ao carrinho"""
        try:
            data = {
                'customerId': customer_id,
                'storeId': store_id,
                **item_data
            }
            result = await self._make_request('POST', f'api/cart/add', json=data)
            return result is not None
        except Exception as e:
            logger.error(f"Erro ao adicionar item ao carrinho: {e}")
            return False
    
    async def get_cart(self, customer_id: str, store_id: str) -> Optional[Dict[str, Any]]:
        """Obter carrinho do cliente"""
        try:
            params = {'customerId': customer_id, 'storeId': store_id}
            return await self._make_request('GET', f'api/cart', params=params)
        except Exception as e:
            logger.error(f"Erro ao buscar carrinho: {e}")
            return None
    
    async def clear_cart(self, customer_id: str, store_id: str) -> bool:
        """Limpar carrinho"""
        try:
            data = {'customerId': customer_id, 'storeId': store_id}
            result = await self._make_request('DELETE', f'api/cart/clear', json=data)
            return result is not None
        except Exception as e:
            logger.error(f"Erro ao limpar carrinho: {e}")
            return False
    
    # === MÉTODOS DE ENTREGA ===
    
    async def calculate_delivery_fee(self, store_id: str, address: str) -> Optional[float]:
        """Calcular taxa de entrega"""
        try:
            data = {'storeId': store_id, 'address': address}
            result = await self._make_request('POST', f'api/delivery/calculate', json=data)
            return result.get('fee') if result else None
        except Exception as e:
            logger.error(f"Erro ao calcular taxa de entrega: {e}")
            return None
    
    async def estimate_delivery_time(self, store_id: str, address: str) -> Optional[int]:
        """Estimar tempo de entrega em minutos"""
        try:
            data = {'storeId': store_id, 'address': address}
            result = await self._make_request('POST', f'api/delivery/estimate', json=data)
            return result.get('estimatedMinutes') if result else None
        except Exception as e:
            logger.error(f"Erro ao estimar tempo de entrega: {e}")
            return None

class DeliveryAPIService:
    """Serviço de alto nível para integração com a API"""
    
    def __init__(self, config: DeliveryAPIConfig):
        self.config = config
        self.client = DeliveryAPIClient(config)
    
    async def get_store_menu(self, store_id: str) -> Dict[str, Any]:
        """Obter menu completo da loja organizado por categorias"""
        async with self.client as api:
            # Buscar informações da loja
            store_info = await api.get_store_info(store_id)
            if not store_info:
                return {'error': 'Loja não encontrada'}
            
            # Buscar categorias
            categories = await api.get_categories(store_id)
            
            # Buscar produtos para cada categoria
            menu = {
                'store': store_info,
                'categories': []
            }
            
            for category in categories:
                products = await api.get_products(store_id, category['_id'])
                menu['categories'].append({
                    'id': category['_id'],
                    'name': category['name'],
                    'description': category.get('description', ''),
                    'products': products
                })
            
            return menu
    
    async def process_customer_order(self, phone: str, store_id: str, items: List[Dict], address: str) -> Dict[str, Any]:
        """Processar pedido completo do cliente"""
        async with self.client as api:
            # Buscar ou criar cliente
            customer = await api.get_customer_by_phone(phone)
            if not customer:
                customer_data = {
                    'phone': phone,
                    'name': f'Cliente {phone[-4:]}',  # Nome temporário
                    'addresses': [{'address': address, 'isDefault': True}]
                }
                customer = await api.create_customer(customer_data)
                
                if not customer:
                    return {'error': 'Não foi possível criar cliente'}
            
            # Calcular taxa de entrega
            delivery_fee = await api.calculate_delivery_fee(store_id, address)
            delivery_time = await api.estimate_delivery_time(store_id, address)
            
            # Criar pedido
            order_data = {
                'customerId': customer['_id'],
                'storeId': store_id,
                'items': items,
                'deliveryAddress': address,
                'deliveryFee': delivery_fee or 0,
                'estimatedDeliveryTime': delivery_time or 60,
                'orderType': 'delivery',
                'paymentMethod': 'pending'  # Será definido posteriormente
            }
            
            order = await api.create_order(order_data)
            
            if order:
                return {
                    'success': True,
                    'order': order,
                    'customer': customer,
                    'deliveryFee': delivery_fee,
                    'estimatedTime': delivery_time
                }
            else:
                return {'error': 'Não foi possível criar o pedido'}
    
    async def get_customer_history(self, phone: str) -> Dict[str, Any]:
        """Obter histórico completo do cliente"""
        async with self.client as api:
            customer = await api.get_customer_by_phone(phone)
            if not customer:
                return {'error': 'Cliente não encontrado'}
            
            orders = await api.get_customer_orders(customer['_id'])
            
            return {
                'customer': customer,
                'orders': orders,
                'totalOrders': len(orders)
            }

# Configuração padrão
DEFAULT_CONFIG = DeliveryAPIConfig(
    base_url="http://localhost:3000",  # URL padrão do backend
    timeout=30,
    max_retries=3
)

# Instância global do serviço
delivery_service = DeliveryAPIService(DEFAULT_CONFIG)

# Funções de conveniência
async def get_menu(store_id: str) -> Dict[str, Any]:
    """Função de conveniência para obter menu"""
    return await delivery_service.get_store_menu(store_id)

async def create_order(phone: str, store_id: str, items: List[Dict], address: str) -> Dict[str, Any]:
    """Função de conveniência para criar pedido"""
    return await delivery_service.process_customer_order(phone, store_id, items, address)

async def get_customer_info(phone: str) -> Dict[str, Any]:
    """Função de conveniência para obter informações do cliente"""
    return await delivery_service.get_customer_history(phone)

if __name__ == "__main__":
    # Exemplo de uso
    async def test_integration():
        """Teste básico da integração"""
        # Configurar para ambiente de desenvolvimento
        config = DeliveryAPIConfig(
            base_url="http://localhost:3000",
            timeout=10
        )
        
        service = DeliveryAPIService(config)
        
        # Testar busca de menu
        print("Testando busca de menu...")
        menu = await service.get_store_menu("store_id_exemplo")
        print(f"Menu: {json.dumps(menu, indent=2, ensure_ascii=False)}")
        
        # Testar busca de cliente
        print("\nTestando busca de cliente...")
        customer_info = await service.get_customer_history("+5511999999999")
        print(f"Cliente: {json.dumps(customer_info, indent=2, ensure_ascii=False)}")
    
    # Executar teste
    asyncio.run(test_integration())