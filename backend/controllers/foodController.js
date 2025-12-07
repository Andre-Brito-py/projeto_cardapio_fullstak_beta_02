import fs from 'fs'
import foodModel from '../models/foodModel.js'
import AddonCategory from '../models/addonCategoryModel.js'
import ProductSuggestion from '../models/productSuggestionModel.js'
import logger from '../config/logger.js'
import { NotFoundError, ValidationError, InternalError } from '../utils/AppError.js'

// Função para popular produtos iniciais se não existirem
const populateInitialFoods = async () => {
    try {
        // Verificar apenas produtos sem storeId (produtos globais)
        const existingFoods = await foodModel.find({
            $or: [
                { storeId: { $exists: false } },
                { storeId: null }
            ]
        });

        if (existingFoods.length === 0) {
            const initialFoods = [
                {
                    name: 'Pizza Margherita',
                    description: 'Pizza clássica com molho de tomate, mussarela e manjericão',
                    price: 25.99,
                    image: 'pizza.jpg',
                    category: 'Pizza',
                    extras: [],
                    storeId: null
                },
                {
                    name: 'Hambúrguer Clássico',
                    description: 'Hambúrguer com carne, alface, tomate e queijo',
                    price: 18.50,
                    image: 'burger.jpg',
                    category: 'Burger',
                    extras: [],
                    storeId: null
                },
                {
                    name: 'Salada Caesar',
                    description: 'Salada fresca com alface, croutons e molho caesar',
                    price: 15.00,
                    image: 'salad.jpg',
                    category: 'Salad',
                    extras: [],
                    storeId: null
                }
            ];

            await foodModel.insertMany(initialFoods);
        }
    } catch (error) {
        logger.error('Erro ao popular produtos iniciais:', error);
    }
};

// Chamar a função de população
// populateInitialFoods(); // Comentado para evitar execução automática

//add food item

const addFood = async (req, res) => {

    let image_filename = req.file ? req.file.filename : req.body.image || 'default.jpg';

    // Parse extras if provided (legacy system)
    let extras = [];
    if (req.body.extras) {
        try {
            extras = typeof req.body.extras === 'string' ? JSON.parse(req.body.extras) : req.body.extras;
        } catch (error) {
            logger.warn('Error parsing extras, using empty array as fallback', { error: error.message });
        }
    }

    // Parse inline addon categories if provided (new system)
    let inlineAddonCategories = [];
    if (req.body.addonCategories) {
        try {
            inlineAddonCategories = typeof req.body.addonCategories === 'string' ? JSON.parse(req.body.addonCategories) : req.body.addonCategories;
        } catch (error) {
            logger.warn('Error parsing inline addon categories', { error: error.message });
        }
    }

    // Parse category addons if provided (new system)
    let categoryAddons = {};
    if (req.body.categoryAddons) {
        try {
            categoryAddons = typeof req.body.categoryAddons === 'string' ? JSON.parse(req.body.categoryAddons) : req.body.categoryAddons;
        } catch (error) {
            logger.warn('Error parsing category addons', { error: error.message });
        }
    }

    // Determine which system to use
    const useOldSystem = req.body.useOldSystem === 'true' || req.body.useOldSystem === true;

    const food = new foodModel({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        image: image_filename,
        storeId: req.store ? req.store._id : null,
        extras: useOldSystem ? extras : [],
        inlineAddonCategories: useOldSystem ? [] : inlineAddonCategories,
        categoryAddons: useOldSystem ? {} : categoryAddons,
        useOldSystem: useOldSystem
    });

    try {
        await food.save();
        res.status(201).json({ success: true, message: 'Produto adicionado com sucesso', data: food })
    } catch (error) {
        logger.error('Erro ao adicionar produto:', error);
        res.status(500).json({ success: false, message: 'Erro ao adicionar produto' })
    }
}

// All food list

const listFood = async (req, res) => {
    try {
        // Se há contexto de loja, filtrar por loja, senão listar todos (incluindo produtos sem storeId)
        const query = req.store
            ? { storeId: req.store._id, isActive: true }
            : {
                $or: [
                    { storeId: { $exists: false } },
                    { storeId: null }
                ],
                isActive: true
            };
        const foods = await foodModel.find(query).populate('storeId', 'name slug');
        res.status(200).json({ success: true, data: foods })
    } catch (error) {
        logger.error('Erro ao listar produtos:', error)
        res.status(500).json({ success: false, message: 'Erro ao listar produtos' })
    }
}

// remove food item

const removeFood = async (req, res) => {
    try {
        // Verificar se o produto pertence à loja
        const query = req.store ? { _id: req.body.id, storeId: req.store._id } : { _id: req.body.id };
        const food = await foodModel.findOne(query);
        if (food) {
            // Remover arquivo de imagem com isolamento por loja
            if (food.image) {
                const storeId = food.storeId;
                const imagePath = `uploads/stores/${storeId}/${food.image}`;

                fs.unlink(imagePath, (err) => {
                    if (err) {
                        // Tentar caminho antigo como fallback
                        fs.unlink(`uploads/${food.image}`, () => { });
                    }
                });
            }

            await foodModel.findByIdAndDelete(req.body.id);
            res.status(200).json({ success: true, message: 'Produto removido com sucesso' })
        } else {
            res.status(404).json({ success: false, message: 'Produto não encontrado ou acesso negado' })
        }
    } catch (error) {
        logger.error('Erro ao remover produto:', error)
        res.status(500).json({ success: false, message: 'Erro ao remover produto' })
    }
}

// update food item
const updateFood = async (req, res) => {
    try {
        const { id, name, description, price, category, extras, addonCategories, categoryAddons, useOldSystem } = req.body;

        // Find food in database with store context
        const query = req.store ? { _id: id, storeId: req.store._id } : { _id: id };
        const food = await foodModel.findOne(query);

        if (!food) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado ou acesso negado' });
        }

        // Prepare update data
        const updateData = {
            name: name || food.name,
            description: description || food.description,
            price: price || food.price,
            category: category || food.category,
            useOldSystem: useOldSystem !== undefined ? (useOldSystem === 'true' || useOldSystem === true) : food.useOldSystem
        };

        // Update based on system type
        if (updateData.useOldSystem) {
            // Sistema antigo - atualizar extras
            if (extras) {
                try {
                    updateData.extras = typeof extras === 'string' ? JSON.parse(extras) : extras;
                } catch (error) {
                    updateData.extras = [];
                }
            } else {
                updateData.extras = food.extras;
            }
            // Limpar campos do novo sistema
            updateData.inlineAddonCategories = [];
            updateData.categoryAddons = {};
        } else {
            // Novo sistema - atualizar categorias e adicionais inline
            if (addonCategories) {
                try {
                    updateData.inlineAddonCategories = typeof addonCategories === 'string' ? JSON.parse(addonCategories) : addonCategories;
                } catch (error) {
                    updateData.inlineAddonCategories = [];
                }
            } else {
                updateData.inlineAddonCategories = food.inlineAddonCategories || [];
            }

            if (categoryAddons) {
                try {
                    updateData.categoryAddons = typeof categoryAddons === 'string' ? JSON.parse(categoryAddons) : categoryAddons;
                } catch (error) {
                    updateData.categoryAddons = {};
                }
            } else {
                updateData.categoryAddons = food.categoryAddons || {};
            }
            // Limpar extras do sistema antigo
            updateData.extras = [];
        }

        // Update image if new file is uploaded
        if (req.file) {
            // Remove old image with store isolation
            if (food.image) {
                const storeId = food.storeId;
                const oldImagePath = `uploads/stores/${storeId}/${food.image}`;

                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        // Tentar caminho antigo como fallback
                        fs.unlink(`uploads/${food.image}`, () => { });
                    }
                });
            }
            updateData.image = req.file.filename;
        } else {
            updateData.image = food.image;
        }

        // Update in database
        const updatedFood = await foodModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        res.status(200).json({ success: true, message: 'Produto atualizado com sucesso', data: updatedFood });
    } catch (error) {
        logger.error('Erro ao atualizar produto:', error);
        res.status(500).json({ success: false, message: 'Erro ao atualizar produto' });
    }
};

// Obter produto com categorias de adicionais e sugestões (para o frontend do cliente)
const getFoodWithAddonsAndSuggestions = async (req, res) => {
    try {
        const { foodId } = req.params;
        const storeId = req.store._id;

        // Buscar o produto
        const food = await foodModel.findOne({ _id: foodId, storeId, isActive: true });

        if (!food) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado' });
        }

        // Preparar dados de adicionais baseado no sistema usado
        let addonData = {};

        if (food.useOldSystem) {
            // Sistema antigo - usar extras
            addonData = {
                useOldSystem: true,
                extras: food.extras || []
            };
        } else {
            // Novo sistema inline - usar categorias e adicionais inline
            addonData = {
                useOldSystem: false,
                inlineAddonCategories: food.inlineAddonCategories || [],
                categoryAddons: food.categoryAddons || {}
            };
        }

        // Buscar sugestões de produtos
        const suggestions = await ProductSuggestion.find({
            productId: foodId,
            storeId,
            isActive: true
        })
            .populate('suggestedProductId', 'name image price description category')
            .sort({ order: 1, createdAt: -1 });

        // Filtrar apenas produtos ativos nas sugestões
        const activeSuggestions = suggestions.filter(suggestion =>
            suggestion.suggestedProductId && suggestion.suggestedProductId.name
        );

        res.json({
            success: true,
            data: {
                ...food.toObject(),
                ...addonData,
                suggestions: activeSuggestions
            }
        });
    } catch (error) {
        logger.error('Erro ao obter produto com adicionais:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};

// Listar produtos com informações básicas de adicionais (para listagem)
const listFoodWithAddonInfo = async (req, res) => {
    try {
        const query = req.store
            ? { storeId: req.store._id, isActive: true }
            : {
                $or: [
                    { storeId: { $exists: false } },
                    { storeId: null }
                ],
                isActive: true
            };
        const foods = await foodModel.find(query)
            .populate('storeId', 'name slug')
            .sort({ createdAt: -1 });

        // Adicionar contagem de sugestões para cada produto
        const foodsWithSuggestionCount = await Promise.all(
            foods.map(async (food) => {
                let suggestionCount = 0;

                // Só buscar sugestões se o produto tiver storeId
                if (food.storeId) {
                    suggestionCount = await ProductSuggestion.countDocuments({
                        productId: food._id,
                        storeId: food.storeId,
                        isActive: true
                    });
                }

                return {
                    ...food.toObject(),
                    suggestionCount
                };
            })
        );

        res.status(200).json({ success: true, data: foodsWithSuggestionCount });
    } catch (error) {
        logger.error('Erro ao listar produtos:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};

// Controle de estoque - marcar produto como esgotado
const updateStockStatus = async (req, res) => {
    try {
        const { id, isOutOfStock, outOfStockAddons, outOfStockAddonCategories } = req.body;

        // Verificar se o produto pertence à loja
        const query = req.store ? { _id: id, storeId: req.store._id } : { _id: id };
        const food = await foodModel.findOne(query);

        if (!food) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado ou acesso negado' });
        }

        // Preparar dados de atualização
        const updateData = {};

        if (isOutOfStock !== undefined) {
            updateData.isOutOfStock = isOutOfStock;
        }

        if (outOfStockAddons !== undefined) {
            updateData.outOfStockAddons = Array.isArray(outOfStockAddons) ? outOfStockAddons : [];
        }

        if (outOfStockAddonCategories !== undefined) {
            updateData.outOfStockAddonCategories = Array.isArray(outOfStockAddonCategories) ? outOfStockAddonCategories : [];
        }

        // Atualizar produto
        const updatedFood = await foodModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        res.json({
            success: true,
            message: 'Status de estoque atualizado com sucesso',
            data: updatedFood
        });

    } catch (error) {
        logger.error('Erro ao atualizar status de estoque:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};

// Buscar detalhes de um produto específico
const getFoodDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se o produto pertence à loja
        const query = req.store ? { _id: id, storeId: req.store._id } : { _id: id };
        const food = await foodModel.findOne(query);

        if (!food) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado ou acesso negado' });
        }

        res.status(200).json({ success: true, data: food });
    } catch (error) {
        logger.error('Erro ao buscar detalhes do produto:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};

export { addFood, listFood, removeFood, updateFood, getFoodWithAddonsAndSuggestions, listFoodWithAddonInfo, updateStockStatus, getFoodDetails }