// Jest setup file
// Add any global test setup configurations here

// Mock Next.js modules
jest.mock('next/navigation', () => ({
    useRouter() {
        return {
            route: '/',
            pathname: '',
            query: {},
            asPath: '',
            push: jest.fn(),
            replace: jest.fn(),
        };
    },
    usePathname() {
        return '/';
    },
    useSearchParams() {
        return {
            get: () => null,
            entries: () => [],
            has: () => false
        };
    }
}));

// Create a mock fetch with basic testing methods
const createMockFetch = () => {
    const mockFetch = jest.fn((url, options) => {
        // Default implementation for questions API
        if (url.includes('/api/questions')) {
            return Promise.resolve({
                json: () => Promise.resolve({
                    data: [
                        {
                            id: 1,
                            Question: 'What is 2 + 2?',
                            Answer: '4',
                            Subject: 'Math',
                            Topic: 'Basic Arithmetic',
                            'Difficulty Level': 'easy',
                            'Nature of Question': 'MCQ'
                        },
                        {
                            id: 2,
                            Question: 'What is the capital of France?',
                            Answer: 'Paris',
                            Subject: 'Geography',
                            Topic: 'European Capitals',
                            'Difficulty Level': 'medium',
                            'Nature of Question': 'Short Answer'
                        }
                    ],
                    pagination: {
                        currentPage: 1,
                        pageSize: 10,
                        totalItems: 2,
                        totalPages: 1
                    }
                }),
                ok: true,
                status: 200,
                text: () => Promise.resolve('Questions fetched successfully'),
                headers: new Headers({'Content-Type': 'application/json'}),
                url: url instanceof Request ? url.url : url,
                ...options
            });
        }

        // Default fallback implementation
        return Promise.resolve({
            json: () => Promise.resolve({}),
            ok: true,
            status: 200,
            text: () => Promise.resolve(''),
            headers: new Headers(),
            url: url instanceof Request ? url.url : url,
            ...options
        });
    });

    // Attach basic mock methods
    mockFetch.mockClear = jest.fn();
    mockFetch.mockReset = jest.fn();
    mockFetch.mockImplementation = jest.fn();
    mockFetch.mockImplementationOnce = jest.fn();

    return mockFetch;
};

// Set global fetch to the mock
global.fetch = createMockFetch();

// Global test configurations
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
};

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import 'whatwg-fetch';

// Mock next/router
jest.mock('next/router', () => require('next-router-mock'))

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.matchMedia
global.matchMedia = query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

// Suppress console errors/warnings in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
console.error = (...args) => {
  if (args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) return;
  originalConsoleError(...args);
};
console.warn = (...args) => {
  if (args[0]?.includes?.('webpack')) return;
  originalConsoleWarn(...args);
};
