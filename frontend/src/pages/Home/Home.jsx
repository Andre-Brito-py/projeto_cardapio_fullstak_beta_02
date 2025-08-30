import { useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { StoreContext } from '../../components/context/StoreContext'
import './Home.css'

const Home = () => {
  const navigate = useNavigate()
  const { loadAllStores } = useContext(StoreContext)

  useEffect(() => {
    const redirectToFirstStore = async () => {
      try {
        // Carregar todas as lojas disponíveis
        const result = await loadAllStores()
        
        if (result.success && result.stores && result.stores.length > 0) {
          // Pegar a primeira loja (já filtrada como ativa pela API)
          const firstStore = result.stores[0]
          
          if (firstStore && firstStore.slug) {
            // Redirecionar para a primeira loja
            navigate(`/loja/${firstStore.slug}`, { replace: true })
            return
          }
        }
        
        // Se não encontrar nenhuma loja, mostrar mensagem de erro
        console.error('Nenhuma loja encontrada')
      } catch (error) {
        console.error('Erro ao carregar lojas:', error)
      }
    }

    redirectToFirstStore()
  }, [navigate, loadAllStores])

  // Mostrar loading enquanto redireciona
  return (
    <div className="home-loading">
      <div className="loading-spinner"></div>
      <p>Carregando loja...</p>
    </div>
  )
}

export default Home