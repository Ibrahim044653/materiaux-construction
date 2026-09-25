import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  js.configs.recommended,

  // ── TypeScript (API — Node.js) ────────────────────────────────────────────
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }],
    },
  },

  // ── TypeScript (Web + Admin — Browser) ───────────────────────────────────
  {
    files: ['apps/web/**/*.{ts,tsx}', 'apps/admin/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        React: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-undef': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },

  // ── Config files (vite.config, vitest.config…) — Node + __dirname ────────
  {
    files: ['**/vite.config.{ts,js}', '**/vitest.config.{ts,js}', '**/postcss.config.*'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },

  // ── Service Worker ─────────────────────────────────────────────────────────
  {
    files: ['apps/web/src/sw.ts'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.es2021,
      },
    },
  },

  // ── Tests ──────────────────────────────────────────────────────────────────
  {
    files: ['**/*.test.{ts,tsx}', '**/tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        ...globals.es2021,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off',
    },
  },

  // ── Ignores ────────────────────────────────────────────────────────────────
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.js',
      '**/*.cjs',
      '**/*.mjs',
    ],
  },
];
