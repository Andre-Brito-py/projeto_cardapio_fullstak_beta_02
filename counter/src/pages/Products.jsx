import React, { useState, useEffect } from 'react'
import { Package, Search, Filter } from 'lucide-react'

const Products = ({ attendant }) => {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, selectedCategory])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('counter-token')
      const response = await fetch('/api/counter-orders/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const productList = data.products || []
        setProducts(productList)
        
        // Extrair categorias únicas
        const uniqueCategories = [...new Set(productList.map(p => p.category).filter(Boolean))]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por categoria
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    setFilteredProducts(filtered)
  }

  const ProductCard = ({ product }) => (
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}
        />
      )}
      
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
          {product.name}
        </h3>
        
        {product.description && (
          <p style={{
            margin: '0 0 1rem',
            color: '#6c757d',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}>
            {product.description}
          </p>
        )}
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <span style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            color: '#27ae60'
          }}>
            R$ {product.price.toFixed(2)}
          </span>
          
          {product.category && (
            <span style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: '#e9ecef',
              color: '#495057',
              borderRadius: '12px',
              fontSize: '0.8rem'
            }}>
              {product.category}
            </span>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.9rem',
          color: '#6c757d'
        }}>
          <span>
            Status: 
            <span style={{
              color: product.available ? '#27ae60' : '#e74c3c',
              fontWeight: '500',
              marginLeft: '0.25rem'
            }}>
              {product.available ? 'Disponível' : 'Indisponível'}
            </span>
          </span>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return <div className="loading">Carregando produtos...</div>
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{ margin: 0 }}>Produtos Disponíveis</h1>
        <div style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#e8f5e8',
          color: '#2d5a2d',
          borderRadius: '20px',
          fontSize: '0.9rem'
        }}>
          {filteredProducts.length} produto(s)
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="grid grid-2">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <Search size={16} style={{ marginRight: '0.5rem' }} />
              Buscar Produto
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              placeholder="Digite o nome do produto..."
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <Filter size={16} style={{ marginRight: '0.5rem' }} />
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-control"
            >
              <option value="">Todas as categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <Package size={48} style={{ color: '#6c757d', marginBottom: '1rem' }} />
          <h3 style={{ color: '#6c757d', marginBottom: '0.5rem' }}>
            Nenhum produto encontrado
          </h3>
          <p style={{ color: '#6c757d', margin: 0 }}>
            {searchTerm || selectedCategory 
              ? 'Tente ajustar os filtros de busca'
              : 'Não há produtos cadastrados no momento'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-3">
          {filteredProducts.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {/* Resumo */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Resumo</h3>
        <div className="grid grid-3">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '600', color: '#3498db' }}>
              {products.length}
            </div>
            <div style={{ color: '#6c757d' }}>Total de Produtos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '600', color: '#27ae60' }}>
              {products.filter(p => p.available).length}
            </div>
            <div style={{ color: '#6c757d' }}>Disponíveis</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '600', color: '#e74c3c' }}>
              {products.filter(p => !p.available).length}
            </div>
            <div style={{ color: '#6c757d' }}>Indisponíveis</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Products