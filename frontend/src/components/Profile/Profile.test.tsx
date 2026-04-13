/*# The following file was generated with the assistance of Claude.
#Prompt:  Create a test suite for the Profile component using Vitest and React Testing Library. Cover rendering of profile sections, diet/allergy chip behavior, name field population, API interactions for loading/saving preferences, and edge cases like API errors or missing localStorage data.
# I, Anais Perron reviewed, modified, and tested the code to ensure correctness.
*/
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Profile from './Profile';

describe('Profile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
    window.alert = vi.fn();
  });

  describe('Rendering', () => {
    it('renders the profile heading', () => {
      render(<Profile />);
      expect(screen.getByRole('heading', { name: /profile/i })).toBeInTheDocument();
    });

    it('renders Personal Information section', () => {
      render(<Profile />);
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    it('renders Diet Preferences section', () => {
      render(<Profile />);
      expect(screen.getByText('Diet Preferences')).toBeInTheDocument();
    });

    it('renders Allergies section', () => {
      render(<Profile />);
      expect(screen.getByRole('heading', { name: /allergies/i })).toBeInTheDocument();
    });

    it('renders Reset Changes button', () => {
      render(<Profile />);
      expect(screen.getByRole('button', { name: /reset changes/i })).toBeInTheDocument();
    });

    it('renders Save Changes button', () => {
      render(<Profile />);
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('shows email from localStorage when no token', () => {
      vi.mocked(localStorage.getItem).mockImplementation((key) => {
        if (key === 'userEmail') return 'user@example.com';
        return null;
      });
      render(<Profile />);
      expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument();
    });

    it('shows fallback when no email in localStorage', () => {
      render(<Profile />);
      expect(screen.getByDisplayValue('No email found')).toBeInTheDocument();
    });
  });

  describe('Diet preference chips', () => {
    it('renders standard diet options', () => {
      render(<Profile />);
      expect(screen.getByRole('button', { name: /vegetarian/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /vegan/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /keto/i })).toBeInTheDocument();
    });

    it('selects a diet chip on click', async () => {
      render(<Profile />);
      const chip = screen.getByRole('button', { name: /vegetarian/i });
      await userEvent.click(chip);
      expect(chip).toHaveClass('selected');
    });

    it('deselects a diet chip on second click', async () => {
      render(<Profile />);
      const chip = screen.getByRole('button', { name: /vegetarian/i });
      await userEvent.click(chip);
      await userEvent.click(chip);
      expect(chip).not.toHaveClass('selected');
    });

    it('adds a custom diet via button', async () => {
      render(<Profile />);
      const input = screen.getByPlaceholderText(/add a custom dietary preference/i);
      await userEvent.type(input, 'Raw Vegan');
      const addButtons = screen.getAllByRole('button', { name: /^add$/i });
      await userEvent.click(addButtons[0]);
      expect(screen.getByRole('button', { name: /raw vegan/i })).toBeInTheDocument();
    });

    it('adds a custom diet via Enter key', async () => {
      render(<Profile />);
      const input = screen.getByPlaceholderText(/add a custom dietary preference/i);
      await userEvent.type(input, 'Fruitarian{Enter}');
      expect(screen.getByRole('button', { name: /fruitarian/i })).toBeInTheDocument();
    });

    it('does not add empty custom diet', async () => {
      render(<Profile />);
      const addButtons = screen.getAllByRole('button', { name: /^add$/i });
      const countBefore = screen.getAllByRole('button').length;
      await userEvent.click(addButtons[0]);
      expect(screen.getAllByRole('button').length).toBe(countBefore);
    });

    it('selects existing option when matching custom input is typed', async () => {
      render(<Profile />);
      const input = screen.getByPlaceholderText(/add a custom dietary preference/i);
      await userEvent.type(input, 'vegan{Enter}');
      const chip = screen.getByRole('button', { name: /^vegan$/i });
      expect(chip).toHaveClass('selected');
    });
  });

  describe('Allergy chips', () => {
    it('renders standard allergy options', () => {
      render(<Profile />);
      expect(screen.getByRole('button', { name: /peanuts/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^dairy$/i })).toBeInTheDocument();
    });

    it('selects an allergy chip on click', async () => {
      render(<Profile />);
      const chip = screen.getByRole('button', { name: /peanuts/i });
      await userEvent.click(chip);
      expect(chip).toHaveClass('selected');
    });

    it('deselects an allergy chip on second click', async () => {
      render(<Profile />);
      const chip = screen.getByRole('button', { name: /peanuts/i });
      await userEvent.click(chip);
      await userEvent.click(chip);
      expect(chip).not.toHaveClass('selected');
    });

    it('adds a custom allergy via button', async () => {
      render(<Profile />);
      const input = screen.getByPlaceholderText(/add a custom allergy or intolerance/i);
      await userEvent.type(input, 'Tomato');
      const addButtons = screen.getAllByRole('button', { name: /^add$/i });
      await userEvent.click(addButtons[1]);
      expect(screen.getByRole('button', { name: /tomato/i })).toBeInTheDocument();
    });

    it('adds a custom allergy via Enter key', async () => {
      render(<Profile />);
      const input = screen.getByPlaceholderText(/add a custom allergy or intolerance/i);
      await userEvent.type(input, 'Avocado{Enter}');
      expect(screen.getByRole('button', { name: /avocado/i })).toBeInTheDocument();
    });
  });

  describe('Reset', () => {
    it('removes custom diets after reset', async () => {
      render(<Profile />);
      const input = screen.getByPlaceholderText(/add a custom dietary preference/i);
      await userEvent.type(input, 'Raw Vegan{Enter}');
      await userEvent.click(screen.getByRole('button', { name: /reset changes/i }));
      expect(screen.queryByRole('button', { name: /raw vegan/i })).not.toBeInTheDocument();
    });

    it('removes custom allergies after reset', async () => {
      render(<Profile />);
      const input = screen.getByPlaceholderText(/add a custom allergy or intolerance/i);
      await userEvent.type(input, 'Tomato{Enter}');
      await userEvent.click(screen.getByRole('button', { name: /reset changes/i }));
      expect(screen.queryByRole('button', { name: /tomato/i })).not.toBeInTheDocument();
    });
  });

  describe('Name fields', () => {
    it('renders firstName and lastName inputs', () => {
      render(<Profile />);
      expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/last name/i)).toBeInTheDocument();
    });

    it('populates firstName and lastName from /api/user on mount', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('fake.token.here');
      vi.mocked(fetch).mockImplementation((url) => {
        if (String(url).includes('/api/user')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ firstName: 'Alice', lastName: 'Smith' }),
          } as Response);
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
      });

      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
      });
    });

    it('does not call /api/user when no token is present', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      render(<Profile />);
      // fetchData is guarded by token check; no fetch call should target /api/user
      await waitFor(() => {
        const userCalls = vi
          .mocked(fetch)
          .mock.calls.filter(([url]) => String(url).includes('/api/user'));
        expect(userCalls).toHaveLength(0);
      });
    });

    it('calls PUT /api/user with firstName and lastName on Save', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('fake.token.here');
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as Response);

      render(<Profile />);

      await userEvent.clear(screen.getByPlaceholderText(/first name/i));
      await userEvent.type(screen.getByPlaceholderText(/first name/i), 'Bob');
      await userEvent.clear(screen.getByPlaceholderText(/last name/i));
      await userEvent.type(screen.getByPlaceholderText(/last name/i), 'Jones');

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/user',
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('"firstName":"Bob"'),
          })
        );
      });
    });
  });

  describe('Preferences loaded from API', () => {
    it('pre-selects allergy and diet chips based on numeric boolean (1) from API', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('fake.token.here');
      vi.mocked(fetch).mockImplementation((url) => {
        if (String(url).includes('/api/preferences')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                allergies: { peanuts: 1, milk: 0 },
                dietaryPreferences: { vegetarian: 1, vegan: false },
              }),
          } as Response);
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
      });

      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^peanuts$/i })).toHaveClass('selected');
      });
      expect(screen.getByRole('button', { name: /^vegetarian$/i })).toHaveClass('selected');
      expect(screen.getByRole('button', { name: /^dairy$/i })).not.toHaveClass('selected');
      expect(screen.getByRole('button', { name: /^vegan$/i })).not.toHaveClass('selected');
    });

    it('does not throw when the preferences API returns a non-ok response', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('fake.token.here');
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);

      render(<Profile />);
      // Component should still render without crashing
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /profile/i })).toBeInTheDocument();
      });
    });
  });

  describe('Save error handling', () => {
    it('shows "Failed to save preferences." when the preferences API returns non-ok', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('fake.token.here');
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);

      render(<Profile />);
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to save preferences/i)).toBeInTheDocument();
      });
    });
  });

  describe('Custom item – already-selected edge cases', () => {
    it('does not add a duplicate chip when the typed value matches a currently-selected standard option', async () => {
      render(<Profile />);
      // Select Vegetarian via chip
      const chip = screen.getByRole('button', { name: /^vegetarian$/i });
      await userEvent.click(chip);
      expect(chip).toHaveClass('selected');

      // Try to add "Vegetarian" again via text input
      const input = screen.getByPlaceholderText(/add a custom dietary preference/i);
      await userEvent.type(input, 'Vegetarian{Enter}');

      // Only one chip with this label should exist
      expect(screen.getAllByRole('button', { name: /^vegetarian$/i })).toHaveLength(1);
    });

    it('does not add a second chip for an allergy already selected via chip', async () => {
      render(<Profile />);
      const chip = screen.getByRole('button', { name: /^peanuts$/i });
      await userEvent.click(chip);

      const input = screen.getByPlaceholderText(/add a custom allergy or intolerance/i);
      await userEvent.type(input, 'Peanuts{Enter}');

      expect(screen.getAllByRole('button', { name: /^peanuts$/i })).toHaveLength(1);
    });
  });

  describe('Save', () => {
    it('calls fetch with PUT when token exists', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('fake.token.here');
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as Response);
      render(<Profile />);
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/preferences',
          expect.objectContaining({ method: 'PUT' })
        );
      });
    });

    it('shows an inline message on successful save', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('fake.token.here');
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as Response);
      render(<Profile />);
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
      await waitFor(() => {
        expect(screen.getByText('Preferences saved!')).toBeInTheDocument();
      });
      expect(window.alert).not.toHaveBeenCalled();
    });

    it('does not call fetch when no token', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      render(<Profile />);
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
      expect(fetch).not.toHaveBeenCalledWith(
        'http://localhost:3000/api/preferences',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });
});
