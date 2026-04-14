/*# The following file was generated with the assistance of Claude.
#Prompt:  Create a test suite for the Recipes component using Vitest and React Testing Library. Cover rendering of recipe list, search/filter functionality, auth-gated buttons, and delete flow.
based on login state, username display, and profile dropdown behavior.
# I, Anais Perron reviewed, modified, and tested the code to ensure correctness.
*/
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Recipes from './Recipes';
import type { Recipe } from '../Recipe-Manager/CreateRecipe';
import React from 'react';

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

    it('warns when a saved profile allergy matches a recipe allergy tag', async () => {
      vi.mocked(localStorage.getItem).mockImplementation((key) =>
        key === 'token' ? makeToken({ id: 42 }) : null
      );
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({ id: 1, title: 'Peanut Noodles', allergies: ['Peanuts'] }),
        makeRecipe({ id: 2, title: 'Tomato Soup', allergies: [] }),
      ]);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ allergies: { peanuts: true } }),
      } as Response);

      render(<Recipes />);

      expect(await screen.findByText('Peanut Noodles')).toBeInTheDocument();
      await waitFor(() =>
        expect(
          screen.getByText(/contains an allergy associated with your profile/i)
        ).toBeInTheDocument()
      );
      expect(screen.getByText('Tomato Soup')).toBeInTheDocument();
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
    // ── Delete error UI ──────────────────────────────────────────────────────
    describe('Delete error UI', () => {
      it('shows and closes the delete error message', async () => {
        vi.mocked(localStorage.getItem).mockImplementation((key) =>
          key === 'token' ? makeToken({ id: 42 }) : null
        );
        vi.mocked(fetchRecipes).mockResolvedValue([makeRecipe({ id: 1, createdBy: 42 })]);
        render(<Recipes />);
        await screen.findByText('Test Pasta');

        // Simulate error state by setting deleteError in the DOM
        // This requires triggering a delete with no token
        // First, click Delete to show confirm UI
        await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
        // Remove token so delete will fail auth
        vi.mocked(localStorage.getItem).mockReturnValue(null);
        await userEvent.click(screen.getByRole('button', { name: /yes, delete/i }));
        // Wait for error message
        await waitFor(() => expect(screen.getByText(/you must be logged in to delete recipes/i)).toBeInTheDocument());
        // Close error message
        await userEvent.click(screen.getByRole('button', { name: /✕/i }));
        expect(screen.queryByText(/you must be logged in to delete recipes/i)).not.toBeInTheDocument();
      });
    });
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

  // ── Advanced filtering ──────────────────────────────────────────────────────

  describe('Difficulty filter', () => {
    beforeEach(() => {
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({ id: 1, title: 'Easy Pasta', difficulty: 'Easy' }),
        makeRecipe({ id: 2, title: 'Hard Steak', difficulty: 'Hard' }),
      ]);
    });

    it('hides recipes that do not match the selected difficulty chip', async () => {
      render(<Recipes />);
      await screen.findByText('Easy Pasta');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      await userEvent.click(screen.getByRole('button', { name: /^easy$/i }));

      await waitFor(() => expect(screen.queryByText('Hard Steak')).not.toBeInTheDocument());
      expect(screen.getByText('Easy Pasta')).toBeInTheDocument();
    });

    it('restores all recipes when the difficulty chip is deselected', async () => {
      render(<Recipes />);
      await screen.findByText('Easy Pasta');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      const easyBtn = screen.getByRole('button', { name: /^easy$/i });
      await userEvent.click(easyBtn);
      await userEvent.click(easyBtn);

      await waitFor(() => expect(screen.getByText('Hard Steak')).toBeInTheDocument());
      expect(screen.getByText('Easy Pasta')).toBeInTheDocument();
    });
  });

  describe('Prep-time filter', () => {
    beforeEach(() => {
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({ id: 1, title: 'Quick Dish', prepTime: 5 }),
        makeRecipe({ id: 2, title: 'Slow Braise', prepTime: 120 }),
      ]);
    });

    it('hides recipes whose prep time exceeds the maximum', async () => {
      render(<Recipes />);
      await screen.findByText('Quick Dish');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      // First "Any" input is Max Prep Time
      const [prepInput] = screen.getAllByPlaceholderText('Any');
      await userEvent.type(prepInput, '30');

      await waitFor(() => expect(screen.queryByText('Slow Braise')).not.toBeInTheDocument());
      expect(screen.getByText('Quick Dish')).toBeInTheDocument();
    });
  });

  describe('Cost filter', () => {
    beforeEach(() => {
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({ id: 1, title: 'Budget Bowl', estimatedCost: 3 }),
        makeRecipe({ id: 2, title: 'Luxury Filet', estimatedCost: 50 }),
      ]);
    });

    it('hides recipes whose cost exceeds the maximum', async () => {
      render(<Recipes />);
      await screen.findByText('Budget Bowl');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      // Inputs: [0]=prep, [1]=cook, [2]=total, [3]=cost
      const anyInputs = screen.getAllByPlaceholderText('Any');
      await userEvent.type(anyInputs[3], '10');

      await waitFor(() => expect(screen.queryByText('Luxury Filet')).not.toBeInTheDocument());
      expect(screen.getByText('Budget Bowl')).toBeInTheDocument();
    });
  });

  describe('Ingredient search filter', () => {
    beforeEach(() => {
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({
          id: 1,
          title: 'Pasta Dish',
          ingredients: [{ name: 'pasta', amount: '200', unit: 'g', cost: 1 }],
        }),
        makeRecipe({
          id: 2,
          title: 'Chicken Stir Fry',
          ingredients: [{ name: 'chicken', amount: '300', unit: 'g', cost: 4 }],
        }),
      ]);
    });

    it('hides recipes that do not contain the searched ingredient', async () => {
      render(<Recipes />);
      await screen.findByText('Pasta Dish');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      const ingredientInput = screen.getByPlaceholderText(/e\.g\. tomato, basil/i);
      await userEvent.type(ingredientInput, 'pasta');

      await waitFor(() => expect(screen.queryByText('Chicken Stir Fry')).not.toBeInTheDocument());
      expect(screen.getByText('Pasta Dish')).toBeInTheDocument();
    });
  });

  describe('Clear filters', () => {
    beforeEach(() => {
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({ id: 1, title: 'Easy Pasta', difficulty: 'Easy' }),
        makeRecipe({ id: 2, title: 'Hard Steak', difficulty: 'Hard' }),
      ]);
    });

    it('restores all recipes after clearing an active filter', async () => {
      render(<Recipes />);
      await screen.findByText('Easy Pasta');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      await userEvent.click(screen.getByRole('button', { name: /^easy$/i }));
      await waitFor(() => expect(screen.queryByText('Hard Steak')).not.toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: /clear filters/i }));
      await waitFor(() => expect(screen.getByText('Hard Steak')).toBeInTheDocument());
    });

    it('updates the "Showing X of Y" counter after clearing', async () => {
      render(<Recipes />);
      await screen.findByText('Easy Pasta');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      await userEvent.click(screen.getByRole('button', { name: /^easy$/i }));
      await waitFor(() => expect(screen.getByText(/showing 1 of 2/i)).toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: /clear filters/i }));
      await waitFor(() => expect(screen.getByText(/showing 2 of 2/i)).toBeInTheDocument());
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

  // ── Cook time / total time filters ─────────────────────────────────────────

  describe('Cook-time filter', () => {
    beforeEach(() => {
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({ id: 1, title: 'Fast Soup', cookTime: 5 }),
        makeRecipe({ id: 2, title: 'Slow Stew', cookTime: 90 }),
      ]);
    });

    it('hides recipes whose cook time exceeds the maximum', async () => {
      render(<Recipes />);
      await screen.findByText('Fast Soup');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      const anyInputs = screen.getAllByPlaceholderText('Any');
      await userEvent.type(anyInputs[1], '20');

      await waitFor(() => expect(screen.queryByText('Slow Stew')).not.toBeInTheDocument());
      expect(screen.getByText('Fast Soup')).toBeInTheDocument();
    });
  });

  describe('Total-time filter', () => {
    beforeEach(() => {
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({ id: 1, title: 'Express Dish', prepTime: 5, cookTime: 5 }),
        makeRecipe({ id: 2, title: 'Long Feast', prepTime: 60, cookTime: 60 }),
      ]);
    });

    it('hides recipes whose total time exceeds the maximum', async () => {
      render(<Recipes />);
      await screen.findByText('Express Dish');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      const anyInputs = screen.getAllByPlaceholderText('Any');
      await userEvent.type(anyInputs[2], '30');

      await waitFor(() => expect(screen.queryByText('Long Feast')).not.toBeInTheDocument());
      expect(screen.getByText('Express Dish')).toBeInTheDocument();
    });
  });

  // ── Dietary tag filter ──────────────────────────────────────────────────────

  describe('Dietary tag filter', () => {
    beforeEach(() => {
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({ id: 1, title: 'Veggie Bowl', categories: ['vegetarian'] }),
        makeRecipe({ id: 2, title: 'Meat Roast', categories: ['dinner'] }),
      ]);
    });

    it('hides recipes that do not match the selected dietary tag', async () => {
      render(<Recipes />);
      await screen.findByText('Veggie Bowl');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      await userEvent.click(screen.getByRole('button', { name: /^vegetarian$/i }));

      await waitFor(() => expect(screen.queryByText('Meat Roast')).not.toBeInTheDocument());
      expect(screen.getByText('Veggie Bowl')).toBeInTheDocument();
    });

    it('restores all recipes when the dietary tag chip is deselected', async () => {
      render(<Recipes />);
      await screen.findByText('Veggie Bowl');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      const chip = screen.getByRole('button', { name: /^vegetarian$/i });
      await userEvent.click(chip);
      await userEvent.click(chip);

      await waitFor(() => expect(screen.getByText('Meat Roast')).toBeInTheDocument());
    });
  });

  // ── Allergen exclusion filter ───────────────────────────────────────────────

  describe('Allergen exclusion filter', () => {
    beforeEach(() => {
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({ id: 1, title: 'Peanut Sauce Noodles', allergies: ['Peanuts'] }),
        makeRecipe({ id: 2, title: 'Safe Salad', allergies: [] }),
      ]);
    });

    it('hides recipes that contain the selected allergen', async () => {
      render(<Recipes />);
      await screen.findByText('Peanut Sauce Noodles');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      await userEvent.click(screen.getByRole('button', { name: /^peanuts$/i }));

      await waitFor(() =>
        expect(screen.queryByText('Peanut Sauce Noodles')).not.toBeInTheDocument()
      );
      expect(screen.getByText('Safe Salad')).toBeInTheDocument();
    });

    it('restores hidden recipes when the allergen chip is deselected', async () => {
      render(<Recipes />);
      await screen.findByText('Peanut Sauce Noodles');

      await userEvent.click(screen.getByRole('button', { name: /expand filters/i }));
      const chip = screen.getByRole('button', { name: /^peanuts$/i });
      await userEvent.click(chip);
      await waitFor(() =>
        expect(screen.queryByText('Peanut Sauce Noodles')).not.toBeInTheDocument()
      );
      await userEvent.click(chip);

      await waitFor(() => expect(screen.getByText('Peanut Sauce Noodles')).toBeInTheDocument());
    });
  });

  // ── Cook mode ───────────────────────────────────────────────────────────────

  describe('Cook mode', () => {
    beforeEach(() => {
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({
          id: 1,
          title: 'Pasta Al Dente',
          steps: [{ text: 'Boil water' }, { text: 'Cook pasta' }],
          ingredients: [{ name: 'pasta', amount: '200', unit: 'g', cost: 1 }],
        }),
      ]);
    });

    it('enters cook mode and shows recipe title after clicking Cook', async () => {
      render(<Recipes />);
      await screen.findByText('Pasta Al Dente');

      await userEvent.click(screen.getByRole('button', { name: /^cook$/i }));

      await waitFor(() => expect(screen.getByText(/cooking mode/i)).toBeInTheDocument());
    });

    it('shows a Back button in cook mode', async () => {
      render(<Recipes />);
      await screen.findByText('Pasta Al Dente');

      await userEvent.click(screen.getByRole('button', { name: /^cook$/i }));

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /^back$/i })).toBeInTheDocument()
      );
    });

    it('returns to list view when Back is clicked in cook mode', async () => {
      render(<Recipes />);
      await screen.findByText('Pasta Al Dente');

      await userEvent.click(screen.getByRole('button', { name: /^cook$/i }));
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /^back$/i })).toBeInTheDocument()
      );

      await userEvent.click(screen.getByRole('button', { name: /^back$/i }));

      await waitFor(() => expect(screen.getByText('Pasta Al Dente')).toBeInTheDocument());
      expect(screen.queryByText(/cooking mode/i)).not.toBeInTheDocument();
    });
  });

  describe('Cook mode navigation and edge cases', () => {
    beforeEach(() => {
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({
          id: 1,
          title: 'Step Test',
          steps: [
            { text: 'Step 1' },
            { text: 'Step 2' },
            { text: 'Step 3' },
          ],
          ingredients: [
            { name: 'Egg', amount: '1', unit: '', cost: 0.5 },
          ],
        }),
      ]);
    });

    it('navigates steps in cook mode and finishes', async () => {
      render(<Recipes />);
      await screen.findByText('Step Test');
      await userEvent.click(screen.getByRole('button', { name: /^cook$/i }));
      // Should start at step 1
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      // Next step
      await userEvent.click(screen.getByRole('button', { name: /next step/i }));
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      // Previous step
      await userEvent.click(screen.getByRole('button', { name: /previous/i }));
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      // Go to last step
      await userEvent.click(screen.getByRole('button', { name: /next step/i }));
      await userEvent.click(screen.getByRole('button', { name: /next step/i }));
      expect(screen.getByText('Step 3')).toBeInTheDocument();
      // Done Cooking
      await userEvent.click(screen.getByRole('button', { name: /done cooking/i }));
      // Should return to list view
      expect(screen.getByText('Step Test')).toBeInTheDocument();
    });

    it('shows message for no ingredients and no steps', async () => {
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({
          id: 2,
          title: 'Empty Recipe',
          steps: [],
          ingredients: [],
        }),
      ]);
      render(<Recipes />);
      await screen.findByText('Empty Recipe');
      await userEvent.click(screen.getByRole('button', { name: /^cook$/i }));
      expect(screen.getByText('No ingredient')).toBeInTheDocument();
      expect(screen.getByText('No step')).toBeInTheDocument();
    });
  });

  // ── Edit / Add mode ──────────────────────────────────────────────────────────

  describe('Edit mode', () => {
    beforeEach(() => {
      vi.mocked(localStorage.getItem).mockImplementation((key) =>
        key === 'token' ? makeToken({ id: 42 }) : null
      );
      vi.mocked(fetchRecipes).mockResolvedValue([
        makeRecipe({
          id: 1,
          createdBy: 42,
          title: 'Editable Pasta',
          description: 'A great pasta',
          prepTime: 10,
          cookTime: 20,
          difficulty: 'Easy',
          estimatedCost: 5,
          ingredients: [{ name: 'pasta', amount: '200', unit: 'g', cost: 1 }],
          steps: [{ text: 'Boil water' }, { text: 'Cook pasta' }],
          categories: ['healthy'],
        }),
      ]);
    });

    it('opens edit form when clicking Edit button', async () => {
      render(<Recipes />);
      await screen.findByText('Editable Pasta');
      await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

      expect(screen.getByText(/editing: editable pasta/i)).toBeInTheDocument();
      expect(screen.getByText('Make changes and save when ready.')).toBeInTheDocument();
    });

    it('pre-fills form fields with recipe data', async () => {
      render(<Recipes />);
      await screen.findByText('Editable Pasta');
      await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

      expect(screen.getByDisplayValue('Editable Pasta')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A great pasta')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // prepTime
      expect(screen.getByDisplayValue('20')).toBeInTheDocument(); // cookTime
    });

    it('shows Save Changes button', async () => {
      render(<Recipes />);
      await screen.findByText('Editable Pasta');
      await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('shows Cancel button that returns to list', async () => {
      render(<Recipes />);
      await screen.findByText('Editable Pasta');
      await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

      await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

      // Back to list view
      expect(screen.getByText('Editable Pasta')).toBeInTheDocument();
      expect(screen.queryByText(/editing:/i)).not.toBeInTheDocument();
    });

    it('shows Back button that returns to list', async () => {
      render(<Recipes />);
      await screen.findByText('Editable Pasta');
      await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

      await userEvent.click(screen.getByRole('button', { name: /^back$/i }));

      expect(screen.getByText('Editable Pasta')).toBeInTheDocument();
      expect(screen.queryByText(/editing:/i)).not.toBeInTheDocument();
    });

    it('displays Switch to Cook button in edit mode', async () => {
      render(<Recipes />);
      await screen.findByText('Editable Pasta');
      await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

      expect(screen.getByRole('button', { name: /switch to cook/i })).toBeInTheDocument();
    });

    it('shows form error when title is empty', async () => {
      const { createRecipe: mockCreate } = await import('../../api/recipes');
      render(<Recipes />);
      await screen.findByText('Editable Pasta');
      await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

      // Clear the title
      const titleInput = screen.getByDisplayValue('Editable Pasta');
      await userEvent.clear(titleInput);

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      expect(screen.getByText('Recipe title is required.')).toBeInTheDocument();
    });

    it('saves recipe and returns to list on success', async () => {
      const { updateRecipe: mockUpdate } = await import('../../api/recipes');
      vi.mocked(mockUpdate).mockResolvedValue(
        makeRecipe({ id: 1, title: 'Updated Pasta', createdBy: 42 })
      );

      render(<Recipes />);
      await screen.findByText('Editable Pasta');
      await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

      // Change title
      const titleInput = screen.getByDisplayValue('Editable Pasta');
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Updated Pasta');

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    it('shows error when save fails', async () => {
      const { updateRecipe: mockUpdate } = await import('../../api/recipes');
      vi.mocked(mockUpdate).mockRejectedValue(new Error('Server error'));

      render(<Recipes />);
      await screen.findByText('Editable Pasta');
      await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('adds and removes ingredients in the form', async () => {
      render(<Recipes />);
      await screen.findByText('Editable Pasta');
      await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

      // Add ingredient
      await userEvent.click(screen.getByRole('button', { name: /\+ add ingredient/i }));

      // Check that a new empty row was added (there should be more ingredient rows)
      const removeButtons = screen.getAllByTitle('Remove');
      const initialCount = removeButtons.length;
      expect(initialCount).toBeGreaterThan(1);

      // Remove the last ingredient row
      await userEvent.click(removeButtons[removeButtons.length - 1]);

      const afterRemove = screen.getAllByTitle('Remove');
      expect(afterRemove.length).toBeLessThan(initialCount);
    });

    it('adds and removes steps in the form', async () => {
      render(<Recipes />);
      await screen.findByText('Editable Pasta');
      await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

      // Add step
      await userEvent.click(screen.getByRole('button', { name: /\+ add step/i }));

      // Remove buttons should include step remove buttons
      const removeButtons = screen.getAllByTitle('Remove');
      const count = removeButtons.length;

      // Remove a step
      await userEvent.click(removeButtons[removeButtons.length - 1]);

      expect(screen.getAllByTitle('Remove').length).toBeLessThan(count);
    });

    it('toggles category tags in the form', async () => {
      render(<Recipes />);
      await screen.findByText('Editable Pasta');
      await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

      // Find a category tag button (e.g., "vegetarian")
      const vegButton = screen.getByRole('button', { name: /^vegetarian$/i });
      // Toggle it on
      await userEvent.click(vegButton);
      // Toggle it off
      await userEvent.click(vegButton);
      // Should still be in the document (just toggled)
      expect(vegButton).toBeInTheDocument();
    });
  });

  describe('Add mode', () => {
    beforeEach(() => {
      vi.mocked(localStorage.getItem).mockImplementation((key) =>
        key === 'token' ? makeToken({ id: 42 }) : null
      );
      vi.mocked(fetchRecipes).mockResolvedValue([]);
    });

    it('opens add form when clicking + Add Recipe', async () => {
      render(<Recipes />);
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: /add recipe/i }).length).toBeGreaterThan(0)
      );

      // Click the first "Add Recipe" button
      const addButtons = screen.getAllByRole('button', { name: /add recipe/i });
      await userEvent.click(addButtons[0]);

      expect(screen.getByText('New Recipe')).toBeInTheDocument();
      expect(screen.getByText('Fill in the details to add a new recipe.')).toBeInTheDocument();
    });

    it('shows Create Recipe button in add mode', async () => {
      render(<Recipes />);
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: /add recipe/i }).length).toBeGreaterThan(0)
      );
      await userEvent.click(screen.getAllByRole('button', { name: /add recipe/i })[0]);

      expect(screen.getByRole('button', { name: /create recipe/i })).toBeInTheDocument();
    });

    it('does not show Switch to Cook button in add mode', async () => {
      render(<Recipes />);
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: /add recipe/i }).length).toBeGreaterThan(0)
      );
      await userEvent.click(screen.getAllByRole('button', { name: /add recipe/i })[0]);

      expect(screen.queryByRole('button', { name: /switch to cook/i })).not.toBeInTheDocument();
    });

    it('validates title is required before creating', async () => {
      render(<Recipes />);
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: /add recipe/i }).length).toBeGreaterThan(0)
      );
      await userEvent.click(screen.getAllByRole('button', { name: /add recipe/i })[0]);

      // Try to create without filling title
      await userEvent.click(screen.getByRole('button', { name: /create recipe/i }));

      expect(screen.getByText('Recipe title is required.')).toBeInTheDocument();
    });

    it('shows login error when trying to save without token', async () => {
      // Start with token (to render add button), then remove it
      render(<Recipes />);
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: /add recipe/i }).length).toBeGreaterThan(0)
      );
      await userEvent.click(screen.getAllByRole('button', { name: /add recipe/i })[0]);

      // Type a title so it passes the title check
      await userEvent.type(screen.getByPlaceholderText('e.g. Spaghetti Carbonara'), 'My Recipe');

      // Clear token
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      await userEvent.click(screen.getByRole('button', { name: /create recipe/i }));

      expect(screen.getByText('You must be logged in to save recipes.')).toBeInTheDocument();
    });

    it('creates a recipe successfully', async () => {
      const { createRecipe: mockCreate } = await import('../../api/recipes');
      vi.mocked(mockCreate).mockResolvedValue(
        makeRecipe({ id: 99, title: 'Brand New Recipe', createdBy: 42 })
      );

      render(<Recipes />);
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: /add recipe/i }).length).toBeGreaterThan(0)
      );
      await userEvent.click(screen.getAllByRole('button', { name: /add recipe/i })[0]);

      await userEvent.type(screen.getByPlaceholderText('e.g. Spaghetti Carbonara'), 'Brand New Recipe');
      await userEvent.click(screen.getByRole('button', { name: /create recipe/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled();
      });
    });

    it('changes difficulty dropdown', async () => {
      render(<Recipes />);
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: /add recipe/i }).length).toBeGreaterThan(0)
      );
      await userEvent.click(screen.getAllByRole('button', { name: /add recipe/i })[0]);

      const difficultySelect = screen.getByLabelText(/difficulty/i);
      await userEvent.selectOptions(difficultySelect, 'Hard');

      expect((difficultySelect as HTMLSelectElement).value).toBe('Hard');
    });

    it('changes prep time and cook time inputs', async () => {
      render(<Recipes />);
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: /add recipe/i }).length).toBeGreaterThan(0)
      );
      await userEvent.click(screen.getAllByRole('button', { name: /add recipe/i })[0]);

      const prepInput = screen.getByLabelText(/prep time/i);
      await userEvent.clear(prepInput);
      await userEvent.type(prepInput, '15');
      expect(prepInput).toHaveValue(15);

      const cookInput = screen.getByLabelText(/cook time/i);
      await userEvent.clear(cookInput);
      await userEvent.type(cookInput, '30');
      expect(cookInput).toHaveValue(30);
    });

    it('changes description textarea', async () => {
      render(<Recipes />);
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: /add recipe/i }).length).toBeGreaterThan(0)
      );
      await userEvent.click(screen.getAllByRole('button', { name: /add recipe/i })[0]);

      const descInput = screen.getByPlaceholderText('A short description of the recipe…');
      await userEvent.type(descInput, 'Delicious meal');
      expect(descInput).toHaveValue('Delicious meal');
    });

    it('changes estimated cost input', async () => {
      render(<Recipes />);
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: /add recipe/i }).length).toBeGreaterThan(0)
      );
      await userEvent.click(screen.getAllByRole('button', { name: /add recipe/i })[0]);

      const costInput = screen.getByLabelText(/estimated cost/i);
      await userEvent.clear(costInput);
      await userEvent.type(costInput, '12');
      expect(costInput).toHaveValue(12);
    });
  });
});
