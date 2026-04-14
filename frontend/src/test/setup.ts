import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock localStorage backed by a real Map so it stores values properly
// and returns null for missing keys (matching real browser behaviour).
// Uses vi.fn() so tests can use vi.mocked(localStorage.getItem) etc.
// The implementations are set via vi.fn(impl) (default impl) so they
// survive vi.clearAllMocks() which only calls mockClear().
const _store = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string): string | null => _store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string): void => {
    _store.set(key, String(value));
  }),
  removeItem: vi.fn((key: string): void => {
    _store.delete(key);
  }),
  clear: vi.fn((): void => {
    _store.clear();
  }),
  get length(): number {
    return _store.size;
  },
  key: vi.fn((index: number): string | null => [..._store.keys()][index] ?? null),
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock as any,
  writable: true,
  configurable: true,
});

// Reset storage between tests
beforeEach(() => {
  _store.clear();
});

// Mock fetch API
global.fetch = vi.fn();

// Mock ResizeObserver (not available in jsdom)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
