import jwt from 'jsonwebtoken';

const authMiddleware = async (req, res, next) => {
    try {
        // Verificar token no cabeçalho Authorization (Bearer token) ou no campo token
        const authHeader = req.headers.authorization;
        const tokenHeader = req.headers.token;
        
        console.log('Headers recebidos:', req.headers);
        
        let token;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
            console.log('Token extraído do Authorization:', token);
        } else if (tokenHeader) {
            token = tokenHeader;
            console.log('Token extraído do header token:', token);
        }
        
        if (!token) {
            console.log('Token não encontrado nos headers');
            return res.status(401).json({
                success: false, 
                message: 'Não autorizado, faça login novamente'
            });
        }

        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado:', token_decode);
        
        req.body.userId = token_decode.id;
        next();
    } catch (error) {
        console.log('Erro de autenticação:', error);
        return res.status(401).json({
            success: false, 
            message: 'Token inválido ou expirado'
        });
    }
}

export default authMiddleware;