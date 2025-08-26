import express from 'express'
import { loginUser, registerUser } from '../controllers/userController.js'
import { identifyStore, addStoreContext } from '../middleware/multiTenancy.js';

const userRouter = express.Router();

// Rotas de autenticação com contexto de loja
userRouter.post('/register', identifyStore, addStoreContext, registerUser)
userRouter.post('/login', identifyStore, addStoreContext, loginUser)

export default userRouter;
