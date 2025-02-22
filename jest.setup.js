// Import type definitions
/** @jest-environment jsdom */

// Import jest-dom extensions
require('@testing-library/jest-dom');

// Extend expect with jest-dom matchers
const matchers = require('@testing-library/jest-dom/matchers');
expect.extend(matchers);

// Type declarations for jest-dom
/** @type {import('@testing-library/jest-dom/matchers')} */
const jestDomMatchers = {
  toBeInTheDocument: expect.any(Function),
  toBeVisible: expect.any(Function),
  toBeChecked: expect.any(Function),
  toBeDisabled: expect.any(Function),
  toHaveTextContent: expect.any(Function),
  toHaveAttribute: expect.any(Function),
  toHaveClass: expect.any(Function),
  toHaveStyle: expect.any(Function),
  toBeEmpty: expect.any(Function),
  toContainElement: expect.any(Function),
};

// Augment global expect type
global.expect = Object.assign(global.expect, jestDomMatchers);

// Set test environment
process.env.NODE_ENV = 'test';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforeHistoryChange: jest.fn(),
      isReady: true,
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Suppress console errors during testing
console.error = jest.fn();
console.warn = jest.fn();

// Add fetch polyfill for test environment
if (!global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
      ok: true,
      status: 200,
      text: () => Promise.resolve(''),
    })
  );
}

console.log('Jest setup complete');
