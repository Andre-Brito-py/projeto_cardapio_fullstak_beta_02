import mongoose from "mongoose";

export const connectDB = async () =>{
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app');
        console.log('DB Connected Successfully');
    } catch (error) {
        console.log('DB connection error:', error);
    }
}