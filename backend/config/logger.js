import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Definir níveis customizados
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Cores para os níveis (console apenas)
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

// Formato customizado para desenvolvimento
const devFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} [${info.level}]: ${info.message}`
    ),
);

// Formato para produção (JSON estruturado)
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Transports
const transports = [];

// Console transport (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
    transports.push(
        new winston.transports.Console({
            format: devFormat,
        })
    );
}

// File transport para errors
transports.push(
    new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        level: 'error',
        format: prodFormat,
    })
);

// File transport para todos os logs
transports.push(
    new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: prodFormat,
    })
);

// Criar logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    levels,
    transports,
});

// Função helper para logar erros de forma segura (sem dados sensíveis)
logger.logError = (error, context = {}) => {
    const sanitizedContext = { ...context };

    // Remover dados sensíveis
    delete sanitizedContext.password;
    delete sanitizedContext.token;
    delete sanitizedContext.authorization;

    logger.error({
        message: error.message,
        stack: error.stack,
        ...sanitizedContext
    });
};

// Função helper para logar requisições HTTP
logger.logRequest = (req) => {
    const logData = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.id,
        storeId: req.store?._id
    };

    logger.http('Request received', logData);
};

export default logger;
