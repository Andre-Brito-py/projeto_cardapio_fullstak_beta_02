import React, { useState, useEffect } from 'react';
import './Categories.css';
import { toast } from 'react-toastify';
import axios from 'axios';
import { assets } from '../../assets/assets';

const Categories = ({ url }) => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: null
    });
    const [editingCategory, setEditingCategory] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const fetchCategories = async () => {
        try {
            const storeId = localStorage.getItem('storeId');
            const response = await axios.get(`${url}/api/category/list?storeId=${storeId}`);
            if (response.data.success) {
                setCategories(response.data.data);
            } else {
                toast.error('Erro ao carregar categorias');
            }
        } catch (error) {
            toast.error('Erro ao carregar categorias');
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        setFormData(prev => ({
            ...prev,
            image: e.target.files[0]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            let response;
            if (editingCategory) {
                data.append('id', editingCategory._id);
                response = await axios.post(`${url}/api/category/update`, data);
            } else {
                response = await axios.post(`${url}/api/category/add`, data);
            }

            if (response.data.success) {
                toast.success(response.data.message);
                setFormData({ name: '', description: '', image: null });
                setEditingCategory(null);
                setShowForm(false);
                fetchCategories();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('Erro ao salvar categoria');
        }
    };

    const handleEdit = (category) => {
        setFormData({
            name: category.name,
            description: category.description,
            image: null
        });
        setEditingCategory(category);
        setShowForm(true);
    };

    const handleDelete = async (categoryId) => {
        if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
            try {
                const response = await axios.post(`${url}/api/category/remove`, { id: categoryId });
                if (response.data.success) {
                    toast.success('Categoria removida com sucesso');
                    fetchCategories();
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                toast.error('Erro ao remover categoria');
            }
        }
    };

    const toggleActive = async (category) => {
        try {
            const data = new FormData();
            data.append('id', category._id);
            data.append('isActive', !category.isActive);
            
            const response = await axios.post(`${url}/api/category/update`, data);
            if (response.data.success) {
                toast.success('Status da categoria atualizado');
                fetchCategories();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', image: null });
        setEditingCategory(null);
        setShowForm(false);
    };

    return (
        <div className='categories'>
            <div className="categories-header">
                <h2>Gerenciar Categorias</h2>
                <button 
                    className="add-category-btn" 
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Cancelar' : 'Nova Categoria'}
                </button>
            </div>

            {showForm && (
                <div className="category-form">
                    <h3>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Nome da Categoria</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                placeholder="Digite o nome da categoria"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Descrição</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Descrição da categoria (opcional)"
                                rows="3"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Imagem da Categoria</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                required={!editingCategory}
                            />
                            <div className="image-recommendation">
                                <p><strong>Tamanho recomendado:</strong></p>
                                <ul>
                                    <li>Proporção: 1:1 (quadrada)</li>
                                    <li>Resolução mínima: 300x300 pixels</li>
                                    <li>Resolução ideal: 500x500 pixels</li>
                                    <li>Formato: JPG, PNG ou WebP</li>
                                    <li>Tamanho máximo: 1MB</li>
                                </ul>
                                <p><em>A imagem será exibida como ícone da categoria no menu de navegação e nas listagens.</em></p>
                            </div>
                            {formData.image && (
                                <div className="image-preview">
                                    <img src={URL.createObjectURL(formData.image)} alt="Preview" />
                                </div>
                            )}
                        </div>
                        
                        <div className="form-buttons">
                            <button type="submit" className="submit-btn">
                                {editingCategory ? 'Atualizar' : 'Adicionar'}
                            </button>
                            <button type="button" className="cancel-btn" onClick={resetForm}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="categories-list">
                <h3>Categorias Cadastradas</h3>
                {categories.length === 0 ? (
                    <p className="no-categories">Nenhuma categoria cadastrada</p>
                ) : (
                    <div className="categories-grid">
                        {categories.map((category) => (
                            <div key={category._id} className={`category-card ${!category.isActive ? 'inactive' : ''}`}>
                                <div className="category-image">
                                    <img src={`${url}/images/${category.image}`} alt={category.name} />
                                </div>
                                <div className="category-info">
                                    <h4>{category.name}</h4>
                                    <p>{category.description || 'Sem descrição'}</p>
                                    <span className={`status ${category.isActive ? 'active' : 'inactive'}`}>
                                        {category.isActive ? 'Ativa' : 'Inativa'}
                                    </span>
                                </div>
                                <div className="category-actions">
                                    <button 
                                        className="edit-btn" 
                                        onClick={() => handleEdit(category)}
                                        title="Editar"
                                    >
                                        <img src={assets.edit_icon} alt="Editar" />
                                    </button>
                                    <button 
                                        className={`toggle-btn ${category.isActive ? 'deactivate' : 'activate'}`}
                                        onClick={() => toggleActive(category)}
                                        title={category.isActive ? 'Desativar' : 'Ativar'}
                                    >
                                        {category.isActive ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                    <button 
                                        className="delete-btn" 
                                        onClick={() => handleDelete(category._id)}
                                        title="Excluir"
                                    >
                                        ❌
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Categories;