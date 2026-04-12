export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface CreateRecipeBody {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  estimatedCost: number;
  difficulty: Difficulty;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    cost?: number;
  }>;
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
  ingredients?: Array<{
    name: string;
    amount: number;
    unit: string;
    cost?: number;
  }>;
  steps?: string | unknown[];
  categories?: string | unknown[];
  dietaryPreferences?: string | unknown[];
  allergies?: string | unknown[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealSlot {
  recipeId: number | null;
  recipeTitle: string | null;
}

export interface DayMeals {
  breakfast: MealSlot;
  lunch: MealSlot;
  dinner: MealSlot;
  snack: MealSlot;
}

export interface CalendarDay {
  date: number;
  meals: DayMeals;
}

export interface Calendar {
  userId: number;
  months: string;
  days: string;
}
