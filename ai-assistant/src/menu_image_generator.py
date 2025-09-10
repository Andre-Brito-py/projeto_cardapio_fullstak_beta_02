import json
import os
import base64
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime
from langchain_community.chat_models import ChatOllama
import tempfile
from PIL import Image, ImageDraw, ImageFont
import io

class MenuImageGenerator:
    """Gerador automático de imagens para pratos do cardápio usando IA"""
    
    def __init__(self, backend_api_url: str):
        self.backend_api_url = backend_api_url.rstrip('/')
        
        # Inicializar modelo Ollama para descrições
        self.llm = ChatOllama(
            model="llama3.1",
            temperature=0.7,
            base_url="http://localhost:11434"
        )
        
        # Configurações de estilo para diferentes tipos de comida
        self.style_presets = {
            "italiana": {
                "style": "rustic Italian kitchen, warm lighting, wooden table",
                "colors": ["#8B4513", "#DAA520", "#CD853F"],
                "mood": "cozy, traditional, appetizing"
            },
            "japonesa": {
                "style": "minimalist Japanese presentation, clean white background",
                "colors": ["#000000", "#FFFFFF", "#FF6B6B"],
                "mood": "elegant, clean, artistic"
            },
            "fast_food": {
                "style": "vibrant, colorful, modern food photography",
                "colors": ["#FF4444", "#FFD700", "#32CD32"],
                "mood": "energetic, fun, appetizing"
            },
            "saudavel": {
                "style": "fresh, natural lighting, organic presentation",
                "colors": ["#228B22", "#90EE90", "#FFA500"],
                "mood": "fresh, healthy, natural"
            },
            "sobremesas": {
                "style": "dreamy, soft lighting, elegant presentation",
                "colors": ["#FFB6C1", "#DDA0DD", "#F0E68C"],
                "mood": "sweet, indulgent, tempting"
            },
            "default": {
                "style": "professional food photography, appetizing presentation",
                "colors": ["#8B4513", "#DAA520", "#228B22"],
                "mood": "delicious, professional, appealing"
            }
        }
        
    def generate_enhanced_description(self, menu_item: Dict) -> str:
        """Gera descrição aprimorada para o prompt de imagem"""
        
        item_name = menu_item.get('name', '')
        description = menu_item.get('description', '')
        category = menu_item.get('category', '').lower()
        ingredients = menu_item.get('ingredients', [])
        
        prompt = f"""
        Crie uma descrição visual detalhada e apetitosa para gerar uma imagem de:
        
        PRATO: {item_name}
        DESCRIÇÃO: {description}
        CATEGORIA: {category}
        INGREDIENTES: {', '.join(ingredients) if ingredients else 'Não especificado'}
        
        Gere uma descrição em inglês para IA de imagem que inclua:
        1. Aparência visual do prato (cores, texturas, formato)
        2. Apresentação e pratos/utensílios
        3. Iluminação e ambiente
        4. Detalhes que tornam o prato apetitoso
        5. Estilo fotográfico apropriado
        
        Foque em:
        - Detalhes visuais específicos
        - Cores vibrantes e apetitosas
        - Apresentação profissional
        - Elementos que despertam apetite
        
        Responda apenas com a descrição em inglês, sem explicações adicionais.
        Máximo 150 palavras.
        """
        
        try:
            response = self.llm.invoke(prompt)
            return response.content.strip()
        except Exception as e:
            print(f"Erro ao gerar descrição: {e}")
            return self._get_fallback_description(item_name, category)
            
    def _get_fallback_description(self, item_name: str, category: str) -> str:
        """Descrição de fallback caso a IA falhe"""
        fallback_descriptions = {
            "pizza": "Delicious pizza with melted cheese, fresh toppings, golden crust, professional food photography, warm lighting",
            "hamburguer": "Juicy burger with fresh lettuce, tomato, cheese, sesame bun, appetizing presentation, vibrant colors",
            "sushi": "Fresh sushi rolls, elegant presentation, minimalist style, clean background, artistic arrangement",
            "salada": "Fresh colorful salad, vibrant vegetables, healthy presentation, natural lighting, appetizing arrangement",
            "sobremesa": "Decadent dessert, rich colors, elegant plating, soft lighting, tempting presentation"
        }
        
        for key, desc in fallback_descriptions.items():
            if key in item_name.lower() or key in category:
                return desc
                
        return f"Delicious {item_name}, professional food photography, appetizing presentation, vibrant colors, warm lighting"
        
    def create_prompt_for_image_generation(self, menu_item: Dict) -> str:
        """Cria prompt completo para geração de imagem"""
        
        # Obter descrição aprimorada
        enhanced_description = self.generate_enhanced_description(menu_item)
        
        # Determinar estilo baseado na categoria
        category = menu_item.get('category', '').lower()
        style_preset = self.style_presets.get(category, self.style_presets['default'])
        
        # Construir prompt final
        final_prompt = f"""
        {enhanced_description}
        
        Style: {style_preset['style']}
        Mood: {style_preset['mood']}
        
        High quality, professional food photography, 4K resolution, appetizing, 
        commercial grade, restaurant menu quality, perfect lighting, 
        sharp focus, delicious appearance, mouth-watering presentation.
        
        Avoid: people, hands, text, watermarks, logos, blurry images.
        """
        
        return final_prompt.strip()
        
    def generate_image_with_stable_diffusion(self, prompt: str, menu_item: Dict) -> Optional[str]:
        """Gera imagem usando Stable Diffusion (simulação - integraria com API real)"""
        
        # Em produção, integraria com:
        # - Stability AI API
        # - Replicate API
        # - Local Stable Diffusion
        # - DALL-E API
        
        try:
            # Simulação de chamada para API de geração de imagem
            # Na implementação real, faria requisição HTTP para serviço de IA
            
            print(f"Gerando imagem para: {menu_item.get('name')}")
            print(f"Prompt: {prompt[:100]}...")
            
            # Simular resposta da API
            simulated_response = {
                "success": True,
                "image_url": f"https://generated-images.example.com/{menu_item.get('id', 'unknown')}.jpg",
                "image_base64": self._create_placeholder_image(menu_item),
                "generation_time": "3.2s",
                "model_used": "stable-diffusion-xl"
            }
            
            return simulated_response
            
        except Exception as e:
            print(f"Erro na geração de imagem: {e}")
            return None
            
    def _create_placeholder_image(self, menu_item: Dict) -> str:
        """Cria imagem placeholder para demonstração"""
        
        # Criar imagem placeholder com informações do prato
        img = Image.new('RGB', (512, 512), color='#f0f0f0')
        draw = ImageDraw.Draw(img)
        
        try:
            # Tentar usar fonte padrão
            font = ImageFont.load_default()
        except:
            font = None
            
        # Desenhar informações do prato
        item_name = menu_item.get('name', 'Prato')[:20]
        category = menu_item.get('category', 'Categoria')[:15]
        price = f"R$ {menu_item.get('price', '0.00')}"
        
        # Cores baseadas na categoria
        category_lower = category.lower()
        if 'pizza' in category_lower or 'italiana' in category_lower:
            bg_color = '#8B4513'
        elif 'sushi' in category_lower or 'japonesa' in category_lower:
            bg_color = '#FF6B6B'
        elif 'salada' in category_lower or 'saudavel' in category_lower:
            bg_color = '#228B22'
        elif 'sobremesa' in category_lower or 'doce' in category_lower:
            bg_color = '#FFB6C1'
        else:
            bg_color = '#DAA520'
            
        # Desenhar fundo colorido
        draw.rectangle([50, 50, 462, 462], fill=bg_color)
        
        # Desenhar textos
        draw.text((256, 200), item_name, fill='white', anchor='mm', font=font)
        draw.text((256, 250), category, fill='white', anchor='mm', font=font)
        draw.text((256, 300), price, fill='white', anchor='mm', font=font)
        draw.text((256, 350), '🍽️ Imagem Gerada por IA', fill='white', anchor='mm', font=font)
        
        # Converter para base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return img_base64
        
    def generate_images_for_menu(self, store_id: str, menu_items: List[Dict] = None) -> Dict:
        """Gera imagens para todos os itens do cardápio"""
        
        if not menu_items:
            menu_items = self.get_store_menu(store_id)
            
        if not menu_items:
            return {'success': False, 'error': 'Cardápio não encontrado'}
            
        results = {
            'success': True,
            'total_items': len(menu_items),
            'generated_images': [],
            'failed_items': [],
            'generation_stats': {
                'start_time': datetime.now().isoformat(),
                'total_time': None,
                'success_rate': 0
            }
        }
        
        start_time = datetime.now()
        
        for item in menu_items:
            try:
                # Verificar se item já tem imagem
                if item.get('image_url') and not item.get('regenerate_image', False):
                    print(f"Item {item.get('name')} já possui imagem")
                    continue
                    
                # Gerar prompt
                prompt = self.create_prompt_for_image_generation(item)
                
                # Gerar imagem
                image_result = self.generate_image_with_stable_diffusion(prompt, item)
                
                if image_result and image_result.get('success'):
                    # Salvar resultado
                    generated_item = {
                        'item_id': item.get('id'),
                        'item_name': item.get('name'),
                        'image_url': image_result.get('image_url'),
                        'image_base64': image_result.get('image_base64'),
                        'prompt_used': prompt,
                        'generation_time': image_result.get('generation_time'),
                        'generated_at': datetime.now().isoformat()
                    }
                    
                    results['generated_images'].append(generated_item)
                    
                    # Atualizar item no backend (simulação)
                    self.update_menu_item_image(store_id, item.get('id'), image_result.get('image_url'))
                    
                else:
                    results['failed_items'].append({
                        'item_id': item.get('id'),
                        'item_name': item.get('name'),
                        'error': 'Falha na geração da imagem'
                    })
                    
            except Exception as e:
                results['failed_items'].append({
                    'item_id': item.get('id'),
                    'item_name': item.get('name'),
                    'error': str(e)
                })
                
        # Calcular estatísticas finais
        end_time = datetime.now()
        results['generation_stats']['end_time'] = end_time.isoformat()
        results['generation_stats']['total_time'] = str(end_time - start_time)
        results['generation_stats']['success_rate'] = (
            len(results['generated_images']) / len(menu_items) * 100
            if menu_items else 0
        )
        
        return results
        
    def generate_batch_images_by_category(self, store_id: str, category: str) -> Dict:
        """Gera imagens para todos os itens de uma categoria específica"""
        
        menu_items = self.get_store_menu(store_id)
        category_items = [
            item for item in menu_items 
            if item.get('category', '').lower() == category.lower()
        ]
        
        if not category_items:
            return {
                'success': False, 
                'error': f'Nenhum item encontrado na categoria {category}'
            }
            
        return self.generate_images_for_menu(store_id, category_items)
        
    def analyze_menu_for_image_needs(self, store_id: str) -> Dict:
        """Analisa cardápio e identifica necessidades de imagem"""
        
        menu_items = self.get_store_menu(store_id)
        
        if not menu_items:
            return {'success': False, 'error': 'Cardápio não encontrado'}
            
        analysis = {
            'total_items': len(menu_items),
            'items_with_images': 0,
            'items_without_images': 0,
            'items_needing_update': 0,
            'categories_analysis': {},
            'priority_items': [],
            'recommendations': []
        }
        
        categories = {}
        
        for item in menu_items:
            category = item.get('category', 'Sem categoria')
            
            if category not in categories:
                categories[category] = {
                    'total': 0,
                    'with_images': 0,
                    'without_images': 0
                }
                
            categories[category]['total'] += 1
            
            if item.get('image_url'):
                analysis['items_with_images'] += 1
                categories[category]['with_images'] += 1
                
                # Verificar se imagem precisa de atualização
                if self._image_needs_update(item):
                    analysis['items_needing_update'] += 1
            else:
                analysis['items_without_images'] += 1
                categories[category]['without_images'] += 1
                
                # Adicionar à lista de prioridade
                if item.get('popular', False) or item.get('featured', False):
                    analysis['priority_items'].append({
                        'id': item.get('id'),
                        'name': item.get('name'),
                        'category': category,
                        'reason': 'Item popular/destacado sem imagem'
                    })
                    
        analysis['categories_analysis'] = categories
        
        # Gerar recomendações
        if analysis['items_without_images'] > 0:
            analysis['recommendations'].append(
                f"Gerar imagens para {analysis['items_without_images']} itens sem foto"
            )
            
        if analysis['priority_items']:
            analysis['recommendations'].append(
                f"Priorizar {len(analysis['priority_items'])} itens populares"
            )
            
        if analysis['items_needing_update'] > 0:
            analysis['recommendations'].append(
                f"Atualizar {analysis['items_needing_update']} imagens antigas"
            )
            
        return analysis
        
    def _image_needs_update(self, item: Dict) -> bool:
        """Verifica se imagem do item precisa ser atualizada"""
        
        # Critérios para atualização:
        # - Imagem muito antiga
        # - Baixa qualidade
        # - Não condiz com descrição atual
        
        image_date = item.get('image_updated_at')
        if image_date:
            try:
                img_date = datetime.fromisoformat(image_date.replace('Z', '+00:00'))
                days_old = (datetime.now() - img_date.replace(tzinfo=None)).days
                return days_old > 90  # Mais de 3 meses
            except:
                return True
                
        return False
        
    def get_store_menu(self, store_id: str) -> List[Dict]:
        """Busca cardápio da loja"""
        try:
            response = requests.get(f"{self.backend_api_url}/api/stores/{store_id}/menu")
            if response.status_code == 200:
                return response.json().get('menu', [])
        except Exception as e:
            print(f"Erro ao buscar cardápio: {e}")
        return []
        
    def update_menu_item_image(self, store_id: str, item_id: str, image_url: str) -> bool:
        """Atualiza URL da imagem do item no backend"""
        try:
            response = requests.patch(
                f"{self.backend_api_url}/api/stores/{store_id}/menu/{item_id}",
                json={
                    'image_url': image_url,
                    'image_updated_at': datetime.now().isoformat()
                }
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Erro ao atualizar imagem: {e}")
            return False
            
    def create_image_generation_report(self, results: Dict) -> str:
        """Cria relatório detalhado da geração de imagens"""
        
        report = f"""
        📸 RELATÓRIO DE GERAÇÃO DE IMAGENS
        =====================================
        
        📊 ESTATÍSTICAS GERAIS:
        • Total de itens processados: {results.get('total_items', 0)}
        • Imagens geradas com sucesso: {len(results.get('generated_images', []))}
        • Falhas na geração: {len(results.get('failed_items', []))}
        • Taxa de sucesso: {results.get('generation_stats', {}).get('success_rate', 0):.1f}%
        • Tempo total: {results.get('generation_stats', {}).get('total_time', 'N/A')}
        
        ✅ IMAGENS GERADAS:
        """
        
        for img in results.get('generated_images', []):
            report += f"• {img.get('item_name')} - {img.get('generation_time')}\n"
            
        if results.get('failed_items'):
            report += "\n❌ FALHAS:\n"
            for fail in results.get('failed_items', []):
                report += f"• {fail.get('item_name')}: {fail.get('error')}\n"
                
        report += "\n🎯 PRÓXIMOS PASSOS:\n"
        report += "• Revisar imagens geradas\n"
        report += "• Ajustar prompts se necessário\n"
        report += "• Regenerar imagens com falha\n"
        report += "• Atualizar cardápio no sistema\n"
        
        return report