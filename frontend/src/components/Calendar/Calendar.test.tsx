import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Calendar from './Calendar';

// ── Mock the calendar API module ─────────────────────────────
// Keep pure utility functions real; stub only the network calls.

vi.mock('../../api/calendar', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    fetchCalendarWindow: vi.fn(),
    saveCalendarWindow: vi.fn(() => Promise.resolve()),
  };
});

import { fetchCalendarWindow, saveCalendarWindow } from '../../api/calendar';

// ── Local types used only for building test fixtures ─────────

type MealSlot = { recipeId: number | null; recipeTitle: string | null };
type DayMeals = { breakfast: MealSlot; lunch: MealSlot; dinner: MealSlot; snack: MealSlot };
type CalDay = { date: number; meals: DayMeals };

// ── Test-data helpers ─────────────────────────────────────────

const MONTH_NAMES_T = [
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

function emptyMeals(): DayMeals {
  const s = (): MealSlot => ({ recipeId: null, recipeTitle: null });
  return { breakfast: s(), lunch: s(), dinner: s(), snack: s() };
}

function buildDays(year: number, month: number): CalDay[] {
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => ({ date: i + 1, meals: emptyMeals() }));
}

function mKey(date: Date): string {
  return `${MONTH_NAMES_T[date.getMonth()]}:${date.getFullYear()}`;
}

/** Build a 7-month CalendarWindowData with one filled slot for a given date. */
function buildCalendarWindow(
  filledDate: Date,
  mealType: keyof DayMeals,
  recipeId: number,
  recipeTitle: string
) {
  const center = new Date(filledDate.getFullYear(), filledDate.getMonth(), 1);
  const monthDates = Array.from(
    { length: 7 },
    (_, i) => new Date(center.getFullYear(), center.getMonth() + i - 3, 1)
  );
  const monthKeys = monthDates.map(mKey);
  const currentKey = mKey(center);
  const monthData: Record<string, CalDay[]> = {};

  for (let i = 0; i < monthDates.length; i++) {
    const d = monthDates[i];
    const days = buildDays(d.getFullYear(), d.getMonth());
    if (monthKeys[i] === currentKey) {
      days[filledDate.getDate() - 1].meals[mealType] = { recipeId, recipeTitle };
    }
    monthData[monthKeys[i]] = days;
  }

  return { monthDates, monthKeys, monthData };
}

/** Build an entirely empty 7-month CalendarWindowData. */
function buildEmptyCalendarWindow() {
  const today = new Date();
  const center = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthDates = Array.from(
    { length: 7 },
    (_, i) => new Date(center.getFullYear(), center.getMonth() + i - 3, 1)
  );
  const monthKeys = monthDates.map(mKey);
  const monthData: Record<string, CalDay[]> = {};
  for (let i = 0; i < monthDates.length; i++) {
    const d = monthDates[i];
    monthData[monthKeys[i]] = buildDays(d.getFullYear(), d.getMonth());
  }
  return { monthDates, monthKeys, monthData };
}

// ── Shared test constants ────────────────────────────────────

const RECIPE_ID = 7;
const RECIPE_TITLE = 'Garlic Pasta';

const fakeRecipe = {
  id: RECIPE_ID,
  title: RECIPE_TITLE,
  description: 'Tasty',
  prepTime: 5,
  cookTime: 10,
  difficulty: 'Easy',
  estimatedCost: 4,
  heroImage: null,
  categories: ['easy'],
  ingredients: [{ name: 'pasta', amount: '200', unit: 'g' }],
  steps: ['Boil water'],
  createdBy: 42,
};

// ── Setup / teardown ─────────────────────────────────────────

beforeEach(() => {
  vi.mocked(localStorage.getItem).mockReturnValue('fake.eyJpZCI6NDJ9.token');
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([fakeRecipe]),
  } as Response);
  vi.mocked(fetchCalendarWindow).mockResolvedValue(
    buildCalendarWindow(new Date(), 'breakfast', RECIPE_ID, RECIPE_TITLE)
  );
  sessionStorage.clear();
  window.location.hash = '';
});

afterEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

// ── Tests ────────────────────────────────────────────────────

describe('Calendar – loading state', () => {
  it('shows a loading spinner before data resolves', () => {
    vi.mocked(fetchCalendarWindow).mockReturnValue(new Promise(() => {}));
    render(<Calendar />);
    expect(screen.getByText(/loading your meal plan/i)).toBeInTheDocument();
  });
});

describe('Calendar – filled meal slots', () => {
  it('renders the recipe title inside a filled slot', async () => {
    render(<Calendar />);
    await screen.findByText(RECIPE_TITLE);
  });

  it('clicking a filled slot sets sessionStorage.viewRecipeId', async () => {
    render(<Calendar />);
    const slotBtn = await screen.findByTitle(RECIPE_TITLE);
    await userEvent.click(slotBtn);
    expect(sessionStorage.getItem('viewRecipeId')).toBe(String(RECIPE_ID));
  });

  it('clicking a filled slot navigates to #recipes', async () => {
    render(<Calendar />);
    const slotBtn = await screen.findByTitle(RECIPE_TITLE);
    await userEvent.click(slotBtn);
    expect(window.location.hash).toBe('#recipes');
  });

  it('remove button is rendered next to a filled slot', async () => {
    render(<Calendar />);
    await screen.findByText(RECIPE_TITLE);
    expect(
      screen.getByRole('button', { name: new RegExp(`Remove ${RECIPE_TITLE}`, 'i') })
    ).toBeInTheDocument();
  });

  it('clicking the remove button triggers saveCalendarWindow', async () => {
    render(<Calendar />);
    await screen.findByText(RECIPE_TITLE);
    const removeBtn = screen.getByRole('button', {
      name: new RegExp(`Remove ${RECIPE_TITLE}`, 'i'),
    });
    await userEvent.click(removeBtn);
    await waitFor(() => expect(saveCalendarWindow).toHaveBeenCalled());
  });

  it('remove button click does NOT navigate to #recipes', async () => {
    render(<Calendar />);
    await screen.findByText(RECIPE_TITLE);
    const removeBtn = screen.getByRole('button', {
      name: new RegExp(`Remove ${RECIPE_TITLE}`, 'i'),
    });
    await userEvent.click(removeBtn);
    expect(window.location.hash).not.toBe('#recipes');
  });
});

describe('Calendar – empty meal slots', () => {
  it('clicking an empty slot opens the "Add a meal" modal', async () => {
    render(<Calendar />);
    await screen.findByText(RECIPE_TITLE); // wait for load

    // Today's lunch slot is empty — find the first enabled one and click it
    const lunchSlots = screen.getAllByTitle('Add Lunch');
    const enabled = lunchSlots.find((btn) => !btn.hasAttribute('disabled'));
    await userEvent.click(enabled!);

    await waitFor(() => expect(screen.getByText(/add a meal/i)).toBeInTheDocument());
  });

  it('renders empty slots when calendar has no assignments', async () => {
    vi.mocked(fetchCalendarWindow).mockResolvedValue(buildEmptyCalendarWindow());
    render(<Calendar />);
    await waitFor(() =>
      expect(screen.queryByText(/loading your meal plan/i)).not.toBeInTheDocument()
    );
    // Empty slots show "Add Breakfast", "Add Lunch", etc. as titles
    expect(screen.getAllByTitle('Add Breakfast').length).toBeGreaterThan(0);
  });
});

describe('Calendar – header controls', () => {
  it('renders the current month name', async () => {
    render(<Calendar />);
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    const today = new Date();
    expect(screen.getByText(new RegExp(MONTH_NAMES_T[today.getMonth()]))).toBeInTheDocument();
  });

  it('renders week and month view toggle buttons', async () => {
    render(<Calendar />);
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: /^week$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^month$/i })).toBeInTheDocument();
  });

  it('switches to week view when the Week button is clicked', async () => {
    render(<Calendar />);
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /^week$/i }));
    expect(screen.getByRole('button', { name: /current week/i })).toBeInTheDocument();
  });
});
