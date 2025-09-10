import json
import re
from typing import Dict, List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import pickle
import os

class DeliveryIntentClassifier:
    def __init__(self, dataset_path: str = None):
        self.dataset_path = dataset_path or os.path.join(os.path.dirname(__file__), 'food_delivery_dataset.json')
        self.model = None
        self.intents_data = None
        self.load_dataset()
        
    def load_dataset(self):
        """Carrega o dataset de intenções"""
        try:
            with open(self.dataset_path, 'r', encoding='utf-8') as f:
                self.intents_data = json.load(f)
        except FileNotFoundError:
            print(f"Dataset não encontrado: {self.dataset_path}")
            self.intents_data = {"intents": {}, "entities": {}}
    
    def preprocess_text(self, text: str) -> str:
        """Pré-processa o texto para classificação"""
        # Converter para minúsculas
        text = text.lower()
        
        # Remover caracteres especiais, manter apenas letras, números e espaços
        text = re.sub(r'[^a-záàâãéèêíïóôõöúçñ\s]', '', text)
        
        # Remover espaços extras
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def prepare_training_data(self) -> Tuple[List[str], List[str]]:
        """Prepara os dados de treinamento"""
        texts = []
        labels = []
        
        for intent_name, intent_data in self.intents_data['intents'].items():
            for example in intent_data['examples']:
                texts.append(self.preprocess_text(example))
                labels.append(intent_name)
        
        return texts, labels
    
    def train_model(self):
        """Treina o modelo de classificação"""
        texts, labels = self.prepare_training_data()
        
        if not texts:
            print("Nenhum dado de treinamento encontrado")
            return False
        
        # Criar pipeline com TF-IDF e Naive Bayes
        self.model = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=1000)),
            ('classifier', MultinomialNB())
        ])
        
        # Treinar o modelo
        self.model.fit(texts, labels)
        
        print(f"Modelo treinado com {len(texts)} exemplos")
        return True
    
    def classify_intent(self, text: str, confidence_threshold: float = 0.3) -> Dict:
        """Classifica a intenção de uma mensagem"""
        if not self.model:
            return {
                'intent': 'unknown',
                'confidence': 0.0,
                'message': 'Modelo não treinado'
            }
        
        processed_text = self.preprocess_text(text)
        
        # Predição
        predicted_intent = self.model.predict([processed_text])[0]
        
        # Probabilidades
        probabilities = self.model.predict_proba([processed_text])[0]
        confidence = max(probabilities)
        
        # Verificar se a confiança está acima do threshold
        if confidence < confidence_threshold:
            return {
                'intent': 'unknown',
                'confidence': confidence,
                'message': 'Confiança baixa na classificação'
            }
        
        return {
            'intent': predicted_intent,
            'confidence': confidence,
            'message': 'Classificação realizada com sucesso'
        }
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extrai entidades do texto"""
        entities = {}
        text_lower = text.lower()
        
        for entity_type, entity_values in self.intents_data.get('entities', {}).items():
            found_entities = []
            for entity_value in entity_values:
                if entity_value.lower() in text_lower:
                    found_entities.append(entity_value)
            
            if found_entities:
                entities[entity_type] = found_entities
        
        return entities
    
    def get_response_template(self, intent: str) -> str:
        """Obtém template de resposta para uma intenção"""
        intent_data = self.intents_data['intents'].get(intent, {})
        responses = intent_data.get('responses', [])
        
        if responses:
            # Por simplicidade, retorna a primeira resposta
            # Em uma implementação mais avançada, poderia alternar ou escolher aleatoriamente
            return responses[0]
        
        return "Desculpe, não entendi sua mensagem. Pode reformular?"
    
    def save_model(self, model_path: str):
        """Salva o modelo treinado"""
        if self.model:
            with open(model_path, 'wb') as f:
                pickle.dump(self.model, f)
            print(f"Modelo salvo em: {model_path}")
    
    def load_model(self, model_path: str):
        """Carrega um modelo treinado"""
        try:
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            print(f"Modelo carregado de: {model_path}")
            return True
        except FileNotFoundError:
            print(f"Modelo não encontrado: {model_path}")
            return False

# Exemplo de uso
if __name__ == "__main__":
    # Inicializar classificador
    classifier = DeliveryIntentClassifier()
    
    # Treinar modelo
    if classifier.train_model():
        # Salvar modelo
        model_path = os.path.join(os.path.dirname(__file__), 'delivery_intent_model.pkl')
        classifier.save_model(model_path)
        
        # Testar classificação
        test_messages = [
            "Olá, bom dia!",
            "Qual é o cardápio de vocês?",
            "Quero fazer um pedido",
            "Quanto tempo demora a entrega?",
            "Aceitam cartão?",
            "Onde está meu pedido?"
        ]
        
        print("\n=== TESTES DE CLASSIFICAÇÃO ===")
        for message in test_messages:
            result = classifier.classify_intent(message)
            entities = classifier.extract_entities(message)
            response = classifier.get_response_template(result['intent'])
            
            print(f"\nMensagem: {message}")
            print(f"Intenção: {result['intent']} (confiança: {result['confidence']:.2f})")
            print(f"Entidades: {entities}")
            print(f"Resposta: {response}")
    else:
        print("Falha no treinamento do modelo")