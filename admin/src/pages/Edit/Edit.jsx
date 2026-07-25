import React, { useState, useEffect } from 'react';
import { assets } from '../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import PremiumCard from '../../components/Card/PremiumCard';
import { motion } from 'framer-motion';

const Edit = ({ url }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [image, setImage] = useState(null);
    const [categories, setCategories] = useState([]);
    const [data, setData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        extras: []
    });
    const [currentImage, setCurrentImage] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const storeId = localStorage.getItem('storeId');
                const response = await axios.get(`${url}/api/category/active?storeId=${storeId}`);
                if (response.data.success) {
                    setCategories(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, [url]);

    // Fetch food item data
    useEffect(() => {
        const fetchFoodItem = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${url}/api/food/admin/list`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.data.success) {
                    const foodItem = response.data.data.find(item => item._id == id);
                    if (foodItem) {
                        setData({
                            name: foodItem.name,
                            description: foodItem.description,
                            price: foodItem.price,
                            category: foodItem.category,
                            extras: foodItem.extras || []
                        });
                        setCurrentImage(foodItem.image);
                    } else {
                        toast.error('Produto não encontrado');
                        navigate('/list');
                    }
                } else {
                    toast.error(response.data.message || 'Erro ao carregar produto');
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching food item:', error);
                toast.error('Erro ao carregar produto');
                setLoading(false);
            }
        };
        if (id) {
            fetchFoodItem();
        }
    }, [id, url, navigate]);

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data => ({ ...data, [name]: value }));
    };

    const addExtra = () => {
        setData(data => ({
            ...data,
            extras: [...data.extras, { name: '', price: '' }]
        }));
    };

    const removeExtra = (index) => {
        setData(data => ({
            ...data,
            extras: data.extras.filter((_, i) => i !== index)
        }));
    };

    const updateExtra = (index, field, value) => {
        setData(data => ({
            ...data,
            extras: data.extras.map((extra, i) =>
                i === index ? { ...extra, [field]: value } : extra
            )
        }));
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append('id', id);
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('price', Number(data.price));
        formData.append('category', data.category);
        formData.append('extras', JSON.stringify(data.extras));

        if (image) {
            formData.append('image', image);
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${url}/api/food/update`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                navigate('/list');
            } else {
                toast.error(response.data.message || 'Erro ao atualizar produto');
            }
        } catch (error) {
            console.error('Error updating food:', error);
            toast.error('Erro ao atualizar produto');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-4xl mx-auto py-6"
        >
            <form onSubmit={onSubmitHandler}>
                <PremiumCard
                    title="Editar Produto"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    }
                    footer={
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/list')}
                                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition-colors"
                            >
                                Atualizar Produto
                            </button>
                        </div>
                    }
                >
                    <div className="space-y-8">
                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Imagem do Produto</label>
                            <label htmlFor="image" className="group cursor-pointer flex flex-col items-center justify-center w-36 h-36 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all overflow-hidden relative">
                                <img
                                    src={image ? URL.createObjectURL(image) : `${url}/images/${currentImage}`}
                                    alt="Preview"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-medium">Trocar Imagem</span>
                                </div>
                            </label>
                            <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden accept="image/*" />
                        </div>

                        {/* Basic Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto <span className="text-red-500">*</span></label>
                                <input
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    onChange={onChangeHandler}
                                    value={data.name}
                                    type="text"
                                    name="name"
                                    placeholder="Ex: X-Tudo Artesanal"
                                    required
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição <span className="text-red-500">*</span></label>
                                <textarea
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    onChange={onChangeHandler}
                                    value={data.description}
                                    name="description"
                                    rows="4"
                                    placeholder="Descreva os ingredientes..."
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    onChange={onChangeHandler}
                                    value={data.category}
                                    name="category"
                                    required
                                >
                                    <option value="">Selecione uma categoria</option>
                                    {categories.map((category) => (
                                        <option key={category._id} value={category.name}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-gray-500 font-medium">R$</span>
                                    </div>
                                    <input
                                        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        onChange={onChangeHandler}
                                        value={data.price}
                                        type="number"
                                        step="0.01"
                                        name="price"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Legacy Extras System */}
                        <div className="pt-6 mt-6 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-base font-semibold text-gray-800">Extras</h4>
                                    <p className="text-sm text-gray-500">Adicionais antigos (Legado)</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addExtra}
                                    className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2"
                                >
                                    + Adicionar Extra
                                </button>
                            </div>

                            {data.extras.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                                    <p className="text-sm text-gray-500">Nenhum extra cadastrado.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {data.extras.map((extra, index) => (
                                        <div key={index} className="flex flex-col md:flex-row gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <input
                                                type="text"
                                                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                placeholder="Nome do extra (Ex: Bacon)"
                                                value={extra.name}
                                                onChange={(e) => updateExtra(index, 'name', e.target.value)}
                                            />
                                            <input
                                                type="number"
                                                className="w-full md:w-32 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                placeholder="R$ 0.00"
                                                step="0.01"
                                                value={extra.price}
                                                onChange={(e) => updateExtra(index, 'price', e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeExtra(index)}
                                                className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors whitespace-nowrap"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </PremiumCard>
            </form>
        </motion.div>
    );
};

export default Edit;