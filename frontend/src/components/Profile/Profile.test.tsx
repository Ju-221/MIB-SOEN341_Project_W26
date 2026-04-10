import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Profile from './Profile';

vi.mock('../Recipe-Manager/CreateRecipe', () => ({
  default: () => <div data-testid="recipe-manager">Recipe Manager</div>,
}));

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

    it('renders Manage Recipes button', () => {
      render(<Profile />);
      expect(screen.getByRole('button', { name: /manage recipes/i })).toBeInTheDocument();
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

  describe('Recipe Manager modal', () => {
    it('opens recipe manager when button clicked', async () => {
      render(<Profile />);
      await userEvent.click(screen.getByRole('button', { name: /manage recipes/i }));
      expect(screen.getByTestId('recipe-manager')).toBeInTheDocument();
    });

    it('closes modal when overlay is clicked', async () => {
      render(<Profile />);
      await userEvent.click(screen.getByRole('button', { name: /manage recipes/i }));
      const overlay = document.querySelector('.modal-overlay-profile') as HTMLElement;
      await userEvent.click(overlay);
      expect(screen.queryByTestId('recipe-manager')).not.toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
      render(<Profile />);
      await userEvent.click(screen.getByRole('button', { name: /manage recipes/i }));
      await userEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(screen.queryByTestId('recipe-manager')).not.toBeInTheDocument();
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

    it('shows alert on successful save', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('fake.token.here');
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as Response);
      render(<Profile />);
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Preferences saved!');
      });
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
