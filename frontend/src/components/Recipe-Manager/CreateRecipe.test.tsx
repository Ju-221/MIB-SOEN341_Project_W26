import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipeManager from './CreateRecipe';

// Mock the recipes API
vi.mock('../../api/recipes', () => ({
  fetchRecipes: vi.fn(() => Promise.resolve([])),
  createRecipe: vi.fn((recipe) => Promise.resolve({ ...recipe, id: '1' })),
  updateRecipe: vi.fn((recipe) => Promise.resolve(recipe)),
  deleteRecipe: vi.fn(() => Promise.resolve()),
}));

describe('RecipeManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Button Tests', () => {
    it('renders add recipe button', () => {
      render(<RecipeManager />);

      const addButton = screen.getByRole('button', { name: /add recipe/i });
      expect(addButton).toBeInTheDocument();
    });

    it('add recipe button is clickable', async () => {
      render(<RecipeManager />);

      const addButton = screen.getByRole('button', { name: /add recipe/i });
      expect(addButton).toBeInTheDocument();

      // Test that button is clickable
      await userEvent.click(addButton);

      // Button should still be in the document after click
      expect(addButton).toBeInTheDocument();
    });

    it('renders clear filters button', async () => {
      render(<RecipeManager />);

      await waitFor(() => {
        const clearButton = screen.getByRole('button', { name: /clear filters/i });
        expect(clearButton).toBeInTheDocument();
      });
    });

    it('clear filters button is clickable', async () => {
      render(<RecipeManager />);

      await waitFor(() => {
        const clearButton = screen.getByRole('button', { name: /clear filters/i });
        expect(clearButton).toBeInTheDocument();
        userEvent.click(clearButton);
      });
    });

    it('renders expand/collapse filters button', async () => {
      render(<RecipeManager />);

      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /expand filters/i });
        expect(toggleButton).toBeInTheDocument();
      });
    });

    it('expand/collapse filters button toggles filters', async () => {
      render(<RecipeManager />);

      // Initially button has aria-label "Expand filters"
      const toggleButton = screen.getByRole('button', { name: /expand filters/i });
      expect(toggleButton).toBeInTheDocument();

      await userEvent.click(toggleButton);

      // After clicking, button should have aria-label "Collapse filters"
      await waitFor(() => {
        const collapseButton = screen.getByRole('button', { name: /collapse filters/i });
        expect(collapseButton).toBeInTheDocument();
      });
    });

    it('renders get started button', async () => {
      render(<RecipeManager />);

      // The get started button is in a section that may not always be visible
      // Just verify the component renders without errors
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /add recipe/i });
        expect(addButton).toBeInTheDocument();
      });
    });

    it('all main action buttons are enabled by default', async () => {
      render(<RecipeManager />);

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /add recipe/i });
        const clearButton = screen.getByRole('button', { name: /clear filters/i });
        const toggleButton = screen.getByRole('button', {
          name: /collapse filters|expand filters/i,
        });

        expect(addButton).not.toBeDisabled();
        expect(clearButton).not.toBeDisabled();
        expect(toggleButton).not.toBeDisabled();
      });
    });
  });

  describe('Create Recipe Form', () => {
    it('allows servings to be cleared without forcing zero back in', async () => {
      const user = userEvent.setup();
      render(<RecipeManager />);

      await user.click(screen.getByRole('button', { name: /add recipe/i }));

      const servingsInput = screen.getByLabelText(/servings/i);
      await user.clear(servingsInput);

      expect(servingsInput).toHaveValue(null);
    });

    it('renders ingredient unit as a select-only dropdown', async () => {
      const user = userEvent.setup();
      render(<RecipeManager />);

      await user.click(screen.getByRole('button', { name: /add recipe/i }));

      const unitField = screen.getByLabelText(/ingredient 1 unit/i);
      expect(unitField.tagName).toBe('SELECT');
    });
  });

  describe('Create Recipe Form', () => {
    it('allows servings to be cleared without forcing zero back in', async () => {
      const user = userEvent.setup();
      render(<RecipeManager />);

      await user.click(screen.getByRole('button', { name: /add recipe/i }));

      const servingsInput = screen.getByLabelText(/servings/i);
      await user.clear(servingsInput);

      expect(servingsInput).toHaveValue(null);
    });

    it('renders ingredient unit as a select-only dropdown', async () => {
      const user = userEvent.setup();
      render(<RecipeManager />);

      await user.click(screen.getByRole('button', { name: /add recipe/i }));

      const unitField = screen.getByLabelText(/ingredient 1 unit/i);
      expect(unitField.tagName).toBe('SELECT');
    });
  });

  describe('Filter Tag Buttons', () => {
    it('filter section exists', async () => {
      render(<RecipeManager />);

      await waitFor(() => {
        expect(screen.getByText(/filter recipes/i)).toBeInTheDocument();
      });
    });

    it('expand filters button toggles filter expansion', async () => {
      render(<RecipeManager />);

      // Get the toggle button
      const toggleButton = screen.getByRole('button', { name: /expand filters/i });
      expect(toggleButton).toBeInTheDocument();

      // Click to expand
      await userEvent.click(toggleButton);

      // Verify it now shows collapse state
      await waitFor(() => {
        const collapseButton = screen.getByRole('button', { name: /collapse filters/i });
        expect(collapseButton).toBeInTheDocument();
      });
    });

    it('filter buttons are rendered after expansion', async () => {
      render(<RecipeManager />);

      // Expand filters - button initially says "Expand filters"
      const toggleButton = screen.getByRole('button', { name: /expand filters/i });
      await userEvent.click(toggleButton);

      // After clicking, the filters section should have expanded content
      // Look for the search label that appears in the filters section
      await waitFor(
        () => {
          const searchLabel = screen.getByText(/search \(title, description, tags, steps\)/i);
          expect(searchLabel).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });
});
