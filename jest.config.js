module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/controllers/**/*.js',
    'src/services/**/*.js',
    'src/utils/**/*.js',
    'src/middleware/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json', 'json-summary'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.js'],
  globalTeardown: '<rootDir>/tests/setup/teardown.js',
  testTimeout: 30000,
  verbose: true,
  moduleDirectories: ['node_modules', 'src'],
};