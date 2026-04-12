/*# The following file was generated with the assistance of Claude.
# Prompt: Separate SignIn into CSS/TSX, brown theme, shared layout for sign-up, and add test cases.
# I, Anais Perron reviewed, modified, and tested the code to ensure correctness.
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignIn from './SignIn';

describe('SignIn Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ── Rendering (sign-in view) ───────────────────────────────────────────────

  describe('Rendering – sign-in view', () => {
    it('renders the MealMajor heading', () => {
      render(<SignIn />);
      expect(screen.getByRole('heading', { name: /mealmajor/i })).toBeInTheDocument();
    });

    it('renders the email input', () => {
      render(<SignIn />);
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    });

    it('renders the password input', () => {
      render(<SignIn />);
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    });

    it('renders the panel title', () => {
      render(<SignIn />);
      expect(screen.getByRole('heading', { name: /sign in/i, level: 2 })).toBeInTheDocument();
    });

    it('renders the feature list', () => {
      render(<SignIn />);
      expect(screen.getByText(/create recipes/i)).toBeInTheDocument();
      expect(screen.getByText(/generate with ai/i)).toBeInTheDocument();
      expect(screen.getByText(/organize your meals/i)).toBeInTheDocument();
      expect(screen.getByText(/be the healthiest/i)).toBeInTheDocument();
    });

    it('renders the "Create one now" link', () => {
      render(<SignIn />);
      expect(screen.getByRole('link', { name: /create one now/i })).toBeInTheDocument();
    });
  });

  // ── Rendering (sign-up view) ───────────────────────────────────────────────

  describe('Rendering – sign-up view', () => {
    it('renders sign-up form when initialView="signup"', () => {
      render(<SignIn initialView="signup" />);
      expect(screen.getByPlaceholderText(/create a strong password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/re-enter your password/i)).toBeInTheDocument();
    });

    it('shows "Register" as the panel title in signup view', () => {
      render(<SignIn initialView="signup" />);
      expect(screen.getByRole('heading', { name: /register/i, level: 2 })).toBeInTheDocument();
    });

    it('renders "Create Account" button in signup view', () => {
      render(<SignIn initialView="signup" />);
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('renders "Sign in" link in signup view', () => {
      render(<SignIn initialView="signup" />);
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  // ── View switching ─────────────────────────────────────────────────────────

  describe('View switching', () => {
    it('switches to sign-up view when "Create one now" is clicked', async () => {
      render(<SignIn />);
      await userEvent.click(screen.getByRole('link', { name: /create one now/i }));
      expect(screen.getByPlaceholderText(/create a strong password/i)).toBeInTheDocument();
    });

    it('switches back to sign-in view when "Sign in" is clicked', async () => {
      render(<SignIn initialView="signup" />);
      await userEvent.click(screen.getByRole('link', { name: /sign in/i }));
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('keeps the MealMajor heading visible after switching to sign-up', async () => {
      render(<SignIn />);
      await userEvent.click(screen.getByRole('link', { name: /create one now/i }));
      expect(screen.getByRole('heading', { name: /mealmajor/i })).toBeInTheDocument();
    });
  });

  // ── Sign-in buttons ────────────────────────────────────────────────────────

  describe('Sign-in buttons', () => {
    it('renders sign in button', () => {
      render(<SignIn />);
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('sign in button is enabled by default', () => {
      render(<SignIn />);
      expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled();
    });

    it('disables sign in button during loading', async () => {
      const mockFetch = vi.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({ token: 'test-token', user: { email: 'test@test.com' } }),
                } as Response),
              100
            )
          )
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      render(<SignIn />);

      await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'test@test.com');
      await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
      });
    });

    it('toggle password visibility button works', async () => {
      render(<SignIn />);

      const passwordInput = screen.getByPlaceholderText(/enter your password/i) as HTMLInputElement;
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

      expect(passwordInput.type).toBe('password');
      await userEvent.click(toggleButton);
      expect(passwordInput.type).toBe('text');
      await userEvent.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });

    it('remember me checkbox toggles correctly', async () => {
      render(<SignIn />);

      const rememberCheckbox = screen.getByRole('checkbox', {
        name: /remember me/i,
      }) as HTMLInputElement;

      expect(rememberCheckbox.checked).toBe(false);
      await userEvent.click(rememberCheckbox);
      expect(rememberCheckbox.checked).toBe(true);
      await userEvent.click(rememberCheckbox);
      expect(rememberCheckbox.checked).toBe(false);
    });
  });

  // ── Sign-in form submission ────────────────────────────────────────────────

  describe('Sign-in form submission', () => {
    it('calls the sign-in API with the entered credentials', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'test-token', user: { email: 'test@test.com' } }),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      render(<SignIn />);

      await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'test@test.com');
      await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/auth/signin',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
          })
        );
      });
    });

    it('calls onSuccess after successful sign-in', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'test-token', user: { email: 'test@test.com' } }),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      const onSuccess = vi.fn();
      render(<SignIn onSuccess={onSuccess} />);

      await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'test@test.com');
      await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    });

    it('stores token and email in localStorage on success', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'abc123', user: { email: 'test@test.com' } }),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      render(<SignIn />);

      await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'test@test.com');
      await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('token', 'abc123');
        expect(localStorage.setItem).toHaveBeenCalledWith('userEmail', 'test@test.com');
      });
    });

    it('saves rememberMe to localStorage when checked', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'abc123', user: { email: 'test@test.com' } }),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      render(<SignIn />);

      await userEvent.click(screen.getByRole('checkbox', { name: /remember me/i }));
      await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'test@test.com');
      await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('rememberMe', 'true');
      });
    });

    it('removes rememberMe from localStorage when unchecked', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'abc123', user: { email: 'test@test.com' } }),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      render(<SignIn />);

      await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'test@test.com');
      await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(localStorage.removeItem).toHaveBeenCalledWith('rememberMe');
      });
    });

    it('displays error message when sign-in fails', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Invalid credentials' }),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      render(<SignIn />);

      await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'wrong@test.com');
      await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'wrongpassword');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('displays fallback error when server returns no message', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({}),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      render(<SignIn />);

      await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'a@b.com');
      await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'pass');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });
    });

    it('displays error when network request throws', async () => {
      const mockFetch = vi.fn(() => Promise.reject(new Error('Network error')));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      render(<SignIn />);

      await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'a@b.com');
      await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'pass');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('re-enables sign in button after failed request', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Bad credentials' }),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      render(<SignIn />);

      await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'a@b.com');
      await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'pass');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled();
      });
    });
  });

  // ── Sign-up form submission ────────────────────────────────────────────────

  describe('Sign-up form submission', () => {
    it('shows validation errors when form is submitted empty', async () => {
      render(<SignIn initialView="signup" />);
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    it('shows error when passwords do not match', async () => {
      render(<SignIn initialView="signup" />);
      await userEvent.type(screen.getByPlaceholderText(/john\.doe/i), 'a@b.com');
      await userEvent.type(screen.getByPlaceholderText(/create a strong password/i), 'abc123');
      await userEvent.type(screen.getByPlaceholderText(/re-enter your password/i), 'different');
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('calls sign-up API with correct credentials', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'tok', user: { email: 'a@b.com' } }),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      render(<SignIn initialView="signup" />);

      await userEvent.type(screen.getByPlaceholderText(/john\.doe/i), 'a@b.com');
      await userEvent.type(screen.getByPlaceholderText(/create a strong password/i), 'abc123');
      await userEvent.type(screen.getByPlaceholderText(/re-enter your password/i), 'abc123');
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/auth/signup',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ email: 'a@b.com', password: 'abc123' }),
          })
        );
      });
    });

    it('calls onSuccess after successful sign-up', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'tok', user: { email: 'a@b.com' } }),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      const onSuccess = vi.fn();
      render(<SignIn initialView="signup" onSuccess={onSuccess} />);

      await userEvent.type(screen.getByPlaceholderText(/john\.doe/i), 'a@b.com');
      await userEvent.type(screen.getByPlaceholderText(/create a strong password/i), 'abc123');
      await userEvent.type(screen.getByPlaceholderText(/re-enter your password/i), 'abc123');
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    });

    it('displays error when sign-up API fails', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Email already in use' }),
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any;

      render(<SignIn initialView="signup" />);

      await userEvent.type(screen.getByPlaceholderText(/john\.doe/i), 'a@b.com');
      await userEvent.type(screen.getByPlaceholderText(/create a strong password/i), 'abc123');
      await userEvent.type(screen.getByPlaceholderText(/re-enter your password/i), 'abc123');
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/email already in use/i)).toBeInTheDocument();
      });
    });
  });

  // ── Auto-redirect ──────────────────────────────────────────────────────────

  describe('Auto-redirect', () => {
    it('calls onSuccess when token + rememberMe are in localStorage', async () => {
      vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
        if (key === 'token') return 'existing-token';
        if (key === 'rememberMe') return 'true';
        return null;
      });

      const onSuccess = vi.fn();
      render(<SignIn onSuccess={onSuccess} />);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('does not auto-redirect when token exists but rememberMe is not set', async () => {
      vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
        if (key === 'token') return 'existing-token';
        return null;
      });

      const onSuccess = vi.fn();
      render(<SignIn onSuccess={onSuccess} />);

      await new Promise((r) => setTimeout(r, 50));
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('does not auto-redirect when rememberMe is set but token is missing', async () => {
      vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
        if (key === 'rememberMe') return 'true';
        return null;
      });

      const onSuccess = vi.fn();
      render(<SignIn onSuccess={onSuccess} />);

      await new Promise((r) => setTimeout(r, 50));
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});
