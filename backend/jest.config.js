
module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  roots: ['<rootDir>/src/__tests__'],
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest.setup.js'],
};
