import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Recipes from './Recipes';
import type { Recipe } from '../Recipe-Manager/CreateRecipe';

// ── Mock the API layer ────────────────────────────────────────────────────────

vi.mock('../../api/recipes', () => ({
  fetchRecipes: vi.fn(),
  createRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
  IMAGES_URL: 'http://localhost:3000/uploads',
}));

import { fetchRecipes, deleteRecipe } from '../../api/recipes';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 1,
  title: 'Test Pasta',
  description: 'A tasty pasta',
  ingredients: [{ name: 'pasta', amount: '200', unit: 'g', cost: 1 }],
  steps: [{ text: 'Boil water' }],
  categories: ['healthy'],
  difficulty: 'Easy',
  prepTime: 10,
  cookTime: 20,
  estimatedCost: 5,
  heroImage: '',
  createdBy: 42,
  createdAt: '2026-01-01',
  ...overrides,
});

/** Encode a minimal JWT with the given payload so the component can parse userId. */
const makeToken = (payload: object): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Recipes Component', () => {
  beforeEach(() => {
    // resetAllMocks clears both call history AND one-time response queues,
    // preventing mockResolvedValueOnce leftovers from leaking between tests.
    vi.resetAllMocks();
    vi.mocked(fetchRecipes).mockResolvedValue([]);
  });

  // ── List rendering ──────────────────────────────────────────────────────────

  describe('List rendering', () => {
    it('shows a loading indicator while fetching', async () => {
      // Never resolve so we can inspect the loading state
      vi.mocked(fetchRecipes).mockReturnValue(new Promise(() => {}) as never);
      render(<Recipes />);
      expect(screen.getByText(/loading recipes/i)).toBeInTheDocument();
    });

    it('renders an empty-state message when there are no recipes', async () => {
      render(<Recipes />);
      await waitFor(() => expect(screen.getByText(/no recipes found/i)).toBeInTheDocument());
    });

    it('renders recipe cards after fetching', async () => {
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({ id: 1, title: 'Pasta' }),
        makeRecipe({ id: 2, title: 'Salad' }),
      ]);
      render(<Recipes />);
      expect(await screen.findByText('Pasta')).toBeInTheDocument();
      expect(await screen.findByText('Salad')).toBeInTheDocument();
    });

    it('shows an error message when fetchRecipes rejects', async () => {
      vi.mocked(fetchRecipes).mockRejectedValue(new Error('Network error'));
      render(<Recipes />);
      await waitFor(() => expect(screen.getByText(/failed to load recipes/i)).toBeInTheDocument());
    });
  });

  // ── Search / filter ─────────────────────────────────────────────────────────

  describe('Search filtering', () => {
    beforeEach(() => {
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({ id: 1, title: 'Spaghetti Bolognese' }),
        makeRecipe({ id: 2, title: 'Chicken Salad' }),
      ]);
    });

    it('filter panel is collapsed by default (no search input visible)', async () => {
      render(<Recipes />);
      await screen.findByText('Spaghetti Bolognese'); // ensure list is loaded
      expect(screen.queryByPlaceholderText(/e\.g\. healthy quick pasta/i)).not.toBeInTheDocument();
    });

    it('expands the filter panel when the toggle button is clicked', async () => {
      render(<Recipes />);
      await screen.findByText('Spaghetti Bolognese');

      const expandBtn = screen.getByRole('button', { name: /expand filters/i });
      await userEvent.click(expandBtn);

      expect(screen.getByPlaceholderText(/e\.g\. healthy quick pasta/i)).toBeInTheDocument();
    });

    it('shows collapse button after panel is expanded', async () => {
      render(<Recipes />);
      await screen.findByText('Spaghetti Bolognese');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      expect(screen.getByRole('button', { name: /collapse filters/i })).toBeInTheDocument();
    });

    it('collapses the panel again on second toggle click', async () => {
      render(<Recipes />);
      await screen.findByText('Spaghetti Bolognese');

      const toggleBtn = screen.getByRole('button', { name: /expand filters/i });
      await userEvent.click(toggleBtn);
      await userEvent.click(screen.getByRole('button', { name: /collapse filters/i }));

      expect(screen.queryByPlaceholderText(/e\.g\. healthy quick pasta/i)).not.toBeInTheDocument();
    });

    it('filters recipes by search term', async () => {
      render(<Recipes />);
      await screen.findByText('Spaghetti Bolognese');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      const searchInput = screen.getByPlaceholderText(/e\.g\. healthy quick pasta/i);
      await userEvent.type(searchInput, 'Salad');

      await waitFor(() =>
        expect(screen.queryByText('Spaghetti Bolognese')).not.toBeInTheDocument()
      );
      expect(screen.getByText('Chicken Salad')).toBeInTheDocument();
    });

    it('shows counter "Showing X of Y" in the filter header', async () => {
      render(<Recipes />);
      await screen.findByText('Spaghetti Bolognese');
      expect(screen.getByText(/showing 2 of 2/i)).toBeInTheDocument();
    });

    it('updates counter after filtering', async () => {
      render(<Recipes />);
      await screen.findByText('Spaghetti Bolognese');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      await userEvent.type(screen.getByPlaceholderText(/e\.g\. healthy quick pasta/i), 'Salad');

      await waitFor(() => expect(screen.getByText(/showing 1 of 2/i)).toBeInTheDocument());
    });
  });

  // ── Auth-gated buttons ──────────────────────────────────────────────────────

  describe('Auth-gated buttons', () => {
    it('does NOT show Edit/Delete buttons when the user is not the recipe owner', async () => {
      // User id=99, recipe createdBy=42
      vi.mocked(localStorage.getItem).mockImplementation((key) =>
        key === 'token' ? makeToken({ id: 99 }) : null
      );
      vi.mocked(fetchRecipes).mockResolvedValue([makeRecipe({ createdBy: 42 })]);

      render(<Recipes />);
      await screen.findByText('Test Pasta');

      expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument();
    });

    it('shows Edit and Delete buttons when the user owns the recipe', async () => {
      vi.mocked(localStorage.getItem).mockImplementation((key) =>
        key === 'token' ? makeToken({ id: 42 }) : null
      );
      vi.mocked(fetchRecipes).mockResolvedValue([makeRecipe({ createdBy: 42 })]);

      render(<Recipes />);
      await screen.findByText('Test Pasta');

      expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
    });

    it('does NOT show Edit/Delete when unauthenticated (no token)', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      vi.mocked(fetchRecipes).mockResolvedValue([makeRecipe({ createdBy: 42 })]);

      render(<Recipes />);
      await screen.findByText('Test Pasta');

      expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument();
    });
  });

  // ── Add Recipe button ───────────────────────────────────────────────────────

  describe('+ Add Recipe button', () => {
    it('renders an "+ Add Recipe" button in the header', async () => {
      render(<Recipes />);
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: /add recipe/i }).length).toBeGreaterThan(0)
      );
    });
  });

  // ── Delete flow ─────────────────────────────────────────────────────────────

  describe('Delete flow', () => {
    beforeEach(() => {
      vi.mocked(localStorage.getItem).mockImplementation((key) =>
        key === 'token' ? makeToken({ id: 42 }) : null
      );
      vi.mocked(fetchRecipes).mockResolvedValue([makeRecipe({ id: 1, createdBy: 42 })]);
    });

    it('shows a confirmation UI after clicking Delete', async () => {
      render(<Recipes />);
      await screen.findByText('Test Pasta');

      await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));

      expect(screen.getByText(/delete this recipe\?/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /yes, delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
    });

    it('calls deleteRecipe after confirming deletion', async () => {
      vi.mocked(deleteRecipe).mockResolvedValue(undefined as never);
      // Use plain mockResolvedValue so no once-queue is left over after this test.
      vi.mocked(fetchRecipes).mockResolvedValue([makeRecipe({ id: 1, createdBy: 42 })]);

      render(<Recipes />);
      await screen.findByText('Test Pasta');

      await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
      await userEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

      await waitFor(() => expect(deleteRecipe).toHaveBeenCalled());
    });

    it('hides confirmation UI after clicking Cancel', async () => {
      render(<Recipes />);
      await screen.findByText('Test Pasta');

      await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
      await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

      expect(screen.queryByText(/delete this recipe\?/i)).not.toBeInTheDocument();
    });
  });

  // ── sessionStorage deep-link (Calendar / Tournament → Recipes) ─────────────

  describe('sessionStorage deep-link', () => {
    afterEach(() => {
      sessionStorage.clear();
    });

    it('opens a recipe in cook mode when viewRecipeId is in sessionStorage', async () => {
      vi.mocked(fetchRecipes).mockResolvedValue([makeRecipe({ id: 1, title: 'Deep Link Recipe' })]);
      sessionStorage.setItem('viewRecipeId', '1');

      render(<Recipes />);

      await waitFor(() => expect(screen.getByText(/cooking mode/i)).toBeInTheDocument());
    });

    it('removes viewRecipeId from sessionStorage after reading it', async () => {
      vi.mocked(fetchRecipes).mockResolvedValue([makeRecipe({ id: 1, title: 'Deep Link Recipe' })]);
      sessionStorage.setItem('viewRecipeId', '1');

      render(<Recipes />);

      await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
      expect(sessionStorage.getItem('viewRecipeId')).toBeNull();
    });

    it('stays in list mode when no viewRecipeId is in sessionStorage', async () => {
      vi.mocked(fetchRecipes).mockResolvedValue([makeRecipe({ id: 1, title: 'Normal Recipe' })]);

      render(<Recipes />);

      await screen.findByText('Normal Recipe');
      expect(screen.queryByText(/cooking mode/i)).not.toBeInTheDocument();
    });

    it('stays in list mode when viewRecipeId does not match any recipe', async () => {
      vi.mocked(fetchRecipes).mockResolvedValue([makeRecipe({ id: 1, title: 'Normal Recipe' })]);
      sessionStorage.setItem('viewRecipeId', '999');

      render(<Recipes />);

      await screen.findByText('Normal Recipe');
      expect(screen.queryByText(/cooking mode/i)).not.toBeInTheDocument();
    });
  });
});
