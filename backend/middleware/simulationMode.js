import jwt from 'jsonwebtoken';

// Dados simulados de usuários
const mockUsers = {
    'superadmin@fooddelivery.com': {
        _id: '68c9fc1ecd24a0be3ba2e0f9',
        name: 'Super Admin',
        email: 'superadmin@fooddelivery.com',
        role: 'super_admin',
        storeId: null
    },
    'admin@loja1.com': {
        _id: '507f1f77bcf86cd799439012',
        name: 'Admin Loja 1',
        email: 'admin@loja1.com',
        role: 'store_admin',
        storeId: '507f1f77bcf86cd799439012'
    },
    'admin@fooddelivery.com': {
        _id: '68ac98c80ab28e621279eab3',
        name: 'Admin da Loja',
        email: 'admin@fooddelivery.com',
        role: 'store_admin',
        storeId: '68d2a1e3fc52f1e80b8457f2'
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
    // Log de entrada para debug
    console.log('🔍 Middleware simulação ativo - Path:', req.path, 'Method:', req.method, 'NODE_ENV:', process.env.NODE_ENV);
    
    // Debug específico para rotas de stores
    if (req.path.includes('/api/system/stores')) {
        console.log('🔍 ROTA DE STORE DETECTADA!');
        console.log('🔍 req.path:', req.path);
        console.log('🔍 req.method:', req.method);
    }
    
    // Verificar se estamos em modo simulação
    if (process.env.NODE_ENV !== 'development') {
        return next();
    }

    // Simular criação de loja do sistema (Super Admin) - DEVE VIR PRIMEIRO
    if (req.path === '/api/system/stores' && req.method === 'POST') {
        console.log('🎯 INTERCEPTANDO CRIAÇÃO DE LOJA - Path:', req.path);
        console.log('📝 Dados recebidos:', JSON.stringify(req.body, null, 2));
        
        const storeData = req.body;
        
        // Simular nova loja criada com os dados recebidos
        const newStore = {
            _id: '507f1f77bcf86cd799439' + Math.floor(Math.random() * 1000),
            name: storeData.name || 'Nova Loja',
            slug: storeData.slug || 'nova-loja',
            status: 'active',
            description: storeData.description || 'Nova loja criada',
            restaurantAddress: storeData.restaurantAddress || 'Endereço da nova loja',
            settings: {
                address: {
                    street: storeData.street || 'Rua da nova loja',
                    number: storeData.number || '123',
                    complement: storeData.complement || '',
                    neighborhood: storeData.neighborhood || 'Bairro',
                    city: storeData.city || 'Cidade',
                    state: storeData.state || 'Estado',
                    zipCode: storeData.zipCode || '00000-000'
                },
                language: storeData.language || 'pt-BR',
                currency: storeData.currency || 'BRL',
                timezone: storeData.timezone || 'America/Sao_Paulo'
            },
            telegram: {
                chatId: storeData.telegramChatId || '',
                phoneNumber: storeData.telegramPhoneNumber || '',
                isActive: storeData.telegramIsActive || false
            },
            owner: {
                _id: 'owner' + Math.floor(Math.random() * 1000),
                name: storeData.ownerName || 'Novo Proprietário',
                email: storeData.ownerEmail || 'proprietario@novaLoja.com'
            },
            subscriptionPlan: storeData.subscriptionPlan || 'Básico',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        console.log('✅ SUCESSO - Nova loja criada no modo simulação');
        
        // Simular delay de 200ms
        setTimeout(() => {
            return res.status(201).json({
                success: true,
                message: 'Loja criada com sucesso!',
                data: newStore
            });
        }, 200);
        return;
    }

    // DESABILITADO: Interceptação genérica de PUT /api/system/stores
    // Agora usamos bypasses específicos no systemRoute.js
    // if (req.path.startsWith('/api/system/stores/') && req.method === 'PUT') {
    //     // Código comentado para permitir que os bypasses específicos funcionem
    // }

    // Simular teste do Telegram PRIMEIRO (antes de qualquer autenticação)
    if (req.path === '/api/system/api/test-telegram' && req.method === 'POST') {
        console.log('🎯 Interceptando rota test-telegram no middleware de simulação');
        console.log('📦 Body recebido:', req.body);
        const { botToken, telegramBotToken } = req.body;
        const token = botToken || telegramBotToken;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token do bot é obrigatório'
            });
        }

        // Simular resposta de sucesso do teste do Telegram
        return res.json({
            success: true,
            message: 'Bot Telegram testado com sucesso (modo simulação)',
            data: {
                bot: {
                    id: 123456789,
                    is_bot: true,
                    first_name: 'Bot Demo',
                    username: 'demo_bot',
                    can_join_groups: true,
                    can_read_all_group_messages: false,
                    supports_inline_queries: false
                },
                testMessage: 'Mensagem de teste enviada com sucesso (simulação)'
            }
        });
    }

    // Para rotas de API do sistema, permitir que passem pela autenticação real
    if (req.path.startsWith('/api/system/api/') && (req.method === 'POST' || req.method === 'GET' || req.method === 'PUT')) {
        console.log('🔐 Permitindo autenticação real para rota do sistema:', req.path);
        // Não interceptar - deixar que o middleware de autenticação real processe
        return next();
    }

    // Simular resposta para configurações de API - mas buscar do banco real se disponível
    if (req.path === '/api/system/api/settings' && req.method === 'GET') {
        console.log('🔍 Tentando buscar configurações reais do banco de dados');
        // Permitir que passe para o controller real primeiro
        // Se falhar, então simular
        // return res.json({
        //     success: true,
        //     settings: {
        //         // Google Maps API
        //         googleMapsApiKey: '',
        //         googleMapsEnabled: false,
        //         
        //         // Asaas API
        //         asaasApiKey: '',
        //         asaasEnvironment: 'sandbox',
        //         asaasEnabled: false,
        //         
        //         // Lisa AI Assistant API
        //         lisaEnabled: false,
        //         lisaOpenAiApiKey: '',
        //         lisaGroqApiKey: '',
        //         lisaChainlitSecret: '',
        //         lisaLiteralApiKey: '',
        //         lisaPort: '8000',
        //         lisaMaxFileSize: 10,
        //         
        //         // Configurações de frete
        //         shippingEnabled: true,
        //         freeShippingMinValue: 50,
        //         baseShippingCost: 5,
        //         costPerKm: 2,
        //         
        //         // WhatsApp Business API
        //         whatsappEnabled: false,
        //         whatsappAccessToken: '',
        //         whatsappPhoneNumberId: '',
        //         whatsappWebhookVerifyToken: '',
        //         whatsappBusinessAccountId: '',
        //         
        //         // Telegram Bot API
        //         telegramEnabled: false,
        //         telegramBotToken: '',
        //         telegramWebhookUrl: '',
        //         telegramAllowedUsers: '',
        //         telegramAdminChatId: ''
        //     }
        // });
    }

    // Simular resposta para salvar configurações de API - mas permitir que passe para o controller real
    if (req.path === '/api/system/api/settings' && req.method === 'PUT') {
        console.log('🔍 Permitindo salvamento real de configurações de API');
        // Não interceptar - deixar passar para o controller real
        // return res.json({
        //     success: true,
        //     message: 'Configurações salvas com sucesso (simulação)'
        // });
    }

    // Interceptar TODAS as rotas de login primeiro - EXCETO store admin login
    if ((req.path === '/api/user/login' || req.path === '/api/system/super-admin/login') && req.method === 'POST') {
        const { email, password } = req.body;
        const user = mockUsers[email];
        
        if (user && (password === 'admin123' || password === 'superadmin123' || password === '123456')) {
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
            { _id: '1', name: 'Bolos', image: 'bolos.png', active: true },
            { _id: '2', name: 'Massas', image: 'massas.png', active: true },
            { _id: '3', name: 'Sobremesas', image: 'sobremesas.png', active: true }
        ];
        
        return res.json({
            success: true,
            data: mockCategories
        });
    }

    // Simular todas as categorias
    if (req.path === '/api/category/list' && req.method === 'GET') {
        const mockCategories = [
            { _id: '1', name: 'Bolos', image: 'bolos.png', active: true },
            { _id: '2', name: 'Massas', image: 'massas.png', active: true },
            { _id: '3', name: 'Sobremesas', image: 'sobremesas.png', active: true }
        ];
        
        return res.json({
            success: true,
            data: mockCategories
        });
    }

    // Simular lista de lojas do sistema (Super Admin)
    if (req.path === '/api/system/stores' && req.method === 'GET') {
        const mockStores = [
            {
                _id: '1',
                name: 'Loja Demo 1',
                slug: 'loja-demo-1',
                status: 'active',
                owner: {
                    _id: 'owner1',
                    name: 'João Silva',
                    email: 'joao@loja1.com'
                },
                createdAt: new Date('2024-01-15'),
                subscription: {
                    plan: 'premium',
                    status: 'active',
                    expiresAt: new Date('2024-12-31')
                }
            },
            {
                _id: '2',
                name: 'Loja Demo 2',
                slug: 'loja-demo-2',
                status: 'pending',
                owner: {
                    _id: 'owner2',
                    name: 'Maria Santos',
                    email: 'maria@loja2.com'
                },
                createdAt: new Date('2024-02-10'),
                subscription: {
                    plan: 'basic',
                    status: 'active',
                    expiresAt: new Date('2024-11-30')
                }
            },
            {
                _id: '3',
                name: 'Loja Demo 3',
                slug: 'loja-demo-3',
                status: 'active',
                owner: {
                    _id: 'owner3',
                    name: 'Pedro Costa',
                    email: 'pedro@loja3.com'
                },
                createdAt: new Date('2024-03-05'),
                subscription: {
                    plan: 'premium',
                    status: 'active',
                    expiresAt: new Date('2025-01-15')
                },
                telegram: {
                    chatId: '',
                    phoneNumber: '',
                    isActive: false
                }
            }
        ];
        
        return res.json({
            success: true,
            data: {
                stores: mockStores,
                pagination: {
                    current: 1,
                    pages: 1,
                    total: mockStores.length
                }
            }
        });
    }

    // Simular atualização de loja do sistema (Super Admin)
    // REMOVIDO DAQUI - MOVIDO PARA O INÍCIO DA FUNÇÃO simulateAuth

    // Simular configuração do bot do Telegram (Super Admin)
    if (req.path === '/api/telegram/bot-config' && req.method === 'GET') {
        return res.json({
            success: true,
            config: {
                token: '8337588749:AAGxcGgyw3qpKEgvzwEUYeW0PWexJrFuMGI',
                webhookUrl: 'https://seu-dominio.com/api/telegram/webhook',
                enabled: true
            }
        });
    }

    // Simular salvamento da configuração do bot do Telegram (Super Admin)
    if (req.path === '/api/telegram/bot-config' && req.method === 'POST') {
        return res.json({
            success: true,
            message: 'Configuração salva com sucesso (modo simulação)'
        });
    }

    // Simular teste do bot do Telegram com token real
    if (req.path === '/api/system/api/test-telegram' && req.method === 'POST') {
        console.log('🔍 Interceptando rota de teste do Telegram');
        
        const { token } = req.body;
        
        // Validar se o token foi fornecido
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token do bot é obrigatório'
            });
        }
        
        // Simular validação do token (usando o token real fornecido)
        if (token === '8337588749:AAGxcGgyw3qpKEgvzwEUYeW0PWexJrFuMGI') {
            return res.json({
                success: true,
                message: 'Bot Telegram testado com sucesso (modo simulação)',
                data: {
                    bot: {
                        id: 8337588749,
                        is_bot: true,
                        first_name: 'Liza Delivery',
                        username: 'LizaDelivetybot'
                    },
                    testMessage: 'Conexão com o bot estabelecida com sucesso (simulação)'
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Token do bot inválido'
            });
        }
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