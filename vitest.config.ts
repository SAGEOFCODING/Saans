import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      ...(process.env.TEST_ALL_ROUTES ? [] : [
        'tests/e2e/tier1-coverage/health.test.ts',
        'tests/e2e/tier1-coverage/geocode.test.ts',
        'tests/e2e/tier1-coverage/air.test.ts',
        'tests/e2e/tier1-coverage/plan.test.ts',
        'tests/e2e/tier1-coverage/chat.test.ts',
        'tests/e2e/tier2-boundary/**',
        'tests/e2e/tier3-interaction/**',
        'tests/e2e/tier4-scenarios/**',
      ]),
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
