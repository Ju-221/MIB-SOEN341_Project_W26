import fs from 'fs';
import path from 'path';
import multer from 'multer';
import {eq , like} from 'drizzle-orm';
import {db} from '../db/index.js'
import {allergies, dietaryPreferences, recipes} from '../db/schema.js';
import {Request,Response} from 'express'
import { CreateRecipeBody, Difficulty, UpdateRecipeBody } from '../types/index.js';

// muter: temp-storeage, renamed after insert
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/'),
    filename: (req, file, cb) => cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`)
})
export const upload = multer({storage});

// Get /api/recipes?title=
export const getAllRecipes =  (req:Request, res :Response) => {
    try {
        const {title} = req.query;
        let result;
        if (title){
            result  =  db.select().from(recipes).where(like(recipes.title, `%${title}%`)).all();
        } else {
            result = db.select().from(recipes).all();
        }

        // parse the json fields
        result = result.map(parseRecipe);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Failed to fetch recipes'});
    }


}

// get /api/recipes/:id
export const getRecipeById = (req : Request,res: Response) => {
    try {
        const recipe = db.select().from(recipes).where(eq(recipes.id, Number(req.params.id))).get();
        if (!recipe) return res.status(404).json({message:'Recipe not found'});
        res.json(parseRecipe(recipe))
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Failed to fettch recipe'});
    }
};

// POST. api/recipes
export const createRecipe = (req: Request<{}, {}, CreateRecipeBody>, res:Response) => {
    try {
        const {title, description, prepTime, cookTime, estimatedCost,difficulty  ,ingredients, steps, categories, allergies, dietaryPreferences} = req.body;
        const createdBy = req.user!.id;

        const result = db.insert(recipes).values({
            title, description, createdBy,
            prepTime: Number(prepTime),
            cookTime: Number(cookTime),
            estimatedCost: Number(estimatedCost),
            heroImage: null,
            difficulty: difficulty,
            ingredients: typeof ingredients === 'string' ? ingredients : JSON.stringify(ingredients),
            steps: typeof steps === 'string' ? steps: JSON.stringify(steps),
            categories: typeof categories === 'string' ? categories : JSON.stringify(categories),
            dietaryPreferences: typeof dietaryPreferences === 'string' ? dietaryPreferences : JSON.stringify(dietaryPreferences),
            allergies: typeof allergies === 'string' ? allergies: JSON.stringify(allergies)
        }).returning().get();
    

    const id = result.id;

    // rename uploaded image to {id}.ext
    let heroImage = null;
    if(req.file) {
        const ext = path.extname(req.file.originalname); // the file extension
        const newName = `${id}${ext}`;
        fs.renameSync(req.file.path,path.join('./uploads', newName));
        heroImage = newName;
        db.update(recipes).set({heroImage}).where(eq(recipes.id, id)).run()
    }

    res.status(201).json(parseRecipe({...result, heroImage}));
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Failed to create recipe'});
    }

};


export const updateRecipe = (req: Request<{ id: string }, {}, UpdateRecipeBody>, res:Response) => {
    try {
        
        const id = Number(req.params.id);
        const existing = db.select().from(recipes).where(eq(recipes.id, id)).get();
        if (!existing) return res.status(404).json({ message: 'Recipe not found'});
        
        const { title, description, prepTime, cookTime, estimatedCost,difficulty ,ingredients, steps, categories, dietaryPreferences, allergies} = req.body;
        const createdBy = req.user!.id;
        if (existing.createdBy !== createdBy) return res.status(403).json({message: 'Unauthorized'});
        

        let heroImage = existing.heroImage;
        if (req.file) {
            if (existing.heroImage) {
                const imagePath = path.join('./uploads',existing.heroImage);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            const ext = path.extname(req.file.originalname);
            const newName = `${id}${ext}`;
            fs.renameSync(req.file.path, path.join('./uploads',newName));
            heroImage = newName;
            
        }

        const updates = {
            ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(prepTime !== undefined && { prepTime: Number(prepTime) }),
      ...(cookTime !== undefined && { cookTime: Number(cookTime) }),
      ...(estimatedCost !== undefined && { estimatedCost: Number(estimatedCost) }),
      ...(ingredients !== undefined && { ingredients: typeof ingredients === 'string' ? ingredients : JSON.stringify(ingredients) }),
      ...(steps !== undefined && { steps: typeof steps === 'string' ? steps : JSON.stringify(steps) }),
      ...(categories !== undefined && { categories: typeof categories === 'string' ? categories : JSON.stringify(categories) }),
      ...(dietaryPreferences !== undefined && {dietaryPreferences: typeof dietaryPreferences === 'string' ? dietaryPreferences : JSON.stringify(dietaryPreferences)}),
      ...(allergies !== undefined && {allergies: typeof allergies === 'string' ? allergies : JSON.stringify(allergies)}),
      ...(difficulty !== undefined && { difficulty }),
      heroImage,
    };

    const updated = db.update(recipes).set(updates).where(eq(recipes.id, id)).returning().get();
    res.json(parseRecipe(updated));

    }catch (err) {
        console.error(err);
        res.status(500).json( {message: 'Failed to update the recipe'})
    };
    
}

// Dlete /api/recipes/:id
export const deleteRecipe = (req : Request, res:Response) => {
    try {
        const id = Number(req.params.id);
        const existing = db.select().from(recipes).where(eq(recipes.id,id)).get();
        if (!existing) return res.status(404).json({messsage: 'Recipe not found'});
        const createdBy = req.user!.id;
        if (existing.createdBy !== createdBy) return res.status(403).json({message: 'Unauthorized'});

        if (existing.heroImage){
            const imagePath = path.join('./uploads',existing.heroImage);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        db.delete(recipes).where(eq(recipes.id, id)).run();
        res.json({message: 'Recipe deleted'})
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Failed to delete recipe'});
    }
};


// helper function 
const parseRecipe = (r : typeof recipes.$inferSelect) => {
    return {
        ...r,
        ingredients: JSON.parse(r.ingredients || '[]'),
        steps: JSON.parse(r.steps || '[]'),
        categories: JSON.parse(r.categories || '[]'),
        dietaryPreferences: JSON.parse(r.dietaryPreferences || '[]'),
        allergies: JSON.parse(r.allergies || '[]')
    };
}