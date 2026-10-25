import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Read apps/api/.env locally; CI passes the variables directly.
    env: loadEnv('', process.cwd(), ''),
    testTimeout: 20_000,
  },
});
