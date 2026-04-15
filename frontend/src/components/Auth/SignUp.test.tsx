import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignUp from './SignUp';

describe('SignUp Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ── Rendering ───────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders the MealMajor heading', () => {
      render(<SignUp />);
      expect(screen.getByRole('heading', { name: /mealmajor/i })).toBeInTheDocument();
    });

    it('renders email, password, and confirm-password inputs', () => {
      render(<SignUp />);
      expect(screen.getByPlaceholderText(/john\.doe@example\.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/create a strong password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/re-enter your password/i)).toBeInTheDocument();
    });

    it('renders a Create Account button', () => {
      render(<SignUp />);
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('Create Account button is enabled by default', () => {
      render(<SignUp />);
      expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled();
    });
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  describe('Validation', () => {
    it('shows required-email error when submitting without email', async () => {
      render(<SignUp />);
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));
      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    });

    it('shows invalid-email error for a malformed address', async () => {
      const { container } = render(<SignUp />);
      // Type value directly into the input to bypass jsdom's native type="email" constraint
      const emailInput = screen.getByPlaceholderText(/john\.doe@example\.com/i);
      fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
      fireEvent.submit(container.querySelector('form')!);
      expect(await screen.findByText('Please enter a valid email')).toBeInTheDocument();
    });

    it('shows password-required error when submitting without password', async () => {
      render(<SignUp />);
      await userEvent.type(
        screen.getByPlaceholderText(/john\.doe@example\.com/i),
        'user@example.com'
      );
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));
      expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    });

    it('shows minimum-length error for a short password', async () => {
      render(<SignUp />);
      await userEvent.type(
        screen.getByPlaceholderText(/john\.doe@example\.com/i),
        'user@example.com'
      );
      await userEvent.type(screen.getByPlaceholderText(/create a strong password/i), 'abc');
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));
      // Use exact match to avoid matching the "Must be at least 6 characters" help text
      expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
    });

    it('shows confirm-password error when confirm field is empty', async () => {
      render(<SignUp />);
      await userEvent.type(
        screen.getByPlaceholderText(/john\.doe@example\.com/i),
        'user@example.com'
      );
      await userEvent.type(screen.getByPlaceholderText(/create a strong password/i), 'Password1!');
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));
      expect(await screen.findByText(/please confirm your password/i)).toBeInTheDocument();
    });

    it('shows mismatch error when passwords differ', async () => {
      render(<SignUp />);
      await userEvent.type(
        screen.getByPlaceholderText(/john\.doe@example\.com/i),
        'user@example.com'
      );
      await userEvent.type(screen.getByPlaceholderText(/create a strong password/i), 'Password1!');
      await userEvent.type(screen.getByPlaceholderText(/re-enter your password/i), 'Different1!');
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));
      expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  // ── Password visibility toggles ─────────────────────────────────────────────

  describe('Password visibility toggles', () => {
    it('password field starts hidden and toggles to text', async () => {
      render(<SignUp />);
      const passwordInput = screen.getByPlaceholderText(
        /create a strong password/i
      ) as HTMLInputElement;
      const [togglePassword] = screen.getAllByRole('button', {
        name: /toggle password visibility/i,
      });

      expect(passwordInput.type).toBe('password');
      await userEvent.click(togglePassword);
      expect(passwordInput.type).toBe('text');
      await userEvent.click(togglePassword);
      expect(passwordInput.type).toBe('password');
    });

    it('confirm-password field starts hidden and toggles to text', async () => {
      render(<SignUp />);
      const confirmInput = screen.getByPlaceholderText(
        /re-enter your password/i
      ) as HTMLInputElement;
      const toggleConfirm = screen.getByRole('button', {
        name: /toggle confirm password visibility/i,
      });

      expect(confirmInput.type).toBe('password');
      await userEvent.click(toggleConfirm);
      expect(confirmInput.type).toBe('text');
      await userEvent.click(toggleConfirm);
      expect(confirmInput.type).toBe('password');
    });
  });

  // ── Successful signup ────────────────────────────────────────────────────────

  describe('Successful signup', () => {
    const fillValidForm = async () => {
      await userEvent.type(
        screen.getByPlaceholderText(/john\.doe@example\.com/i),
        'new@example.com'
      );
      await userEvent.type(screen.getByPlaceholderText(/create a strong password/i), 'Password1!');
      await userEvent.type(screen.getByPlaceholderText(/re-enter your password/i), 'Password1!');
    };

    it('calls POST /api/auth/signup with correct payload', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              token: 'test-token',
              user: { email: 'new@example.com' },
            }),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      render(<SignUp />);
      await fillValidForm();
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/auth/signup',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'new@example.com', password: 'Password1!' }),
          })
        );
      });
    });

    it('stores token and email in localStorage after successful signup', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              token: 'my-jwt',
              user: { email: 'new@example.com' },
            }),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      render(<SignUp />);
      await fillValidForm();
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('token', 'my-jwt');
        expect(localStorage.setItem).toHaveBeenCalledWith('userEmail', 'new@example.com');
      });
    });

    it('calls onSuccess callback after successful signup', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'tok', user: { email: 'new@example.com' } }),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      const onSuccess = vi.fn();
      render(<SignUp onSuccess={onSuccess} />);
      await fillValidForm();
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    });
  });

  // ── Failed signup ────────────────────────────────────────────────────────────

  describe('Failed signup', () => {
    it('shows server error message when API returns an error', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Email already exists' }),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      render(<SignUp />);
      await userEvent.type(
        screen.getByPlaceholderText(/john\.doe@example\.com/i),
        'dup@example.com'
      );
      await userEvent.type(screen.getByPlaceholderText(/create a strong password/i), 'Password1!');
      await userEvent.type(screen.getByPlaceholderText(/re-enter your password/i), 'Password1!');
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => expect(screen.getByText(/email already exists/i)).toBeInTheDocument());
    });

    it('disables the button while the request is in-flight', async () => {
      const mockFetch = vi.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ token: 'tok', user: { email: 'new@example.com' } }),
                } as Response),
              100
            )
          )
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      render(<SignUp />);
      await userEvent.type(
        screen.getByPlaceholderText(/john\.doe@example\.com/i),
        'new@example.com'
      );
      await userEvent.type(screen.getByPlaceholderText(/create a strong password/i), 'Password1!');
      await userEvent.type(screen.getByPlaceholderText(/re-enter your password/i), 'Password1!');

      const btn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(btn);

      await waitFor(() => expect(btn).toBeDisabled());
    });
  });

  // ── Switch to sign-in ────────────────────────────────────────────────────────

  describe('Navigation', () => {
    it('calls onSwitchToSignIn when the sign-in link is clicked', async () => {
      const onSwitch = vi.fn();
      render(<SignUp onSwitchToSignIn={onSwitch} />);
      const link = screen.getByText(/sign in/i);
      await userEvent.click(link);
      expect(onSwitch).toHaveBeenCalled();
    });
  });
});
