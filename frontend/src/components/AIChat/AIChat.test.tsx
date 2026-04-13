import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIChat from './AIChat';

// Aurora uses canvas – not available in jsdom; mock by the path AIChat imports
vi.mock('../Unique/Background', () => ({
  default: () => <div data-testid="aurora-mock" />,
}));

// Card displayed inside RecipeMessage – mock by the path AIChat imports
vi.mock('../Unique/Card', () => ({
  default: (props: { title: string }) => <div data-testid="recipe-card">{props.title}</div>,
}));

// Calendar helpers referenced by RecipeMessage
vi.mock('../Calendar/types', () => ({
  MONTH_NAMES: [
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
  ],
  MEAL_TYPES: ['breakfast', 'lunch', 'dinner', 'snack'],
  MEAL_LABELS: { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' },
  buildEmptyMonth: vi.fn(() => []),
  emptyMeals: vi.fn(() => ({
    breakfast: { recipeId: null, recipeTitle: null },
    lunch: { recipeId: null, recipeTitle: null },
    dinner: { recipeId: null, recipeTitle: null },
    snack: { recipeId: null, recipeTitle: null },
  })),
}));

const mockFetch = vi.fn();

// jsdom does not implement scrollIntoView – mock it globally
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  // Reset storage
  sessionStorage.clear();
  localStorage.clear();

  // Stub global fetch
  vi.stubGlobal('fetch', mockFetch);

  // Default: any fetch resolves successfully
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Helpers ─────────────────────────────────────────────────

const generatedRecipe = {
  id: 1,
  title: 'AI Pasta',
  description: 'Delicious AI pasta.',
  prepTime: 10,
  cookTime: 20,
  difficulty: 'Easy',
  estimatedCost: 5,
  heroImage: null,
  categories: ['easy'],
  ingredients: [{ name: 'pasta', amount: 200, unit: 'g' }],
  steps: ['Boil water', 'Cook pasta'],
  dietaryPreferences: [],
  allergies: [],
};

function createToken(payload: object) {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

// ── Tests ────────────────────────────────────────────────────

describe('AIChat – Initial Render', () => {
  it('displays the AI Recipe Chef heading', () => {
    render(<AIChat />);
    // The heading appears in the <p class="aichat-title"> element
    const headings = screen.getAllByText(/AI Recipe Chef/i);
    expect(headings.length).toBeGreaterThan(0);
  });

  it('shows the initial greeting message', () => {
    render(<AIChat />);
    expect(screen.getByText(/I'm your AI recipe chef/i)).toBeInTheDocument();
  });

  it('renders a textarea for user input', () => {
    render(<AIChat />);
    expect(screen.getByPlaceholderText(/Describe what you're craving/i)).toBeInTheDocument();
  });

  it('renders a Send button', () => {
    render(<AIChat />);
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('Send button is disabled when input is empty', () => {
    render(<AIChat />);
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('renders a Clear button', () => {
    render(<AIChat />);
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });
});

describe('AIChat – Sending a Message', () => {
  it('enables Send button when text is typed', async () => {
    render(<AIChat />);
    const textarea = screen.getByPlaceholderText(/Describe what you're craving/i);
    await userEvent.type(textarea, 'pasta');
    expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled();
  });

  it('displays the user message in the chat after sending', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => generatedRecipe,
    });

    render(<AIChat />);
    const textarea = screen.getByPlaceholderText(/Describe what you're craving/i);
    await userEvent.type(textarea, 'make me pasta');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('make me pasta')).toBeInTheDocument();
    });
  });

  it('clears the input field after sending', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => generatedRecipe,
    });

    render(<AIChat />);
    const textarea = screen.getByPlaceholderText(/Describe what you're craving/i);
    await userEvent.type(textarea, 'tacos please');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('disables the textarea while the AI is loading', async () => {
    // Promise that never resolves → loading stays true
    mockFetch.mockReturnValueOnce(new Promise(() => undefined));

    render(<AIChat />);
    const textarea = screen.getByPlaceholderText(/Describe what you're craving/i);
    await userEvent.type(textarea, 'sushi');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(textarea).toBeDisabled();
    });
  });
});

describe('AIChat – AI Response', () => {
  it('shows an error message when the API returns an error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Gemini service unavailable' }),
    });

    render(<AIChat />);
    const textarea = screen.getByPlaceholderText(/Describe what you're craving/i);
    await userEvent.type(textarea, 'something spicy');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/Gemini service unavailable/i)).toBeInTheDocument();
    });
  });

  it('shows a recipe card when the API returns a valid recipe', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => generatedRecipe,
    });

    render(<AIChat />);
    const textarea = screen.getByPlaceholderText(/Describe what you're craving/i);
    await userEvent.type(textarea, 'pasta with garlic');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByTestId('recipe-card')).toBeInTheDocument();
    });
  });
});

describe('AIChat – Clear Button', () => {
  it('resets chat to only the initial greeting when cleared', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => generatedRecipe,
    });

    render(<AIChat />);
    const textarea = screen.getByPlaceholderText(/Describe what you're craving/i);
    await userEvent.type(textarea, 'hello');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => screen.getByText('hello'));

    await userEvent.click(screen.getByRole('button', { name: /clear/i }));

    // User message gone, initial greeting still present
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
    expect(screen.getByText(/I'm your AI recipe chef/i)).toBeInTheDocument();
  });
});

describe('AIChat – Stored Messages', () => {
  it('loads saved messages that already have ids', () => {
    sessionStorage.setItem(
      'aichat_messages',
      JSON.stringify({
        userId: null,
        messages: [{ id: 'saved-user-message', kind: 'user', text: 'saved chat text' }],
      })
    );

    render(<AIChat />);

    expect(screen.getByText('saved chat text')).toBeInTheDocument();
  });

  it('adds ids to legacy saved messages', async () => {
    sessionStorage.setItem(
      'aichat_messages',
      JSON.stringify({
        userId: null,
        messages: [{ kind: 'model', text: 'legacy saved chat text' }],
      })
    );

    render(<AIChat />);

    expect(screen.getByText('legacy saved chat text')).toBeInTheDocument();

    await waitFor(() => {
      const saved = JSON.parse(sessionStorage.getItem('aichat_messages') ?? '{}') as {
        messages?: Array<{ id?: string }>;
      };
      expect(saved.messages?.[0].id).toMatch(/^legacy-message-0-/);
    });
  });

  it('ignores saved messages for a different user', () => {
    localStorage.setItem('token', createToken({ id: 2 }));
    sessionStorage.setItem(
      'aichat_messages',
      JSON.stringify({
        userId: 1,
        messages: [{ id: 'other-user-message', kind: 'user', text: 'other user chat text' }],
      })
    );

    render(<AIChat />);

    expect(screen.queryByText('other user chat text')).not.toBeInTheDocument();
    expect(screen.getByText(/I'm your AI recipe chef/i)).toBeInTheDocument();
  });

  it('falls back to the initial greeting when the auth token is invalid', () => {
    localStorage.setItem('token', 'invalid-token');
    sessionStorage.setItem(
      'aichat_messages',
      JSON.stringify({
        userId: 2,
        messages: [{ id: 'saved-message', kind: 'user', text: 'saved invalid token text' }],
      })
    );

    render(<AIChat />);

    expect(screen.queryByText('saved invalid token text')).not.toBeInTheDocument();
    expect(screen.getByText(/I'm your AI recipe chef/i)).toBeInTheDocument();
  });

  it('falls back to the initial greeting when saved messages are invalid', () => {
    sessionStorage.setItem('aichat_messages', '{invalid json');

    render(<AIChat />);

    expect(screen.getByText(/I'm your AI recipe chef/i)).toBeInTheDocument();
  });

  it('keeps rendering when session storage cannot persist messages', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    setItemSpy.mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => generatedRecipe,
    });

    render(<AIChat />);
    const textarea = screen.getByPlaceholderText(/Describe what you're craving/i);
    await userEvent.type(textarea, 'storage failure meal');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('storage failure meal')).toBeInTheDocument();
    });
  });
});
