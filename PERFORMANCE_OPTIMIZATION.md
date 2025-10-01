# Guia de Otimização de Performance - Sistema Multi-Tenant

## Visão Geral

Este documento apresenta estratégias e implementações para otimização de performance no sistema de cardápio digital multi-tenant, focando em escalabilidade, eficiência e experiência do usuário.

## 1. Otimizações de Banco de Dados

### 1.1 Índices Estratégicos

**Índices Principais:**
```javascript
// Coleção de produtos (foods)
db.foods.createIndex({ "storeId": 1, "category": 1, "available": 1 })
db.foods.createIndex({ "storeId": 1, "createdAt": -1 })
db.foods.createIndex({ "storeId": 1, "name": "text", "description": "text" })

// Coleção de pedidos (orders)
db.orders.createIndex({ "storeId": 1, "status": 1, "createdAt": -1 })
db.orders.createIndex({ "storeId": 1, "customerId": 1, "createdAt": -1 })
db.orders.createIndex({ "storeId": 1, "paymentMethod": 1, "createdAt": -1 })

// Coleção de usuários (users)
db.users.createIndex({ "email": 1, "storeId": 1 }, { unique: true })
db.users.createIndex({ "storeId": 1, "role": 1, "active": 1 })

// Coleção de auditoria (auditlogs)
db.auditlogs.createIndex({ "storeId": 1, "createdAt": -1 })
db.auditlogs.createIndex({ "storeId": 1, "category": 1, "action": 1 })
db.auditlogs.createIndex({ "storeId": 1, "userId": 1, "createdAt": -1 })
db.auditlogs.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 31536000 }) // TTL 1 ano

// Coleção de clientes (customers)
db.customers.createIndex({ "storeId": 1, "phone": 1 }, { unique: true })
db.customers.createIndex({ "storeId": 1, "email": 1 })
db.customers.createIndex({ "storeId": 1, "lastOrderDate": -1 })
```

### 1.2 Agregações Otimizadas

**Pipeline de Estatísticas:**
```javascript
// Estatísticas de vendas otimizada
const salesStats = [
    { $match: { storeId: ObjectId(storeId), createdAt: { $gte: startDate } } },
    { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalSales: { $sum: "$amount" },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: "$amount" }
    }},
    { $sort: { "_id": 1 } },
    { $limit: 30 }
];

// Top produtos com cache
const topProducts = [
    { $match: { storeId: ObjectId(storeId) } },
    { $unwind: "$items" },
    { $group: {
        _id: "$items.foodId",
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
    }},
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
    { $lookup: {
        from: "foods",
        localField: "_id",
        foreignField: "_id",
        as: "product"
    }}
];
```

### 1.3 Connection Pooling

**Configuração MongoDB:**
```javascript
const mongoOptions = {
    maxPoolSize: 50,        // Máximo de conexões simultâneas
    minPoolSize: 5,         // Mínimo de conexões mantidas
    maxIdleTimeMS: 30000,   // Tempo limite para conexões inativas
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,    // Desabilita buffering
    bufferCommands: false,
    readPreference: 'secondaryPreferred', // Leitura em secundários quando possível
    writeConcern: { w: 'majority', j: true }
};
```

## 2. Cache Estratégico

### 2.1 Redis Cache Implementation

**Configuração Redis:**
```javascript
import Redis from 'redis';

const redisClient = Redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0,
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis server refused connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
        }
        return Math.min(options.attempt * 100, 3000);
    }
});
```

**Cache Middleware:**
```javascript
const cacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
        const key = `cache:${req.storeId}:${req.originalUrl}`;
        
        try {
            const cached = await redisClient.get(key);
            if (cached) {
                return res.json(JSON.parse(cached));
            }
            
            // Interceptar resposta para cache
            const originalSend = res.json;
            res.json = function(data) {
                redisClient.setex(key, duration, JSON.stringify(data));
                originalSend.call(this, data);
            };
            
            next();
        } catch (error) {
            console.error('Cache error:', error);
            next();
        }
    };
};
```

### 2.2 Estratégias de Cache por Endpoint

**Cache de Longa Duração (1 hora):**
- Configurações da loja
- Categorias de produtos
- Informações de entrega
- Métodos de pagamento aceitos

**Cache de Média Duração (15 minutos):**
- Lista de produtos
- Banners ativos
- Estatísticas do dashboard

**Cache de Curta Duração (5 minutos):**
- Pedidos em andamento
- Status de disponibilidade
- Estatísticas em tempo real

### 2.3 Invalidação Inteligente de Cache

```javascript
const invalidateCache = async (storeId, patterns = []) => {
    const keys = await redisClient.keys(`cache:${storeId}:*`);
    
    if (patterns.length > 0) {
        const filteredKeys = keys.filter(key => 
            patterns.some(pattern => key.includes(pattern))
        );
        if (filteredKeys.length > 0) {
            await redisClient.del(filteredKeys);
        }
    } else {
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    }
};

// Uso em controllers
const updateFood = async (req, res) => {
    // ... lógica de atualização
    
    // Invalidar caches relacionados
    await invalidateCache(req.storeId, ['/api/food', '/api/category']);
    
    res.json(result);
};
```

## 3. Otimização de Imagens

### 3.1 Processamento Automático

**Sharp.js Integration:**
```javascript
import sharp from 'sharp';

const processImage = async (inputPath, outputPath, options = {}) => {
    const {
        width = 800,
        height = 600,
        quality = 80,
        format = 'webp'
    } = options;
    
    await sharp(inputPath)
        .resize(width, height, { 
            fit: 'cover',
            position: 'center'
        })
        .webp({ quality })
        .toFile(outputPath);
};

// Gerar múltiplas versões
const generateImageVersions = async (originalPath, storeId, filename) => {
    const basePath = `uploads/stores/${storeId}`;
    const versions = {
        thumbnail: { width: 150, height: 150, quality: 70 },
        medium: { width: 400, height: 300, quality: 80 },
        large: { width: 800, height: 600, quality: 85 }
    };
    
    const results = {};
    
    for (const [size, options] of Object.entries(versions)) {
        const outputPath = `${basePath}/${size}_${filename}.webp`;
        await processImage(originalPath, outputPath, options);
        results[size] = outputPath;
    }
    
    return results;
};
```

### 3.2 CDN e Compressão

**Nginx Configuration:**
```nginx
# Compressão de imagens
location ~* \.(jpg|jpeg|png|gif|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
    
    # Compressão gzip para SVG
    gzip on;
    gzip_types image/svg+xml;
}

# Servir WebP quando suportado
location ~* \.(jpg|jpeg|png)$ {
    add_header Vary Accept;
    try_files $uri$webp_suffix $uri =404;
}
```

## 4. Otimização de API

### 4.1 Paginação Eficiente

**Cursor-based Pagination:**
```javascript
const getPaginatedResults = async (model, storeId, options = {}) => {
    const {
        cursor,
        limit = 20,
        sortField = 'createdAt',
        sortOrder = -1,
        filters = {}
    } = options;
    
    const query = { storeId, ...filters };
    
    if (cursor) {
        query[sortField] = sortOrder === 1 
            ? { $gt: cursor }
            : { $lt: cursor };
    }
    
    const results = await model
        .find(query)
        .sort({ [sortField]: sortOrder })
        .limit(limit + 1)
        .lean(); // Usar lean() para melhor performance
    
    const hasNext = results.length > limit;
    if (hasNext) results.pop();
    
    const nextCursor = results.length > 0 
        ? results[results.length - 1][sortField]
        : null;
    
    return {
        data: results,
        pagination: {
            hasNext,
            nextCursor,
            limit
        }
    };
};
```

### 4.2 Batch Operations

**Bulk Updates:**
```javascript
const bulkUpdateProducts = async (storeId, updates) => {
    const bulkOps = updates.map(update => ({
        updateOne: {
            filter: { _id: update.id, storeId },
            update: { $set: update.data },
            upsert: false
        }
    }));
    
    const result = await Food.bulkWrite(bulkOps, {
        ordered: false, // Continuar mesmo com erros
        writeConcern: { w: 'majority' }
    });
    
    // Invalidar cache após bulk update
    await invalidateCache(storeId, ['/api/food']);
    
    return result;
};
```

### 4.3 Response Compression

**Middleware de Compressão:**
```javascript
import compression from 'compression';

app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6, // Nível de compressão balanceado
    threshold: 1024, // Comprimir apenas responses > 1KB
    memLevel: 8
}));
```

## 5. Otimização de Frontend

### 5.1 Code Splitting

**Vite Configuration:**
```javascript
// vite.config.js
export default {
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    ui: ['@mui/material', '@emotion/react'],
                    charts: ['recharts', 'chart.js'],
                    utils: ['axios', 'lodash', 'moment']
                }
            }
        },
        chunkSizeWarningLimit: 1000
    }
};
```

### 5.2 Lazy Loading

**Component Lazy Loading:**
```javascript
import { lazy, Suspense } from 'react';

const OrderManagement = lazy(() => import('./pages/OrderManagement'));
const ProductManagement = lazy(() => import('./pages/ProductManagement'));
const Analytics = lazy(() => import('./pages/Analytics'));

const App = () => (
    <Suspense fallback={<div>Carregando...</div>}>
        <Routes>
            <Route path="/orders" element={<OrderManagement />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/analytics" element={<Analytics />} />
        </Routes>
    </Suspense>
);
```

### 5.3 Virtual Scrolling

**Para Listas Grandes:**
```javascript
import { FixedSizeList as List } from 'react-window';

const ProductList = ({ products }) => {
    const Row = ({ index, style }) => (
        <div style={style}>
            <ProductItem product={products[index]} />
        </div>
    );
    
    return (
        <List
            height={600}
            itemCount={products.length}
            itemSize={80}
            width="100%"
        >
            {Row}
        </List>
    );
};
```

## 6. Monitoramento de Performance

### 6.1 Métricas Chave

**Application Performance Monitoring:**
```javascript
import { performance } from 'perf_hooks';

const performanceMiddleware = (req, res, next) => {
    const start = performance.now();
    
    res.on('finish', () => {
        const duration = performance.now() - start;
        
        // Log performance metrics
        logger.performance({
            method: req.method,
            url: req.originalUrl,
            storeId: req.storeId,
            duration: Math.round(duration),
            statusCode: res.statusCode,
            contentLength: res.get('content-length') || 0
        });
        
        // Alert para requests lentos
        if (duration > 5000) {
            logger.warn(`Slow request detected: ${req.method} ${req.originalUrl} - ${duration}ms`);
        }
    });
    
    next();
};
```

### 6.2 Database Query Monitoring

**Mongoose Plugin:**
```javascript
const queryMonitorPlugin = function(schema) {
    schema.pre(/^find/, function() {
        this.start = Date.now();
    });
    
    schema.post(/^find/, function() {
        if (this.start) {
            const duration = Date.now() - this.start;
            
            if (duration > 1000) {
                logger.warn(`Slow query detected: ${this.getQuery()} - ${duration}ms`);
            }
            
            logger.performance({
                type: 'database_query',
                collection: this.model.collection.name,
                query: this.getQuery(),
                duration
            });
        }
    });
};

// Aplicar a todos os schemas
mongoose.plugin(queryMonitorPlugin);
```

## 7. Otimizações de Rede

### 7.1 HTTP/2 e Compression

**Express Configuration:**
```javascript
import spdy from 'spdy';
import fs from 'fs';

const options = {
    key: fs.readFileSync('path/to/private-key.pem'),
    cert: fs.readFileSync('path/to/certificate.pem'),
    spdy: {
        protocols: ['h2', 'http/1.1'],
        plain: false
    }
};

spdy.createServer(options, app).listen(443, () => {
    console.log('HTTP/2 server running on port 443');
});
```

### 7.2 Request Batching

**GraphQL-style Batching:**
```javascript
const batchMiddleware = () => {
    const batches = new Map();
    
    return (req, res, next) => {
        if (req.headers['x-batch-request']) {
            const batchId = req.headers['x-batch-id'];
            
            if (!batches.has(batchId)) {
                batches.set(batchId, []);
            }
            
            batches.get(batchId).push({ req, res });
            
            // Processar batch após timeout
            setTimeout(() => {
                processBatch(batches.get(batchId));
                batches.delete(batchId);
            }, 10);
            
            return;
        }
        
        next();
    };
};
```

## 8. Configurações de Produção

### 8.1 PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
    apps: [{
        name: 'cardapio-api',
        script: './server.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'production',
            PORT: 4001
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 4001
        },
        max_memory_restart: '1G',
        node_args: '--max-old-space-size=2048',
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true
    }]
};
```

### 8.2 Load Balancer Configuration

**Nginx Upstream:**
```nginx
upstream cardapio_backend {
    least_conn;
    server 127.0.0.1:4001 weight=3;
    server 127.0.0.1:4002 weight=3;
    server 127.0.0.1:4003 weight=2;
    keepalive 32;
}

server {
    listen 80;
    server_name api.cardapio.com;
    
    location / {
        proxy_pass http://cardapio_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

## 9. Benchmarks e Testes de Performance

### 9.1 Load Testing

**Artillery Configuration:**
```yaml
# load-test.yml
config:
  target: 'http://localhost:4001'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
  defaults:
    headers:
      X-Store-ID: '507f1f77bcf86cd799439011'

scenarios:
  - name: "API Load Test"
    weight: 100
    flow:
      - get:
          url: "/api/food/list"
      - think: 2
      - post:
          url: "/api/order/place"
          json:
            items: [{ foodId: "507f1f77bcf86cd799439012", quantity: 2 }]
            customerInfo: { name: "Test User", phone: "11999999999" }
```

### 9.2 Performance Metrics

**Targets de Performance:**
- Response time médio: < 200ms
- 95th percentile: < 500ms
- 99th percentile: < 1000ms
- Throughput: > 1000 req/s
- Error rate: < 0.1%
- Database query time: < 100ms
- Cache hit rate: > 80%

## 10. Checklist de Otimização

### 10.1 Backend Optimizations

- [ ] Índices de banco de dados implementados
- [ ] Cache Redis configurado
- [ ] Connection pooling otimizado
- [ ] Paginação cursor-based implementada
- [ ] Bulk operations para updates em massa
- [ ] Compression middleware ativo
- [ ] Performance monitoring implementado
- [ ] Query optimization realizada

### 10.2 Frontend Optimizations

- [ ] Code splitting configurado
- [ ] Lazy loading implementado
- [ ] Virtual scrolling para listas grandes
- [ ] Image optimization ativa
- [ ] Bundle size otimizado
- [ ] Service worker para cache
- [ ] Critical CSS inline
- [ ] Resource hints implementados

### 10.3 Infrastructure Optimizations

- [ ] CDN configurado
- [ ] HTTP/2 habilitado
- [ ] Gzip/Brotli compression ativa
- [ ] Load balancer configurado
- [ ] Database replication setup
- [ ] Monitoring e alertas ativos
- [ ] Backup strategy implementada
- [ ] Disaster recovery testado

---

**Última Atualização:** [Data]
**Versão:** 1.0
**Próxima Revisão:** [Data + 3 meses]