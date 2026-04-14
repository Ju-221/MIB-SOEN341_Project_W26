import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ── Mock all child components ─────────────────────────────────────────────────
vi.mock('./hooks/useHashNavigation', () => ({
  useHashNavigation: vi.fn((defaultPage: string) => defaultPage),
}));

vi.mock('./components/Auth', () => ({
  SignIn: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="signin">
      <button data-testid="signin-btn" onClick={onSuccess}>
        Sign In
      </button>
    </div>
  ),
  SignUp: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="signup">
      <button data-testid="signup-btn" onClick={onSuccess}>
        Sign Up
      </button>
    </div>
  ),
}));

vi.mock('./components/Profile/Profile', () => ({
  default: () => <div data-testid="profile">Profile</div>,
}));

vi.mock('./components/Homepage/Homepage', () => ({
  default: ({ isLoggedIn, userEmail }: { isLoggedIn: boolean; userEmail: string | null }) => (
    <div data-testid="homepage">
      Homepage {isLoggedIn ? 'logged-in' : 'logged-out'} {userEmail ?? ''}
    </div>
  ),
}));

vi.mock('./components/Navbar/Navbar', () => ({
  default: ({
    currentPage,
    isLoggedIn,
    onLoginClick,
    onLogout,
  }: {
    currentPage: string;
    isLoggedIn: boolean;
    onLoginClick: () => void;
    onLogout: () => void;
  }) => (
    <nav data-testid="navbar">
      <span data-testid="nav-page">{currentPage}</span>
      <span data-testid="nav-logged">{isLoggedIn ? 'yes' : 'no'}</span>
      <button data-testid="nav-login" onClick={onLoginClick}>
        Login
      </button>
      <button data-testid="nav-logout" onClick={onLogout}>
        Logout
      </button>
    </nav>
  ),
}));

vi.mock('./components/Unique/Unique', () => ({
  default: () => <div data-testid="unique">Unique</div>,
}));

vi.mock('./components/AIChat/AIChat', () => ({
  default: () => <div data-testid="aichat">AIChat</div>,
}));

vi.mock('./components/LoadingScreen/LoadingScreen', () => ({
  default: ({ onReady }: { onReady: () => void }) => (
    <div data-testid="loading-screen">
      <button data-testid="loading-ready" onClick={onReady}>
        Ready
      </button>
    </div>
  ),
}));

vi.mock('./components/Calendar/Calendar', () => ({
  default: () => <div data-testid="calendar">Calendar</div>,
}));

vi.mock('./components/Recipes/Recipes', () => ({
  default: () => <div data-testid="recipes">Recipes</div>,
}));

vi.mock('./App.css', () => ({}));

import App from './App';
import { useHashNavigation } from './hooks/useHashNavigation';

const FAKE_TOKEN = 'header.' + btoa(JSON.stringify({ id: 1, email: 'test@example.com' })) + '.sig';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('App', () => {
  it('renders signin page when no token is present', () => {
    vi.mocked(useHashNavigation).mockReturnValue('signin');
    render(<App />);

    expect(screen.getByTestId('signin')).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('nav-logged')).toHaveTextContent('no');
  });

  it('renders homepage when token is present', () => {
    localStorage.setItem('token', FAKE_TOKEN);
    vi.mocked(useHashNavigation).mockReturnValue('home');
    render(<App />);

    expect(screen.getByTestId('homepage')).toBeInTheDocument();
    expect(screen.getByTestId('nav-logged')).toHaveTextContent('yes');
  });

  it('renders profile page', () => {
    localStorage.setItem('token', FAKE_TOKEN);
    vi.mocked(useHashNavigation).mockReturnValue('profile');
    render(<App />);

    expect(screen.getByTestId('profile')).toBeInTheDocument();
  });

  it('renders calendar page', () => {
    localStorage.setItem('token', FAKE_TOKEN);
    vi.mocked(useHashNavigation).mockReturnValue('calendar');
    render(<App />);

    expect(screen.getByTestId('calendar')).toBeInTheDocument();
  });

  it('renders recipes page', () => {
    vi.mocked(useHashNavigation).mockReturnValue('recipes');
    render(<App />);

    expect(screen.getByTestId('recipes')).toBeInTheDocument();
  });

  it('renders unique page', () => {
    localStorage.setItem('token', FAKE_TOKEN);
    vi.mocked(useHashNavigation).mockReturnValue('unique');
    render(<App />);

    expect(screen.getByTestId('unique')).toBeInTheDocument();
  });

  it('renders aichat page', () => {
    vi.mocked(useHashNavigation).mockReturnValue('aichat');
    render(<App />);

    expect(screen.getByTestId('aichat')).toBeInTheDocument();
  });

  it('renders signup page', () => {
    vi.mocked(useHashNavigation).mockReturnValue('signup');
    render(<App />);

    expect(screen.getByTestId('signup')).toBeInTheDocument();
  });

  it('shows loading screen after auth success, then main app on ready', async () => {
    const user = userEvent.setup();
    vi.mocked(useHashNavigation).mockReturnValue('signin');
    render(<App />);

    // Set token before clicking sign in
    localStorage.setItem('token', FAKE_TOKEN);
    await user.click(screen.getByTestId('signin-btn'));

    // Loading screen should appear
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();

    // Click ready to dismiss loading
    await user.click(screen.getByTestId('loading-ready'));

    // Loading screen should be gone, navbar visible
    expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  it('logout clears token and resets state', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', FAKE_TOKEN);
    localStorage.setItem('rememberMe', 'true');
    sessionStorage.setItem('aichat_messages', '[]');
    vi.mocked(useHashNavigation).mockReturnValue('home');
    render(<App />);

    expect(screen.getByTestId('nav-logged')).toHaveTextContent('yes');

    await user.click(screen.getByTestId('nav-logout'));

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('rememberMe')).toBeNull();
    expect(sessionStorage.getItem('aichat_messages')).toBeNull();
    expect(screen.getByTestId('nav-logged')).toHaveTextContent('no');
  });

  it('login click navigates to signin', async () => {
    const user = userEvent.setup();
    vi.mocked(useHashNavigation).mockReturnValue('home');
    render(<App />);

    await user.click(screen.getByTestId('nav-login'));

    expect(window.location.hash).toBe('#signin');
  });

  it('extracts email from token', () => {
    localStorage.setItem('token', FAKE_TOKEN);
    vi.mocked(useHashNavigation).mockReturnValue('home');
    render(<App />);

    expect(screen.getByTestId('homepage')).toHaveTextContent('test@example.com');
  });

  it('falls back to localStorage email when token has no email', () => {
    const tokenNoEmail = 'header.' + btoa(JSON.stringify({ id: 1 })) + '.sig';
    localStorage.setItem('token', tokenNoEmail);
    localStorage.setItem('userEmail', 'fallback@example.com');
    vi.mocked(useHashNavigation).mockReturnValue('home');
    render(<App />);

    expect(screen.getByTestId('homepage')).toHaveTextContent('fallback@example.com');
  });

  it('falls back to localStorage email when token is malformed', () => {
    localStorage.setItem('token', 'bad-token');
    localStorage.setItem('userEmail', 'safe@example.com');
    vi.mocked(useHashNavigation).mockReturnValue('home');
    render(<App />);

    expect(screen.getByTestId('homepage')).toHaveTextContent('safe@example.com');
  });
});
