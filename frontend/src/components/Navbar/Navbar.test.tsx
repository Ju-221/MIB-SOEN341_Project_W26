/*# The following file was generated with the assistance of Claude.
#Prompt:  Create a test suite for the Navbar component using Vitest and React Testing Library. Cover rendering of brand, nav links
based on login state, username display, and profile dropdown behavior.
# I, Anais Perron reviewed, modified, and tested the code to ensure correctness.
*/
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Navbar from './Navbar';

const baseProps = {
  currentPage: 'home',
  isLoggedIn: false,
  userEmail: null,
};

const loggedInProps = {
  currentPage: 'home',
  isLoggedIn: true,
  userEmail: 'anais@example.com',
};

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Brand ──────────────────────────────────────────────────────────────────

  describe('Brand', () => {
    it('renders MealMajor brand linking to #home', () => {
      render(<Navbar {...baseProps} />);
      const brand = screen.getByRole('link', { name: /mealmajor/i });
      expect(brand).toBeInTheDocument();
      expect(brand).toHaveAttribute('href', '#home');
    });
  });

  // ── Nav links ──────────────────────────────────────────────────────────────

  describe('Nav links', () => {
    it('hides Calendar, Discover and AI Chef when logged out', () => {
      render(<Navbar {...baseProps} />);
      expect(screen.queryByRole('link', { name: /calendar/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /meal tournament/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /ai chef/i })).not.toBeInTheDocument();
    });

    it('shows all nav links when logged in', () => {
      render(<Navbar {...loggedInProps} />);
      expect(screen.getByRole('link', { name: /recipes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /calendar/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /meal tournament/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /ai chef/i })).toBeInTheDocument();
    });

    it('marks the active page link', () => {
      render(<Navbar {...loggedInProps} currentPage="recipes" />);
      const recipesLink = screen.getAllByRole('link', { name: /recipes/i })[0];
      expect(recipesLink).toHaveClass('active');
    });
  });

  // ── Username display ───────────────────────────────────────────────────────

  describe('Username display', () => {
    it('shows the part before @ when logged in', () => {
      render(<Navbar {...loggedInProps} />);
      expect(screen.getByText('anais')).toBeInTheDocument();
    });

    it('does not show a username when logged out', () => {
      render(<Navbar {...baseProps} />);
      expect(screen.queryByText('anais')).not.toBeInTheDocument();
    });
  });

  // ── Profile dropdown ───────────────────────────────────────────────────────

  describe('Profile dropdown', () => {
    it('profile icon button is always visible', () => {
      render(<Navbar {...baseProps} />);
      expect(screen.getByRole('button', { name: /account menu/i })).toBeInTheDocument();
    });

    it('dropdown is closed by default', () => {
      render(<Navbar {...baseProps} />);
      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    });

    it('opens dropdown on profile icon click', async () => {
      render(<Navbar {...baseProps} />);
      await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows Sign In when logged out', async () => {
      render(<Navbar {...baseProps} />);
      await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows Profile link and Sign Out when logged in', async () => {
      render(<Navbar {...loggedInProps} />);
      await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
      expect(screen.getByRole('link', { name: /^profile$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    it('does not show Sign Out when logged out', async () => {
      render(<Navbar {...baseProps} />);
      await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
      expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
    });

    it('shows the email in the dropdown header when logged in', async () => {
      render(<Navbar {...loggedInProps} />);
      await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
      expect(screen.getByText('anais@example.com')).toBeInTheDocument();
    });

    it('closes the dropdown when clicking outside', async () => {
      render(
        <div>
          <Navbar {...baseProps} />
          <div data-testid="outside">outside</div>
        </div>
      );
      await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

      await userEvent.click(screen.getByTestId('outside'));
      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    });
  });
});
