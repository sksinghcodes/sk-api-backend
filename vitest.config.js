import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/**/*.unit.test.js'],
          setupFiles: ['./tests/setup/unit.js'],
          globals: true
        }
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/**/*.test.js'],
          exclude: ['tests/**/*.unit.test.js'],
          setupFiles: ['./tests/setup/integration.js'],
          fileParallelism: false,
          globals: true
        }
      }
    ]
  }
});
