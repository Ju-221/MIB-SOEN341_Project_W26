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
});
