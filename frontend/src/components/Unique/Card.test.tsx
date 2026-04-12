import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Card from './Card';

vi.mock('../../api/recipes', () => ({
  IMAGES_URL: 'http://localhost:3000/uploads',
}));

// ── Shared test data ─────────────────────────────────────────

const baseProps = {
  id: 5,
  title: 'Tomato Soup',
  description: 'A warm classic.',
  prepTime: 10,
  cookTime: 20,
  difficulty: 'Easy' as const,
  estimatedCost: 6,
  heroImage: null,
  categories: ['vegan', 'quick'],
  ingredients: [
    { name: 'tomato', amount: '4', unit: 'unit' },
    { name: 'garlic', amount: '2', unit: 'cloves' },
  ],
  steps: ['Blend tomatoes', 'Simmer for 20 minutes'],
};

// ── Setup / teardown ─────────────────────────────────────────

beforeEach(() => {
  sessionStorage.clear();
  window.location.hash = '';
});

afterEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

// ── Tests ────────────────────────────────────────────────────

describe('Card – rendering', () => {
  it('renders the recipe title on the front face', () => {
    render(<Card {...baseProps} />);
    expect(screen.getAllByText('Tomato Soup').length).toBeGreaterThan(0);
  });

  it('renders the difficulty badge', () => {
    render(<Card {...baseProps} />);
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('renders the "View full recipe" button', () => {
    render(<Card {...baseProps} />);
    expect(screen.getByRole('button', { name: /view full recipe/i })).toBeInTheDocument();
  });

  it('renders ingredient names on the front face', () => {
    render(<Card {...baseProps} />);
    expect(screen.getAllByText(/tomato/i).length).toBeGreaterThan(0);
  });
});

describe('Card – View full recipe navigation', () => {
  it('clicking the button stores the recipe id in sessionStorage', async () => {
    render(<Card {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: /view full recipe/i }));
    expect(sessionStorage.getItem('viewRecipeId')).toBe('5');
  });

  it('clicking the button navigates to #recipes', async () => {
    render(<Card {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: /view full recipe/i }));
    expect(window.location.hash).toBe('#recipes');
  });

  it('clicking the button does NOT flip the card', async () => {
    const { container } = render(<Card {...baseProps} />);
    const card = container.querySelector('.recipe-flip-card')!;
    await userEvent.click(screen.getByRole('button', { name: /view full recipe/i }));
    expect(card).not.toHaveClass('flipped');
  });
});

describe('Card – Flip behavior', () => {
  it('card is not flipped by default', () => {
    const { container } = render(<Card {...baseProps} />);
    expect(container.querySelector('.recipe-flip-card')).not.toHaveClass('flipped');
  });

  it('clicking the recipe title flips the card', async () => {
    const { container } = render(<Card {...baseProps} />);
    const card = container.querySelector('.recipe-flip-card')!;
    const title = container.querySelector('.recipe-title')!;
    await userEvent.click(title);
    expect(card).toHaveClass('flipped');
  });

  it('clicking the card twice returns it to unflipped state', async () => {
    const { container } = render(<Card {...baseProps} />);
    const card = container.querySelector('.recipe-flip-card')!;
    const title = container.querySelector('.recipe-title')!;
    await userEvent.click(title);
    await userEvent.click(title);
    expect(card).not.toHaveClass('flipped');
  });
});
