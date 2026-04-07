import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import CoverFlow from './CoverFlow';

vi.mock('gsap', () => import('../../test/gsapMock'));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { refresh: vi.fn() } }));

const makeRecipe = (id: number) => ({
  id,
  title: `Recipe ${id}`,
  description: `Description ${id}`,
  prepTime: 10,
  cookTime: 20,
  estimatedCost: 5,
  heroImage: null,
  categories: ['Italian'],
});

// Helper: get the active-title element in the details panel (not the card overlay)
const activeTitle = () =>
  document.querySelector('.coverflow-active-title') as HTMLElement;

describe('CoverFlow — logged-out gate', () => {
  it('shows the gate heading', () => {
    render(<CoverFlow recipes={[]} isLoggedIn={false} />);
    expect(screen.getByText(/your personal recipe collection awaits/i)).toBeInTheDocument();
  });

  it('shows the subtitle', () => {
    render(<CoverFlow recipes={[]} isLoggedIn={false} />);
    expect(screen.getByText(/sign in to browse/i)).toBeInTheDocument();
  });

  it('renders a "Sign In" link pointing to /login', () => {
    render(<CoverFlow recipes={[]} isLoggedIn={false} />);
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('does NOT render any recipe cards', () => {
    render(<CoverFlow recipes={[makeRecipe(1), makeRecipe(2)]} isLoggedIn={false} />);
    expect(document.querySelector('.coverflow-card')).not.toBeInTheDocument();
  });
});

describe('CoverFlow — logged-in, no recipes', () => {
  it('shows the empty state message', () => {
    render(<CoverFlow recipes={[]} isLoggedIn={true} />);
    expect(screen.getByText(/no result/i)).toBeInTheDocument();
  });
});

describe('CoverFlow — logged-in with recipes', () => {
  const recipes = [makeRecipe(1), makeRecipe(2), makeRecipe(3)];

  it('renders the section heading', () => {
    render(<CoverFlow recipes={recipes} isLoggedIn={true} />);
    expect(screen.getByText(/scroll through your recipes/i)).toBeInTheDocument();
  });

  it('shows the first recipe title in the details panel', () => {
    render(<CoverFlow recipes={recipes} isLoggedIn={true} />);
    expect(activeTitle()).toHaveTextContent('Recipe 1');
  });

  it('previous button is disabled on the first recipe', () => {
    render(<CoverFlow recipes={recipes} isLoggedIn={true} />);
    expect(screen.getByRole('button', { name: /previous recipe/i })).toBeDisabled();
  });

  it('next button is disabled on the last recipe after navigating there', () => {
    render(<CoverFlow recipes={recipes} isLoggedIn={true} />);
    const next = screen.getByRole('button', { name: /next recipe/i });
    fireEvent.click(next);
    fireEvent.click(next);
    expect(next).toBeDisabled();
  });

  it('clicking next advances the active recipe in the details panel', () => {
    render(<CoverFlow recipes={recipes} isLoggedIn={true} />);
    fireEvent.click(screen.getByRole('button', { name: /next recipe/i }));
    expect(activeTitle()).toHaveTextContent('Recipe 2');
  });

  it('keyboard ArrowRight advances the active recipe', () => {
    render(<CoverFlow recipes={recipes} isLoggedIn={true} />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(activeTitle()).toHaveTextContent('Recipe 2');
  });

  it('keyboard ArrowLeft goes back', () => {
    render(<CoverFlow recipes={recipes} isLoggedIn={true} />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(activeTitle()).toHaveTextContent('Recipe 1');
  });

  it('keyboard ArrowLeft does not go below index 0', () => {
    render(<CoverFlow recipes={recipes} isLoggedIn={true} />);
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(activeTitle()).toHaveTextContent('Recipe 1');
  });

  it('renders one dot per recipe', () => {
    render(<CoverFlow recipes={recipes} isLoggedIn={true} />);
    expect(screen.getAllByRole('button', { name: /go to recipe/i })).toHaveLength(recipes.length);
  });

  it('clicking a dot navigates to that recipe', () => {
    render(<CoverFlow recipes={recipes} isLoggedIn={true} />);
    fireEvent.click(screen.getByRole('button', { name: /go to recipe 3/i }));
    expect(activeTitle()).toHaveTextContent('Recipe 3');
  });

  it('shows the description of the active recipe', () => {
    render(<CoverFlow recipes={recipes} isLoggedIn={true} />);
    expect(screen.getByText('Description 1')).toBeInTheDocument();
  });

  it('shows prep+cook time in each card', () => {
    render(<CoverFlow recipes={recipes} isLoggedIn={true} />);
    // 10 + 20 = 30 min — appears in every card's meta
    const metas = screen.getAllByText(/30.*min/i);
    expect(metas.length).toBeGreaterThanOrEqual(1);
  });
});
