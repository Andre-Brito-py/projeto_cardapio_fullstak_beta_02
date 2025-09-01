import ProductSuggestion from '../models/productSuggestionModel.js';
import foodModel from '../models/foodModel.js';

// Criar nova sugestão de produto
const createProductSuggestion = async (req, res) => {
    try {
        const { productId, suggestedProductId, title, description, order } = req.body;
        const storeId = req.store._id;

        // Verificar se os produtos existem
        const product = await foodModel.findOne({ _id: productId, storeId });
        if (!product) {
            return res.json({ success: false, message: 'Produto principal não encontrado' });
        }

        const suggestedProduct = await foodModel.findOne({ _id: suggestedProductId, storeId });
        if (!suggestedProduct) {
            return res.json({ success: false, message: 'Produto sugerido não encontrado' });
        }

        // Verificar se não é o mesmo produto
        if (productId === suggestedProductId) {
            return res.json({ success: false, message: 'Um produto não pode ser sugestão de si mesmo' });
        }

        // Verificar se já existe esta sugestão
        const existingSuggestion = await ProductSuggestion.findOne({ 
            productId, 
            suggestedProductId, 
            storeId 
        });
        if (existingSuggestion) {
            return res.json({ success: false, message: 'Esta sugestão já existe' });
        }

        const suggestion = new ProductSuggestion({
            productId,
            suggestedProductId,
            storeId,
            title: title || 'Que tal adicionar?',
            description: description || '',
            order: order || 0
        });

        await suggestion.save();
        
        // Retornar a sugestão com informações dos produtos
        const populatedSuggestion = await ProductSuggestion.findById(suggestion._id)
            .populate('productId', 'name image price')
            .populate('suggestedProductId', 'name image price');
        
        res.json({ success: true, message: 'Sugestão criada com sucesso', data: populatedSuggestion });
    } catch (error) {
        console.error('Erro ao criar sugestão de produto:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
};

// Listar todas as sugestões da loja
const listProductSuggestions = async (req, res) => {
    try {
        const storeId = req.store._id;
        const { productId } = req.query;

        let filter = { storeId };
        if (productId) {
            filter.productId = productId;
        }

        const suggestions = await ProductSuggestion.find(filter)
            .populate('productId', 'name image price')
            .populate('suggestedProductId', 'name image price')
            .sort({ order: 1, createdAt: -1 });
        
        res.json({ success: true, data: suggestions });
    } catch (error) {
        console.error('Erro ao listar sugestões de produto:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
};

// Obter sugestão específica
const getProductSuggestion = async (req, res) => {
    try {
        const { suggestionId } = req.params;
        const storeId = req.store._id;

        const suggestion = await ProductSuggestion.findOne({ _id: suggestionId, storeId })
            .populate('productId', 'name image price')
            .populate('suggestedProductId', 'name image price');
            
        if (!suggestion) {
            return res.json({ success: false, message: 'Sugestão não encontrada' });
        }

        res.json({ success: true, data: suggestion });
    } catch (error) {
        console.error('Erro ao obter sugestão de produto:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
};

// Atualizar sugestão
const updateProductSuggestion = async (req, res) => {
    try {
        const { suggestionId } = req.params;
        const { productId, suggestedProductId, title, description, order, isActive } = req.body;
        const storeId = req.store._id;

        // Verificar se a sugestão existe
        const suggestion = await ProductSuggestion.findOne({ _id: suggestionId, storeId });
        if (!suggestion) {
            return res.json({ success: false, message: 'Sugestão não encontrada' });
        }

        // Se os produtos foram alterados, verificar se existem
        if (productId && productId !== suggestion.productId.toString()) {
            const product = await foodModel.findOne({ _id: productId, storeId });
            if (!product) {
                return res.json({ success: false, message: 'Produto principal não encontrado' });
            }
        }

        if (suggestedProductId && suggestedProductId !== suggestion.suggestedProductId.toString()) {
            const suggestedProduct = await foodModel.findOne({ _id: suggestedProductId, storeId });
            if (!suggestedProduct) {
                return res.json({ success: false, message: 'Produto sugerido não encontrado' });
            }
        }

        // Verificar se não é o mesmo produto
        const finalProductId = productId || suggestion.productId;
        const finalSuggestedProductId = suggestedProductId || suggestion.suggestedProductId;
        if (finalProductId.toString() === finalSuggestedProductId.toString()) {
            return res.json({ success: false, message: 'Um produto não pode ser sugestão de si mesmo' });
        }

        // Verificar se já existe esta sugestão (se foi alterada)
        if ((productId && productId !== suggestion.productId.toString()) || 
            (suggestedProductId && suggestedProductId !== suggestion.suggestedProductId.toString())) {
            const existingSuggestion = await ProductSuggestion.findOne({ 
                productId: finalProductId, 
                suggestedProductId: finalSuggestedProductId, 
                storeId,
                _id: { $ne: suggestionId }
            });
            if (existingSuggestion) {
                return res.json({ success: false, message: 'Esta sugestão já existe' });
            }
        }

        // Atualizar campos
        if (productId !== undefined) suggestion.productId = productId;
        if (suggestedProductId !== undefined) suggestion.suggestedProductId = suggestedProductId;
        if (title !== undefined) suggestion.title = title;
        if (description !== undefined) suggestion.description = description;
        if (order !== undefined) suggestion.order = order;
        if (isActive !== undefined) suggestion.isActive = isActive;

        await suggestion.save();
        
        // Retornar a sugestão atualizada com informações dos produtos
        const updatedSuggestion = await ProductSuggestion.findById(suggestion._id)
            .populate('productId', 'name image price')
            .populate('suggestedProductId', 'name image price');
        
        res.json({ success: true, message: 'Sugestão atualizada com sucesso', data: updatedSuggestion });
    } catch (error) {
        console.error('Erro ao atualizar sugestão de produto:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
};

// Deletar sugestão
const deleteProductSuggestion = async (req, res) => {
    try {
        const { suggestionId } = req.params;
        const storeId = req.store._id;

        // Verificar se a sugestão existe
        const suggestion = await ProductSuggestion.findOne({ _id: suggestionId, storeId });
        if (!suggestion) {
            return res.json({ success: false, message: 'Sugestão não encontrada' });
        }

        await ProductSuggestion.findByIdAndDelete(suggestionId);
        res.json({ success: true, message: 'Sugestão deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar sugestão de produto:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
};

// Listar sugestões para um produto específico (para o frontend do cliente)
const getProductSuggestions = async (req, res) => {
    try {
        const { productId } = req.params;
        const storeId = req.store._id;
        
        const suggestions = await ProductSuggestion.find({ 
            productId, 
            storeId, 
            isActive: true 
        })
        .populate('suggestedProductId', 'name image price description category')
        .sort({ order: 1, createdAt: -1 });

        // Filtrar apenas produtos ativos
        const activeSuggestions = suggestions.filter(suggestion => 
            suggestion.suggestedProductId && suggestion.suggestedProductId.name
        );

        res.json({ success: true, data: activeSuggestions });
    } catch (error) {
        console.error('Erro ao obter sugestões do produto:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
};

export {
    createProductSuggestion,
    listProductSuggestions,
    getProductSuggestion,
    updateProductSuggestion,
    deleteProductSuggestion,
    getProductSuggestions
};