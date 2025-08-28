/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/packages', '<rootDir>/apps', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }]
  },
  moduleNameMapper: {
    '^@bpmn-modeler/core(.*)$': '<rootDir>/packages/bpmn-core/src$1',
    '^@bpmn-modeler/properties(.*)$': '<rootDir>/packages/bpmn-properties/src$1',
    '^@bpmn-modeler/deployment(.*)$': '<rootDir>/packages/bpmn-deployment/src$1',
    '^@bpmn-modeler/storage(.*)$': '<rootDir>/packages/bpmn-storage/src$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'packages/**/src/**/*.{ts,tsx}',
    'apps/**/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/*.stories.tsx'
  ],
  coverageThresholds: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './packages/bpmn-core/': {
      branches: 95,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  watchPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  verbose: true,
  bail: false,
  errorOnDeprecated: true
};