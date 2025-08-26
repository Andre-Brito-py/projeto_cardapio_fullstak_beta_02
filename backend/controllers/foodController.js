import fs from 'fs'
import foodModel from '../models/foodModel.js'

// Função para popular produtos iniciais se não existirem
const populateInitialFoods = async () => {
    try {
        console.log('🔍 Verificando produtos existentes...');
        const existingFoods = await foodModel.find({});
        console.log(`📊 Produtos encontrados no banco: ${existingFoods.length}`);
        
        if (existingFoods.length === 0) {
            console.log('📦 Populando produtos iniciais...');
            const initialFoods = [
                {
                    name: 'Pizza Margherita',
                    description: 'Pizza clássica com molho de tomate, mussarela e manjericão',
                    price: 25.99,
                    image: 'pizza.jpg',
                    category: 'Pizza',
                    extras: []
                },
                {
                    name: 'Hambúrguer Clássico',
                    description: 'Hambúrguer com carne, alface, tomate e queijo',
                    price: 18.50,
                    image: 'burger.jpg',
                    category: 'Burger',
                    extras: []
                },
                {
                    name: 'Salada Caesar',
                    description: 'Salada fresca com alface, croutons e molho caesar',
                    price: 15.00,
                    image: 'salad.jpg',
                    category: 'Salad',
                    extras: []
                }
            ];
            
            const savedFoods = await foodModel.insertMany(initialFoods);
            console.log('✅ Produtos iniciais populados com sucesso!');
            console.log('🆔 IDs dos produtos criados:');
            savedFoods.forEach(food => {
                console.log(`   - ${food.name}: ${food._id}`);
            });
        } else {
            console.log('✅ Produtos já existem no banco de dados');
            console.log('🆔 IDs dos produtos existentes:');
            existingFoods.forEach(food => {
                console.log(`   - ${food.name}: ${food._id}`);
            });
        }
    } catch (error) {
        console.log('❌ Erro ao popular produtos iniciais:', error);
    }
};

// Chamar a função de população
populateInitialFoods();

//add food item

const addFood = async (req,res) =>{
    console.log('=== ADD FOOD REQUEST RECEIVED ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Store context:', req.store);

    let image_filename = req.file ? req.file.filename : req.body.image || 'default.jpg';

    // Parse extras if provided
    let extras = [];
    if (req.body.extras) {
        try {
            extras = typeof req.body.extras === 'string' ? JSON.parse(req.body.extras) : req.body.extras;
        } catch (error) {
            console.log('Error parsing extras:', error);
        }
    }

    const food = new foodModel({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        image: image_filename,
        storeId: req.store._id, // Adicionar storeId do contexto
        extras: extras
    });

    try {
        await food.save();
        console.log('Food added to database:', food.name, 'for store:', req.store.name);
        res.json({success:true,message:'Food Added'})
    } catch (error) {
        console.log(error);
        res.json({success:false, message:'Error'})
    }
}

// All food list

const listFood = async (req,res) =>{
    try {
        // Se há contexto de loja, filtrar por loja, senão listar todos
        const query = req.store ? { storeId: req.store._id, isActive: true } : { isActive: true };
        const foods = await foodModel.find(query).populate('storeId', 'name slug');
        res.json({success:true,data:foods})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:'Error'})
    }
}

// remove food item

const removeFood = async (req,res)=>{
    try {
        // Verificar se o produto pertence à loja
        const query = req.store ? { _id: req.body.id, storeId: req.store._id } : { _id: req.body.id };
        const food = await foodModel.findOne(query);
        if (food) {
            fs.unlink(`uploads/${food.image}`,()=>{})
            await foodModel.findByIdAndDelete(req.body.id);
            res.json({success:true,message:'Food Removed'})
        } else {
            res.json({success:false, message:'Food not found or access denied'})
        }
    } catch (error) {
        console.log(error)
        res.json({success:false, message:'Error'})
    }
}

// update food item
const updateFood = async (req, res) => {
    try {
        const { id, name, description, price, category, extras } = req.body;
        
        // Find food in database with store context
        const query = req.store ? { _id: id, storeId: req.store._id } : { _id: id };
        const food = await foodModel.findOne(query);
        
        if (!food) {
            return res.json({ success: false, message: 'Food item not found or access denied' });
        }
        
        // Prepare update data
        const updateData = {
            name: name || food.name,
            description: description || food.description,
            price: price || food.price,
            category: category || food.category
        };
        
        // Parse and update extras if provided
        if (extras) {
            try {
                updateData.extras = typeof extras === 'string' ? JSON.parse(extras) : extras;
            } catch (error) {
                console.log('Error parsing extras:', error);
                updateData.extras = [];
            }
        } else {
            updateData.extras = food.extras;
        }
        
        // Update image if new file is uploaded
        if (req.file) {
            // Remove old image
            if (food.image) {
                fs.unlink(`uploads/${food.image}`, () => {});
            }
            updateData.image = req.file.filename;
        } else {
            updateData.image = food.image;
        }
        
        // Update in database
        const updatedFood = await foodModel.findByIdAndUpdate(id, updateData, { new: true });
        
        res.json({ success: true, message: 'Food Updated', data: updatedFood });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error updating food' });
    }
};

export {addFood, listFood, removeFood, updateFood}