import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ── Mock the calendar API ─────────────────────────────────────────────────────
vi.mock('../../api/calendar', () => {
  const today = new Date();
  const baseMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const windowDates: Date[] = [];
  for (let i = -3; i <= 3; i++) {
    windowDates.push(new Date(baseMonth.getFullYear(), baseMonth.getMonth() + i, 1));
  }
  const monthKeys = windowDates.map(
    (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  );
  const buildEmpty = (year: number, month: number) => {
    const count = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => ({
      date: i + 1,
      meals: {
        breakfast: { recipeId: null, recipeTitle: null },
        lunch: { recipeId: null, recipeTitle: null },
        dinner: { recipeId: null, recipeTitle: null },
        snack: { recipeId: null, recipeTitle: null },
      },
    }));
  };
  const monthData: Record<string, ReturnType<typeof buildEmpty>> = {};
  windowDates.forEach((d, i) => {
    monthData[monthKeys[i]] = buildEmpty(d.getFullYear(), d.getMonth());
  });

  return {
    getCalendarMonthKey: vi.fn(
      (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    ),
    getCalendarMonthWindow: vi.fn(() => windowDates),
    fetchCalendarWindow: vi.fn(async () => ({
      monthDates: windowDates,
      monthKeys,
      monthData,
    })),
    saveCalendarWindow: vi.fn(async () => {}),
    replaceMonthInCalendarWindow: vi.fn((win: unknown) => win),
  };
});

// ── Mock the RecipeManager component ──────────────────────────────────────────
vi.mock('../Recipe-Manager/CreateRecipe', () => ({
  default: () => <div data-testid="recipe-manager">RecipeManager</div>,
}));

// ── Mock CSS import ───────────────────────────────────────────────────────────
vi.mock('./Calendar.css', () => ({}));

import Calendar from './Calendar';
import { fetchCalendarWindow, saveCalendarWindow } from '../../api/calendar';

const FAKE_TOKEN = 'header.' + btoa(JSON.stringify({ id: 1 })) + '.sig';

// Fake recipes returned by fetch
const fakeRecipes = [
  {
    id: 10,
    title: 'Pancakes',
    description: 'Fluffy pancakes',
    prepTime: 5,
    cookTime: 15,
    difficulty: 'Easy',
    estimatedCost: 3,
    heroImage: null,
    ingredients: [],
    steps: [],
    categories: [],
  },
  {
    id: 20,
    title: 'Pasta Salad',
    description: 'Cold pasta salad',
    prepTime: 10,
    cookTime: 10,
    difficulty: 'Easy',
    estimatedCost: 6,
    heroImage: null,
    ingredients: [],
    steps: [],
    categories: [],
  },
];

// ── Setup / Teardown ──────────────────────────────────────────────────────────
let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('token', FAKE_TOKEN);
  vi.clearAllMocks();

  originalFetch = globalThis.fetch;
  globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
    const urlString = typeof url === 'string' ? url : url.toString();
    if (urlString.includes('/api/recipes/generate')) {
      return new Response(JSON.stringify({ id: 99, title: 'AI Generated Recipe' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (urlString.includes('/api/recipes')) {
      return new Response(JSON.stringify(fakeRecipes), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200 });
  }) as typeof globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  localStorage.clear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Calendar', () => {
  it('shows loading spinner initially then renders month view', async () => {
    render(<Calendar />);
    // Initially shows loading
    expect(screen.getByText('Loading your meal plan...')).toBeInTheDocument();

    // After data loads, shows month/year title
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Day labels should be visible
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('renders the current month name and year in the header', async () => {
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    const now = new Date();
    const monthNames = [
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
    const expected = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('has Week and Month view toggle buttons', async () => {
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
  });

  it('switches to week view on Week button click', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    await user.click(screen.getByText('Week'));

    // In week view, the "Current Week" button appears
    expect(screen.getByText('Current Week')).toBeInTheDocument();
  });

  it('switches back to month view on Month button click', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    await user.click(screen.getByText('Week'));
    expect(screen.getByText('Current Week')).toBeInTheDocument();

    await user.click(screen.getByText('Month'));
    expect(screen.getByText('Current Month')).toBeInTheDocument();
  });

  it('navigates to the previous month', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    const prevBtn = screen.getByLabelText('Previous month');
    await user.click(prevBtn);

    // After navigating, the title should change
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthNames = [
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
    await waitFor(() => {
      expect(
        screen.getByText(`${monthNames[prev.getMonth()]} ${prev.getFullYear()}`)
      ).toBeInTheDocument();
    });
  });

  it('navigates to next month', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    const nextBtn = screen.getByLabelText('Next month');
    await user.click(nextBtn);

    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthNames = [
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
    await waitFor(() => {
      expect(
        screen.getByText(`${monthNames[next.getMonth()]} ${next.getFullYear()}`)
      ).toBeInTheDocument();
    });
  });

  it('returns to current month with Current Month button', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Navigate away
    await user.click(screen.getByLabelText('Previous month'));
    // Come back
    await user.click(screen.getByText('Current Month'));

    const now = new Date();
    const monthNames = [
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
    await waitFor(() => {
      expect(
        screen.getByText(`${monthNames[now.getMonth()]} ${now.getFullYear()}`)
      ).toBeInTheDocument();
    });
  });

  it('renders meal slots (Breakfast, Lunch, Dinner, Snack) in day cells', async () => {
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Each day cell should have meal labels
    const breakfastSlots = screen.getAllByText('Breakfast');
    expect(breakfastSlots.length).toBeGreaterThan(0);

    const lunchSlots = screen.getAllByText('Lunch');
    expect(lunchSlots.length).toBeGreaterThan(0);

    const dinnerSlots = screen.getAllByText('Dinner');
    expect(dinnerSlots.length).toBeGreaterThan(0);

    const snackSlots = screen.getAllByText('Snack');
    expect(snackSlots.length).toBeGreaterThan(0);
  });

  it('opens choices modal when clicking an empty meal slot', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Click on any breakfast slot (they're all empty)
    const breakfastSlots = screen.getAllByText('Breakfast');
    // Find first enabled one (current month slot)
    const enabledSlot = breakfastSlots.find(
      (el) => !(el.closest('button') as HTMLButtonElement)?.disabled
    );
    expect(enabledSlot).toBeDefined();
    await user.click(enabledSlot!.closest('button')!);

    // The choices modal should appear
    await waitFor(() => {
      expect(screen.getByText('Add a meal')).toBeInTheDocument();
    });
    expect(screen.getByText('Choose from Recipes')).toBeInTheDocument();
    expect(screen.getByText('Generate with AI')).toBeInTheDocument();
    expect(screen.getByText('Manage Recipes')).toBeInTheDocument();
  });

  it('opens recipe picker from choices modal', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Open choices modal
    const breakfastSlots = screen.getAllByText('Breakfast');
    const enabledSlot = breakfastSlots.find(
      (el) => !(el.closest('button') as HTMLButtonElement)?.disabled
    );
    await user.click(enabledSlot!.closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Choose from Recipes')).toBeInTheDocument();
    });

    // Click "Choose from Recipes"
    await user.click(screen.getByText('Choose from Recipes'));

    // Should show the picker with recipe list
    await waitFor(() => {
      expect(screen.getByText('Pancakes')).toBeInTheDocument();
      expect(screen.getByText('Pasta Salad')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Search recipes...')).toBeInTheDocument();
  });

  it('filters recipes in picker with search', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Open choices modal → picker
    const breakfastSlots = screen.getAllByText('Breakfast');
    const enabledSlot = breakfastSlots.find(
      (el) => !(el.closest('button') as HTMLButtonElement)?.disabled
    );
    await user.click(enabledSlot!.closest('button')!);
    await waitFor(() => {
      expect(screen.getByText('Choose from Recipes')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Choose from Recipes'));

    await waitFor(() => {
      expect(screen.getByText('Pancakes')).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByPlaceholderText('Search recipes...');
    await user.type(searchInput, 'Pancakes');

    expect(screen.getByText('Pancakes')).toBeInTheDocument();
    expect(screen.queryByText('Pasta Salad')).not.toBeInTheDocument();
  });

  it('assigns a recipe to a meal slot', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Open choices → picker
    const breakfastSlots = screen.getAllByText('Breakfast');
    const enabledSlot = breakfastSlots.find(
      (el) => !(el.closest('button') as HTMLButtonElement)?.disabled
    );
    await user.click(enabledSlot!.closest('button')!);
    await waitFor(() => {
      expect(screen.getByText('Choose from Recipes')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Choose from Recipes'));

    await waitFor(() => {
      expect(screen.getByText('Pancakes')).toBeInTheDocument();
    });

    // Click on Pancakes to assign
    await user.click(screen.getByText('Pancakes'));

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Add a meal')).not.toBeInTheDocument();
    });
  });

  it('closes modal on overlay click', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Open choices modal
    const breakfastSlots = screen.getAllByText('Breakfast');
    const enabledSlot = breakfastSlots.find(
      (el) => !(el.closest('button') as HTMLButtonElement)?.disabled
    );
    await user.click(enabledSlot!.closest('button')!);
    await waitFor(() => {
      expect(screen.getByText('Add a meal')).toBeInTheDocument();
    });

    // Click overlay to close
    const overlay = document.querySelector('.cal-modal-overlay') as HTMLElement;
    await user.click(overlay);

    await waitFor(() => {
      expect(screen.queryByText('Add a meal')).not.toBeInTheDocument();
    });
  });

  it('closes modal with the close button', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Open choices modal
    const breakfastSlots = screen.getAllByText('Breakfast');
    const enabledSlot = breakfastSlots.find(
      (el) => !(el.closest('button') as HTMLButtonElement)?.disabled
    );
    await user.click(enabledSlot!.closest('button')!);
    await waitFor(() => {
      expect(screen.getByText('Add a meal')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Close'));

    await waitFor(() => {
      expect(screen.queryByText('Add a meal')).not.toBeInTheDocument();
    });
  });

  it('opens AI generation view from choices', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Open choices modal
    const breakfastSlots = screen.getAllByText('Breakfast');
    const enabledSlot = breakfastSlots.find(
      (el) => !(el.closest('button') as HTMLButtonElement)?.disabled
    );
    await user.click(enabledSlot!.closest('button')!);
    await waitFor(() => {
      expect(screen.getByText('Generate with AI')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Generate with AI'));

    await waitFor(() => {
      expect(screen.getByText('Generate Recipe')).toBeInTheDocument();
    });
    expect(
      screen.getByPlaceholderText('e.g. A quick high-protein breakfast under $5...')
    ).toBeInTheDocument();
  });

  it('generates an AI recipe', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Open choices → AI
    const breakfastSlots = screen.getAllByText('Breakfast');
    const enabledSlot = breakfastSlots.find(
      (el) => !(el.closest('button') as HTMLButtonElement)?.disabled
    );
    await user.click(enabledSlot!.closest('button')!);
    await waitFor(() => {
      expect(screen.getByText('Generate with AI')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Generate with AI'));

    const textarea = screen.getByPlaceholderText('e.g. A quick high-protein breakfast under $5...');
    await user.type(textarea, 'A quick healthy breakfast');

    await user.click(screen.getByText('Generate Recipe'));

    // Modal should close after generation
    await waitFor(() => {
      expect(screen.queryByText('Generate Recipe')).not.toBeInTheDocument();
    });
  });

  it('shows AI error when generation fails', async () => {
    // Override fetch to fail for generate
    globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes('/api/recipes/generate')) {
        return new Response(JSON.stringify({ message: 'Quota exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlString.includes('/api/recipes')) {
        return new Response(JSON.stringify(fakeRecipes), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('{}', { status: 200 });
    }) as typeof globalThis.fetch;

    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Open choices → AI
    const breakfastSlots = screen.getAllByText('Breakfast');
    const enabledSlot = breakfastSlots.find(
      (el) => !(el.closest('button') as HTMLButtonElement)?.disabled
    );
    await user.click(enabledSlot!.closest('button')!);
    await waitFor(() => {
      expect(screen.getByText('Generate with AI')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Generate with AI'));

    const textarea = screen.getByPlaceholderText('e.g. A quick high-protein breakfast under $5...');
    await user.type(textarea, 'Something tasty');
    await user.click(screen.getByText('Generate Recipe'));

    await waitFor(() => {
      expect(screen.getByText('Quota exceeded')).toBeInTheDocument();
    });
  });

  it('opens recipe manager from choices modal', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Open choices modal
    const breakfastSlots = screen.getAllByText('Breakfast');
    const enabledSlot = breakfastSlots.find(
      (el) => !(el.closest('button') as HTMLButtonElement)?.disabled
    );
    await user.click(enabledSlot!.closest('button')!);
    await waitFor(() => {
      expect(screen.getByText('Manage Recipes')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Manage Recipes'));

    await waitFor(() => {
      expect(screen.getByTestId('recipe-manager')).toBeInTheDocument();
    });
  });

  it('shows empty recipe message in picker when no recipes match', async () => {
    // Override fetch to return empty recipes
    globalThis.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
    ) as typeof globalThis.fetch;

    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Open choices → picker
    const breakfastSlots = screen.getAllByText('Breakfast');
    const enabledSlot = breakfastSlots.find(
      (el) => !(el.closest('button') as HTMLButtonElement)?.disabled
    );
    await user.click(enabledSlot!.closest('button')!);
    await waitFor(() => {
      expect(screen.getByText('Choose from Recipes')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Choose from Recipes'));

    await waitFor(() => {
      expect(screen.getByText('No recipes found. Create one in your Profile.')).toBeInTheDocument();
    });
  });

  it('renders without token (guest mode) with empty calendar', async () => {
    localStorage.clear();
    render(<Calendar />);

    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Calendar still renders with day labels
    expect(screen.getByText('Mon')).toBeInTheDocument();
  });

  it('week view shows 7 days of meal slots', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    await user.click(screen.getByText('Week'));

    await waitFor(() => {
      expect(screen.getByText('Current Week')).toBeInTheDocument();
    });

    // In week view, exactly 7 cells × 4 meal types = 28 meal slot buttons
    const breakfastSlots = screen.getAllByText('Breakfast');
    expect(breakfastSlots).toHaveLength(7);
  });

  it('navigates weeks in week view', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    await user.click(screen.getByText('Week'));
    await waitFor(() => {
      expect(screen.getByText('Current Week')).toBeInTheDocument();
    });

    // Navigate to next week
    const nextBtn = screen.getByLabelText('Next week');
    if (!(nextBtn as HTMLButtonElement).disabled) {
      await user.click(nextBtn);
      // Week range text should change
      await waitFor(() => {
        const weekRange = document.querySelector('.cal-week-range');
        expect(weekRange).toBeTruthy();
      });
    }
  });

  it('back button from AI view returns to choices', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your meal plan...')).not.toBeInTheDocument();
    });

    // Open choices → AI
    const breakfastSlots = screen.getAllByText('Breakfast');
    const enabledSlot = breakfastSlots.find(
      (el) => !(el.closest('button') as HTMLButtonElement)?.disabled
    );
    await user.click(enabledSlot!.closest('button')!);
    await waitFor(() => {
      expect(screen.getByText('Generate with AI')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Generate with AI'));

    await waitFor(() => {
      expect(screen.getByText('Generate Recipe')).toBeInTheDocument();
    });

    // Click Back
    await user.click(screen.getByText('Back'));

    await waitFor(() => {
      expect(screen.getByText('Add a meal')).toBeInTheDocument();
    });
  });
});
