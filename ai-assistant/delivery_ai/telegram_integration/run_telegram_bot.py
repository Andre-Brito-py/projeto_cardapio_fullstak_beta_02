#!/usr/bin/env python3
"""
Script de inicialização do Bot Telegram - IA Liza Delivery
Gerencia bot principal e sistema promocional
"""

import os
import sys
import asyncio
import logging
import signal
from pathlib import Path

# Adiciona o diretório pai ao path para imports
sys.path.append(str(Path(__file__).parent.parent))

from telegram_integration.telegram_bot import LizaTelegramBot
from telegram_integration.promotional_system import PromotionalSystem

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('telegram_bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class TelegramBotManager:
    """
    Gerenciador principal do bot Telegram
    """
    
    def __init__(self):
        self.bot = None
        self.promo_system = None
        self.running = False
        self.scheduler_task = None
    
    async def setup(self):
        """
        Configura o sistema
        """
        try:
            logger.info("Iniciando configuração do sistema...")
            
            # Inicializa bot principal
            self.bot = LizaTelegramBot()
            
            # Inicializa sistema promocional
            self.promo_system = PromotionalSystem()
            await self.promo_system.setup()
            
            logger.info("Sistema configurado com sucesso")
            
        except Exception as e:
            logger.error(f"Erro na configuração: {e}")
            raise
    
    async def start_scheduler(self):
        """
        Inicia agendador de campanhas
        """
        logger.info("Iniciando agendador de campanhas...")
        
        while self.running:
            try:
                # Verifica campanhas agendadas a cada minuto
                await self.promo_system.schedule_campaign_check()
                await asyncio.sleep(60)  # 1 minuto
                
            except Exception as e:
                logger.error(f"Erro no agendador: {e}")
                await asyncio.sleep(60)
    
    async def cleanup_scheduler(self):
        """
        Agendador de limpeza (executa diariamente)
        """
        logger.info("Iniciando agendador de limpeza...")
        
        while self.running:
            try:
                # Limpa campanhas antigas a cada 24 horas
                await self.promo_system.cleanup_old_campaigns(days=30)
                await asyncio.sleep(86400)  # 24 horas
                
            except Exception as e:
                logger.error(f"Erro na limpeza: {e}")
                await asyncio.sleep(3600)  # Tenta novamente em 1 hora
    
    async def run(self):
        """
        Executa o sistema completo
        """
        try:
            await self.setup()
            
            self.running = True
            
            # Inicia tarefas em paralelo
            tasks = [
                asyncio.create_task(self.bot.run()),
                asyncio.create_task(self.start_scheduler()),
                asyncio.create_task(self.cleanup_scheduler())
            ]
            
            logger.info("Sistema Telegram iniciado com sucesso!")
            logger.info("Bot: Ativo")
            logger.info("Sistema Promocional: Ativo")
            logger.info("Agendador: Ativo")
            
            # Aguarda todas as tarefas
            await asyncio.gather(*tasks)
            
        except KeyboardInterrupt:
            logger.info("Interrupção recebida, finalizando...")
        except Exception as e:
            logger.error(f"Erro na execução: {e}")
        finally:
            await self.shutdown()
    
    async def shutdown(self):
        """
        Finaliza o sistema graciosamente
        """
        logger.info("Finalizando sistema...")
        
        self.running = False
        
        # Cancela tarefas pendentes
        tasks = [task for task in asyncio.all_tasks() if not task.done()]
        for task in tasks:
            task.cancel()
        
        # Aguarda finalização
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        
        logger.info("Sistema finalizado")

def signal_handler(signum, frame):
    """
    Handler para sinais do sistema
    """
    logger.info(f"Sinal {signum} recebido, finalizando...")
    sys.exit(0)

async def main():
    """
    Função principal
    """
    # Configura handlers de sinal
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Verifica variáveis de ambiente necessárias
    required_env_vars = [
        'TELEGRAM_BOT_TOKEN',
        'REDIS_URL'
    ]
    
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    if missing_vars:
        logger.error(f"Variáveis de ambiente faltando: {missing_vars}")
        logger.info("Configure as seguintes variáveis:")
        logger.info("TELEGRAM_BOT_TOKEN=seu_token_do_bot")
        logger.info("REDIS_URL=redis://localhost:6379")
        return
    
    # Inicia o gerenciador
    manager = TelegramBotManager()
    await manager.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Aplicação finalizada pelo usuário")
    except Exception as e:
        logger.error(f"Erro fatal: {e}")
        sys.exit(1)