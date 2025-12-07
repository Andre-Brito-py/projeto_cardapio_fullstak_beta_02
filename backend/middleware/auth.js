import jwt from 'jsonwebtoken';

const authMiddleware = async (req, res, next) => {
    try {
        // Verificar token no cabeçalho Authorization (Bearer token) ou no campo token
        const authHeader = req.headers.authorization;
        const tokenHeader = req.headers.token;
        
        // Verificar headers de autenticação
        
        let token;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
            // Token extraído do Authorization
        } else if (tokenHeader) {
            token = tokenHeader;
            // Token extraído do header token
        }
        
        if (!token) {
            // Token não encontrado nos headers
            return res.status(401).json({
                success: false, 
                message: 'Não autorizado, faça login novamente'
            });
        }

        const token_decode = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        // Token decodificado com sucesso
        
        req.user = { 
            id: token_decode.id,
            role: token_decode.role,
            storeId: token_decode.storeId
        };
        req.body.userId = token_decode.id;
        next();
    } catch (error) {
        // Erro de autenticação
        return res.status(401).json({
            success: false, 
            message: 'Token inválido ou expirado'
        });
    }
}

export default authMiddleware;
