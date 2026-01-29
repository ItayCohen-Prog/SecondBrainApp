/**
 * Jest configuration for Expo SDK 54 with React 19
 *
 * KNOWN ISSUE: There are compatibility issues between jest-expo, Expo SDK 54,
 * and React 19 related to the "winter" runtime that prevent tests from running.
 * See: https://github.com/expo/expo/issues/37261
 *
 * Status: Tests are configured but temporarily disabled until upstream fixes.
 * The test infrastructure (files, config) is in place for when this is resolved.
 */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/test-utils'],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/*.d.ts',
    '!**/types/**',
    '!**/test-utils.*',
  ],
};
