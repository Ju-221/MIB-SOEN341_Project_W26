export interface Ingredient {
  name: string;
  amount?: string;
  unit?: string;
}

export interface Recipe {
  id: number;
  createdBy?: number;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedCost: number;
  heroImage: string | null;
  ingredients: (string | Ingredient)[];
  steps: string[];
  categories: string[];
  createdAt?: string;
  dietaryPreferences?: string[];
  allergies?: string[];
}
