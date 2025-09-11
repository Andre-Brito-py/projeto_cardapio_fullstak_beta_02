import cron from 'node-cron';
import TelegramCampaign from '../models/telegramCampaignModel.js';
import TelegramService from './telegramService.js';
import TelegramClient from '../models/telegramClientModel.js';
import logger from '../utils/logger.js';

class TelegramCampaignScheduler {
    constructor() {
        this.isRunning = false;
        this.scheduledTasks = new Map();
    }

    /**
     * Inicializar o agendador de campanhas
     */
    init() {
        if (this.isRunning) {
            console.log('📅 Agendador de campanhas do Telegram já está rodando');
            return;
        }

        // Verificar campanhas agendadas a cada minuto
        cron.schedule('* * * * *', async () => {
            await this.checkScheduledCampaigns();
        });

        // Verificar campanhas pendentes na inicialização
        this.checkScheduledCampaigns();

        this.isRunning = true;
        console.log('📅 Agendador de campanhas do Telegram inicializado');
    }

    /**
     * Verificar e executar campanhas agendadas
     */
    async checkScheduledCampaigns() {
        try {
            const now = new Date();
            
            // Buscar campanhas agendadas para execução
            const scheduledCampaigns = await TelegramCampaign.find({
                status: 'scheduled',
                scheduledDate: { $lte: now }
            });

            for (const campaign of scheduledCampaigns) {
                await this.executeCampaign(campaign._id);
            }

        } catch (error) {
            logger.error('Erro ao verificar campanhas agendadas:', error);
        }
    }

    /**
     * Executar campanha específica
     */
    async executeCampaign(campaignId) {
        try {
            const campaign = await TelegramCampaign.findById(campaignId);
            
            if (!campaign || campaign.status !== 'scheduled') {
                return;
            }

            logger.info(`Executando campanha agendada: ${campaign.name}`);

            // Atualizar status para enviando
            campaign.status = 'sending';
            campaign.executionStartedAt = new Date();
            await campaign.save();
            await campaign.addExecutionLog('started', 'Execução automática iniciada');

            // Processar envio em background
            setImmediate(() => this.processCampaignExecution(campaignId));

        } catch (error) {
            logger.error(`Erro ao executar campanha ${campaignId}:`, error);
        }
    }

    /**
     * Processar execução da campanha em background
     */
    async processCampaignExecution(campaignId) {
        try {
            const campaign = await TelegramCampaign.findById(campaignId);
            if (!campaign) return;

            logger.info(`Processando campanha: ${campaign.name}`);

            // Buscar clientes baseado nos critérios
            let clientsQuery = {};
            
            if (campaign.targetCriteria.allActive) {
                clientsQuery.isActive = true;
            }
            
            if (campaign.targetCriteria.inactiveDays) {
                const inactiveDate = new Date();
                inactiveDate.setDate(inactiveDate.getDate() - campaign.targetCriteria.inactiveDays);
                clientsQuery.lastInteraction = { $lt: inactiveDate };
            }

            if (campaign.targetCriteria.hasOrdered !== undefined) {
                if (campaign.targetCriteria.hasOrdered) {
                    clientsQuery.totalOrders = { $gt: 0 };
                } else {
                    clientsQuery.totalOrders = { $eq: 0 };
                }
            }

            const clients = await TelegramClient.find(clientsQuery);
            
            campaign.stats.totalTargets = clients.length;
            await campaign.save();

            logger.info(`Enviando para ${clients.length} clientes`);

            // Inicializar serviço do Telegram
            const telegramService = new TelegramService();
            await telegramService.initialize();

            // Enviar mensagens com controle de taxa
            for (let i = 0; i < clients.length; i++) {
                const client = clients[i];
                
                try {
                    // Verificar se campanha ainda está ativa
                    const currentCampaign = await TelegramCampaign.findById(campaignId);
                    if (currentCampaign.status !== 'sending') {
                        logger.info(`Campanha ${campaignId} foi pausada ou cancelada`);
                        break;
                    }

                    // Enviar mensagem
                    await telegramService.sendMessage(client.chatId, campaign.message, {
                        parse_mode: 'HTML'
                    });
                    
                    campaign.stats.sent += 1;
                    campaign.stats.delivered += 1;
                    
                    // Atualizar cliente
                    client.lastInteraction = new Date();
                    await client.save();
                    
                    // Salvar progresso a cada 10 envios
                    if (i % 10 === 0) {
                        await campaign.save();
                        logger.info(`Progresso: ${campaign.stats.sent}/${campaign.stats.totalTargets}`);
                    }
                    
                    // Delay entre envios para evitar rate limiting
                    await new Promise(resolve => setTimeout(resolve, 
                        campaign.sendingConfig?.delayBetweenMessages || 1000
                    ));
                    
                } catch (error) {
                    logger.error(`Erro ao enviar para cliente ${client.chatId}:`, error);
                    campaign.stats.failed += 1;
                    
                    // Se muitos erros, pausar campanha
                    if (campaign.stats.failed > campaign.stats.totalTargets * 0.1) {
                        logger.warn(`Muitos erros na campanha ${campaignId}, pausando`);
                        campaign.status = 'paused';
                        await campaign.save();
                        await campaign.addExecutionLog('paused', 'Campanha pausada devido a muitos erros');
                        break;
                    }
                }
            }

            // Finalizar campanha se ainda estiver enviando
            const finalCampaign = await TelegramCampaign.findById(campaignId);
            if (finalCampaign.status === 'sending') {
                finalCampaign.status = 'completed';
                finalCampaign.executionCompletedAt = new Date();
                await finalCampaign.save();
                await finalCampaign.addExecutionLog('completed', 
                    `Campanha finalizada. Enviadas: ${finalCampaign.stats.sent}, Falhas: ${finalCampaign.stats.failed}`);
                
                logger.info(`Campanha ${campaignId} finalizada com sucesso`);
            }

        } catch (error) {
            logger.error('Erro no processamento da campanha:', error);
            
            // Marcar campanha como com erro
            const campaign = await TelegramCampaign.findById(campaignId);
            if (campaign) {
                campaign.status = 'error';
                await campaign.save();
                await campaign.addExecutionLog('error', `Erro na execução: ${error.message}`);
            }
        }
    }

    /**
     * Pausar campanha em execução
     */
    async pauseCampaign(campaignId) {
        try {
            const campaign = await TelegramCampaign.findById(campaignId);
            
            if (campaign && campaign.status === 'sending') {
                campaign.status = 'paused';
                await campaign.save();
                await campaign.addExecutionLog('paused', 'Campanha pausada manualmente');
                
                logger.info(`Campanha ${campaignId} pausada`);
                return true;
            }
            
            return false;
        } catch (error) {
            logger.error(`Erro ao pausar campanha ${campaignId}:`, error);
            return false;
        }
    }

    /**
     * Cancelar campanha
     */
    async cancelCampaign(campaignId) {
        try {
            const campaign = await TelegramCampaign.findById(campaignId);
            
            if (campaign && ['scheduled', 'sending', 'paused'].includes(campaign.status)) {
                campaign.status = 'cancelled';
                await campaign.save();
                await campaign.addExecutionLog('cancelled', 'Campanha cancelada manualmente');
                
                logger.info(`Campanha ${campaignId} cancelada`);
                return true;
            }
            
            return false;
        } catch (error) {
            logger.error(`Erro ao cancelar campanha ${campaignId}:`, error);
            return false;
        }
    }

    /**
     * Obter estatísticas do agendador
     */
    async getSchedulerStats() {
        try {
            const stats = await TelegramCampaign.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalSent: { $sum: '$stats.sent' },
                        totalFailed: { $sum: '$stats.failed' }
                    }
                }
            ]);

            const scheduledCount = await TelegramCampaign.countDocuments({
                status: 'scheduled',
                scheduledDate: { $gt: new Date() }
            });

            return {
                isRunning: this.isRunning,
                stats,
                upcomingScheduled: scheduledCount
            };
        } catch (error) {
            logger.error('Erro ao obter estatísticas do agendador:', error);
            return null;
        }
    }
}

const telegramCampaignScheduler = new TelegramCampaignScheduler();
export default telegramCampaignScheduler;