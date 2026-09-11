import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  // .pgsql is a bundled PostgreSQL/pgAdmin install for local tooling — its
  // vendored JS is not our code and was contributing 21 phantom warnings.
  globalIgnores(['node_modules/**', '.next/**', 'out/**', 'build/**', 'uploads/**', 'coverage/**', '.pgsql/**', '.playwright-mcp/**']),
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]);