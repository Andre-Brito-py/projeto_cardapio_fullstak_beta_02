import { useContext, useEffect, useCallback } from 'react'
import './Verify.css'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StoreContext } from './../../components/context/StoreContext';
import axios from 'axios';
import SEO from '../../components/SEO/SEO';

const Verify = () => {

    const [searchParams] = useSearchParams();
    const success = searchParams.get("success")
    const orderId = searchParams.get("orderId")
    const {url, token} = useContext(StoreContext);
    const navigate = useNavigate();

    const verifyPayment = useCallback(async () => {
        try {
            const response = await axios.post(`${url}/api/order/verify`, {
                success, 
                orderId
            });
            
            if (response.data.success) {
                // Limpar carrinho do localStorage para usuários não autenticados
                if (!token) {
                    localStorage.removeItem('cartItems');
                    // Cart cleared from localStorage after successful payment
                }
                
                // Redirecionar baseado no status de autenticação
                if (token) {
                    navigate('/myorders');
                } else {
                    // Para usuários não autenticados, redirecionar para home com mensagem de sucesso
                    alert('Pedido realizado com sucesso! Você receberá atualizações por email.');
                    navigate('/');
                }
            } else {
                console.error('Erro na verificação do pagamento:', response.data.message);
                alert(response.data.message || 'Erro na verificação do pagamento.');
                navigate('/');
            }
        } catch (error) {
            console.error('Erro ao verificar pagamento:', error);
            const errorMessage = error.response?.data?.message || 'Erro ao verificar pagamento. Tente novamente.';
            alert(errorMessage);
            navigate('/');
        }
    }, [url, success, orderId, token, navigate])

    useEffect(() => {
        verifyPayment();
    }, [verifyPayment])
   
  return (
    <div className='verify'>
      <SEO 
        title="Verificando Pagamento - Food Delivery"
        description="Aguarde enquanto verificamos seu pagamento e confirmamos seu pedido."
        keywords="verificação pagamento, confirmação pedido, food delivery"
      />
        <div className="spinner"></div>
    </div>
  )
}

export default Verify