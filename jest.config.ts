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
};

export default config;
