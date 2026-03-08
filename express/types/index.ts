export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface CreateRecipeBody {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  estimatedCost: number;
  difficulty: Difficulty;
  ingredients: Array<{name: string; amount: number, unit:string}>;
  steps: string | unknown[];
  categories: string | unknown[];
  dietaryPreferences?: string | unknown[];
  allergies?: string | unknown[];
}

export interface UpdateRecipeBody {
  title?: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  estimatedCost?: number;
  difficulty?: Difficulty;
  ingredients?: Array<{name: string; amount: number, unit:string}>;
  steps?: string | unknown[];
  categories?: string | unknown[];
  dietaryPreferences?: string | unknown[];
  allergies?: string | unknown[];
}