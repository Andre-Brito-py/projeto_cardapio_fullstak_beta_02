import jwt from 'jsonwebtoken';

// Dados simulados para desenvolvimento
const mockUsers = {
    'admin@fooddelivery.com': {
        _id: '507f1f77bcf86cd799439011',
        name: 'Admin User',
        email: 'admin@fooddelivery.com',
        role: 'store_admin',
        storeId: '507f1f77bcf86cd799439012',
        isActive: true
    },
    'superadmin@fooddelivery.com': {
        _id: '507f1f77bcf86cd799439013',
        name: 'Super Admin',
        email: 'superadmin@fooddelivery.com',
        role: 'super_admin',
        isActive: true
    }
};

const mockStore = {
    _id: '507f1f77bcf86cd799439012',
    name: 'Loja Demo',
    slug: 'loja-demo',
    status: 'active',
    owner: '507f1f77bcf86cd799439011',
    api_token: 'demo-token-123',
    active: true,
    isOpen: true
};

const mockProducts = [
    {
        _id: '507f1f77bcf86cd799439014',
        name: 'Produto Demo 1',
        price: 25.90,
        category: 'Categoria 1',
        image: '/images/demo1.jpg',
        description: 'Produto de demonstração',
        storeId: '507f1f77bcf86cd799439012'
    },
    {
        _id: '507f1f77bcf86cd799439015',
        name: 'Produto Demo 2',
        price: 35.50,
        category: 'Categoria 2',
        image: '/images/demo2.jpg',
        description: 'Outro produto de demonstração',
        storeId: '507f1f77bcf86cd799439012'
    }
];

// Middleware para simular autenticação
export const simulateAuth = (req, res, next) => {
    // Verificar se estamos em modo simulação
    if (process.env.NODE_ENV !== 'development') {
        return next();
    }

    // Interceptar TODAS as rotas de login primeiro
    if ((req.path === '/api/user/login' || req.path.includes('/login')) && req.method === 'POST') {
        const { email, password } = req.body;
        const user = mockUsers[email];
        
        if (user && (password === 'admin123' || password === 'superadmin123')) {
            const token = jwt.sign(
                { 
                    id: user._id, 
                    role: user.role, 
                    storeId: user.storeId 
                }, 
                process.env.JWT_SECRET || 'fallback-secret', 
                { expiresIn: '7d' }
            );
            
            return res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    storeId: user.storeId
                }
            });
        } else {
            return res.json({ success: false, message: 'Credenciais inválidas' });
        }
    }

    // Simular dados da loja atual
    if (req.path === '/api/store/current' && req.method === 'GET') {
        return res.json({
            success: true,
            store: mockStore
        });
    }

    // Simular busca de loja por slug (apenas para rotas que não são de menu)
    if (req.path.startsWith('/api/store/public/') && req.method === 'GET' && !req.path.includes('/menu')) {
        const slug = req.path.split('/').pop();
        if (slug === 'loja-demo' || slug === mockStore.slug) {
            return res.json({
                success: true,
                store: mockStore
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'Loja não encontrada'
            });
        }
    }

    // Simular busca de loja por ID
    if (req.path.startsWith('/api/store/public/id/') && req.method === 'GET') {
        const storeId = req.path.split('/').pop();
        if (storeId === mockStore._id) {
            return res.json({
                success: true,
                store: mockStore
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'Loja não encontrada'
            });
        }
    }

    // Simular busca de menu da loja por slug
    if (req.path.match(/\/api\/store\/public\/[^/]+\/menu$/) && req.method === 'GET') {
        const pathParts = req.path.split('/');
        const slug = pathParts[pathParts.length - 2]; // Pega o slug antes de '/menu'
        console.log('🔍 Middleware simulação - Processando menu para slug:', slug);
        
        if (slug === 'loja-demo' || slug === mockStore.slug) {
            return res.json({
                success: true,
                data: {
                    categories: [
                        {
                            _id: '507f1f77bcf86cd799439013',
                            name: 'Pratos Principais',
                            image: '/images/category-main.jpg',
                            active: true
                        },
                        {
                            _id: '507f1f77bcf86cd799439014',
                            name: 'Bebidas',
                            image: '/images/category-drinks.jpg',
                            active: true
                        }
                    ],
                    foods: mockProducts
                }
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'Menu da loja não encontrado'
            });
        }
    }

    // Simular lista de produtos
    if (req.path === '/api/food/list' && req.method === 'GET') {
        return res.json({
            success: true,
            data: mockProducts
        });
    }

    // Simular lista de mesas
    if (req.path === '/api/tables' && req.method === 'GET') {
        const mockTables = [
            { _id: '1', number: 1, capacity: 4, status: 'available' },
            { _id: '2', number: 2, capacity: 2, status: 'occupied' },
            { _id: '3', number: 3, capacity: 6, status: 'available' },
            { _id: '4', number: 4, capacity: 4, status: 'reserved' }
        ];
        
        return res.json({
            success: true,
            tables: mockTables
        });
    }

    // Simular geração de link do garçom
    if (req.path === '/api/waiter/generate-link' && req.method === 'POST') {
        const token = jwt.sign(
            { storeId: mockStore._id, type: 'waiter', timestamp: Date.now() },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '30d' }
        );
        
        return res.json({
            success: true,
            data: {
                token,
                accessLink: `http://localhost:5173/waiter-order/${mockStore._id}?token=${token}`,
                storeId: mockStore._id,
                storeName: mockStore.name,
                expiresIn: '30 dias'
            }
        });
    }

    // Simular geração de link do atendente
    if (req.path === '/api/counter-attendant/generate-link' && req.method === 'POST') {
        const token = jwt.sign(
            { storeId: mockStore._id, type: 'attendant', timestamp: Date.now() },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '30d' }
        );
        
        return res.json({
            success: true,
            data: {
                token,
                accessLink: `http://localhost:5174/counter/${mockStore._id}?token=${token}`,
                storeId: mockStore._id,
                storeName: mockStore.name,
                expiresIn: '30 dias'
            }
        });
    }

    // Simular geração de link do cardápio
    if (req.path === '/api/menu/generate-link' && req.method === 'POST') {
        const token = jwt.sign(
            { storeId: mockStore._id, type: 'menu', timestamp: Date.now() },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '30d' }
        );
        
        return res.json({
            success: true,
            data: {
                token,
                accessLink: `http://localhost:5173/menu/${mockStore._id}?token=${token}`,
                storeId: mockStore._id,
                storeName: mockStore.name,
                expiresIn: '30 dias'
            }
        });
    }

    // Simular validação de token
    if (req.path === '/api/auth/validate-token' && req.method === 'POST') {
        const { token } = req.body;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
            return res.json({
                success: true,
                valid: true,
                data: decoded
            });
        } catch (error) {
            return res.status(401).json({
                success: false,
                valid: false,
                message: 'Token inválido ou expirado'
            });
        }
    }

    // Simular validação de token do garçom
    if (req.path === '/api/waiter/validate-token' && req.method === 'POST') {
        const { token } = req.body;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
            if (decoded.type === 'waiter') {
                return res.json({
                    success: true,
                    valid: true,
                    waiterName: 'Garçom Demo',
                    storeId: decoded.storeId,
                    storeName: mockStore.name
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Token não é de garçom'
                });
            }
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido ou expirado'
            });
        }
    }

    // Simular login do atendente de balcão
    if (req.path === '/api/counter-attendant/login' && req.method === 'POST') {
        const { email, password } = req.body;
        
        // Simular credenciais válidas
        if (email === 'atendente@demo.com' && password === '123456') {
            const token = jwt.sign(
                { 
                    id: '507f1f77bcf86cd799439015',
                    email: 'atendente@demo.com',
                    name: 'Atendente Demo',
                    storeId: mockStore._id,
                    type: 'counter-attendant'
                },
                process.env.JWT_SECRET || 'fallback-secret',
                { expiresIn: '30d' }
            );
            
            return res.json({
                success: true,
                token,
                attendant: {
                    _id: '507f1f77bcf86cd799439015',
                    name: 'Atendente Demo',
                    email: 'atendente@demo.com',
                    storeId: mockStore._id,
                    storeName: mockStore.name,
                    status: 'active'
                }
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }
    }

    // Simular perfil do atendente
    if (req.path === '/api/counter-attendant/profile' && req.method === 'GET') {
        const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
            if (decoded.type === 'counter-attendant') {
                return res.json({
                    success: true,
                    attendant: {
                        _id: decoded.id,
                        name: decoded.name,
                        email: decoded.email,
                        storeId: decoded.storeId,
                        storeName: mockStore.name,
                        status: 'active'
                    }
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido para atendente'
                });
            }
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido ou expirado'
            });
        }
    }

    // Simular categorias ativas
    if (req.path === '/api/category/active' && req.method === 'GET') {
        const mockCategories = [
            { _id: '1', name: 'Categoria 1', active: true },
            { _id: '2', name: 'Categoria 2', active: true },
            { _id: '3', name: 'Categoria 3', active: true }
        ];
        
        return res.json({
            success: true,
            data: mockCategories
        });
    }

    // Simular todas as categorias
    if (req.path === '/api/category/list' && req.method === 'GET') {
        const mockCategories = [
            { _id: '1', name: 'Categoria 1', active: true },
            { _id: '2', name: 'Categoria 2', active: true },
            { _id: '3', name: 'Categoria 3', active: true }
        ];
        
        return res.json({
            success: true,
            data: mockCategories
        });
    }

    // Simular pedidos
    if (req.path === '/api/order/list' && req.method === 'GET') {
        const mockOrders = [
            {
                _id: '1',
                items: mockProducts.slice(0, 2),
                amount: 61.40,
                status: 'Food Processing',
                date: new Date(),
                address: {
                    firstName: 'Cliente',
                    lastName: 'Demo',
                    email: 'cliente@demo.com',
                    street: 'Rua Demo, 123',
                    city: 'São Paulo',
                    state: 'SP',
                    zipcode: '01234-567',
                    country: 'Brasil',
                    phone: '(11) 99999-9999'
                }
            }
        ];
        
        return res.json({
            success: true,
            data: mockOrders
        });
    }

    // Simular configurações
    if (req.path.startsWith('/api/settings/') && req.method === 'GET') {
        return res.json({
            success: true,
            data: {
                deliveryFee: 5.00,
                minimumOrder: 20.00,
                acceptedPaymentMethods: ['dinheiro', 'cartao', 'pix']
            }
        });
    }

    // Simular banners
    if (req.path === '/api/banner/list' && req.method === 'GET') {
        return res.json({
            success: true,
            data: []
        });
    }

    next();
};

// Middleware para simular dados quando MongoDB não está disponível
export const simulateDatabase = (req, res, next) => {
    console.log('🔍 Middleware simulação ativo - Path:', req.path, 'Method:', req.method, 'NODE_ENV:', process.env.NODE_ENV);
    
    // Forçar simulação temporariamente
    // if (process.env.NODE_ENV !== 'development') {
    //     return next();
    // }
    
    // Adicionar dados simulados ao contexto da requisição
    req.mockData = {
        users: mockUsers,
        store: mockStore,
        products: mockProducts
    };
    
    // Simular contexto de loja para multi-tenancy
    req.store = mockStore;
    req.storeId = mockStore._id;
    
    next();
};

export { mockUsers, mockStore, mockProducts };