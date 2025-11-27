/** @type {import('jest').Config} */
module.exports = {
  projects: [
    // UNIT TESTS (keep your current setup)
    {
      displayName: 'unit',
      testEnvironment: 'node',
      clearMocks: true,
      roots: ['<rootDir>/src/__tests__'],
      testMatch: ['**/__tests__/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest.setup.js'],

    },

    // INTEGRATION TESTS (real DB, no mocks)
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.int.test.js'],
      globalSetup: '<rootDir>/src/__tests__/integration/globalSetup.js',
      globalTeardown: '<rootDir>/src/__tests__/integration/globalTeardown.js',
      // no jest.setup.js here – we *want* the real knex
    },
  ],
};
