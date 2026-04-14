import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHashNavigation } from './useHashNavigation';

describe('useHashNavigation', () => {
  const originalHash = window.location.hash;

  beforeEach(() => {
    window.location.hash = '';
  });

  afterEach(() => {
    window.location.hash = originalHash;
  });

  it('returns the default page when hash is empty', () => {
    const { result } = renderHook(() => useHashNavigation('home'));
    expect(result.current).toBe('home');
  });

  it('returns the page matching the current hash', () => {
    window.location.hash = '#profile';
    const { result } = renderHook(() => useHashNavigation('home'));
    expect(result.current).toBe('profile');
  });

  it('returns the default page for an unrecognized hash', () => {
    window.location.hash = '#nonexistent';
    const { result } = renderHook(() => useHashNavigation('home'));
    expect(result.current).toBe('home');
  });

  it('updates when the hash changes', async () => {
    const { result } = renderHook(() => useHashNavigation('home'));
    expect(result.current).toBe('home');

    act(() => {
      window.location.hash = '#recipes';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(result.current).toBe('recipes');
  });

  it('recognizes all valid pages', () => {
    const pages = ['home', 'signin', 'signup', 'profile', 'calendar', 'unique', 'aichat', 'recipes'] as const;
    for (const page of pages) {
      window.location.hash = `#${page}`;
      const { result } = renderHook(() => useHashNavigation('home'));
      expect(result.current).toBe(page);
    }
  });
});
