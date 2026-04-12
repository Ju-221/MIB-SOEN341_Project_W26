import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    pool: 'forks',
    env: {
      TEST_DATABASE: ':memory:',
    },
    setupFiles: ['./__tests__/setup.ts'],
    include: ['**/__tests__/**/*.test.ts'],
  },
});
