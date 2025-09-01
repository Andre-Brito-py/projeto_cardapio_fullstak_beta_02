import mongoose from "mongoose";

export const connectDB = async () =>{
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app');
        // Database connected successfully
    } catch (error) {
        console.error('DB connection error:', error);
        throw error;
    }
}