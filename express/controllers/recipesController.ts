import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { eq, like } from 'drizzle-orm';
import { db } from '../db/index.js';
import { recipes } from '../db/schema.js';
import { Request, Response } from 'express';
import { CreateRecipeBody, Difficulty, UpdateRecipeBody } from '../types/index.js';
import errorHelpers from '../utils/errorHelpers.js';

type RecipeIngredient = {
  name: string;
  amount: number | string;
  unit: string;
  cost?: number;
};

const RECIPE_ALLERGY_OPTIONS = [
  'Nuts',
  'Peanuts',
  'Dairy',
  'Eggs',
  'Wheat',
  'Gluten',
  'Shellfish',
  'Fish',
  'Soy',
  'Sesame',
  'Mustard',
  'Lactose Intolerance',
  'Sulfites',
];

const RECIPE_ALLERGY_ALIASES: Record<string, string> = {
  nuts: 'Nuts',
  treenuts: 'Nuts',
  tree_nuts: 'Nuts',
  'tree-nuts': 'Nuts',
  peanuts: 'Peanuts',
  peanut: 'Peanuts',
  dairy: 'Dairy',
  milk: 'Dairy',
  eggs: 'Eggs',
  egg: 'Eggs',
  wheat: 'Wheat',
  gluten: 'Gluten',
  shellfish: 'Shellfish',
  crustaceans: 'Shellfish',
  crustacean: 'Shellfish',
  fish: 'Fish',
  soy: 'Soy',
  sesame: 'Sesame',
  mustard: 'Mustard',
  lactose: 'Lactose Intolerance',
  lactoseintolerance: 'Lactose Intolerance',
  sulfites: 'Sulfites',
  sulphites: 'Sulfites',
};

const normalizeRecipeAllergyLabels = (allergies: unknown): string[] => {
  if (!Array.isArray(allergies)) return [];

  const normalized = allergies.flatMap((allergy) => {
    if (typeof allergy !== 'string') return [];
    const key = allergy.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const label = RECIPE_ALLERGY_ALIASES[key] ?? allergy;
    return RECIPE_ALLERGY_OPTIONS.includes(label) ? [label] : [];
  });

  return [...new Set(normalized)];
};

// muter: temp-storeage, renamed after insert
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`),
});

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'));
    }
  },
});

// Get /api/recipes?title=
export const getAllRecipes = (req: Request, res: Response) => {
  try {
    const { title } = req.query;
    let result;
    if (title) {
      result = db
        .select()
        .from(recipes)
        .where(like(recipes.title, `%${title}%`))
        .all();
    } else {
      result = db.select().from(recipes).all();
    }

    // parse the json fields
    result = result.map(parseRecipe);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch recipes' });
  }
};

// get /api/recipes/:id
export const getRecipeById = (req: Request, res: Response) => {
  try {
    const recipe = db
      .select()
      .from(recipes)
      .where(eq(recipes.id, Number(req.params.id)))
      .get();
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json(parseRecipe(recipe));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fettch recipe' });
  }
};

// POST. api/recipes
export const createRecipe = (req: Request<{}, {}, CreateRecipeBody>, res: Response) => {
  try {
    const {
      title,
      description,
      prepTime,
      cookTime,
      estimatedCost,
      difficulty,
      ingredients,
      steps,
      categories,
      allergies,
      dietaryPreferences,
    } = req.body;
    const createdBy = req.user!.id;
    const parsedIngredients = parseJsonArrayField<RecipeIngredient>(ingredients);
    const parsedSteps = parseJsonArrayField(steps);
    const parsedCategories = parseJsonArrayField<string>(categories);
    const parsedDietaryPreferences = parseJsonArrayField<string>(dietaryPreferences);
    const parsedAllergies = normalizeRecipeAllergyLabels(parseJsonArrayField<string>(allergies));

    const result = db
      .insert(recipes)
      .values({
        title,
        description,
        createdBy,
        prepTime: Number(prepTime),
        cookTime: Number(cookTime),
        estimatedCost: Number(estimatedCost),
        heroImage: null,
        difficulty: difficulty,
        ingredients: JSON.stringify(parsedIngredients),
        steps: JSON.stringify(parsedSteps),
        categories: JSON.stringify(parsedCategories),
        dietaryPreferences: JSON.stringify(parsedDietaryPreferences),
        allergies: JSON.stringify(parsedAllergies),
      })
      .returning()
      .get();

    const id = result.id;

    // Handle image upload with transaction safety
    let heroImage = null;
    if (req.file) {
      try {
        const ext = path.extname(req.file.originalname);
        const newName = `${id}${ext}`;
        const newPath = path.join('./uploads', newName);

        // Rename file first
        fs.renameSync(req.file.path, newPath);

        // Update DB only after successful file operation
        db.update(recipes).set({ heroImage: newName }).where(eq(recipes.id, id)).run();
        heroImage = newName;
      } catch (fileError) {
        console.error('Failed to process uploaded image:', fileError);
        // Clean up the temp file if rename failed
        try {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup temp file:', cleanupError);
        }
      }
    }

    res.status(201).json(parseRecipe({ ...result, heroImage }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create recipe' });
  }
};

export const updateRecipe = (req: Request<{ id: string }, {}, UpdateRecipeBody>, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = db.select().from(recipes).where(eq(recipes.id, id)).get();
    if (!existing) return res.status(404).json({ message: 'Recipe not found' });

    const {
      title,
      description,
      prepTime,
      cookTime,
      estimatedCost,
      difficulty,
      ingredients,
      steps,
      categories,
      dietaryPreferences,
      allergies,
    } = req.body;
    const createdBy = req.user!.id;
    if (existing.createdBy !== createdBy) return res.status(403).json({ message: 'Unauthorized' });

    const parsedIngredients =
      ingredients !== undefined ? parseJsonArrayField<RecipeIngredient>(ingredients) : undefined;
    const parsedSteps = steps !== undefined ? parseJsonArrayField(steps) : undefined;
    const parsedCategories =
      categories !== undefined ? parseJsonArrayField<string>(categories) : undefined;
    const parsedDietaryPreferences =
      dietaryPreferences !== undefined
        ? parseJsonArrayField<string>(dietaryPreferences)
        : undefined;
    const parsedAllergies =
      allergies !== undefined
        ? normalizeRecipeAllergyLabels(parseJsonArrayField<string>(allergies))
        : undefined;

    let heroImage = existing.heroImage;
    if (req.file) {
      try {
        // Delete old image if it exists
        if (existing.heroImage) {
          const oldImagePath = path.join('./uploads', existing.heroImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        // Rename new file
        const ext = path.extname(req.file.originalname);
        const newName = `${id}${ext}`;
        const newPath = path.join('./uploads', newName);
        fs.renameSync(req.file.path, newPath);
        heroImage = newName;
      } catch (fileError) {
        console.error('Failed to process uploaded image:', fileError);
        // Clean up temp file
        try {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup temp file:', cleanupError);
        }
        return res.status(500).json({ message: 'Failed to process image upload' });
      }
    }

    const updates = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(prepTime !== undefined && { prepTime: Number(prepTime) }),
      ...(cookTime !== undefined && { cookTime: Number(cookTime) }),
      ...(estimatedCost !== undefined && {
        estimatedCost: Number(estimatedCost),
      }),
      ...(parsedIngredients !== undefined && {
        ingredients: JSON.stringify(parsedIngredients),
      }),
      ...(parsedSteps !== undefined && { steps: JSON.stringify(parsedSteps) }),
      ...(parsedCategories !== undefined && {
        categories: JSON.stringify(parsedCategories),
      }),
      ...(parsedDietaryPreferences !== undefined && {
        dietaryPreferences: JSON.stringify(parsedDietaryPreferences),
      }),
      ...(parsedAllergies !== undefined && {
        allergies: JSON.stringify(parsedAllergies),
      }),
      ...(difficulty !== undefined && { difficulty }),
      heroImage,
    };

    const updated = db.update(recipes).set(updates).where(eq(recipes.id, id)).returning().get();
    res.json(parseRecipe(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update the recipe' });
  }
};

// Dlete /api/recipes/:id
export const deleteRecipe = (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = db.select().from(recipes).where(eq(recipes.id, id)).get();
    if (!existing) return res.status(404).json({ messsage: 'Recipe not found' });
    const createdBy = req.user!.id;
    if (existing.createdBy !== createdBy) return res.status(403).json({ message: 'Unauthorized' });

    if (existing.heroImage) {
      const imagePath = path.join('./uploads', existing.heroImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    db.delete(recipes).where(eq(recipes.id, id)).run();
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete recipe' });
  }
};

// helper function
const parseRecipe = (r: typeof recipes.$inferSelect) => {
  return {
    ...r,
    ingredients: JSON.parse(r.ingredients || '[]'),
    steps: JSON.parse(r.steps || '[]'),
    categories: JSON.parse(r.categories || '[]'),
    dietaryPreferences: JSON.parse(r.dietaryPreferences || '[]'),
    allergies: normalizeRecipeAllergyLabels(JSON.parse(r.allergies || '[]')),
  };
};

const parseJsonArrayField = <T>(value: unknown): T[] => {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  }
  return [];
};

import { GoogleGenerativeAI } from '@google/generative-ai';

export const generateRecipe = async (req: Request, res: Response) => {
  const { prompt } = req.body;
  const createdBy = req.user!.id; // ! asserts that user object is non null
  const promptPreview = typeof prompt === 'string' ? prompt.slice(0, 200) : undefined;

  try {
    if (!process.env.GEMINI_API_KEY) {
      const details = {
        type: 'ConfigurationError',
        code: 'MISSING_GEMINI_API_KEY',
        message: 'Gemini API key is missing from server configuration.',
      };

      console.error('Gemini recipe generation failed: missing GEMINI_API_KEY', {
        userId: createdBy,
        hasPrompt: typeof prompt === 'string' && prompt.trim().length > 0,
        promptPreview,
        error: details,
      });
      return res
        .status(500)
        .json(errorHelpers.createDevErrorResponse('Failed to generate recipe', details));
    }

    const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAi.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `
            Generate a recipe based on: "${prompt}".
            Respond ONLY with valid JSON in this exact shape:
            {
              "title": string,
              "description": string,
              "prepTime": number (minutes),
              "cookTime": number (minutes),
              "estimatedCost": number (dollars),
              "difficulty": "Easy" | "Medium" | "Hard",
              "ingredients": [{ "name": string, "amount": number, "unit": string }],
              "steps": [string],
              "categories": [string],
              "allergies": [string]
            }
            The "allergies" array must contain only exact values from this list when applicable:
            ${RECIPE_ALLERGY_OPTIONS.join(', ')}.
            Infer these allergies from the recipe ingredients. For example, cheese, butter,
            yogurt, cream, and milk should use "Dairy"; shrimp, crab, and lobster should
            use "Shellfish"; almonds, walnuts, and cashews should use "Nuts".
        
        `;

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();

    if (!text.trim()) {
      const details = {
        type: 'GeminiResponseError',
        code: 'EMPTY_RESPONSE',
        message: 'Gemini returned an empty response.',
      };

      console.error('Gemini recipe generation failed: empty response text', {
        userId: createdBy,
        model: 'gemini-2.5-flash',
        promptPreview,
        error: details,
      });
      return res
        .status(500)
        .json(errorHelpers.createDevErrorResponse('Failed to generate recipe', details));
    }

    // strip away the markdown syntax
    const json = text.replace(/```json|```/g, '').trim();
    let recipe: {
      title: string;
      description: string;
      prepTime: number;
      cookTime: number;
      estimatedCost: number;
      difficulty: Difficulty;
      ingredients: RecipeIngredient[];
      steps: string[];
      categories: string[];
      allergies?: string[];
    };

    try {
      recipe = JSON.parse(json);
    } catch (err) {
      const parseError = errorHelpers.getErrorDetails(err);
      const details = {
        type: 'GeminiResponseError',
        code: 'INVALID_JSON',
        message: 'Gemini returned malformed JSON.',
        cause: parseError,
      };

      console.error('Gemini recipe generation failed: invalid JSON response', {
        userId: createdBy,
        model: 'gemini-2.5-flash',
        promptPreview,
        rawResponsePreview: text.slice(0, 500),
        cleanedResponsePreview: json.slice(0, 500),
        error: details,
      });
      return res
        .status(500)
        .json(errorHelpers.createDevErrorResponse('Failed to generate recipe', details));
    }

    const saved = db
      .insert(recipes)
      .values({
        title: recipe.title,
        description: recipe.description,
        createdBy,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        estimatedCost: recipe.estimatedCost,
        difficulty: recipe.difficulty,
        ingredients: JSON.stringify(recipe.ingredients),
        steps: JSON.stringify(recipe.steps),
        categories: JSON.stringify(recipe.categories),
        dietaryPreferences: '[]',
        allergies: JSON.stringify(normalizeRecipeAllergyLabels(recipe.allergies)),
        heroImage: null,
      })
      .returning()
      .get();

    res.status(201).json(parseRecipe(saved));
  } catch (err) {
    const details = errorHelpers.getErrorDetails(err);

    console.error('Gemini recipe generation failed', {
      userId: createdBy,
      model: 'gemini-2.5-flash',
      promptPreview,
      error: details,
    });
    res.status(500).json(errorHelpers.createDevErrorResponse('Failed to generate recipe', details));
  }
};
