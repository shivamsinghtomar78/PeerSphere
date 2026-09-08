import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  // Route-handler integration tests read DATABASE_URL from .env.test via setup
  setupFiles: ['<rootDir>/__tests__/setup-env.ts'],
  // Reset + seed the test DB once per run (skips when .env.test is absent)
  globalSetup: '<rootDir>/__tests__/global-setup.ts',
  // The engines are the product's core logic — coverage regressions fail the build
  coverageThreshold: {
    global: {}, // no global gate; only the engines are enforced
    'lib/engines/**': { lines: 80, branches: 80 },
  },
};

export default config;
