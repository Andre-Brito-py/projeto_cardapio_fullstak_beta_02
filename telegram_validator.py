#!/usr/bin/env python3
"""
Validador de Token do Telegram - Solução Alternativa
Este script valida tokens do Telegram diretamente com a API oficial
"""

import requests
import json
import sys
from datetime import datetime

class TelegramValidator:
    def __init__(self):
        self.base_url = "https://api.telegram.org/bot"
    
    def validate_token(self, token):
        """
        Valida um token do Telegram fazendo uma requisição para getMe
        """
        try:
            url = f"{self.base_url}{token}/getMe"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('ok'):
                    bot_info = data.get('result', {})
                    return {
                        'success': True,
                        'message': 'Token válido',
                        'bot_info': {
                            'id': bot_info.get('id'),
                            'is_bot': bot_info.get('is_bot'),
                            'first_name': bot_info.get('first_name'),
                            'username': bot_info.get('username'),
                            'can_join_groups': bot_info.get('can_join_groups'),
                            'can_read_all_group_messages': bot_info.get('can_read_all_group_messages'),
                            'supports_inline_queries': bot_info.get('supports_inline_queries')
                        }
                    }
                else:
                    return {
                        'success': False,
                        'message': f"Erro da API: {data.get('description', 'Erro desconhecido')}"
                    }
            else:
                return {
                    'success': False,
                    'message': f"Erro HTTP {response.status_code}: {response.text}"
                }
                
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'message': 'Timeout na requisição para a API do Telegram'
            }
        except requests.exceptions.ConnectionError:
            return {
                'success': False,
                'message': 'Erro de conexão com a API do Telegram'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Erro inesperado: {str(e)}'
            }
    
    def test_send_message(self, token, chat_id, message):
        """
        Testa o envio de uma mensagem usando o token
        """
        try:
            url = f"{self.base_url}{token}/sendMessage"
            payload = {
                'chat_id': chat_id,
                'text': message
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('ok'):
                    return {
                        'success': True,
                        'message': 'Mensagem enviada com sucesso',
                        'message_id': data.get('result', {}).get('message_id')
                    }
                else:
                    return {
                        'success': False,
                        'message': f"Erro ao enviar mensagem: {data.get('description', 'Erro desconhecido')}"
                    }
            else:
                return {
                    'success': False,
                    'message': f"Erro HTTP {response.status_code}: {response.text}"
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Erro ao enviar mensagem: {str(e)}'
            }

def main():
    """Função principal para uso via linha de comando"""
    if len(sys.argv) < 2:
        print("Uso: python telegram_validator.py <token> [chat_id] [mensagem]")
        sys.exit(1)
    
    token = sys.argv[1]
    validator = TelegramValidator()
    
    # Validar token
    print(f"🔍 Validando token: {token[:20]}...")
    result = validator.validate_token(token)
    
    print(f"\n📊 Resultado da validação:")
    print(f"Status: {'✅ SUCESSO' if result['success'] else '❌ ERRO'}")
    print(f"Mensagem: {result['message']}")
    
    if result['success'] and 'bot_info' in result:
        bot_info = result['bot_info']
        print(f"\n🤖 Informações do Bot:")
        print(f"ID: {bot_info['id']}")
        print(f"Nome: {bot_info['first_name']}")
        print(f"Username: @{bot_info['username']}")
        print(f"É Bot: {bot_info['is_bot']}")
        print(f"Pode entrar em grupos: {bot_info['can_join_groups']}")
        print(f"Pode ler mensagens de grupo: {bot_info['can_read_all_group_messages']}")
        print(f"Suporte a consultas inline: {bot_info['supports_inline_queries']}")
        
        # Teste de envio de mensagem se chat_id foi fornecido
        if len(sys.argv) >= 3:
            chat_id = sys.argv[2]
            message = sys.argv[3] if len(sys.argv) >= 4 else f"🧪 Teste de conexão - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            
            print(f"\n📤 Testando envio de mensagem para chat {chat_id}...")
            send_result = validator.test_send_message(token, chat_id, message)
            print(f"Status: {'✅ SUCESSO' if send_result['success'] else '❌ ERRO'}")
            print(f"Mensagem: {send_result['message']}")
    
    # Retornar código de saída apropriado
    sys.exit(0 if result['success'] else 1)

if __name__ == "__main__":
    main()