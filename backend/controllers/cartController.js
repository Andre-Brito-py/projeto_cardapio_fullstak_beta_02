import userModel from './../models/userModel.js';

// add items to user cart
const addToCart = async (req,res) =>{
    try {
        // Se usuário não está autenticado, retornar sucesso (carrinho gerenciado no frontend)
        if (!req.body.userId) {
            return res.json({success:true,message:'Added to cart (local storage)'});
        }

        let userData = await userModel.findById(req.body.userId)
        let cartData = await userData.cartData;
        
        // Create cart key with extras and observations
        const { itemId, extras = [], observations = '', includeDisposables = false } = req.body;
        const extrasKey = extras.length > 0 ? JSON.stringify(extras.sort((a, b) => a.name.localeCompare(b.name))) : '';
        const cartKey = extrasKey ? `${itemId}_${Buffer.from(extrasKey).toString('base64')}` : itemId;
        
        if(!cartData[cartKey]){
            cartData[cartKey] = {
                quantity: 1,
                itemId: itemId,
                extras: extras,
                observations: observations,
                includeDisposables: includeDisposables
            };
        }
        else{
            cartData[cartKey].quantity += 1;
            // Update observations if provided
            if(observations) {
                cartData[cartKey].observations = observations;
            }
            // Update includeDisposables if provided
            if(includeDisposables !== undefined) {
                cartData[cartKey].includeDisposables = includeDisposables;
            }
        }

        await userModel.findByIdAndUpdate(req.body.userId,{cartData})
        res.json({success:true,message:'Added to cart'});
    } catch (error) {
       res.json({success:false,message:'Error'});
    }
}

// remove items to user cart
const removeFromCart = async (req, res) =>{
    try {
        // Se usuário não está autenticado, retornar sucesso (carrinho gerenciado no frontend)
        if (!req.body.userId) {
            return res.json({success:true,message:'Removed from cart (local storage)'});
        }

        let userData = await userModel.findById(req.body.userId)
        let cartData = await userData.cartData;

        // Create cart key with extras
        const { itemId, extras = [] } = req.body;
        const extrasKey = extras.length > 0 ? JSON.stringify(extras.sort((a, b) => a.name.localeCompare(b.name))) : '';
        const cartKey = extrasKey ? `${itemId}_${Buffer.from(extrasKey).toString('base64')}` : itemId;

        if(cartData[cartKey] && cartData[cartKey].quantity > 0){
            if(cartData[cartKey].quantity === 1) {
                delete cartData[cartKey];
            } else {
                cartData[cartKey].quantity -= 1;
            }
        }

        await userModel.findByIdAndUpdate(req.body.userId,{cartData});
        res.json({success:true,message:'Removed from cart'});
    } catch (error) {
       res.json({success:false,message:'Error'});
    }
}

// fetch user cart data
const getCart = async (req,res) =>{
    try {
        // Se usuário não está autenticado, retornar carrinho vazio (gerenciado no frontend)
        if (!req.body.userId) {
            return res.json({success:true,cartData:{}});
        }

        let userData = await userModel.findById(req.body.userId)
        let cartData = await userData.cartData;
        res.json({success:true,cartData});
    } catch (error) {
        res.json({success:false,message:'Error'});
    }
}

export {addToCart, removeFromCart, getCart}
