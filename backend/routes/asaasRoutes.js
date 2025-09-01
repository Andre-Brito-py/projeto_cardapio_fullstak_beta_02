import express from 'express';
import {
  criarAssinaturaLoja,
  cancelarAssinaturaLoja,
  obterDetalhesAssinatura,
  listarHistoricoPagamentos,
  webhookAsaas,
  dashboardSuperAdmin,
  listarLogsPagamentos,
  reprocessarPagamento,
  sincronizarAsaas
} from '../controllers/asaasController.js';
import authMiddleware from '../middleware/auth.js';
import { isSuperAdmin } from '../middleware/superAdmin.js';

const router = express.Router();

// Webhook público (sem autenticação)
router.post('/webhook/asaas', webhookAsaas);

// Rotas protegidas por autenticação
router.use(authMiddleware);

// Rotas para gerenciamento de assinaturas (Super Admin)
router.post('/subscriptions', isSuperAdmin, criarAssinaturaLoja);
router.delete('/subscriptions/:lojaId', isSuperAdmin, cancelarAssinaturaLoja);
router.get('/subscriptions/:lojaId', obterDetalhesAssinatura);
router.get('/subscriptions/:lojaId/payments', listarHistoricoPagamentos);
router.post('/subscriptions/:lojaId/sync', isSuperAdmin, sincronizarAsaas);

// Rotas do dashboard Super Admin
router.get('/admin/dashboard', isSuperAdmin, dashboardSuperAdmin);
router.get('/admin/payment-logs', isSuperAdmin, listarLogsPagamentos);
router.post('/admin/payments/:paymentId/reprocess', isSuperAdmin, reprocessarPagamento);

export default router;