// Importações necessárias
import userModel from "../models/userModel.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';

/**
 * Função para fazer login do usuário
 * @param {Object} req - Objeto de requisição contendo email e password
 * @param {Object} res - Objeto de resposta
 */
const loginUser = async (req,res) =>{
    const {email, password} = req.body;
    try {
        const user = await userModel.findOne({email});

        if(!user){
           return res.json({success:false, message:'User does not exist'}) 
        }

        const isMatch = await bcrypt.compare(password,user.password)

        if(!isMatch){
            return res.json({success:false, message:'Invalid credentials'})
        }

        const token = createToken(user._id);
        res.json({success:true, token})
    } catch (error) {
        res.json({success:false, message:'Error'})
    }
}

/**
 * Função para criar token JWT
 * @param {String} id - ID do usuário
 * @returns {String} Token JWT assinado
 */
const createToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET);
};

/**
 * Função para registrar novo usuário
 * @param {Object} req - Objeto de requisição contendo name, email e password
 * @param {Object} res - Objeto de resposta
 */
const registerUser = async (req, res) => {
    const {name, password, email} = req.body;
    try {
        // Verifica se o usuário já existe
        const exists = await userModel.findOne({email});
        if(exists) {
            return res.json({success: false, message: 'User already exists'});
        }

        // Valida formato do email e força da senha
        if(!validator.isEmail(email)) {
            return res.json({success: false, message: 'Please enter a valid email'});
        }

        if(password.length < 8) {
            return res.json({success: false, message: 'Please enter a strong password'});
        }

        // Criptografa a senha do usuário
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name:name,
            email:email,
            password:hashedPassword
        })

      const user =  await newUser.save()
      const token = createToken(user._id)
      res.json({success:true, token})

    } catch (error) {
        res.json({success:false, message:'Error'})
    }
}

export {loginUser, registerUser}