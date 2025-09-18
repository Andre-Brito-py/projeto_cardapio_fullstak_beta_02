import React, { useState, useEffect } from 'react';
import './ProductSuggestions.css';
import { toast } from 'react-toastify';
import backendService from '../../services/backendService';

const ProductSuggestions = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSuggestion, setEditingSuggestion] = useState(null);
    const [formData, setFormData] = useState({
        productId: '',
        suggestedProductId: '',
        title: 'Que tal adicionar?',
        description: '',
        order: 0,
        isActive: true
    });

    useEffect(() => {
        loadSuggestions();
        loadProducts();
    }, []);

    const loadSuggestions = async () => {
        try {
            const response = await backendService.getProductSuggestions();
            if (response.success) {
                setSuggestions(response.data);
            } else {
                toast.error('Erro ao carregar sugestões');
            }
        } catch (error) {
            console.error('Erro ao carregar sugestões:', error);
            toast.error('Erro ao carregar sugestões');
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const response = await backendService.getMenuItems();
            if (response.success) {
                setProducts(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.productId === formData.suggestedProductId) {
            toast.error('Um produto não pode ser sugestão de si mesmo');
            return;
        }

        try {
            let response;
            if (editingSuggestion) {
                response = await backendService.updateProductSuggestion(editingSuggestion._id, formData);
            } else {
                response = await backendService.createProductSuggestion(formData);
            }

            if (response.success) {
                toast.success(editingSuggestion ? 'Sugestão atualizada com sucesso!' : 'Sugestão criada com sucesso!');
                loadSuggestions();
                handleCloseModal();
            } else {
                toast.error(response.message || 'Erro ao salvar sugestão');
            }
        } catch (error) {
            console.error('Erro ao salvar sugestão:', error);
            toast.error('Erro ao salvar sugestão');
        }
    };

    const handleEdit = (suggestion) => {
        setEditingSuggestion(suggestion);
        setFormData({
            productId: suggestion.productId._id,
            suggestedProductId: suggestion.suggestedProductId._id,
            title: suggestion.title,
            description: suggestion.description,
            order: suggestion.order,
            isActive: suggestion.isActive
        });
        setShowModal(true);
    };

    const handleDelete = async (suggestionId) => {
        if (window.confirm('Tem certeza que deseja excluir esta sugestão?')) {
            try {
                const response = await backendService.deleteProductSuggestion(suggestionId);
                if (response.success) {
                    toast.success('Sugestão excluída com sucesso!');
                    loadSuggestions();
                } else {
                    toast.error('Erro ao excluir sugestão');
                }
            } catch (error) {
                console.error('Erro ao excluir sugestão:', error);
                toast.error('Erro ao excluir sugestão');
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSuggestion(null);
        setFormData({
            productId: '',
            suggestedProductId: '',
            title: 'Que tal adicionar?',
            description: '',
            order: 0,
            isActive: true
        });
    };

    const toggleActive = async (suggestion) => {
        try {
            const response = await backendService.updateProductSuggestion(suggestion._id, {
                ...suggestion,
                isActive: !suggestion.isActive
            });
            if (response.success) {
                toast.success('Status atualizado com sucesso!');
                loadSuggestions();
            } else {
                toast.error('Erro ao atualizar status');
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            toast.error('Erro ao atualizar status');
        }
    };

    if (loading) {
        return <div className="loading">Carregando sugestões...</div>;
    }

    return (
        <div className="product-suggestions">
            <div className="page-header">
                <h1>Sugestões de Produtos</h1>
                <button 
                    className="btn-primary"
                    onClick={() => setShowModal(true)}
                >
                    + Nova Sugestão
                </button>
            </div>

            <div className="suggestions-table">
                <table>
                    <thead>
                        <tr>
                            <th>Produto Principal</th>
                            <th>Produto Sugerido</th>
                            <th>Título</th>
                            <th>Ordem</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suggestions.map(suggestion => (
                            <tr key={suggestion._id}>
                                <td>
                                    <div className="product-info">
                                        <img 
                                            src={`${backendService.baseUrl}/images/${suggestion.productId.image}`}
                                            alt={suggestion.productId.name}
                                            className="product-image"
                                        />
                                        <span>{suggestion.productId.name}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="product-info">
                                        <img 
                                            src={`${backendService.baseUrl}/images/${suggestion.suggestedProductId.image}`}
                                            alt={suggestion.suggestedProductId.name}
                                            className="product-image"
                                        />
                                        <span>{suggestion.suggestedProductId.name}</span>
                                    </div>
                                </td>
                                <td>{suggestion.title}</td>
                                <td>{suggestion.order}</td>
                                <td>
                                    <button 
                                        className={`status-btn ${suggestion.isActive ? 'active' : 'inactive'}`}
                                        onClick={() => toggleActive(suggestion)}
                                    >
                                        {suggestion.isActive ? 'Ativo' : 'Inativo'}
                                    </button>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button 
                                            className="btn-edit"
                                            onClick={() => handleEdit(suggestion)}
                                        >
                                            Editar
                                        </button>
                                        <button 
                                            className="btn-delete"
                                            onClick={() => handleDelete(suggestion._id)}
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {suggestions.length === 0 && (
                    <div className="empty-state">
                        <p>Nenhuma sugestão cadastrada ainda.</p>
                        <button 
                            className="btn-primary"
                            onClick={() => setShowModal(true)}
                        >
                            Criar primeira sugestão
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>{editingSuggestion ? 'Editar Sugestão' : 'Nova Sugestão'}</h2>
                            <button className="close-btn" onClick={handleCloseModal}>×</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Produto Principal:</label>
                                <select 
                                    value={formData.productId}
                                    onChange={(e) => setFormData({...formData, productId: e.target.value})}
                                    required
                                >
                                    <option value="">Selecione um produto</option>
                                    {products.map(product => (
                                        <option key={product._id} value={product._id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Produto Sugerido:</label>
                                <select 
                                    value={formData.suggestedProductId}
                                    onChange={(e) => setFormData({...formData, suggestedProductId: e.target.value})}
                                    required
                                >
                                    <option value="">Selecione um produto</option>
                                    {products
                                        .filter(product => product._id !== formData.productId)
                                        .map(product => (
                                            <option key={product._id} value={product._id}>
                                                {product.name}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Título da Sugestão:</label>
                                <input 
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="Ex: Que tal adicionar?"
                                />
                            </div>

                            <div className="form-group">
                                <label>Descrição (opcional):</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Descrição da sugestão..."
                                    rows="3"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Ordem de Exibição:</label>
                                    <input 
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        <input 
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                        />
                                        Ativo
                                    </label>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingSuggestion ? 'Atualizar' : 'Criar'} Sugestão
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductSuggestions;