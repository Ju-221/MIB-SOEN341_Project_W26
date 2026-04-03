import fs from "fs";
import path from "path";
import multer from "multer";
import { eq, like } from "drizzle-orm";
import { db } from "../db/index.js";
import { allergies, dietaryPreferences, recipes } from "../db/schema.js";
import { Request, Response } from "express";
import {
  CreateRecipeBody,
  Difficulty,
  UpdateRecipeBody,
} from "../types/index.js";

type RecipeIngredient = {
  name: string;
  amount: number | string;
  unit: string;
  cost?: number;
};

// muter: temp-storeage, renamed after insert
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads/"),
  filename: (req, file, cb) =>
    cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`),
});
export const upload = multer({ storage });

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
    res.status(500).json({ message: "Failed to fetch recipes" });
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
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json(parseRecipe(recipe));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fettch recipe" });
  }
};

// POST. api/recipes
export const createRecipe = (
  req: Request<{}, {}, CreateRecipeBody>,
  res: Response,
) => {
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
    const parsedIngredients =
      parseJsonArrayField<RecipeIngredient>(ingredients);
    const parsedSteps = parseJsonArrayField(steps);
    const parsedCategories = parseJsonArrayField<string>(categories);
    const parsedDietaryPreferences =
      parseJsonArrayField<string>(dietaryPreferences);
    const parsedAllergies = parseJsonArrayField<string>(allergies);

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

    // rename uploaded image to {id}.ext
    let heroImage = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname); // the file extension
      const newName = `${id}${ext}`;
      fs.renameSync(req.file.path, path.join("./uploads", newName));
      heroImage = newName;
      db.update(recipes).set({ heroImage }).where(eq(recipes.id, id)).run();
    }

    res.status(201).json(parseRecipe({ ...result, heroImage }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create recipe" });
  }
};

export const updateRecipe = (
  req: Request<{ id: string }, {}, UpdateRecipeBody>,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);
    const existing = db.select().from(recipes).where(eq(recipes.id, id)).get();
    if (!existing) return res.status(404).json({ message: "Recipe not found" });

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
    if (existing.createdBy !== createdBy)
      return res.status(403).json({ message: "Unauthorized" });

    const parsedIngredients =
      ingredients !== undefined
        ? parseJsonArrayField<RecipeIngredient>(ingredients)
        : undefined;
    const parsedSteps =
      steps !== undefined ? parseJsonArrayField(steps) : undefined;
    const parsedCategories =
      categories !== undefined
        ? parseJsonArrayField<string>(categories)
        : undefined;
    const parsedDietaryPreferences =
      dietaryPreferences !== undefined
        ? parseJsonArrayField<string>(dietaryPreferences)
        : undefined;
    const parsedAllergies =
      allergies !== undefined
        ? parseJsonArrayField<string>(allergies)
        : undefined;

    let heroImage = existing.heroImage;
    if (req.file) {
      if (existing.heroImage) {
        const imagePath = path.join("./uploads", existing.heroImage);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      const ext = path.extname(req.file.originalname);
      const newName = `${id}${ext}`;
      fs.renameSync(req.file.path, path.join("./uploads", newName));
      heroImage = newName;
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

    const updated = db
      .update(recipes)
      .set(updates)
      .where(eq(recipes.id, id))
      .returning()
      .get();
    res.json(parseRecipe(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update the recipe" });
  }
};

// Dlete /api/recipes/:id
export const deleteRecipe = (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = db.select().from(recipes).where(eq(recipes.id, id)).get();
    if (!existing)
      return res.status(404).json({ messsage: "Recipe not found" });
    const createdBy = req.user!.id;
    if (existing.createdBy !== createdBy)
      return res.status(403).json({ message: "Unauthorized" });

    if (existing.heroImage) {
      const imagePath = path.join("./uploads", existing.heroImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    db.delete(recipes).where(eq(recipes.id, id)).run();
    res.json({ message: "Recipe deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete recipe" });
  }
};

// helper function
const parseRecipe = (r: typeof recipes.$inferSelect) => {
  return {
    ...r,
    ingredients: JSON.parse(r.ingredients || "[]"),
    steps: JSON.parse(r.steps || "[]"),
    categories: JSON.parse(r.categories || "[]"),
    dietaryPreferences: JSON.parse(r.dietaryPreferences || "[]"),
    allergies: JSON.parse(r.allergies || "[]"),
  };
};

const parseJsonArrayField = <T>(value: unknown): T[] => {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  }
  return [];
};

import { GoogleGenerativeAI } from "@google/generative-ai";
import { error } from "console";

export const generateRecipe = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const createdBy = req.user!.id; // ! asserts that user object is non null

    const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });

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
              "categories": [string]
            }
        
        `;

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();

    // strip away the markdown syntax
    const json = text.replace(/```json|```/g, "").trim();
    const recipe = JSON.parse(json);

    console.log(recipe);

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
        dietaryPreferences: "[]",
        allergies: "[]",
        heroImage: null,
      })
      .returning()
      .get();

    res.status(201).json(parseRecipe(saved));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate recipe" });
  }
};
