import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit tests, plus the rules in *.feature files, which run through their *.steps.ts bindings.
    include: ['src/**/*.test.ts', 'src/**/*.steps.ts'],
  },
});
