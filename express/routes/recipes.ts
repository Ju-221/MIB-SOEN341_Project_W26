import express from 'express';
import {upload, getAllRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe,generateRecipe} from '../controllers/recipesController.js';
import {verifyToken} from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllRecipes);
router.get('/:id', getRecipeById);
router.post('/', verifyToken, upload.single('heroImage'),createRecipe);
router.put('/:id', verifyToken, upload.single('heroImage'), updateRecipe);
router.delete('/:id', verifyToken, deleteRecipe);
router.post('/generate',verifyToken, generateRecipe);
export default router;