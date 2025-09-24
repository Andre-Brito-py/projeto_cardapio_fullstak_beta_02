import fs from 'fs';
import path from 'path';

// Logger aprimorado para o sistema com suporte a auditoria
class Logger {
    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, data = null, storeId = null) {
        const timestamp = new Date().toISOString();
        const storeInfo = storeId ? ` [Store:${storeId}]` : '';
        const dataStr = data ? ` | Data: ${JSON.stringify(data, null, 2)}` : '';
        return `[${timestamp}]${storeInfo} ${level}: ${message}${dataStr}`;
    }

    writeToFile(filename, message) {
        try {
            const filePath = path.join(this.logDir, filename);
            fs.appendFileSync(filePath, message + '\n');
        } catch (error) {
            console.error('Erro ao escrever no arquivo de log:', error);
        }
    }

    info(message, data = null, storeId = null) {
        const formattedMessage = this.formatMessage('INFO', message, data, storeId);
        console.log(formattedMessage);
        
        // Escrever em arquivo se não estiver em modo de desenvolvimento
        if (process.env.NODE_ENV !== 'development') {
            this.writeToFile('app.log', formattedMessage);
        }
    }

    warn(message, data = null, storeId = null) {
        const formattedMessage = this.formatMessage('WARN', message, data, storeId);
        console.warn(formattedMessage);
        
        if (process.env.NODE_ENV !== 'development') {
            this.writeToFile('app.log', formattedMessage);
            this.writeToFile('warnings.log', formattedMessage);
        }
    }

    error(message, error = null, storeId = null) {
        const formattedMessage = this.formatMessage('ERROR', message, error ? error.stack || error : null, storeId);
        console.error(formattedMessage);
        
        if (process.env.NODE_ENV !== 'development') {
            this.writeToFile('app.log', formattedMessage);
            this.writeToFile('errors.log', formattedMessage);
        }
    }

    debug(message, data = null, storeId = null) {
        if (process.env.NODE_ENV === 'development') {
            const formattedMessage = this.formatMessage('DEBUG', message, data, storeId);
            console.log(formattedMessage);
        }
    }

    // Método específico para logs de auditoria
    audit(action, details, storeId, userId = null) {
        const auditData = {
            action,
            details,
            storeId,
            userId,
            timestamp: new Date().toISOString()
        };
        
        const message = `AUDIT: ${action} | Store: ${storeId} | User: ${userId || 'System'} | ${details}`;
        console.log(`[${auditData.timestamp}] ${message}`);
        
        if (process.env.NODE_ENV !== 'development') {
            this.writeToFile('audit.log', JSON.stringify(auditData));
        }
    }

    // Método para logs de segurança
    security(event, details, storeId = null, severity = 'MEDIUM') {
        const securityData = {
            event,
            details,
            storeId,
            severity,
            timestamp: new Date().toISOString()
        };
        
        const message = `SECURITY [${severity}]: ${event} | ${details}`;
        const formattedMessage = this.formatMessage('SECURITY', message, null, storeId);
        
        console.warn(formattedMessage);
        
        if (process.env.NODE_ENV !== 'development') {
            this.writeToFile('security.log', JSON.stringify(securityData));
            this.writeToFile('app.log', formattedMessage);
        }
    }

    // Método para logs de performance
    performance(operation, duration, storeId = null, metadata = {}) {
        const perfData = {
            operation,
            duration,
            storeId,
            metadata,
            timestamp: new Date().toISOString()
        };
        
        const message = `PERFORMANCE: ${operation} took ${duration}ms`;
        
        if (duration > 1000) { // Log apenas operações lentas
            console.log(this.formatMessage('PERF', message, metadata, storeId));
            
            if (process.env.NODE_ENV !== 'development') {
                this.writeToFile('performance.log', JSON.stringify(perfData));
            }
        }
    }

    // Método para rotacionar logs (chamado periodicamente)
    rotateLogs() {
        try {
            const files = fs.readdirSync(this.logDir);
            const now = new Date();
            const cutoff = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 dias

            files.forEach(file => {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < cutoff) {
                    fs.unlinkSync(filePath);
                    console.log(`Log rotacionado: ${file}`);
                }
            });
        } catch (error) {
            console.error('Erro ao rotacionar logs:', error);
        }
    }
}

const logger = new Logger();

// Rotacionar logs diariamente
if (process.env.NODE_ENV !== 'development') {
    setInterval(() => {
        logger.rotateLogs();
    }, 24 * 60 * 60 * 1000); // 24 horas
}

export default logger;