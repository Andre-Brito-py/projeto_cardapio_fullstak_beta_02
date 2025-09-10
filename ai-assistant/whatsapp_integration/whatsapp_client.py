import requests
import json
import os
from typing import Dict, List, Optional
from datetime import datetime
import logging

class WhatsAppClient:
    def __init__(self, access_token: str, phone_number_id: str, webhook_verify_token: str = None):
        self.access_token = access_token
        self.phone_number_id = phone_number_id
        self.webhook_verify_token = webhook_verify_token
        self.base_url = f"https://graph.facebook.com/v18.0/{phone_number_id}"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Configurar logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def send_text_message(self, to: str, message: str) -> Dict:
        """Envia mensagem de texto"""
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {
                "body": message
            }
        }
        
        return self._send_message(payload)
    
    def send_template_message(self, to: str, template_name: str, language_code: str = "pt_BR", 
                            components: List[Dict] = None) -> Dict:
        """Envia mensagem usando template aprovado"""
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {
                    "code": language_code
                }
            }
        }
        
        if components:
            payload["template"]["components"] = components
        
        return self._send_message(payload)
    
    def send_interactive_message(self, to: str, message_type: str, header: str = None, 
                               body: str = None, footer: str = None, 
                               buttons: List[Dict] = None, sections: List[Dict] = None) -> Dict:
        """Envia mensagem interativa com botões ou lista"""
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "interactive",
            "interactive": {
                "type": message_type
            }
        }
        
        # Adicionar header se fornecido
        if header:
            payload["interactive"]["header"] = {
                "type": "text",
                "text": header
            }
        
        # Adicionar body se fornecido
        if body:
            payload["interactive"]["body"] = {
                "text": body
            }
        
        # Adicionar footer se fornecido
        if footer:
            payload["interactive"]["footer"] = {
                "text": footer
            }
        
        # Adicionar botões ou seções baseado no tipo
        if message_type == "button" and buttons:
            payload["interactive"]["action"] = {
                "buttons": buttons
            }
        elif message_type == "list" and sections:
            payload["interactive"]["action"] = {
                "button": "Ver opções",
                "sections": sections
            }
        
        return self._send_message(payload)
    
    def send_media_message(self, to: str, media_type: str, media_id: str = None, 
                          media_url: str = None, caption: str = None) -> Dict:
        """Envia mensagem com mídia (imagem, áudio, vídeo, documento)"""
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": media_type,
            media_type: {}
        }
        
        # Usar ID da mídia ou URL
        if media_id:
            payload[media_type]["id"] = media_id
        elif media_url:
            payload[media_type]["link"] = media_url
        else:
            raise ValueError("É necessário fornecer media_id ou media_url")
        
        # Adicionar legenda se fornecida
        if caption and media_type in ["image", "video", "document"]:
            payload[media_type]["caption"] = caption
        
        return self._send_message(payload)
    
    def send_location_message(self, to: str, latitude: float, longitude: float, 
                            name: str = None, address: str = None) -> Dict:
        """Envia mensagem de localização"""
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "location",
            "location": {
                "latitude": latitude,
                "longitude": longitude
            }
        }
        
        if name:
            payload["location"]["name"] = name
        if address:
            payload["location"]["address"] = address
        
        return self._send_message(payload)
    
    def _send_message(self, payload: Dict) -> Dict:
        """Método interno para enviar mensagens"""
        try:
            url = f"{self.base_url}/messages"
            response = requests.post(url, headers=self.headers, json=payload)
            
            if response.status_code == 200:
                result = response.json()
                self.logger.info(f"Mensagem enviada com sucesso: {result.get('messages', [{}])[0].get('id')}")
                return {
                    "success": True,
                    "message_id": result.get('messages', [{}])[0].get('id'),
                    "data": result
                }
            else:
                error_data = response.json()
                self.logger.error(f"Erro ao enviar mensagem: {error_data}")
                return {
                    "success": False,
                    "error": error_data,
                    "status_code": response.status_code
                }
        
        except Exception as e:
            self.logger.error(f"Exceção ao enviar mensagem: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def upload_media(self, media_path: str, media_type: str) -> Dict:
        """Faz upload de mídia para o WhatsApp"""
        try:
            url = f"https://graph.facebook.com/v18.0/{self.phone_number_id}/media"
            
            with open(media_path, 'rb') as media_file:
                files = {
                    'file': (os.path.basename(media_path), media_file, f'{media_type}/*')
                }
                data = {
                    'messaging_product': 'whatsapp',
                    'type': media_type
                }
                headers = {
                    "Authorization": f"Bearer {self.access_token}"
                }
                
                response = requests.post(url, headers=headers, data=data, files=files)
            
            if response.status_code == 200:
                result = response.json()
                media_id = result.get('id')
                self.logger.info(f"Mídia enviada com sucesso: {media_id}")
                return {
                    "success": True,
                    "media_id": media_id,
                    "data": result
                }
            else:
                error_data = response.json()
                self.logger.error(f"Erro ao enviar mídia: {error_data}")
                return {
                    "success": False,
                    "error": error_data,
                    "status_code": response.status_code
                }
        
        except Exception as e:
            self.logger.error(f"Exceção ao enviar mídia: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_media_url(self, media_id: str) -> Dict:
        """Obtém URL de mídia pelo ID"""
        try:
            url = f"https://graph.facebook.com/v18.0/{media_id}"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "url": result.get('url'),
                    "data": result
                }
            else:
                error_data = response.json()
                return {
                    "success": False,
                    "error": error_data,
                    "status_code": response.status_code
                }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def mark_as_read(self, message_id: str) -> Dict:
        """Marca mensagem como lida"""
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id
        }
        
        try:
            url = f"{self.base_url}/messages"
            response = requests.post(url, headers=self.headers, json=payload)
            
            if response.status_code == 200:
                return {"success": True}
            else:
                return {
                    "success": False,
                    "error": response.json(),
                    "status_code": response.status_code
                }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def verify_webhook(self, mode: str, token: str, challenge: str) -> str:
        """Verifica webhook do WhatsApp"""
        if mode == "subscribe" and token == self.webhook_verify_token:
            return challenge
        else:
            raise ValueError("Token de verificação inválido")

# Exemplo de uso
if __name__ == "__main__":
    # Configurações (normalmente viriam de variáveis de ambiente)
    ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
    PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN")
    
    if ACCESS_TOKEN and PHONE_NUMBER_ID:
        client = WhatsAppClient(ACCESS_TOKEN, PHONE_NUMBER_ID, VERIFY_TOKEN)
        
        # Teste de envio de mensagem
        test_number = "5511999999999"  # Substitua por um número real para teste
        
        # Enviar mensagem de texto
        result = client.send_text_message(test_number, "Olá! Esta é uma mensagem de teste da Liza AI! 🤖")
        print(f"Resultado do envio: {result}")
    else:
        print("Configure as variáveis de ambiente WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID")