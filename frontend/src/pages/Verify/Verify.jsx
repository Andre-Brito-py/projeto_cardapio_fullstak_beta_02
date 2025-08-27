import React, { useContext, useEffect } from 'react'
import './Verify.css'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StoreContext } from './../../components/context/StoreContext';
import axios from 'axios';
import SEO from '../../components/SEO/SEO';

const Verify = () => {

    const [searchParams] = useSearchParams();
    const success = searchParams.get("success")
    const orderId = searchParams.get("orderId")
    const {url} = useContext(StoreContext);
    const navigate = useNavigate();

    const verifyPayment = async () =>{
        const response = await axios.post(url+"/api/order/verify",{success, orderId});
        if(response.data.success){
            navigate('/myorders');
        }
        else{
            navigate('/')
        }
    }

    useEffect(()=>{
        verifyPayment();
    },[])
   
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