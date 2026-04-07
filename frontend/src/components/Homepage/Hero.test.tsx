import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Hero from './Hero';

vi.mock('gsap', () => import('../../test/gsapMock'));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { refresh: vi.fn() } }));
vi.mock('@gsap/react', () => ({ useGSAP: (fn: () => void) => fn() }));
vi.mock('gsap/SplitText',     () => ({ SplitText: class { chars = []; } }));
vi.mock('gsap/InertiaPlugin', () => ({ InertiaPlugin: {} }));

vi.mock('../../assets/uploads/round-plate.png', () => ({ default: 'round-plate.png' }));
vi.mock('../../assets/uploads/chopsticks.png',  () => ({ default: 'chopsticks.png'  }));
vi.mock('../../assets/uploads/olives.png',      () => ({ default: 'olives.png'      }));
vi.mock('../../assets/uploads/mint.png',        () => ({ default: 'mint.png'        }));
vi.mock('../../assets/uploads/tomato.png',      () => ({ default: 'tomato.png'      }));

beforeEach(() => {
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
});

describe('Hero — not logged in', () => {
  it('renders a "Register now!" link pointing to /login', () => {
    render(<Hero isLoggedIn={false} />);
    const link = screen.getByRole('link', { name: /register now/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });

  it('does NOT show "Welcome Back"', () => {
    render(<Hero isLoggedIn={false} />);
    expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();
  });

  it('renders the "View recipes" button', () => {
    render(<Hero isLoggedIn={false} />);
    expect(screen.getByRole('button', { name: /view recipes/i })).toBeInTheDocument();
  });
});

describe('Hero — logged in', () => {
  it('renders the "Welcome Back" greeting', () => {
    render(<Hero isLoggedIn={true} />);
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('does NOT show the "Register now!" link', () => {
    render(<Hero isLoggedIn={true} />);
    expect(screen.queryByRole('link', { name: /register now/i })).not.toBeInTheDocument();
  });

  it('renders the "View recipes" button', () => {
    render(<Hero isLoggedIn={true} />);
    expect(screen.getByRole('button', { name: /view recipes/i })).toBeInTheDocument();
  });
});

describe('Hero — "View recipes" button', () => {
  it('calls window.scrollTo with the spacer bottom offset when clicked', () => {
    const spacer = document.createElement('div');
    spacer.className = 'homepage-spacer';
    Object.defineProperty(spacer, 'offsetTop',    { value: 100 });
    Object.defineProperty(spacer, 'offsetHeight', { value: 500 });
    document.body.appendChild(spacer);

    render(<Hero isLoggedIn={false} />);
    fireEvent.click(screen.getByRole('button', { name: /view recipes/i }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 600, behavior: 'smooth' });

    document.body.removeChild(spacer);
  });

  it('does nothing if the spacer is not in the DOM', () => {
    render(<Hero isLoggedIn={false} />);
    // No spacer in DOM — should not throw
    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: /view recipes/i }))
    ).not.toThrow();
  });
});
