import express from 'express'
import { addFood, listFood, removeFood, updateFood } from '../controllers/foodController.js'
import multer from 'multer'

const foodRouter = express.Router();

// Image Storage Engine

const storage = multer.diskStorage({
    destination:"uploads",
    filename: (req,file,cb)=>{
        return cb(null,`${Date.now()}${file.originalname}`)
    }
})

const upload = multer({storage:storage})

foodRouter.post('/add',upload.single('image'),addFood)
foodRouter.get('/list',listFood)
foodRouter.post('/remove', removeFood)
foodRouter.put('/update',upload.single('image'),updateFood)

// Test endpoint
foodRouter.post('/test', (req, res) => {
    console.log('=== TEST ENDPOINT CALLED ===');
    console.log('Request body:', req.body);
    res.json({success: true, message: 'Test endpoint working'});
});

export default foodRouter;