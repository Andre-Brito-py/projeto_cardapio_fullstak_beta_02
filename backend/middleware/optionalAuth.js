import jwt from 'jsonwebtoken';

// Middleware de autenticação opcional - permite pedidos sem login
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        // Verificar token no cabeçalho Authorization (Bearer token) ou no campo token
        const authHeader = req.headers.authorization;
        const tokenHeader = req.headers.token;
        
        let token;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (tokenHeader) {
            token = tokenHeader;
        }
        
        // Se não há token, continuar sem autenticação (usuário anônimo)
        if (!token) {
            console.log('Pedido sem autenticação - usuário anônimo');
            req.body.userId = null; // Marcar como usuário anônimo
            req.isAuthenticated = false;
            return next();
        }

        // Se há token, tentar validá-lo
        try {
            const token_decode = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token válido decodificado:', token_decode);
            
            req.body.userId = token_decode.id;
            req.isAuthenticated = true;
            next();
        } catch (tokenError) {
            console.log('Token inválido, continuando como usuário anônimo:', tokenError.message);
            // Token inválido, mas permitir continuar como anônimo
            req.body.userId = null;
            req.isAuthenticated = false;
            next();
        }
    } catch (error) {
        console.log('Erro no middleware de autenticação opcional:', error);
        // Em caso de erro, permitir continuar como anônimo
        req.body.userId = null;
        req.isAuthenticated = false;
        next();
    }
}

export default optionalAuthMiddleware;