import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import Home from '../page';
import { getCurrentUser } from '@/lib/server-actions';
import { getQuestions } from '@/lib/database/queries';

// Mock React hooks for server components
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
  useEffect: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }))
}));

// Mock the server actions and queries
jest.mock('@/lib/server-actions', () => ({
  getCurrentUser: jest.fn()
}));

jest.mock('@/lib/database/queries', () => ({
  getQuestions: jest.fn()
}));

// Mock QuestionList component
jest.mock('@/components/QuestionList', () => ({
  QuestionList: (props: any) => (
    <div data-testid="question-list-mock">
      Mocked QuestionList {JSON.stringify(props)}
    </div>
  )
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Home Page', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock useState to return default values for all hooks in the component
    (React.useState as jest.Mock)
      .mockReturnValueOnce(["home-question-list", jest.fn()]) // testId
      .mockReturnValueOnce([0, jest.fn()]) // cartCount
      .mockReturnValueOnce([false, jest.fn()]) // logoutDialogOpen
      .mockReturnValueOnce([{}, jest.fn()]) // filters
      .mockReturnValueOnce([1, jest.fn()]) // currentPage
      .mockReturnValueOnce([1, jest.fn()]) // totalPages

    // Mock useEffect to do nothing with type-safe implementation
    (React.useEffect as jest.Mock).mockImplementation((callback: () => void | (() => void)) => {
      const cleanupFn = callback();
      if (typeof cleanupFn === 'function') {
        cleanupFn();
      }
    });

    // Mock localStorage getItem to return null by default
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders without crashing', async () => {
    // Setup mock return values
    (getCurrentUser as jest.Mock).mockResolvedValue(null);
    (getQuestions as jest.Mock).mockResolvedValue({
      questions: [],
      total: 0,
      page: 1,
      pageSize: 10
    });

    await act(async () => {
      render(await Home());
    });

    // Check for the mocked QuestionList
    const questionList = screen.getByTestId('question-list-mock');
    expect(questionList).toBeInTheDocument();
  });
});
