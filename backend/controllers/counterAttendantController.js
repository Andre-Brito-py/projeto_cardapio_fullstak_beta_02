import CounterAttendant from '../models/counterAttendantModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';

// Criar token JWT
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Login do atendente de balcão
const loginAttendant = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const attendant = await CounterAttendant.findOne({ email }).populate('storeId');
        
        if (!attendant) {
            return res.json({ success: false, message: "Atendente não encontrado" });
        }
        
        if (!attendant.isActive) {
            return res.json({ success: false, message: "Conta desativada. Entre em contato com o administrador." });
        }
        
        const isMatch = await bcrypt.compare(password, attendant.password);
        
        if (!isMatch) {
            return res.json({ success: false, message: "Credenciais inválidas" });
        }
        
        // Atualizar último login
        attendant.lastLogin = new Date();
        await attendant.save();
        
        const token = createToken(attendant._id);
        
        res.json({
            success: true,
            token,
            attendant: {
                id: attendant._id,
                name: attendant.name,
                email: attendant.email,
                storeId: attendant.storeId._id,
                storeName: attendant.storeId.name,
                shift: attendant.shift,
                permissions: attendant.permissions,
                totalOrdersCreated: attendant.totalOrdersCreated
            }
        });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Erro no servidor" });
    }
};

// Registrar novo atendente (apenas admins podem fazer isso)
const registerAttendant = async (req, res) => {
    const { name, email, password, storeId, employeeId, phone, shift, permissions } = req.body;
    
    try {
        // Verificar se o email já existe
        const exists = await CounterAttendant.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "Atendente já existe com este email" });
        }
        
        // Validar email
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Email inválido" });
        }
        
        // Validar senha
        if (password.length < 8) {
            return res.json({ success: false, message: "Senha deve ter pelo menos 8 caracteres" });
        }
        
        // Hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newAttendant = new CounterAttendant({
            name,
            email,
            password: hashedPassword,
            storeId,
            employeeId,
            phone,
            shift: shift || 'full_time',
            permissions: permissions || {
                canCreateOrders: true,
                canViewReports: false,
                canManageProducts: false
            },
            createdBy: req.body.userId // ID do admin que está criando
        });
        
        const attendant = await newAttendant.save();
        
        res.json({
            success: true,
            message: "Atendente criado com sucesso",
            attendant: {
                id: attendant._id,
                name: attendant.name,
                email: attendant.email,
                employeeId: attendant.employeeId,
                shift: attendant.shift
            }
        });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Erro ao criar atendente" });
    }
};

// Listar atendentes de uma loja
const getStoreAttendants = async (req, res) => {
    try {
        const storeId = req.params.storeId || req.body.storeId;
        
        const attendants = await CounterAttendant.find({ storeId })
            .select('-password')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        
        res.json({ success: true, attendants });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Erro ao buscar atendentes" });
    }
};

// Atualizar atendente
const updateAttendant = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Remover campos que não devem ser atualizados diretamente
        delete updates.password;
        delete updates._id;
        delete updates.createdAt;
        delete updates.totalOrdersCreated;
        
        const attendant = await CounterAttendant.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!attendant) {
            return res.json({ success: false, message: "Atendente não encontrado" });
        }
        
        res.json({ success: true, attendant });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Erro ao atualizar atendente" });
    }
};

// Desativar/ativar atendente
const toggleAttendantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const attendant = await CounterAttendant.findById(id);
        if (!attendant) {
            return res.json({ success: false, message: "Atendente não encontrado" });
        }
        
        attendant.isActive = !attendant.isActive;
        await attendant.save();
        
        res.json({
            success: true,
            message: `Atendente ${attendant.isActive ? 'ativado' : 'desativado'} com sucesso`,
            isActive: attendant.isActive
        });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Erro ao alterar status do atendente" });
    }
};

// Alterar senha do atendente
const changeAttendantPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const attendantId = req.user.id;
        
        const attendant = await CounterAttendant.findById(attendantId);
        if (!attendant) {
            return res.json({ success: false, message: "Atendente não encontrado" });
        }
        
        // Verificar senha atual
        const isMatch = await bcrypt.compare(currentPassword, attendant.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Senha atual incorreta" });
        }
        
        // Validar nova senha
        if (newPassword.length < 8) {
            return res.json({ success: false, message: "Nova senha deve ter pelo menos 8 caracteres" });
        }
        
        // Hash da nova senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        attendant.password = hashedPassword;
        await attendant.save();
        
        res.json({ success: true, message: "Senha alterada com sucesso" });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Erro ao alterar senha" });
    }
};

// Obter perfil do atendente
const getAttendantProfile = async (req, res) => {
    try {
        const attendant = await CounterAttendant.findById(req.user.id)
            .select('-password')
            .populate('storeId', 'name address phone');
        
        if (!attendant) {
            return res.json({ success: false, message: "Atendente não encontrado" });
        }
        
        res.json({ success: true, attendant });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Erro ao buscar perfil" });
    }
};

export {
    loginAttendant,
    registerAttendant,
    getStoreAttendants,
    updateAttendant,
    toggleAttendantStatus,
    changeAttendantPassword,
    getAttendantProfile
};