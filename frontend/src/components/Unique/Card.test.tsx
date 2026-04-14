import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Card from './Card';

vi.mock('../../api/recipes', () => ({
  IMAGES_URL: 'http://localhost:3000/uploads',
}));

const baseProps = {
  id: 1,
  title: 'Test Recipe',
  description: 'A great recipe',
  prepTime: 15,
  cookTime: 30,
  difficulty: 'Medium' as const,
  estimatedCost: 12.5,
  heroImage: 'recipe.jpg',
  categories: ['italian', 'dinner'],
  ingredients: [
    { name: 'chicken', amount: '500', unit: 'g' },
    'garlic',
  ],
  steps: ['Prep chicken', 'Cook chicken', 'Serve'],
  dietaryPreferences: ['high-protein'],
  allergies: [],
};

describe('Card', () => {
  it('renders the recipe title on the front', () => {
    render(<Card {...baseProps} />);
    // Title appears on both front and back
    const titles = screen.getAllByText('Test Recipe');
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it('renders difficulty badge', () => {
    render(<Card {...baseProps} />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders total time', () => {
    render(<Card {...baseProps} />);
    expect(screen.getByText('45 min')).toBeInTheDocument(); // 15+30
  });

  it('renders prep and cook times', () => {
    render(<Card {...baseProps} />);
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('renders estimated cost', () => {
    render(<Card {...baseProps} />);
    expect(screen.getByText('$12.50')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<Card {...baseProps} />);
    // Description appears on both front and back
    const descs = screen.getAllByText('A great recipe');
    expect(descs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders ingredient names on front', () => {
    render(<Card {...baseProps} />);
    expect(screen.getAllByText('chicken').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('garlic').length).toBeGreaterThanOrEqual(1);
  });

  it('renders category tags', () => {
    render(<Card {...baseProps} />);
    expect(screen.getByText('italian')).toBeInTheDocument();
    expect(screen.getByText('dinner')).toBeInTheDocument();
  });

  it('renders flip hint', () => {
    render(<Card {...baseProps} />);
    expect(screen.getByText(/tap to flip for steps/i)).toBeInTheDocument();
  });

  it('flips on click', () => {
    render(<Card {...baseProps} />);
    const card = document.querySelector('.recipe-flip-card')!;
    expect(card.classList.contains('flipped')).toBe(false);
    fireEvent.click(card);
    expect(card.classList.contains('flipped')).toBe(true);
  });

  it('flips back on second click', () => {
    render(<Card {...baseProps} />);
    const card = document.querySelector('.recipe-flip-card')!;
    fireEvent.click(card);
    fireEvent.click(card);
    expect(card.classList.contains('flipped')).toBe(false);
  });

  it('renders steps on the back', () => {
    render(<Card {...baseProps} />);
    expect(screen.getByText('Prep chicken')).toBeInTheDocument();
    expect(screen.getByText('Cook chicken')).toBeInTheDocument();
    expect(screen.getByText('Serve')).toBeInTheDocument();
  });

  it('uses fallback image when heroImage is null', () => {
    render(<Card {...baseProps} heroImage={null} />);
    const img = screen.getByAltText('Test Recipe') as HTMLImageElement;
    expect(img.src).toContain('food-clipart.jpg');
  });

  it('renders without categories when empty', () => {
    render(<Card {...baseProps} categories={[]} />);
    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
  });

  it('renders without description when empty', () => {
    render(<Card {...baseProps} description="" />);
    expect(screen.queryByText('A great recipe')).not.toBeInTheDocument();
  });
});
