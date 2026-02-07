import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['lib/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      all: true,
      reportsDirectory: 'coverage',
      reporter: ['text', 'html', 'lcov'],
      include: ['lib/**/*.{ts,tsx}'],
      exclude: [
        'lib/**/__tests__/**',
        'lib/**/*.stories.*',
        'lib/stories/**',
        'lib/index.ts',
        'lib/types.ts',
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
