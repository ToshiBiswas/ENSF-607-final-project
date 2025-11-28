/** @type {import('jest').Config} */
module.exports = {
  projects: [
    // ===========================
    // UNIT TESTS (mocked, no DB)
    // ===========================
    {
      displayName: 'unit',
      testEnvironment: 'node',
      clearMocks: true,

      // Only pick up files like:
      // src/__tests__/unit/.../*.unit.test.js
      testMatch: ['<rootDir>/src/__tests__/unit/**/*.unit.test.js'],

      // Optional: if you have extra Jest setup (e.g., custom matchers)
      // make sure this file exists, or remove this line.
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest.setup.js'],
    },

    // ===========================
    // INTEGRATION TESTS (real DB)
    // ===========================
    {
      displayName: 'integration',
      testEnvironment: 'node',

      // Integration tests live here and end with .int.test.js
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.int.test.js'],

      globalSetup: '<rootDir>/src/__tests__/integration/globalSetup.js',
      globalTeardown: '<rootDir>/src/__tests__/integration/globalTeardown.js',
    },
  ],
};
