import express from 'express';
import {
    loginAttendant,
    registerAttendant,
    getStoreAttendants,
    updateAttendant,
    toggleAttendantStatus,
    changeAttendantPassword,
    getAttendantProfile
} from '../controllers/counterAttendantController.js';
import { counterAuth } from '../middleware/counterAuth.js';
import authMiddleware from '../middleware/auth.js'; // Para admins

const counterAttendantRouter = express.Router();

// Rotas públicas (sem autenticação)
counterAttendantRouter.post('/login', loginAttendant);

// Rotas para atendentes autenticados
counterAttendantRouter.get('/profile', counterAuth, getAttendantProfile);
counterAttendantRouter.put('/change-password', counterAuth, changeAttendantPassword);

// Rotas para administradores (gerenciar atendentes)
counterAttendantRouter.post('/register', authMiddleware, registerAttendant);
counterAttendantRouter.get('/store/:storeId?', authMiddleware, getStoreAttendants);
counterAttendantRouter.put('/:id', authMiddleware, updateAttendant);
counterAttendantRouter.patch('/:id/toggle-status', authMiddleware, toggleAttendantStatus);

export default counterAttendantRouter;