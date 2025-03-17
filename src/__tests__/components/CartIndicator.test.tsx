import React from 'react';
import { render, screen } from '@testing-library/react';
import CartIndicator from '@/components/CartIndicator';
import { useCartStore } from '@/store/cartStore';

// Mock the zustand store
jest.mock('@/store/cartStore', () => ({
  useCartStore: jest.fn(),
}));

// Mock MUI components
jest.mock('@mui/material', () => {
  const original = jest.requireActual('@mui/material');
  return {
    ...original,
    Badge: ({ badgeContent, children, ...props }: any) => (
      <div data-testid="badge" data-badge-content={badgeContent}>
        {badgeContent !== 0 && <span>{badgeContent}</span>}
        {children}
      </div>
    ),
    IconButton: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
    Tooltip: ({ children, ...props }: any) => children,
  };
});

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children }: any) => children;
});

describe('CartIndicator', () => {
  // Mock for the getCartCount method
  const mockGetCartCount = jest.fn();
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementation
    mockGetCartCount.mockReturnValue(0);
  });

  it('renders with the correct count from store using getCartCount', () => {
    // Mock the cart store with getCartCount returning 3
    mockGetCartCount.mockReturnValue(3);
    
    (useCartStore as unknown as jest.Mock).mockReturnValue({
      questions: [{ id: 1 }, { id: 2 }, { id: 3 }],
      getCartCount: mockGetCartCount,
    });

    render(<CartIndicator />);
    
    // Check if the badge with count 3 is rendered
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-badge-content', '3');
    expect(mockGetCartCount).toHaveBeenCalled();
  });

  it('renders with the provided count prop', () => {
    // Mock the cart store with getCartCount returning 3
    mockGetCartCount.mockReturnValue(3);
    
    (useCartStore as unknown as jest.Mock).mockReturnValue({
      questions: [{ id: 1 }, { id: 2 }, { id: 3 }],
      getCartCount: mockGetCartCount,
    });

    // Render with a count prop of 5, which should override the store count
    render(<CartIndicator count={5} />);
    
    // Check if the badge with count 5 is rendered
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-badge-content', '5');
  });

  it('renders with a custom color', () => {
    // Mock the cart store with getCartCount returning 1
    mockGetCartCount.mockReturnValue(1);
    
    (useCartStore as unknown as jest.Mock).mockReturnValue({
      questions: [{ id: 1 }],
      getCartCount: mockGetCartCount,
    });

    render(<CartIndicator color="primary" />);
    
    // Check if the badge with count 1 is rendered
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-badge-content', '1');
  });

  it('renders with zero items', () => {
    // Mock the cart store with getCartCount returning 0
    mockGetCartCount.mockReturnValue(0);
    
    (useCartStore as unknown as jest.Mock).mockReturnValue({
      questions: [],
      getCartCount: mockGetCartCount,
    });

    render(<CartIndicator />);
    
    // Check if the badge with count 0 is rendered
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-badge-content', '0');
  });
}); 