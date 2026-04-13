/*# The following file was generated with the assistance of Claude.
#Prompt:  Create a test suite for the Unique component using Vitest and React Testing Library. Cover rendering of brand, nav links
based on login state, username display, and profile dropdown behavior.
# I, Anais Perron reviewed, modified, and tested the code to ensure correctness.
*/
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Unique from './Unique';
import type { Recipe } from './fakeRecipes';

// canvas-confetti uses browser canvas – unavailable in jsdom
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

// Aurora background uses canvas
vi.mock('./Background', () => ({
  default: () => <div data-testid="aurora-mock" />,
}));

// Lightweight Card stub – just renders the title
vi.mock('./Card', () => ({
  default: (props: { title: string }) => <div data-testid="recipe-card">{props.title}</div>,
}));

// ── Mock the recipes API module ──────────────────────────────
// The Unique component calls fetchRecipes from '../../api/recipes'.
// We mock the module so it resolves instantly without hitting the network.

const USER_ID = 42;
const fakeToken = `header.${btoa(JSON.stringify({ id: USER_ID }))}.sig`;

const fakeRecipes: Recipe[] = [
  {
    id: 1,
    title: 'Garlic Pasta',
    description: 'Simple garlic pasta.',
    prepTime: 5,
    cookTime: 10,
    difficulty: 'Easy',
    estimatedCost: 4,
    heroImage: null,
    categories: ['easy', 'vegetarian'],
    ingredients: [
      { name: 'pasta', amount: '200', unit: 'g' },
      { name: 'garlic', amount: '3', unit: 'cloves' },
    ],
    steps: ['Boil water', 'Cook pasta'],
    createdBy: USER_ID,
  },
  {
    id: 2,
    title: 'Tomato Soup',
    description: 'Creamy tomato soup.',
    prepTime: 10,
    cookTime: 20,
    difficulty: 'Easy',
    estimatedCost: 6,
    heroImage: null,
    categories: ['easy', 'vegan'],
    ingredients: [
      { name: 'tomato', amount: '4', unit: 'unit' },
      { name: 'garlic', amount: '2', unit: 'cloves' },
    ],
    steps: ['Blend', 'Simmer'],
    createdBy: USER_ID,
  },
  {
    id: 3,
    title: 'Omelette',
    description: 'Classic omelette.',
    prepTime: 5,
    cookTime: 5,
    difficulty: 'Medium',
    estimatedCost: 3,
    heroImage: null,
    categories: ['quick', 'easy'],
    ingredients: [
      { name: 'eggs', amount: '3', unit: 'unit' },
      { name: 'butter', amount: '1', unit: 'tbsp' },
    ],
    steps: ['Whisk', 'Cook'],
    createdBy: USER_ID,
  },
  {
    id: 4,
    title: 'Veggie Stir Fry',
    description: 'Colourful stir fry.',
    prepTime: 15,
    cookTime: 10,
    difficulty: 'Medium',
    estimatedCost: 8,
    heroImage: null,
    categories: ['healthy', 'vegan'],
    ingredients: [
      { name: 'broccoli', amount: '200', unit: 'g' },
      { name: 'soy sauce', amount: '2', unit: 'tbsp' },
    ],
    steps: ['Stir fry', 'Add sauce'],
    createdBy: USER_ID,
  },
];

vi.mock('../../api/recipes', () => ({
  fetchRecipes: vi.fn(() => Promise.resolve(fakeRecipes)),
}));

import { fetchRecipes } from '../../api/recipes';

// ── Setup / teardown ─────────────────────────────────────────

beforeEach(() => {
  localStorage.setItem('token', fakeToken);
});

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// ── Shared helpers ─────────────────────────────────────────

/** Click past the intro overlay to reach the picker screen. */
async function goToPicker() {
  render(<Unique />);
  await waitFor(() => screen.getByText(/click anywhere to continue/i));
  await userEvent.click(screen.getByText(/click anywhere to continue/i));
  await waitFor(() => screen.getByRole('button', { name: /let's play/i }));
}

/**
 * Reach the game phase via Uncommon mode (uses all recipes as pool,
 * so no ingredients need to be pre-selected).
 */
async function startGameInUncommonMode() {
  await goToPicker();
  await userEvent.click(screen.getByRole('button', { name: /^Uncommon$/i }));
  await userEvent.click(screen.getByRole('button', { name: /let's play/i }));
  // Game renders two card slots each with a Choose! button
  await waitFor(() => {
    expect(screen.getAllByRole('button', { name: /choose!/i })).toHaveLength(2);
  });
}

// ── Tests ────────────────────────────────────────────────────

// ── Loading / empty states ────────────────────────────────────────────────────

describe('Unique – Loading state', () => {
  it('shows "Loading recipes…" while the fetch is in flight', async () => {
    // Use Once so the never-resolving promise does not leak into subsequent tests
    vi.mocked(fetchRecipes).mockReturnValueOnce(new Promise(() => {}) as ReturnType<typeof fetchRecipes>);
    render(<Unique />);
    expect(screen.getByText(/loading recipes/i)).toBeInTheDocument();
  });
});

describe('Unique – Empty recipes state', () => {
  it('shows "No recipes found" when the user has no recipes', async () => {
    vi.mocked(fetchRecipes).mockResolvedValueOnce([]);
    render(<Unique />);
    await waitFor(() => {
      expect(screen.getByText(/no recipes found/i)).toBeInTheDocument();
    });
  });

  it('shows a link to generate a recipe with AI', async () => {
    vi.mocked(fetchRecipes).mockResolvedValueOnce([]);
    render(<Unique />);
    await waitFor(() => {
      // The empty-state body text includes this phrase
      expect(screen.getByText(/generate one from scratch with AI!/i)).toBeInTheDocument();
    });
  });
});

describe('Unique – No-ingredients state', () => {
  it('shows "No ingredients found" when all recipes have empty ingredient lists', async () => {
    vi.mocked(fetchRecipes).mockResolvedValueOnce([
      {
        id: 99,
        title: 'Mystery Recipe',
        description: 'No ingredients',
        prepTime: 5,
        cookTime: 5,
        difficulty: 'Easy',
        estimatedCost: 0,
        heroImage: null,
        categories: [],
        ingredients: [],
        steps: [],
        createdBy: USER_ID,
      },
    ]);

    render(<Unique />);
    await waitFor(() => screen.getByText(/click anywhere to continue/i));
    await userEvent.click(screen.getByText(/click anywhere to continue/i));

    await waitFor(() => {
      expect(screen.getByText(/no ingredients found/i)).toBeInTheDocument();
    });
  });

  it('shows a "Go back" button on the no-ingredients screen', async () => {
    vi.mocked(fetchRecipes).mockResolvedValueOnce([
      {
        id: 99,
        title: 'Mystery Recipe',
        description: '',
        prepTime: 0,
        cookTime: 0,
        difficulty: 'Easy',
        estimatedCost: 0,
        heroImage: null,
        categories: [],
        ingredients: [],
        steps: [],
        createdBy: USER_ID,
      },
    ]);

    render(<Unique />);
    await waitFor(() => screen.getByText(/click anywhere to continue/i));
    await userEvent.click(screen.getByText(/click anywhere to continue/i));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });
  });
});

// ── Single-recipe shortcut (Common mode winner) ───────────────────────────────

describe('Unique – Single-recipe winner via Common mode', () => {
  it('skips the game phase and shows the winner when exactly one recipe matches', async () => {
    await goToPicker();
    await waitFor(() => screen.getByRole('button', { name: /^eggs$/i }));

    // Only "Omelette" contains eggs
    await userEvent.click(screen.getByRole('button', { name: /^eggs$/i }));
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }));

    // Winner screen should appear (no Choose! buttons)
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /choose!/i })).not.toBeInTheDocument();
    });
    // Winner title appears both in the Card stub and the winner label
    expect(screen.getAllByText(/omelette/i).length).toBeGreaterThan(0);
  });
});

// ── No-results back button ────────────────────────────────────────────────────

describe('Unique – No-results back navigation', () => {
  it('returns to the picker when "Change my ingredients" is clicked', async () => {
    await goToPicker();
    await waitFor(() => screen.getByRole('button', { name: /^pasta$/i }));

    await userEvent.click(screen.getByRole('button', { name: /^pasta$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^broccoli$/i }));
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /change my ingredients/i })).toBeInTheDocument()
    );
    await userEvent.click(screen.getByRole('button', { name: /change my ingredients/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /let's play/i })).toBeInTheDocument();
    });
  });
});

// ── Intro Phase ───────────────────────────────────────────────────────────────

describe('Unique – Intro Phase', () => {
  it('renders the intro text on mount', async () => {
    render(<Unique />);
    await waitFor(() => {
      expect(screen.getByText(/Can't decide what to eat/i)).toBeInTheDocument();
    });
  });

  it('shows the "click anywhere to continue" hint', async () => {
    render(<Unique />);
    await waitFor(() => {
      expect(screen.getByText(/click anywhere to continue/i)).toBeInTheDocument();
    });
  });

  it('advances to picker phase when the overlay is clicked', async () => {
    await goToPicker();
    expect(screen.getByText(/define the ingredients you have/i)).toBeInTheDocument();
  });
});

describe('Unique – Picker Phase', () => {
  it('renders Common and Uncommon toggle buttons', async () => {
    await goToPicker();
    expect(screen.getByRole('button', { name: /^Common$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Uncommon$/i })).toBeInTheDocument();
  });

  it('renders ingredient chips fetched from the API', async () => {
    await goToPicker();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^pasta$/i })).toBeInTheDocument();
    });
  });

  it('selects an ingredient chip on click', async () => {
    await goToPicker();
    await waitFor(() => screen.getByRole('button', { name: /^pasta$/i }));
    const chip = screen.getByRole('button', { name: /^pasta$/i });
    await userEvent.click(chip);
    expect(chip).toHaveClass('selected');
  });

  it('deselects an ingredient chip on second click', async () => {
    await goToPicker();
    await waitFor(() => screen.getByRole('button', { name: /^pasta$/i }));
    const chip = screen.getByRole('button', { name: /^pasta$/i });
    await userEvent.click(chip);
    await userEvent.click(chip);
    expect(chip).not.toHaveClass('selected');
  });

  it('renders the "Let\'s play!" start button', async () => {
    await goToPicker();
    expect(screen.getByRole('button', { name: /let's play/i })).toBeInTheDocument();
  });

  it('shows Uncommon mode description after toggling', async () => {
    await goToPicker();
    await userEvent.click(screen.getByRole('button', { name: /^Uncommon$/i }));
    expect(screen.getByText(/at least one of your ingredients/i)).toBeInTheDocument();
  });

  it('shows Common mode description by default', async () => {
    await goToPicker();
    expect(screen.getByText(/all of your ingredients/i)).toBeInTheDocument();
  });
});

describe('Unique – No-Results Phase', () => {
  it('shows no-results screen when no recipe has all selected ingredients', async () => {
    await goToPicker();
    await waitFor(() => screen.getByRole('button', { name: /^pasta$/i }));

    // Select two ingredients that no single recipe shares
    await userEvent.click(screen.getByRole('button', { name: /^pasta$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^broccoli$/i }));

    await userEvent.click(screen.getByRole('button', { name: /let's play/i }));

    await waitFor(() => {
      expect(screen.getByText(/No recipe found/i)).toBeInTheDocument();
    });
  });

  it('shows a "Change my ingredients" back button on the no-results screen', async () => {
    await goToPicker();
    await waitFor(() => screen.getByRole('button', { name: /^pasta$/i }));

    await userEvent.click(screen.getByRole('button', { name: /^pasta$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^broccoli$/i }));
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /change my ingredients/i })).toBeInTheDocument();
    });
  });
});

describe('Unique – Game Phase', () => {
  it('renders two Choose! buttons after starting the game', async () => {
    await startGameInUncommonMode();
    expect(screen.getAllByRole('button', { name: /choose!/i })).toHaveLength(2);
  });

  it('Choose! buttons are enabled', async () => {
    await startGameInUncommonMode();
    screen.getAllByRole('button', { name: /choose!/i }).forEach((btn) => {
      expect(btn).not.toBeDisabled();
    });
  });

  it('shows two recipe cards in the game slots', async () => {
    await startGameInUncommonMode();
    await waitFor(() => {
      expect(screen.getAllByTestId('recipe-card')).toHaveLength(2);
    });
  });

  it('clicking Choose! does not crash the component', async () => {
    await startGameInUncommonMode();
    const [firstBtn] = screen.getAllByRole('button', { name: /choose!/i });
    await userEvent.click(firstBtn);
    expect(screen.getByTestId('aurora-mock')).toBeInTheDocument();
  });
});
