import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

mongoose.connect('mongodb://localhost:27017/food-delivery');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    isActive: Boolean,
    lastLogin: Date
});

const User = mongoose.model('User', userSchema);

async function testPassword() {
    try {
        const user = await User.findOne({ email: 'admin@fooddelivery.com', role: 'super_admin' });
        
        if (!user) {
            console.log('Usuário não encontrado');
            return;
        }
        
        console.log('Usuário encontrado:', user.email);
        console.log('Senha hash:', user.password);
        
        // Testar várias senhas possíveis
        const passwords = ['superadmin123', 'admin123', '123456', 'admin', 'password'];
        
        for (const pwd of passwords) {
            const isMatch = await bcrypt.compare(pwd, user.password);
            console.log(`Senha "${pwd}":`, isMatch ? 'MATCH' : 'NO MATCH');
        }
        
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        mongoose.disconnect();
    }
}

testPassword();