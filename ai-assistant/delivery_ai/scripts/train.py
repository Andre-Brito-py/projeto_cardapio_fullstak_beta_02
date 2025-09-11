#!/usr/bin/env python3
"""
Script de Treinamento da IA Liza para Sistema de Delivery
Realiza fine-tuning do modelo base usando Ollama
"""

import os
import json
import yaml
import logging
import requests
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Tuple
import pandas as pd
from sklearn.model_selection import train_test_split
import numpy as np

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DeliveryAITrainer:
    """
    Classe responsável pelo treinamento da IA de delivery
    """
    
    def __init__(self, config_path: str = "../config/config.yaml"):
        """
        Inicializa o trainer com configurações
        
        Args:
            config_path: Caminho para o arquivo de configuração
        """
        self.config_path = config_path
        self.config = self.load_config()
        self.ollama_url = f"http://{self.config['ollama']['host']}:{self.config['ollama']['port']}"
        self.setup_directories()
        
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
    
    def setup_directories(self):
        """
        Cria diretórios necessários para o treinamento
        """
        directories = [
            self.config['checkpoints']['save_dir'],
            'logs',
            'temp'
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)
            logger.info(f"Diretório criado/verificado: {directory}")
    
    def check_ollama_connection(self) -> bool:
        """
        Verifica se o Ollama está rodando
        
        Returns:
            True se conectado, False caso contrário
        """
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            if response.status_code == 200:
                logger.info("Conexão com Ollama estabelecida")
                return True
            else:
                logger.error(f"Ollama retornou status {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"Erro ao conectar com Ollama: {e}")
            return False
    
    def pull_base_model(self) -> bool:
        """
        Baixa o modelo base se não existir
        
        Returns:
            True se sucesso, False caso contrário
        """
        base_model = self.config['model']['base_model']
        
        try:
            # Verifica se o modelo já existe
            response = requests.get(f"{self.ollama_url}/api/tags")
            if response.status_code == 200:
                models = response.json().get('models', [])
                model_names = [model['name'] for model in models]
                
                if base_model in model_names:
                    logger.info(f"Modelo base {base_model} já existe")
                    return True
            
            # Baixa o modelo
            logger.info(f"Baixando modelo base {base_model}...")
            pull_data = {"name": base_model}
            
            response = requests.post(
                f"{self.ollama_url}/api/pull",
                json=pull_data,
                timeout=self.config['ollama']['model_pull_timeout']
            )
            
            if response.status_code == 200:
                logger.info(f"Modelo {base_model} baixado com sucesso")
                return True
            else:
                logger.error(f"Erro ao baixar modelo: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao baixar modelo base: {e}")
            return False
    
    def load_dataset(self) -> Tuple[List[Dict], List[Dict]]:
        """
        Carrega e processa o dataset de treinamento
        
        Returns:
            Tupla com dados de treino e validação
        """
        dataset_path = self.config['dataset']['train_file']
        
        try:
            # Carrega dados do arquivo JSONL
            data = []
            with open(dataset_path, 'r', encoding='utf-8') as file:
                for line in file:
                    if line.strip():
                        data.append(json.loads(line))
            
            logger.info(f"Dataset carregado: {len(data)} exemplos")
            
            # Divide em treino e validação
            validation_split = self.config['dataset']['validation_split']
            train_data, val_data = train_test_split(
                data, 
                test_size=validation_split, 
                random_state=self.config['dataset']['seed']
            )
            
            logger.info(f"Treino: {len(train_data)} exemplos")
            logger.info(f"Validação: {len(val_data)} exemplos")
            
            return train_data, val_data
            
        except Exception as e:
            logger.error(f"Erro ao carregar dataset: {e}")
            raise
    
    def prepare_training_data(self, data: List[Dict]) -> str:
        """
        Prepara dados para formato de treinamento do Ollama
        
        Args:
            data: Lista de exemplos de treino
            
        Returns:
            String formatada para treinamento
        """
        training_examples = []
        
        for example in data:
            # Formato para fine-tuning
            prompt = f"### Instrução:\nVocê é a Liza, assistente de delivery. Responda de forma natural e útil.\n\n### Entrada:\n{example['input']}\n\n### Resposta:\n{example['output']}"
            training_examples.append(prompt)
        
        return "\n\n".join(training_examples)
    
    def create_modelfile(self, training_data: str) -> str:
        """
        Cria Modelfile para fine-tuning
        
        Args:
            training_data: Dados de treinamento formatados
            
        Returns:
            Caminho do Modelfile criado
        """
        base_model = self.config['model']['base_model']
        fine_tuned_model = self.config['model']['fine_tuned_model']
        
        modelfile_content = f"""FROM {base_model}

# Configurações do modelo
PARAMETER temperature {self.config['model']['temperature']}
PARAMETER top_p {self.config['model']['top_p']}
PARAMETER num_ctx {self.config['model']['context_length']}

# Prompt do sistema
SYSTEM """
Você é a Liza, uma assistente virtual especializada em atendimento de delivery.

Suas características:
- Sempre educada e prestativa
- Conhece bem o cardápio e preços
- Ajuda com pedidos, modificações e dúvidas
- Informa tempos de entrega e status dos pedidos
- Resolve problemas de forma eficiente
- Promove ofertas quando apropriado

Regras importantes:
- Sempre confirme os dados do pedido
- Informe preços e tempos estimados
- Seja clara sobre taxas de entrega
- Mantenha tom amigável e profissional
- Ajude com modificações nos pedidos
- Ofereça alternativas quando necessário
"""

# Exemplos de treinamento
{training_data}
"""
        
        modelfile_path = "temp/Modelfile"
        with open(modelfile_path, 'w', encoding='utf-8') as file:
            file.write(modelfile_content)
        
        logger.info(f"Modelfile criado: {modelfile_path}")
        return modelfile_path
    
    def train_model(self, modelfile_path: str) -> bool:
        """
        Executa o treinamento do modelo
        
        Args:
            modelfile_path: Caminho do Modelfile
            
        Returns:
            True se sucesso, False caso contrário
        """
        fine_tuned_model = self.config['model']['fine_tuned_model']
        
        try:
            # Lê o Modelfile
            with open(modelfile_path, 'r', encoding='utf-8') as file:
                modelfile_content = file.read()
            
            # Cria o modelo fine-tuned
            logger.info(f"Iniciando treinamento do modelo {fine_tuned_model}...")
            
            create_data = {
                "name": fine_tuned_model,
                "modelfile": modelfile_content
            }
            
            response = requests.post(
                f"{self.ollama_url}/api/create",
                json=create_data,
                timeout=600  # 10 minutos timeout
            )
            
            if response.status_code == 200:
                logger.info(f"Modelo {fine_tuned_model} criado com sucesso")
                return True
            else:
                logger.error(f"Erro ao criar modelo: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Erro durante treinamento: {e}")
            return False
    
    def evaluate_model(self, val_data: List[Dict]) -> Dict[str, float]:
        """
        Avalia o modelo treinado
        
        Args:
            val_data: Dados de validação
            
        Returns:
            Métricas de avaliação
        """
        fine_tuned_model = self.config['model']['fine_tuned_model']
        
        try:
            correct_responses = 0
            total_responses = len(val_data)
            
            logger.info("Iniciando avaliação do modelo...")
            
            for i, example in enumerate(val_data[:10]):  # Avalia apenas 10 exemplos por velocidade
                # Gera resposta
                generate_data = {
                    "model": fine_tuned_model,
                    "prompt": example['input'],
                    "stream": False
                }
                
                response = requests.post(
                    f"{self.ollama_url}/api/generate",
                    json=generate_data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    generated = response.json().get('response', '')
                    expected = example['output']
                    
                    # Avaliação simples baseada em palavras-chave
                    if self.evaluate_response_quality(generated, expected):
                        correct_responses += 1
                
                if (i + 1) % 5 == 0:
                    logger.info(f"Avaliação: {i + 1}/10 exemplos processados")
            
            accuracy = correct_responses / min(10, total_responses)
            
            metrics = {
                'accuracy': accuracy,
                'evaluated_samples': min(10, total_responses),
                'correct_responses': correct_responses
            }
            
            logger.info(f"Avaliação concluída: {metrics}")
            return metrics
            
        except Exception as e:
            logger.error(f"Erro durante avaliação: {e}")
            return {'accuracy': 0.0, 'error': str(e)}
    
    def evaluate_response_quality(self, generated: str, expected: str) -> bool:
        """
        Avalia qualidade da resposta gerada
        
        Args:
            generated: Resposta gerada pelo modelo
            expected: Resposta esperada
            
        Returns:
            True se resposta é considerada boa
        """
        # Palavras-chave importantes
        keywords = ['pedido', 'pizza', 'hambúrguer', 'entrega', 'tempo', 'preço', 'confirmar']
        
        generated_lower = generated.lower()
        expected_lower = expected.lower()
        
        # Verifica se contém palavras-chave relevantes
        keyword_match = any(keyword in generated_lower for keyword in keywords if keyword in expected_lower)
        
        # Verifica comprimento razoável
        length_ok = 10 <= len(generated) <= 500
        
        # Verifica se não é resposta genérica demais
        not_generic = len(generated.split()) > 3
        
        return keyword_match and length_ok and not_generic
    
    def save_checkpoint(self, metrics: Dict[str, float], epoch: int = 0):
        """
        Salva checkpoint do treinamento
        
        Args:
            metrics: Métricas do modelo
            epoch: Época atual
        """
        checkpoint_dir = self.config['checkpoints']['save_dir']
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        checkpoint_data = {
            'model_name': self.config['model']['fine_tuned_model'],
            'timestamp': timestamp,
            'epoch': epoch,
            'metrics': metrics,
            'config': self.config
        }
        
        checkpoint_path = f"{checkpoint_dir}/checkpoint_{timestamp}.json"
        
        with open(checkpoint_path, 'w', encoding='utf-8') as file:
            json.dump(checkpoint_data, file, indent=2, ensure_ascii=False)
        
        logger.info(f"Checkpoint salvo: {checkpoint_path}")
    
    def run_training(self):
        """
        Executa o pipeline completo de treinamento
        """
        logger.info("=== Iniciando Treinamento da IA Liza para Delivery ===")
        
        try:
            # 1. Verifica conexão com Ollama
            if not self.check_ollama_connection():
                raise Exception("Não foi possível conectar ao Ollama")
            
            # 2. Baixa modelo base
            if not self.pull_base_model():
                raise Exception("Erro ao baixar modelo base")
            
            # 3. Carrega dataset
            train_data, val_data = self.load_dataset()
            
            # 4. Prepara dados de treinamento
            training_text = self.prepare_training_data(train_data)
            
            # 5. Cria Modelfile
            modelfile_path = self.create_modelfile(training_text)
            
            # 6. Treina modelo
            if not self.train_model(modelfile_path):
                raise Exception("Erro durante treinamento")
            
            # 7. Avalia modelo
            metrics = self.evaluate_model(val_data)
            
            # 8. Salva checkpoint
            self.save_checkpoint(metrics)
            
            logger.info("=== Treinamento Concluído com Sucesso ===")
            logger.info(f"Métricas finais: {metrics}")
            
            return True
            
        except Exception as e:
            logger.error(f"Erro durante treinamento: {e}")
            return False

def main():
    """
    Função principal
    """
    trainer = DeliveryAITrainer()
    success = trainer.run_training()
    
    if success:
        print("\n✅ Treinamento concluído com sucesso!")
        print(f"Modelo treinado: {trainer.config['model']['fine_tuned_model']}")
        print("\nPara usar o modelo:")
        print(f"ollama run {trainer.config['model']['fine_tuned_model']}")
    else:
        print("\n❌ Erro durante o treinamento. Verifique os logs.")
        exit(1)

if __name__ == "__main__":
    main()