import React, { useState, useEffect } from 'react';
import './Edit.css';
import { assets } from '../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';

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
        return <div className="edit-loading">Carregando...</div>;
    }

    return (
        <div className='edit'>
            <form className='flex-col' onSubmit={onSubmitHandler}>
                <div className="edit-img-upload flex-col">
                    <p>Upload Image</p>
                    <label htmlFor="image">
                        <img 
                            src={image ? URL.createObjectURL(image) : `${url}/images/${currentImage}`} 
                            alt="" 
                        />
                    </label>
                    <input 
                        onChange={(e) => setImage(e.target.files[0])} 
                        type="file" 
                        id="image" 
                        hidden 
                        accept="image/*"
                    />
                </div>
                
                <div className="edit-product-name flex-col">
                    <p>Product name</p>
                    <input 
                        onChange={onChangeHandler} 
                        value={data.name} 
                        type="text" 
                        name='name' 
                        placeholder='Type here' 
                        required
                    />
                </div>
                
                <div className="edit-product-description flex-col">
                    <p>Product description</p>
                    <textarea 
                        onChange={onChangeHandler} 
                        value={data.description} 
                        name="description" 
                        rows="6" 
                        placeholder='Write content here' 
                        required
                    ></textarea>
                </div>
                
                <div className="edit-category-price">
                    <div className="edit-category flex-col">
                        <p>Product category</p>
                        <select onChange={onChangeHandler} value={data.category} name="category" required>
                            <option value="">Selecione uma categoria</option>
                            {categories.map((category) => (
                                <option key={category._id} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="edit-price flex-col">
                        <p>Product price</p>
                        <input 
                            onChange={onChangeHandler} 
                            value={data.price} 
                            type="Number" 
                            name='price' 
                            placeholder='$20' 
                            required
                        />
                    </div>
                </div>

                <div className="edit-extras flex-col">
                    <div className="extras-header">
                        <p>Extras (Opcionais)</p>
                        <button type="button" onClick={addExtra} className="add-extra-btn">
                            + Adicionar Extra
                        </button>
                    </div>
                    
                    {data.extras.map((extra, index) => (
                        <div key={index} className="extra-item">
                            <input
                                type="text"
                                placeholder="Nome do extra"
                                value={extra.name}
                                onChange={(e) => updateExtra(index, 'name', e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Preço"
                                value={extra.price}
                                onChange={(e) => updateExtra(index, 'price', e.target.value)}
                            />
                            <button 
                                type="button" 
                                onClick={() => removeExtra(index)}
                                className="remove-extra-btn"
                            >
                                Remover
                            </button>
                        </div>
                    ))}
                </div>
                
                <div className="edit-buttons">
                    <button type="submit" className='edit-btn'>ATUALIZAR PRODUTO</button>
                    <button 
                        type="button" 
                        onClick={() => navigate('/list')} 
                        className='cancel-btn'
                    >
                        CANCELAR
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Edit;