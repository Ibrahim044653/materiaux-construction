import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }] },
  moduleNameMapper: {
    '^@materiaux/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts', '!src/tests/**'],
};

export default config;
