import logger from '../config/logger.js';

/**
 * Centralizado error handler middleware
 * Deve ser o ÚLTIMO middleware no server.js
 */
const errorHandler = (err, req, res, next) => {
    let { statusCode = 500, message, details } = err;
    let isOperational = err.isOperational || false;

    // Erros de validação do Mongoose
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Dados inválidos';
        details = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
        isOperational = true;
    }

    // Mongoose CastError (ID inválido)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `ID inválido: ${err.value}`;
        isOperational = true;
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyPattern)[0];
        message = `${field} já está em uso`;
        isOperational = true;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token inválido';
        isOperational = true;
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expirado, faça login novamente';
        isOperational = true;
    }

    // Logar erro
    if (!isOperational || statusCode >= 500) {
        logger.logError(err, {
            url: req.originalUrl,
            method: req.method,
            userId: req.user?.id,
            storeId: req.store?._id,
        });
    }

    // Response
    const response = {
        success: false,
        message,
        ...(details && { errors: details })
    };

    // Em desenvolvimento, incluir stack trace
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

export default errorHandler;
