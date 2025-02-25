import React from 'react';
import { render, act } from '@testing-library/react';
import Home from '../page';

// Minimal mocking to avoid complex dependencies
jest.mock('@/lib/actions', () => ({
  addQuestionToCart: jest.fn(),
  getCartItems: jest.fn(() => Promise.resolve([])) // Return an empty array
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }))
}));

jest.mock('@/components/QuestionList', () => ({
  __esModule: true,
  default: () => <div data-testid="question-list-mock">QuestionListMock</div>,
}));

describe('Home Page', () => {
  it('renders without crashing', async () => {
    await act(async () => {
      const { getByTestId } = render(<Home />);
      expect(getByTestId('question-list-mock')).toBeInTheDocument();
    });
  });
});
