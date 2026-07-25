import React, { useState, useEffect } from 'react';
import { assets } from '../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import PremiumCard from '../../components/Card/PremiumCard';
import { motion } from 'framer-motion';

const Add = ({ url }) => {
    const [image, setImage] = useState(false);
    const [categories, setCategories] = useState([]);
    const [data, setData] = useState({
        name: '',
        description: '',
        price: '',
        category: ''
    });

    // New inline addon system states
    const [addonCategories, setAddonCategories] = useState([]);
    const [currentAddonCategory, setCurrentAddonCategory] = useState({
        name: '',
        description: '',
        maxSelection: 1,
        isRequired: false
    });

    // Current addons for each category
    const [categoryAddons, setCategoryAddons] = useState({});
    const [currentAddon, setCurrentAddon] = useState({
        name: '',
        price: '',
        description: ''
    });
    const [selectedCategoryForAddon, setSelectedCategoryForAddon] = useState('');

    // Legacy extras system (for backward compatibility)
    const [useOldSystem, setUseOldSystem] = useState(false);
    const [extras, setExtras] = useState([]);
    const [currentExtra, setCurrentExtra] = useState({
        name: '',
        price: '',
        description: ''
    });

    const fetchCategories = async () => {
        try {
            const storeId = localStorage.getItem('storeId');
            const response = await axios.get(`${url}/api/category/active?storeId=${storeId}`);
            if (response.data.success) {
                setCategories(response.data.data);
                // Set first category as default if available
                if (response.data.data.length > 0 && !data.category) {
                    setData(prev => ({ ...prev, category: response.data.data[0].name }));
                }
            }
        } catch (error) {
            setCategories([]);
            toast.error('Erro ao carregar categorias');
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data => ({ ...data, [name]: value }));
    };

    // Addon Category handlers
    const onAddonCategoryChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setCurrentAddonCategory(prev => ({ ...prev, [name]: value }));
    };

    const addAddonCategory = () => {
        if (currentAddonCategory.name.trim()) {
            const newCategory = {
                id: Date.now().toString(),
                ...currentAddonCategory,
                maxSelection: Number(currentAddonCategory.maxSelection)
            };
            setAddonCategories(prev => [...prev, newCategory]);
            setCategoryAddons(prev => ({ ...prev, [newCategory.id]: [] }));
            setCurrentAddonCategory({
                name: '',
                description: '',
                maxSelection: 1,
                isRequired: false
            });
            toast.success('Categoria de adicional criada!');
        } else {
            toast.error('Nome da categoria é obrigatório');
        }
    };

    const removeAddonCategory = (categoryId) => {
        setAddonCategories(prev => prev.filter(cat => cat.id !== categoryId));
        setCategoryAddons(prev => {
            const newAddons = { ...prev };
            delete newAddons[categoryId];
            return newAddons;
        });
        if (selectedCategoryForAddon === categoryId) {
            setSelectedCategoryForAddon('');
        }
    };

    // Addon handlers
    const onAddonChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setCurrentAddon(prev => ({ ...prev, [name]: value }));
    };

    const addAddon = () => {
        if (!selectedCategoryForAddon) {
            toast.error('Selecione uma categoria primeiro');
            return;
        }
        if (currentAddon.name.trim() && currentAddon.price) {
            const newAddon = {
                id: Date.now().toString(),
                ...currentAddon,
                price: Number(currentAddon.price)
            };
            setCategoryAddons(prev => ({
                ...prev,
                [selectedCategoryForAddon]: [...(prev[selectedCategoryForAddon] || []), newAddon]
            }));
            setCurrentAddon({ name: '', price: '', description: '' });
            toast.success('Adicional criado!');
        } else {
            toast.error('Nome e preço são obrigatórios');
        }
    };

    const removeAddon = (categoryId, addonId) => {
        setCategoryAddons(prev => ({
            ...prev,
            [categoryId]: prev[categoryId].filter(addon => addon.id !== addonId)
        }));
    };

    // Legacy extras handlers
    const onExtraChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setCurrentExtra(prev => ({ ...prev, [name]: value }));
    };

    const addExtra = () => {
        if (currentExtra.name && currentExtra.price) {
            setExtras(prev => [...prev, { ...currentExtra, price: Number(currentExtra.price) }]);
            setCurrentExtra({ name: '', price: '', description: '' });
        }
    };

    const removeExtra = (index) => {
        setExtras(prev => prev.filter((_, i) => i !== index));
    };

    const testConnection = async () => {
        try {
            await axios.post(`${url}/api/food/test`, { test: 'data' });
            toast.success('Conexão funcionando!');
        } catch (error) {
            toast.error('Erro na conexão: ' + error.message);
        }
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('price', Number(data.price));
        formData.append('category', data.category);
        if (image) formData.append('image', image);

        // Include addon system data
        if (useOldSystem) {
            formData.append('extras', JSON.stringify(extras));
            formData.append('useOldSystem', 'true');
        } else {
            // New inline system - convert to backend expected format
            const inlineAddonCategories = addonCategories.map(cat => ({
                name: cat.name,
                description: cat.description,
                maxSelection: cat.maxSelection,
                isRequired: cat.isRequired
            }));

            // Convert categoryAddons from ID-based to name-based
            const categoryAddonsForBackend = {};
            addonCategories.forEach(category => {
                const addons = categoryAddons[category.id] || [];
                categoryAddonsForBackend[category.name] = addons.map(addon => ({
                    name: addon.name,
                    price: addon.price,
                    description: addon.description
                }));
            });

            formData.append('addonCategories', JSON.stringify(inlineAddonCategories));
            formData.append('categoryAddons', JSON.stringify(categoryAddonsForBackend));
            formData.append('useOldSystem', 'false');
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${url}/api/food/add`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setData({
                    name: '',
                    description: '',
                    price: '',
                    category: categories.length > 0 ? categories[0].name : ''
                });
                setImage(false);

                // Reset addon system
                setAddonCategories([]);
                setCategoryAddons({});
                setCurrentAddonCategory({
                    name: '',
                    description: '',
                    maxSelection: 1,
                    isRequired: false
                });
                setCurrentAddon({ name: '', price: '', description: '' });
                setSelectedCategoryForAddon('');

                // Reset legacy system
                setExtras([]);
                setCurrentExtra({ name: '', price: '', description: '' });
                setUseOldSystem(false);
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            if (error.response) {
                toast.error(error.response.data.message || 'Erro ao criar produto');
            } else {
                toast.error('Erro ao conectar com o servidor');
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-4xl mx-auto py-6"
        >
            <form onSubmit={onSubmitHandler}>
                <PremiumCard
                    title="Novo Produto"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    }
                    actions={
                        <button type="button" onClick={testConnection} className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Testar Conexão
                        </button>
                    }
                    footer={
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => window.history.back()} className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition-colors">
                                Salvar Produto
                            </button>
                        </div>
                    }
                >
                    <div className="space-y-8">
                        {/* Imagem */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Imagem do Produto</label>
                            <label htmlFor="image" className="group cursor-pointer flex flex-col items-center justify-center w-36 h-36 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all overflow-hidden relative">
                                {image ? (
                                    <img src={URL.createObjectURL(image)} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-indigo-500">
                                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span className="text-xs font-medium">Fazer Upload</span>
                                    </div>
                                )}
                            </label>
                            <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden accept="image/*" />
                        </div>

                        {/* Detalhes Basicos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto <span className="text-red-500">*</span></label>
                                <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" onChange={onChangeHandler} value={data.name} type="text" name="name" placeholder="Ex: X-Tudo Artesanal" required />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição <span className="text-red-500">*</span></label>
                                <textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" onChange={onChangeHandler} value={data.description} name="description" rows="4" placeholder="Descreva os ingredientes e detalhes do produto..." required></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria <span className="text-red-500">*</span></label>
                                <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" onChange={onChangeHandler} name="category" value={data.category} required>
                                    {categories.length === 0 ? (
                                        <option value="">Nenhuma categoria cadastrada</option>
                                    ) : (
                                        categories.map((category) => (
                                            <option key={category._id} value={category.name}>
                                                {category.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-gray-500 font-medium">R$</span>
                                    </div>
                                    <input className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" onChange={onChangeHandler} value={data.price} type="number" step="0.01" name="price" placeholder="0.00" required />
                                </div>
                            </div>
                        </div>

                        {/* Adicionais & Extras */}
                        <div className="pt-6 mt-6 border-t border-gray-100">
                            <div className="flex gap-4 mb-6">
                                <button type="button" className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${!useOldSystem ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`} onClick={() => setUseOldSystem(false)}>
                                    Grupos de Adicionais (Novo)
                                </button>
                                <button type="button" className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${useOldSystem ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`} onClick={() => setUseOldSystem(true)}>
                                    Extras Simples (Legado)
                                </button>
                            </div>

                            {!useOldSystem && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                        <h4 className="text-base font-semibold text-gray-800 mb-4">Adicionar Nova Categoria de Adicional</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" type="text" name="name" placeholder="Ex: Escolha o Ponto da Carne" value={currentAddonCategory.name} onChange={onAddonCategoryChangeHandler} />
                                            <input className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" type="text" name="description" placeholder="Ex: Escolha até 1" value={currentAddonCategory.description} onChange={onAddonCategoryChangeHandler} />
                                            
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Máx. Seleções</label>
                                                    <input className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" type="number" name="maxSelection" min="1" max="10" value={currentAddonCategory.maxSelection} onChange={onAddonCategoryChangeHandler} />
                                                </div>
                                                <div className="flex items-center h-full pt-4">
                                                    <label className="flex items-center cursor-pointer">
                                                        <input type="checkbox" name="isRequired" checked={currentAddonCategory.isRequired} onChange={onAddonCategoryChangeHandler} className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                                                        <span className="ml-2 text-sm font-medium text-gray-700">Obrigatório</span>
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-end">
                                                <button type="button" onClick={addAddonCategory} className="w-full px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors">
                                                    Criar Categoria
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {addonCategories.length > 0 && (
                                        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                                            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                                                <h4 className="font-semibold text-gray-800">Grupos Criados</h4>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {addonCategories.map(category => (
                                                    <div key={category.id} className="p-6">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                                                                    {category.name}
                                                                    {category.isRequired && <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">Obrigatório</span>}
                                                                </h5>
                                                                <p className="text-sm text-gray-500 mt-1">
                                                                    {category.description && <span className="mr-2">{category.description} •</span>}
                                                                    Máximo de {category.maxSelection} seleções
                                                                </p>
                                                            </div>
                                                            <button type="button" onClick={() => removeAddonCategory(category.id)} className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors">Remover Grupo</button>
                                                        </div>

                                                        {/* Items within category */}
                                                        {categoryAddons[category.id] && categoryAddons[category.id].length > 0 && (
                                                            <div className="mb-4 bg-gray-50 rounded-lg border border-gray-100 divide-y divide-gray-100">
                                                                {categoryAddons[category.id].map(addon => (
                                                                    <div key={addon.id} className="flex justify-between items-center p-3">
                                                                        <div>
                                                                            <span className="font-medium text-gray-800">{addon.name}</span>
                                                                            <span className="ml-2 text-sm text-gray-500">+ R$ {addon.price.toFixed(2)}</span>
                                                                            {addon.description && <span className="block text-xs text-gray-400">{addon.description}</span>}
                                                                        </div>
                                                                        <button type="button" onClick={() => removeAddon(category.id, addon.id)} className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Add Item form */}
                                                        <div className="flex flex-col md:flex-row gap-3">
                                                            <input className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" type="text" placeholder="Nome do item (ex: Bacon)" value={selectedCategoryForAddon === category.id ? currentAddon.name : ''} onChange={(e) => { setSelectedCategoryForAddon(category.id); onAddonChangeHandler({ target: { name: 'name', value: e.target.value } }); }} />
                                                            <input className="w-full md:w-32 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" type="number" placeholder="R$ 0.00" step="0.01" value={selectedCategoryForAddon === category.id ? currentAddon.price : ''} onChange={(e) => { setSelectedCategoryForAddon(category.id); onAddonChangeHandler({ target: { name: 'price', value: e.target.value } }); }} />
                                                            <button type="button" onClick={addAddon} className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm font-medium transition-colors whitespace-nowrap">
                                                                + Add Item
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {useOldSystem && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {extras.length > 0 && (
                                        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                                            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                                                <h4 className="font-semibold text-gray-800">Extras Cadastrados</h4>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {extras.map((extra, index) => (
                                                    <div key={index} className="flex justify-between items-center p-4">
                                                        <div>
                                                            <span className="font-medium text-gray-800">{extra.name}</span>
                                                            <span className="ml-2 font-medium text-indigo-600">R$ {Number(extra.price).toFixed(2)}</span>
                                                            {extra.description && <span className="block text-sm text-gray-500 mt-1">{extra.description}</span>}
                                                        </div>
                                                        <button type="button" onClick={() => removeExtra(index)} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                            Remover
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                        <h4 className="text-base font-semibold text-gray-800 mb-4">Cadastrar Novo Extra</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="col-span-1 md:col-span-4">
                                                <input className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" type="text" name="name" placeholder="Ex: Cheddar Extra" value={currentExtra.name} onChange={onExtraChangeHandler} />
                                            </div>
                                            <div className="col-span-1 md:col-span-3">
                                                <input className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" type="number" name="price" placeholder="Preço (R$)" step="0.01" value={currentExtra.price} onChange={onExtraChangeHandler} />
                                            </div>
                                            <div className="col-span-1 md:col-span-5">
                                                <div className="flex gap-2">
                                                    <input className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" type="text" name="description" placeholder="Descrição (opc.)" value={currentExtra.description} onChange={onExtraChangeHandler} />
                                                    <button type="button" onClick={addExtra} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors whitespace-nowrap">
                                                        Adicionar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </PremiumCard>
            </form>
        </motion.div>
    );
};

export default Add;
