import express from 'express';
import { registerTenant } from '../controllers/tenantController.js';

const tenantRouter = express.Router();

tenantRouter.post('/register', registerTenant);

export default tenantRouter;
