import categoryModel from "../models/categoryModel.js";
import fs from 'fs';

// Adicionar categoria
const addCategory = async (req, res) => {
    try {
        const { name, description, storeId } = req.body;
        const image_filename = req.file ? req.file.filename : null;

        if (!name) {
            return res.json({ success: false, message: "Nome da categoria é obrigatório" });
        }

        if (!storeId) {
            return res.json({ success: false, message: "storeId é obrigatório" });
        }

        if (!image_filename) {
            return res.json({ success: false, message: "Imagem da categoria é obrigatória" });
        }

        // Verificar se categoria já existe na loja específica
        const existingCategory = await categoryModel.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            storeId 
        });
        if (existingCategory) {
            return res.json({ success: false, message: "Categoria já existe nesta loja" });
        }

        const categoryData = {
            name: name,
            description: description || "",
            image: image_filename,
            isActive: true,
            storeId: storeId
        };

        const category = new categoryModel(categoryData);
        await category.save();
        res.json({ success: true, message: "Categoria adicionada com sucesso" });
    } catch (error) {
        console.error('Erro ao adicionar categoria:', error);
        res.json({ success: false, message: "Erro ao adicionar categoria" });
    }
};

// Listar todas as categorias
const listCategory = async (req, res) => {
    try {
        const { storeId } = req.query;
        
        if (!storeId) {
            return res.json({ success: false, message: "storeId é obrigatório" });
        }
        
        const categories = await categoryModel.find({ storeId });
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Erro ao listar categorias:', error);
        res.json({ success: false, message: "Erro ao listar categorias" });
    }
};

// Listar apenas categorias ativas (para o frontend)
const listActiveCategories = async (req, res) => {
    try {
        const { storeId } = req.query;
        
        if (!storeId) {
            return res.json({ success: false, message: "storeId é obrigatório" });
        }
        
        const activeCategories = await categoryModel.find({ 
            isActive: true, 
            storeId 
        });
        res.json({ success: true, data: activeCategories });
    } catch (error) {
        console.error('Erro ao listar categorias ativas:', error);
        res.json({ success: false, message: "Erro ao listar categorias ativas" });
    }
};

// Remover categoria
const removeCategory = async (req, res) => {
    try {
        const categoryId = req.body.id;
        const category = await categoryModel.findById(categoryId);
        
        if (!category) {
            return res.json({ success: false, message: "Categoria não encontrada" });
        }
        
        // Verificar se a categoria pertence à loja (se não for super admin)
        if (req.storeId && req.user.role !== 'super_admin' && category.storeId.toString() !== req.storeId) {
            return res.json({ success: false, message: "Acesso negado" });
        }
        
        // Remover arquivo de imagem com isolamento por loja
        if (category.image) {
            const storeId = category.storeId;
            const imagePath = `uploads/stores/${storeId}/${category.image}`;
            
            fs.unlink(imagePath, (err) => {
                if (err) {
                    // Tentar caminho antigo como fallback
                    fs.unlink(`uploads/${category.image}`, (fallbackErr) => {
                        if (fallbackErr) console.error('Erro ao deletar imagem:', fallbackErr);
                    });
                }
            });
        }

        await categoryModel.findByIdAndDelete(categoryId);
        res.json({ success: true, message: "Categoria removida com sucesso" });
    } catch (error) {
        console.error('Erro ao remover categoria:', error);
        res.json({ success: false, message: "Erro ao remover categoria" });
    }
};

// Atualizar categoria
const updateCategory = async (req, res) => {
    try {
        const categoryId = req.body.id;
        const { name, description, isActive } = req.body;
        const image_filename = req.file ? req.file.filename : null;

        const category = await categoryModel.findById(categoryId);
        
        if (!category) {
            return res.json({ success: false, message: "Categoria não encontrada" });
        }
        
        // Verificar se novo nome já existe em outra categoria da mesma loja
        if (name && name !== category.name) {
            const existingCategory = await categoryModel.findOne({ 
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                storeId: category.storeId,
                _id: { $ne: categoryId }
            });
            if (existingCategory) {
                return res.json({ success: false, message: "Nome da categoria já existe nesta loja" });
            }
        }

        // Preparar dados para atualização
        const updateData = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.isActive = isActive;
        
        // Atualizar imagem se fornecida
        if (image_filename) {
            // Remover imagem antiga com isolamento por loja
            if (category.image) {
                const storeId = category.storeId;
                const oldImagePath = `uploads/stores/${storeId}/${category.image}`;
                
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        // Tentar caminho antigo como fallback
                        fs.unlink(`uploads/${category.image}`, (fallbackErr) => {
                            if (fallbackErr) console.error('Erro ao deletar imagem antiga:', fallbackErr);
                        });
                    }
                });
            }
            updateData.image = image_filename;
        }

        await categoryModel.findByIdAndUpdate(categoryId, updateData);
        
        res.json({ success: true, message: "Categoria atualizada com sucesso" });
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        res.json({ success: false, message: "Erro ao atualizar categoria" });
    }
};

export { addCategory, listCategory, listActiveCategories, removeCategory, updateCategory };