// Import type definitions
/** @jest-environment jsdom */

// Import jest-dom extensions
require('@testing-library/jest-dom');

global.Request = jest.fn().mockImplementation((input: RequestInfo, init?: RequestInit) => {
  return {
    url: input.toString(),
    method: init?.method || 'GET',
    headers: init?.headers || {},
    body: init?.body,
  } as any;
});


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
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
      },
      text: () => Promise.resolve(''),
    } as any)
  );
}

console.log('Jest setup complete');
