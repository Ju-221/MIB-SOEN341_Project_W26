export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type ViewMode = 'week' | 'month';

export interface MealSlot {
  recipeId: number | null;
  recipeTitle: string | null;
}

export interface CalendarDay {
  date: number;
  meals: {
    breakfast: MealSlot;
    lunch: MealSlot;
    dinner: MealSlot;
  };
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

export function emptyMeals() {
  return {
    breakfast: { recipeId: null, recipeTitle: null },
    lunch: { recipeId: null, recipeTitle: null },
    dinner: { recipeId: null, recipeTitle: null },
  };
}

export function buildEmptyMonth(year: number, month: number): CalendarDay[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => ({
    date: i + 1,
    meals: emptyMeals(),
  }));
}
