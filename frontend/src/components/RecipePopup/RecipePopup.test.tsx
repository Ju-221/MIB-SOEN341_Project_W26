import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import RecipePopup from './RecipePopup';

vi.mock('../../api/recipes', () => ({
  IMAGES_URL: 'http://localhost:3000/uploads',
}));

const baseRecipe = {
  id: 1,
  title: 'Test Pasta',
  description: 'A delicious pasta dish',
  prepTime: 10,
  cookTime: 20,
  difficulty: 'Easy' as const,
  estimatedCost: 5.5,
  heroImage: 'pasta.jpg',
  ingredients: [
    { name: 'pasta', amount: '200', unit: 'g' },
    'tomato sauce',
  ],
  steps: ['Boil water', 'Cook pasta'],
  categories: ['italian', 'quick'],
  dietaryPreferences: ['vegetarian'],
  allergies: ['Gluten'],
};

describe('RecipePopup', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders recipe title and description', () => {
    render(<RecipePopup recipe={baseRecipe} onClose={onClose} />);
    expect(screen.getByText('Test Pasta')).toBeInTheDocument();
    expect(screen.getByText('A delicious pasta dish')).toBeInTheDocument();
  });

  it('renders difficulty badge', () => {
    render(<RecipePopup recipe={baseRecipe} onClose={onClose} />);
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('renders meta information (times, cost)', () => {
    render(<RecipePopup recipe={baseRecipe} onClose={onClose} />);
    expect(screen.getByText('30 min')).toBeInTheDocument(); // total
    expect(screen.getByText('10 min')).toBeInTheDocument(); // prep
    expect(screen.getByText('20 min')).toBeInTheDocument(); // cook
    expect(screen.getByText('$5.50')).toBeInTheDocument(); // cost
  });

  it('renders ingredients (object and string)', () => {
    render(<RecipePopup recipe={baseRecipe} onClose={onClose} />);
    expect(screen.getByText('pasta — 200 g')).toBeInTheDocument();
    expect(screen.getByText('tomato sauce')).toBeInTheDocument();
  });

  it('renders steps as numbered instructions', () => {
    render(<RecipePopup recipe={baseRecipe} onClose={onClose} />);
    expect(screen.getByText('Boil water')).toBeInTheDocument();
    expect(screen.getByText('Cook pasta')).toBeInTheDocument();
  });

  it('renders category tags', () => {
    render(<RecipePopup recipe={baseRecipe} onClose={onClose} />);
    expect(screen.getByText('italian')).toBeInTheDocument();
    expect(screen.getByText('quick')).toBeInTheDocument();
  });

  it('renders dietary preference tags', () => {
    render(<RecipePopup recipe={baseRecipe} onClose={onClose} />);
    expect(screen.getByText('vegetarian')).toBeInTheDocument();
  });

  it('renders allergy tags', () => {
    render(<RecipePopup recipe={baseRecipe} onClose={onClose} />);
    expect(screen.getByText('Gluten')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    render(<RecipePopup recipe={baseRecipe} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', () => {
    render(<RecipePopup recipe={baseRecipe} onClose={onClose} />);
    fireEvent.click(document.querySelector('.popup-overlay')!);
    expect(onClose).toHaveBeenCalled();
  });

  it('does NOT call onClose when popup card body is clicked', () => {
    render(<RecipePopup recipe={baseRecipe} onClose={onClose} />);
    fireEvent.click(document.querySelector('.popup-card')!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<RecipePopup recipe={baseRecipe} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('renders hero image with correct src', () => {
    render(<RecipePopup recipe={baseRecipe} onClose={onClose} />);
    const img = screen.getByAltText('Test Pasta') as HTMLImageElement;
    expect(img.src).toContain('pasta.jpg');
  });

  it('uses fallback image when heroImage is null', () => {
    render(<RecipePopup recipe={{ ...baseRecipe, heroImage: null }} onClose={onClose} />);
    const img = screen.getByAltText('Test Pasta') as HTMLImageElement;
    expect(img.src).toContain('food-clipart.jpg');
  });

  it('hides steps section when steps array is empty', () => {
    render(<RecipePopup recipe={{ ...baseRecipe, steps: [] }} onClose={onClose} />);
    expect(screen.queryByText('Instructions')).not.toBeInTheDocument();
  });

  it('hides dietary section when dietaryPreferences is empty', () => {
    render(
      <RecipePopup recipe={{ ...baseRecipe, dietaryPreferences: [] }} onClose={onClose} />
    );
    expect(screen.queryByText('Dietary')).not.toBeInTheDocument();
  });

  it('hides allergen section when allergies is empty', () => {
    render(<RecipePopup recipe={{ ...baseRecipe, allergies: [] }} onClose={onClose} />);
    expect(screen.queryByText('Allergens')).not.toBeInTheDocument();
  });

  it('renders ingredient with name only (no amount/unit)', () => {
    render(
      <RecipePopup
        recipe={{ ...baseRecipe, ingredients: [{ name: 'salt' }] }}
        onClose={onClose}
      />
    );
    expect(screen.getByText('salt')).toBeInTheDocument();
  });
});
