import categoryModel from "../models/categoryModel.js";
import fs from 'fs';

// Adicionar categoria
const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const image_filename = req.file ? req.file.filename : null;

        if (!name) {
            return res.json({ success: false, message: "Nome da categoria é obrigatório" });
        }

        if (!image_filename) {
            return res.json({ success: false, message: "Imagem da categoria é obrigatória" });
        }

        // Verificar se categoria já existe no MongoDB
        const existingCategory = await categoryModel.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingCategory) {
            return res.json({ success: false, message: "Categoria já existe" });
        }

        const categoryData = {
            name: name,
            description: description || "",
            image: image_filename,
            isActive: true
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
        const categories = await categoryModel.find({});
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Erro ao listar categorias:', error);
        res.json({ success: false, message: "Erro ao listar categorias" });
    }
};

// Listar apenas categorias ativas (para o frontend)
const listActiveCategories = async (req, res) => {
    try {
        const activeCategories = await categoryModel.find({ isActive: true });
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
        
        // Remover arquivo de imagem
        if (category.image) {
            fs.unlink(`uploads/${category.image}`, (err) => {
                if (err) console.error('Erro ao deletar imagem:', err);
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
        
        // Verificar se novo nome já existe em outra categoria
        if (name && name !== category.name) {
            const existingCategory = await categoryModel.findOne({ 
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                _id: { $ne: categoryId }
            });
            if (existingCategory) {
                return res.json({ success: false, message: "Nome da categoria já existe" });
            }
        }

        // Preparar dados para atualização
        const updateData = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.isActive = isActive;
        
        // Atualizar imagem se fornecida
        if (image_filename) {
            // Remover imagem antiga
            if (category.image) {
                fs.unlink(`uploads/${category.image}`, (err) => {
                    if (err) console.error('Erro ao deletar imagem antiga:', err);
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