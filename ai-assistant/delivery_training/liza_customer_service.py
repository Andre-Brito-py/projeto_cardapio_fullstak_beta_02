#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Serviço de Clientes para IA Liza

Este módulo fornece funcionalidades específicas para a IA Liza
consultar, gerenciar e interagir com informações de clientes,
incluindo números de telefone e preferências de contato.

Autor: Sistema IA Liza
Data: Janeiro 2025
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from api_integration import DeliveryAPIClient, DeliveryAPIConfig

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LizaCustomerService:
    """Serviço especializado para gerenciamento de clientes pela Liza"""
    
    def __init__(self, api_config: DeliveryAPIConfig):
        self.api_config = api_config
        self.client = None
    
    async def __aenter__(self):
        """Context manager para inicializar cliente API"""
        self.client = DeliveryAPIClient(self.api_config)
        await self.client.__aenter__()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Finalizar cliente API"""
        if self.client:
            await self.client.__aexit__(exc_type, exc_val, exc_tb)
    
    async def find_customer_by_phone(self, phone: str, store_id: str) -> Optional[Dict[str, Any]]:
        """
        Buscar cliente por número de telefone
        
        Args:
            phone: Número de telefone do cliente
            store_id: ID da loja
            
        Returns:
            Dados do cliente ou None se não encontrado
        """
        try:
            endpoint = f'api/liza/customers/phone/{phone}'
            headers = {'X-Store-ID': store_id}
            
            result = await self.client._make_request('GET', endpoint, headers=headers)
            
            if result and result.get('success'):
                customer_data = result.get('data')
                logger.info(f"Cliente encontrado: {customer_data.get('name')} - {phone}")
                return customer_data
            else:
                logger.info(f"Cliente não encontrado para telefone: {phone}")
                return None
                
        except Exception as e:
            logger.error(f"Erro ao buscar cliente por telefone {phone}: {e}")
            return None
    
    async def get_contactable_customers(
        self, 
        store_id: str, 
        segment: str = 'all',
        contact_method: str = 'whatsapp',
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Obter lista de clientes contactáveis para campanhas
        
        Args:
            store_id: ID da loja
            segment: Segmento de clientes ('all', 'new', 'loyal', 'inactive', 'vip')
            contact_method: Método de contato ('whatsapp', 'telegram', 'both')
            limit: Limite de clientes retornados
            
        Returns:
            Lista de clientes contactáveis
        """
        try:
            endpoint = 'api/liza/customers/contactable'
            headers = {'X-Store-ID': store_id}
            params = {
                'segment': segment,
                'contactMethod': 'whatsapp',
                'limit': limit,
                'active': 'true'
            }
            
            result = await self.client._make_request('GET', endpoint, headers=headers, params=params)
            
            if result and result.get('success'):
                customers = result.get('data', [])
                logger.info(f"Encontrados {len(customers)} clientes contactáveis")
                return customers
            else:
                logger.warning("Nenhum cliente contactável encontrado")
                return []
                
        except Exception as e:
            logger.error(f"Erro ao buscar clientes contactáveis: {e}")
            return []
    
    async def search_customers(
        self, 
        store_id: str, 
        query: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Buscar clientes por nome ou telefone
        
        Args:
            store_id: ID da loja
            query: Termo de busca (nome ou telefone)
            limit: Limite de resultados
            
        Returns:
            Lista de clientes encontrados
        """
        try:
            if len(query.strip()) < 2:
                logger.warning("Termo de busca muito curto")
                return []
            
            endpoint = 'api/liza/customers/search'
            headers = {'X-Store-ID': store_id}
            params = {
                'query': query.strip(),
                'limit': limit
            }
            
            result = await self.client._make_request('GET', endpoint, headers=headers, params=params)
            
            if result and result.get('success'):
                customers = result.get('data', [])
                logger.info(f"Encontrados {len(customers)} clientes para busca: {query}")
                return customers
            else:
                logger.info(f"Nenhum cliente encontrado para: {query}")
                return []
                
        except Exception as e:
            logger.error(f"Erro ao buscar clientes com query '{query}': {e}")
            return []
    
    async def update_contact_preferences(
        self, 
        customer_id: str, 
        store_id: str,
        preferences: Dict[str, Any]
    ) -> bool:
        """
        Atualizar preferências de contato do cliente
        
        Args:
            customer_id: ID do cliente
            store_id: ID da loja
            preferences: Dicionário com preferências a atualizar
            
        Returns:
            True se atualizado com sucesso, False caso contrário
        """
        try:
            endpoint = f'api/liza/customers/contact-preferences/{customer_id}'
            headers = {'X-Store-ID': store_id}
            
            result = await self.client._make_request('PATCH', endpoint, headers=headers, json=preferences)
            
            if result and result.get('success'):
                logger.info(f"Preferências de contato atualizadas para cliente {customer_id}")
                return True
            else:
                logger.warning(f"Falha ao atualizar preferências para cliente {customer_id}")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao atualizar preferências do cliente {customer_id}: {e}")
            return False
    
    def format_customer_info(self, customer: Dict[str, Any]) -> str:
        """
        Formatar informações do cliente para exibição
        
        Args:
            customer: Dados do cliente
            
        Returns:
            String formatada com informações do cliente
        """
        try:
            name = customer.get('name', 'Nome não informado')
            phone = customer.get('phone', 'Telefone não informado')
            whatsapp = customer.get('whatsappNumber', phone)
            
            segment = customer.get('customerSegment', 'new')
            total_orders = customer.get('totalOrders', 0)
            
            # Traduzir segmento
            segment_names = {
                'new': 'Novo Cliente',
                'loyal': 'Cliente Fiel',
                'inactive': 'Cliente Inativo',
                'vip': 'Cliente VIP'
            }
            segment_display = segment_names.get(segment, segment)
            
            # Formatar última compra
            last_order = customer.get('lastOrderDate')
            if last_order:
                try:
                    last_order_date = datetime.fromisoformat(last_order.replace('Z', '+00:00'))
                    last_order_str = last_order_date.strftime('%d/%m/%Y')
                except:
                    last_order_str = 'Data inválida'
            else:
                last_order_str = 'Nunca fez pedidos'
            
            info = f"""👤 **{name}**
📱 Telefone: {phone}
💬 WhatsApp: {whatsapp}

🏷️ Segmento: {segment_display}
📦 Total de Pedidos: {total_orders}
🗓️ Último Pedido: {last_order_str}"""
            
            return info
            
        except Exception as e:
            logger.error(f"Erro ao formatar informações do cliente: {e}")
            return "Erro ao formatar informações do cliente"
    
    def get_contact_methods(self, customer: Dict[str, Any]) -> List[str]:
        """
        Obter métodos de contato disponíveis para o cliente
        
        Args:
            customer: Dados do cliente
            
        Returns:
            Lista de métodos de contato disponíveis
        """
        methods = []
        
        if customer.get('allowWhatsappContact') and customer.get('whatsappNumber'):
            methods.append('whatsapp')
        
        
        
        return methods
    
    async def get_customer_statistics(self, store_id: str) -> Dict[str, Any]:
        """
        Obter estatísticas gerais de clientes da loja
        
        Args:
            store_id: ID da loja
            
        Returns:
            Dicionário com estatísticas de clientes
        """
        try:
            # Buscar clientes por segmento
            segments = ['new', 'loyal', 'inactive', 'vip']
            stats = {
                'total_customers': 0,
                'by_segment': {},
                'contactable_whatsapp': 0
            }
            
            for segment in segments:
                customers = await self.get_contactable_customers(
                    store_id=store_id,
                    segment=segment,
                    contact_method='whatsapp',
                    limit=1000
                )
                stats['by_segment'][segment] = len(customers)
                stats['total_customers'] += len(customers)
            
            # Contar por método de contato
            whatsapp_customers = await self.get_contactable_customers(
                store_id=store_id,
                contact_method='whatsapp',
                limit=1000
            )
            stats['contactable_whatsapp'] = len(whatsapp_customers)
            
            
            
            return stats
            
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas de clientes: {e}")
            return {}

# Configuração padrão
DEFAULT_CONFIG = DeliveryAPIConfig(
    base_url="http://localhost:4001",
    timeout=30,
    max_retries=3
)

# Instância global do serviço
liza_customer_service = LizaCustomerService(DEFAULT_CONFIG)

# Funções de conveniência para uso direto
async def find_customer(phone: str, store_id: str) -> Optional[Dict[str, Any]]:
    """Buscar cliente por telefone"""
    async with LizaCustomerService(DEFAULT_CONFIG) as service:
        return await service.find_customer_by_phone(phone, store_id)

async def get_contactable_customers(
    store_id: str, 
    segment: str = 'all',
    contact_method: str = 'whatsapp',
    limit: int = 50
) -> List[Dict[str, Any]]:
    """Obter clientes contactáveis"""
    async with LizaCustomerService(DEFAULT_CONFIG) as service:
        return await service.get_contactable_customers(store_id, segment, contact_method, limit)

async def search_customers(store_id: str, query: str) -> List[Dict[str, Any]]:
    """Buscar clientes por nome ou telefone"""
    async with LizaCustomerService(DEFAULT_CONFIG) as service:
        return await service.search_customers(store_id, query)

if __name__ == "__main__":
    # Teste do serviço
    async def test_customer_service():
        """Função de teste do serviço de clientes"""
        store_id = "test_store_123"
        
        async with LizaCustomerService(DEFAULT_CONFIG) as service:
            print("🔍 Testando serviço de clientes da Liza...")
            
            # Teste 1: Buscar cliente por telefone
            print("\n1. Buscando cliente por telefone...")
            customer = await service.find_customer_by_phone("11999999999", store_id)
            if customer:
                print(f"✅ Cliente encontrado: {customer['name']}")
                print(service.format_customer_info(customer))
            else:
                print("❌ Cliente não encontrado")
            
            # Teste 2: Buscar clientes contactáveis
            print("\n2. Buscando clientes contactáveis...")
            contactable = await service.get_contactable_customers(store_id, limit=5)
            print(f"✅ Encontrados {len(contactable)} clientes contactáveis")
            
            # Teste 3: Estatísticas
            print("\n3. Obtendo estatísticas...")
            stats = await service.get_customer_statistics(store_id)
            print(f"✅ Estatísticas: {stats}")
    
    # Executar teste
    asyncio.run(test_customer_service())
