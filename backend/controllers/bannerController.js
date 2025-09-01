import bannerModel from "../models/bannerModel.js";
import fs from 'fs';

// Adicionar novo banner
const addBanner = async (req, res) => {
    let image_filename = `${req.file.filename}`;

    const banner = new bannerModel({
        title: req.body.title,
        description: req.body.description,
        image: image_filename,
        order: req.body.order || 0,
        productId: req.body.productId && req.body.productId !== '' ? req.body.productId : null
    });

    try {
        await banner.save();
        res.json({ success: true, message: "Banner adicionado com sucesso" });
    } catch (error) {
        console.error('Erro ao adicionar banner:', error);
        res.json({ success: false, message: "Erro ao adicionar banner" });
    }
};

// Listar banners ativos (público)
const listBanners = async (req, res) => {
    try {
        const banners = await bannerModel.find({ isActive: true }).sort({ order: 1 });
        res.json({ success: true, data: banners });
    } catch (error) {
        console.error('Erro ao listar banners:', error);
        res.json({ success: false, message: "Erro ao listar banners" });
    }
};

// Listar todos os banners (admin)
const listAllBanners = async (req, res) => {
    try {
        const banners = await bannerModel.find({}).sort({ createdAt: -1 });
        res.json({ success: true, data: banners });
    } catch (error) {
        console.error('Erro ao listar todos os banners:', error);
        res.json({ success: false, message: "Erro ao listar banners" });
    }
};

// Remover banner
const removeBanner = async (req, res) => {
    try {
        const banner = await bannerModel.findById(req.body.id);
        if (!banner) {
            return res.json({ success: false, message: "Banner não encontrado" });
        }

        // Remover arquivo de imagem
        fs.unlink(`uploads/${banner.image}`, () => {});

        await bannerModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Banner removido com sucesso" });
    } catch (error) {
        console.error('Erro ao remover banner:', error);
        res.json({ success: false, message: "Erro ao remover banner" });
    }
};

// Atualizar banner
const updateBanner = async (req, res) => {
    try {
        // Dados recebidos para atualização
        const banner = await bannerModel.findById(req.body.id);
        if (!banner) {
            return res.json({ success: false, message: "Banner não encontrado" });
        }

        const updateData = {
            title: req.body.title,
            description: req.body.description,
            order: req.body.order || banner.order,
            isActive: req.body.isActive !== undefined ? req.body.isActive : banner.isActive,
            productId: req.body.productId && req.body.productId !== '' ? req.body.productId : null
        };
        
        // Preparando dados de atualização

        // Se uma nova imagem foi enviada
        if (req.file) {
            // Remover imagem antiga
            fs.unlink(`uploads/${banner.image}`, () => {});
            updateData.image = req.file.filename;
        }

        await bannerModel.findByIdAndUpdate(req.body.id, updateData);
        res.json({ success: true, message: "Banner atualizado com sucesso" });
    } catch (error) {
        console.error('Erro ao atualizar banner:', error);
        res.json({ success: false, message: "Erro ao atualizar banner" });
    }
};

// Ativar/Desativar banner
const toggleBannerStatus = async (req, res) => {
    try {
        const banner = await bannerModel.findById(req.body.id);
        if (!banner) {
            return res.json({ success: false, message: "Banner não encontrado" });
        }

        await bannerModel.findByIdAndUpdate(req.body.id, { isActive: !banner.isActive });
        res.json({ success: true, message: `Banner ${!banner.isActive ? 'ativado' : 'desativado'} com sucesso` });
    } catch (error) {
        console.error('Erro ao alterar status do banner:', error);
        res.json({ success: false, message: "Erro ao alterar status do banner" });
    }
};

export { addBanner, listBanners, listAllBanners, removeBanner, updateBanner, toggleBannerStatus };