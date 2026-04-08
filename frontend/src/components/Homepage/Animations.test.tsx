import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RotatingImageWithCallouts } from './Animations';

vi.mock('gsap', () => import('../../test/gsapMock'));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { refresh: vi.fn() } }));
vi.mock('@gsap/react', () => ({ useGSAP: (fn: () => void) => fn() }));
vi.mock('gsap/SplitText',     () => ({ SplitText: class { chars = []; } }));
vi.mock('gsap/InertiaPlugin', () => ({ InertiaPlugin: {} }));

vi.mock('../../assets/uploads/round-plate.png', () => ({ default: 'round-plate.png' }));
vi.mock('../../assets/uploads/chopsticks.png',  () => ({ default: 'chopsticks.png' }));

describe('RotatingImageWithCallouts', () => {
  it('renders the default callout labels', () => {
    render(<RotatingImageWithCallouts />);
    // Default callouts include at least these two
    expect(screen.getByText('Add tags')).toBeInTheDocument();
    expect(screen.getByText('Be organized')).toBeInTheDocument();
  });

  it('renders custom callout labels when provided', () => {
    render(
      <RotatingImageWithCallouts
        callouts={[
          { id: 'a', angle: 45,  label: 'Custom A' },
          { id: 'b', angle: 225, label: 'Custom B' },
        ]}
      />
    );
    expect(screen.getByText('Custom A')).toBeInTheDocument();
    expect(screen.getByText('Custom B')).toBeInTheDocument();
  });

  it('does not render labels that are not in the callouts prop', () => {
    render(
      <RotatingImageWithCallouts
        callouts={[{ id: '1', angle: 135, label: 'Add tags' }]}
      />
    );
    expect(screen.queryByText('Be organized')).not.toBeInTheDocument();
  });

  it('renders the central rotating plate image', () => {
    render(<RotatingImageWithCallouts />);
    expect(screen.getByAltText(/rotating center/i)).toBeInTheDocument();
  });

  it('renders the chopsticks image', () => {
    render(<RotatingImageWithCallouts />);
    expect(screen.getByAltText(/chopsticks/i)).toBeInTheDocument();
  });

  it('renders exactly as many SVG paths as callouts', () => {
    const { container } = render(
      <RotatingImageWithCallouts
        callouts={[
          { id: '1', angle: 45,  label: 'One' },
          { id: '2', angle: 135, label: 'Two' },
          { id: '3', angle: 225, label: 'Three' },
        ]}
      />
    );
    expect(container.querySelectorAll('path')).toHaveLength(3);
  });

  it('renders exactly as many tip circles as callouts', () => {
    const { container } = render(
      <RotatingImageWithCallouts
        callouts={[
          { id: '1', angle: 45,  label: 'One' },
          { id: '2', angle: 135, label: 'Two' },
        ]}
      />
    );
    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });
});
