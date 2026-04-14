import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import LoadingScreen from './LoadingScreen';

describe('LoadingScreen', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the brand name and spinner text', () => {
    const onReady = vi.fn();
    render(<LoadingScreen onReady={onReady} />);
    expect(screen.getByText('MealMajor')).toBeInTheDocument();
    expect(screen.getByText(/getting everything ready/i)).toBeInTheDocument();
  });

  it('calls onReady immediately when no token is present', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    const onReady = vi.fn();
    render(<LoadingScreen onReady={onReady} />);
    await waitFor(() => expect(onReady).toHaveBeenCalled());
  });

  it('calls onReady after checking backend when token exists', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue('fake-token');
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    const onReady = vi.fn();
    render(<LoadingScreen onReady={onReady} />);
    await waitFor(() => expect(onReady).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/preferences', {
      headers: { Authorization: 'Bearer fake-token' },
    });
  });

  it('calls onReady even when the backend fetch fails', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue('fake-token');
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
    const onReady = vi.fn();
    render(<LoadingScreen onReady={onReady} />);
    await waitFor(() => expect(onReady).toHaveBeenCalled());
  });
});
