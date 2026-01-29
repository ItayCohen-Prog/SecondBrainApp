/**
 * Jest setup file for Expo SDK 54+ with React 19
 *
 * Note: Component tests are currently skipped due to jest-expo/winter runtime
 * compatibility issues. This setup focuses on unit tests for pure functions.
 */

// Suppress specific console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0]?.toString() || '';
  if (message.includes('componentWillReceiveProps') || message.includes('componentWillMount')) {
    return;
  }
  originalWarn.apply(console, args);
};
