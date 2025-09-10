// Logger simples para o sistema
class Logger {
    info(message, data = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }

    warn(message, data = null) {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }

    error(message, error = null) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ERROR: ${message}`, error ? error.stack || error : '');
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
        }
    }
}

const logger = new Logger();
export default logger;