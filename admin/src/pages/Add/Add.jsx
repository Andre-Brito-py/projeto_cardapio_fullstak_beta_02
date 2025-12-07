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
                    setData(prev => ({...prev, category: response.data.data[0].name}));
                }
            }
        } catch (error) {
            // Error loading categories, using empty array as fallback
            setCategories([]);
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
    
    // Addon Category handlers
    const onAddonCategoryChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setCurrentAddonCategory(prev => ({...prev, [name]: value}));
    }
    
    const addAddonCategory = () => {
        if (currentAddonCategory.name.trim()) {
            const newCategory = {
                id: Date.now().toString(),
                ...currentAddonCategory,
                maxSelection: Number(currentAddonCategory.maxSelection)
            };
            setAddonCategories(prev => [...prev, newCategory]);
            setCategoryAddons(prev => ({...prev, [newCategory.id]: []}));
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
    }
    
    const removeAddonCategory = (categoryId) => {
        setAddonCategories(prev => prev.filter(cat => cat.id !== categoryId));
        setCategoryAddons(prev => {
            const newAddons = {...prev};
            delete newAddons[categoryId];
            return newAddons;
        });
        if (selectedCategoryForAddon === categoryId) {
            setSelectedCategoryForAddon('');
        }
    }
    
    // Addon handlers
    const onAddonChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setCurrentAddon(prev => ({...prev, [name]: value}));
    }
    
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
    }
    
    const removeAddon = (categoryId, addonId) => {
        setCategoryAddons(prev => ({
            ...prev,
            [categoryId]: prev[categoryId].filter(addon => addon.id !== addonId)
        }));
    }
    
    // Legacy extras handlers
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
        try {
            const response = await axios.post(`${url}/api/food/test`, {test: 'data'});
            toast.success('Conexão funcionando!');
        } catch (error) {
            toast.error('Erro na conexão: ' + error.message);
        }
    }

    const onSubmitHandler = async (event) =>{
        event.preventDefault();
        
        const formData = new FormData();
        formData.append('name', data.name)
        formData.append('description', data.description)
        formData.append('price', Number(data.price))
        formData.append('category', data.category)
        formData.append('image', image)
        
        // Include addon system data
        if (useOldSystem) {
            formData.append('extras', JSON.stringify(extras))
            formData.append('useOldSystem', 'true')
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
            
            formData.append('addonCategories', JSON.stringify(inlineAddonCategories))
            formData.append('categoryAddons', JSON.stringify(categoryAddonsForBackend))
            formData.append('useOldSystem', 'false')
        }
        
        try {
            const token = localStorage.getItem('token');
            
            const response = await axios.post(`${url}/api/food/add`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if(response.data.success){
                setData({
                    name:'',
                    description:'',
                    price:'',
                    category: categories.length > 0 ? categories[0].name : ''
                })
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
                toast.success(response.data.message)
            }else{
                toast.error(response.data.message)
            }
        } catch (error) {
            if (error.response) {
                toast.error(error.response.data.message || 'Erro ao criar produto');
            } else {
                toast.error('Erro ao conectar com o servidor');
            }
        }
    }

  return (
    <div className='add'>
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h2 className="m-0 d-flex align-items-center gap-2"><i className="ti ti-plus"></i>Novo Produto</h2>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-primary" onClick={testConnection}><i className="ti ti-plug"></i> Testar Conexão</button>
          </div>
        </div>
        <div className="card-body">
          <form className="flex-col" onSubmit={onSubmitHandler}>
            <div className="add-img-upload flex-col">
              <label className="form-label">Imagem</label>
              <label htmlFor="image">
                <img src={image ? URL.createObjectURL(image) : assets.upload_area} alt="upload" />
              </label>
              <input onChange={(e) => setImage(e.target.files[0])} type="file" id='image' hidden required accept="image/*" />
            </div>
            <div className="add-product-name flex-col">
              <label className="form-label">Nome</label>
              <div className="input-with-icon">
                <i className="ti ti-text-size"></i>
                <input className="form-control" onChange={onChangeHandler} value={data.name} type="text" name='name' placeholder='Digite o nome' required />
              </div>
            </div>
            <div className="add-product-description flex-col">
              <label className="form-label">Descrição</label>
              <div className="input-with-icon">
                <i className="ti ti-align-left"></i>
                <textarea className="form-control" onChange={onChangeHandler} value={data.description} name="description" rows='6' placeholder='Descreva o produto' required></textarea>
              </div>
            </div>
            <div className="add-category-price">
              <div className="add-category flex-col">
                <label className="form-label">Categoria</label>
                <div className="input-with-icon">
                <i className="ti ti-category"></i>
                <select className="form-select" onChange={onChangeHandler} name="category" value={data.category}>
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
              </div>
              <div className="add-price flex-col">
                <label className="form-label">Preço</label>
                <div className="input-with-icon">
                  <i className="ti ti-currency-dollar"></i>
                  <input className="form-control" onChange={onChangeHandler} value={data.price} type="number" name='price' placeholder='R$ 0,00' required />
                </div>
              </div>
            </div>
            <div className="card card-tabs mt-2">
              <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs">
                  <li className="nav-item">
                    <button type="button" className={`nav-link ${!useOldSystem ? 'active' : ''}`} onClick={() => setUseOldSystem(false)}>
                      <i className="ti ti-layers-union"></i> Adicionais
                    </button>
                  </li>
                  <li className="nav-item">
                    <button type="button" className={`nav-link ${useOldSystem ? 'active' : ''}`} onClick={() => setUseOldSystem(true)}>
                      <i className="ti ti-archive"></i> Extras (Legado)
                    </button>
                  </li>
                </ul>
              </div>
              <div className="card-body">
                {!useOldSystem && (
                  <div className="addon-categories-system flex-col">
                    <h3>Categorias de Adicionais</h3>
                    <div className="add-category-form">
                      <h4>Adicionar Nova Categoria</h4>
                      <div className="category-form-inputs">
                        <input className="form-control" type="text" name="name" placeholder="Nome da categoria" value={currentAddonCategory.name} onChange={onAddonCategoryChangeHandler} />
                        <input className="form-control" type="text" name="description" placeholder="Descrição (opcional)" value={currentAddonCategory.description} onChange={onAddonCategoryChangeHandler} />
                        <div className="category-settings d-flex gap-3">
                          <div className="setting-group">
                            <label className="form-label">Máximo de seleções</label>
                            <input className="form-control" type="number" name="maxSelection" min="1" max="10" value={currentAddonCategory.maxSelection} onChange={onAddonCategoryChangeHandler} />
                          </div>
                          <div className="setting-group d-flex align-items-center gap-2">
                            <input className="form-check-input" type="checkbox" name="isRequired" checked={currentAddonCategory.isRequired} onChange={onAddonCategoryChangeHandler} />
                            <span>Obrigatória</span>
                          </div>
                        </div>
                        <button type="button" onClick={addAddonCategory} className="btn btn-primary">Adicionar Categoria</button>
                      </div>
                    </div>
                    {addonCategories.length > 0 && (
                      <div className="created-categories">
                        <h4>Categorias Criadas</h4>
                        <ul className="list-group list-group-flush">
                          {addonCategories.map(category => (
                            <li key={category.id} className="list-group-item">
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="category-info">
                                  <strong>{category.name}</strong>
                                  {category.description && <span> - {category.description}</span>}
                                  <small> (Máx: {category.maxSelection}, {category.isRequired ? 'Obrigatória' : 'Opcional'})</small>
                                </div>
                                <button type="button" onClick={() => removeAddonCategory(category.id)} className="btn btn-danger btn-sm">Remover</button>
                              </div>
                              {categoryAddons[category.id] && categoryAddons[category.id].length > 0 && (
                                <ul className="list-group list-group-flush mt-2">
                                  {categoryAddons[category.id].map(addon => (
                                    <li key={addon.id} className="list-group-item d-flex justify-content-between align-items-center">
                                      <span>{addon.name} - R$ {addon.price.toFixed(2)}</span>
                                      {addon.description && <small> ({addon.description})</small>}
                                      <button type="button" onClick={() => removeAddon(category.id, addon.id)} className="btn btn-danger btn-sm">×</button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {addonCategories.length > 0 && (
                      <div className="add-addon-form">
                        <h4>Adicionar Adicionais às Categorias</h4>
                        <div className="addon-form-inputs">
                          <select className="form-select" value={selectedCategoryForAddon} onChange={(e) => setSelectedCategoryForAddon(e.target.value)}>
                            <option value="">Selecione uma categoria</option>
                            {addonCategories.map(category => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                          <input className="form-control" type="text" name="name" placeholder="Nome do adicional" value={currentAddon.name} onChange={onAddonChangeHandler} />
                          <input className="form-control" type="number" name="price" placeholder="Preço (R$)" step="0.01" value={currentAddon.price} onChange={onAddonChangeHandler} />
                          <input className="form-control" type="text" name="description" placeholder="Descrição (opcional)" value={currentAddon.description} onChange={onAddonChangeHandler} />
                          <button type="button" onClick={addAddon} className="btn btn-primary">Adicionar</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {useOldSystem && (
                  <div className="add-extras-section flex-col">
                    <h3>Extras do Produto (Sistema Antigo)</h3>
                    {extras.length > 0 && (
                      <div className="extras-list">
                        <h4>Extras Adicionados:</h4>
                        <ul className="list-group list-group-flush">
                          {extras.map((extra, index) => (
                            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                              <span><strong>{extra.name}</strong> - R$ {extra.price}</span>
                              {extra.description && <span> ({extra.description})</span>}
                              <button type="button" onClick={() => removeExtra(index)} className="btn btn-danger btn-sm">Remover</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="add-extra-form">
                      <div className="extra-inputs">
                        <input className="form-control" type="text" name="name" placeholder="Nome do extra" value={currentExtra.name} onChange={onExtraChangeHandler} />
                        <input className="form-control" type="number" name="price" placeholder="Preço (R$)" step="0.01" value={currentExtra.price} onChange={onExtraChangeHandler} />
                        <input className="form-control" type="text" name="description" placeholder="Descrição (opcional)" value={currentExtra.description} onChange={onExtraChangeHandler} />
                        <button type="button" onClick={addExtra} className="btn btn-primary">Adicionar Extra</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="card-footer d-flex justify-content-end gap-2">
              <button type='submit' className='btn btn-primary'>Salvar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Add
