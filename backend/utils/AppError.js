/**
 * Custom error class for operational errors
 */
export class AppError extends Error {
    constructor(message, statusCode, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.details = details;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Pre-defined error types for consistency
 */
export class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400, details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Não autorizado') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Acesso negado') {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Recurso não encontrado') {
        super(message, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Conflito de dados') {
        super(message, 409);
    }
}

export class InternalError extends AppError {
    constructor(message = 'Erro interno do servidor') {
        super(message, 500);
    }
}
