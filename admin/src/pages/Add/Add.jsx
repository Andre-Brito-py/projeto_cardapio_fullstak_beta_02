import React, {useState, useEffect } from 'react'
import './Add.css'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const Add = ({url}) => {

    const [image, setImage] = useState(false);
    const [categories, setCategories] = useState([]);
    const [data, setData] = useState({
        name:'',
        description:'',
        price:'',
        category:''
    })
    
    const [extras, setExtras] = useState([]);
    const [currentExtra, setCurrentExtra] = useState({
        name: '',
        price: '',
        description: ''
    });

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${url}/api/category/active`);
            if (response.data.success) {
                setCategories(response.data.data);
                // Set first category as default if available
                if (response.data.data.length > 0 && !data.category) {
                    setData(prev => ({...prev, category: response.data.data[0].name}));
                }
            }
        } catch (error) {
            console.log('Erro ao carregar categorias:', error);
            toast.error('Erro ao carregar categorias');
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const onChangeHandler = (event) =>{
        const name = event.target.name;
        const value = event.target.value;
        setData(data=>({...data,[name]:value}))
    }
    
    const onExtraChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setCurrentExtra(prev => ({...prev, [name]: value}));
    }
    
    const addExtra = () => {
        if (currentExtra.name && currentExtra.price) {
            setExtras(prev => [...prev, {...currentExtra, price: Number(currentExtra.price)}]);
            setCurrentExtra({ name: '', price: '', description: '' });
        }
    }
    
    const removeExtra = (index) => {
        setExtras(prev => prev.filter((_, i) => i !== index));
    }

    const testConnection = async () => {
        console.log('=== TESTING CONNECTION ===');
        console.log('URL being used:', url);
        console.log('Full endpoint:', `${url}/api/food/test`);
        try {
            console.log('Making request...');
            const response = await axios.post(`${url}/api/food/test`, {test: 'data'});
            console.log('Test response:', response.data);
            toast.success('Conexão funcionando!');
        } catch (error) {
            console.error('Test error details:', error);
            console.error('Error message:', error.message);
            console.error('Error response:', error.response);
            toast.error('Erro na conexão: ' + error.message);
        }
    }

    const onSubmitHandler = async (event) =>{
        event.preventDefault();
        console.log('=== FORM SUBMIT HANDLER CALLED ===');
        console.log('Form data:', data);
        console.log('Image:', image);
        console.log('Extras:', extras);
        console.log('URL:', url);
        
        const formData = new FormData();
        formData.append('name', data.name)
        formData.append('description', data.description)
        formData.append('price', Number(data.price))
        formData.append('category', data.category)
        formData.append('image', image)
        formData.append('extras', JSON.stringify(extras))
        
        console.log('Making axios request to:', `${url}/api/food/add`);
        try {
            const token = localStorage.getItem('token');
            console.log('Token being used:', token ? token.substring(0, 20) + '...' : 'No token found');
            
            const response = await axios.post(`${url}/api/food/add`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Response received:', response.data);

            if(response.data.success){
                setData({
                    name:'',
                    description:'',
                    price:'',
                    category: categories.length > 0 ? categories[0].name : ''
                })
                setImage(false);
                setExtras([]);
                setCurrentExtra({ name: '', price: '', description: '' });
                toast.success(response.data.message)
            }else{
                toast.error(response.data.message)
            }
        } catch (error) {
            console.error('Error making request:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
                toast.error(error.response.data.message || 'Erro ao criar produto');
            } else {
                toast.error('Erro ao conectar com o servidor');
            }
        }
    }

  return (
    <div className='add'>
        <form  className="flex-col" onSubmit={onSubmitHandler}>
            <div className="add-img-upload flex-col">
                <p>Upload Image</p>
                <label htmlFor="image">
                    <img src={image? URL.createObjectURL(image):assets.upload_area} alt="" />
                </label>
                <input onChange={(e)=>setImage(e.target.files[0])} type="file" id='image' hidden required />
            </div>
            <div className="add-product-name flex-col">
                <p>Product name</p>
                <input onChange={onChangeHandler} value={data.name} type="text" name='name' placeholder='Type Here' required />
            </div>
            <div className="add-product-description flex-col">
                <p>Product description</p>
                <textarea onChange={onChangeHandler} value={data.description} name="description" rows='6' placeholder='Write content here' required></textarea>
            </div>
            <div className="add-category-price">
                <div className="add-category flex-col">
                    <p>Product category</p>
                    <select onChange={onChangeHandler} name="category" value={data.category}>
                        {categories.length === 0 ? (
                            <option value="">Carregando categorias...</option>
                        ) : (
                            categories.map((category) => (
                                <option key={category._id} value={category.name}>
                                    {category.name}
                                </option>
                            ))
                        )}
                    </select>
                </div>
                <div className="add-price flex-col">
                    <p>Product price</p>
                    <input onChange={onChangeHandler} value={data.price} type="number" name='price' placeholder='₹20' required />
                </div>
            </div>
            
            {/* Extras Section */}
            <div className="add-extras-section flex-col">
                <p>Product Extras (Optional)</p>
                
                {/* Current extras list */}
                {extras.length > 0 && (
                    <div className="extras-list">
                        <h4>Added Extras:</h4>
                        {extras.map((extra, index) => (
                            <div key={index} className="extra-item">
                                <span><strong>{extra.name}</strong> - ₹{extra.price}</span>
                                {extra.description && <span> ({extra.description})</span>}
                                <button type="button" onClick={() => removeExtra(index)} className="remove-extra-btn">Remove</button>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Add new extra form */}
                <div className="add-extra-form">
                    <div className="extra-inputs">
                        <input 
                            type="text" 
                            name="name" 
                            placeholder="Extra name (e.g., Extra Cheese)" 
                            value={currentExtra.name}
                            onChange={onExtraChangeHandler}
                        />
                        <input 
                            type="number" 
                            name="price" 
                            placeholder="Price (₹)" 
                            value={currentExtra.price}
                            onChange={onExtraChangeHandler}
                        />
                        <input 
                            type="text" 
                            name="description" 
                            placeholder="Description (optional)" 
                            value={currentExtra.description}
                            onChange={onExtraChangeHandler}
                        />
                        <button type="button" onClick={addExtra} className="add-extra-btn">Add Extra</button>
                    </div>
                </div>
            </div>
            
            <button type='submit' className='add-btn'>ADD</button>
        </form>
    </div>
  )
}

export default Add