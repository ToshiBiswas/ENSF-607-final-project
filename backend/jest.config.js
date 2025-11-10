
module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  roots: ['<rootDir>/src/__tests__'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest.setup.js'],
};
