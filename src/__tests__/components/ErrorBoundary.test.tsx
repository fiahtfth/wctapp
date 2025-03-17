import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '@/components/ErrorBoundary';

// Create a component that throws an error
const ErrorThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Suppress console.error for cleaner test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
  
  it('renders fallback UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText('Please try again later.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
  
  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error UI</div>}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });
  
  it('calls onError prop when there is an error', () => {
    const handleError = jest.fn();
    
    render(
      <ErrorBoundary onError={handleError}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(handleError).toHaveBeenCalled();
    expect(handleError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(handleError.mock.calls[0][0].message).toBe('Test error');
  });
  
  it('resets error state when "Try again" is clicked', () => {
    // Create a component that can control its error state
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      // This is a workaround to make the test work
      // We need to expose the setShouldThrow function to the test
      React.useEffect(() => {
        // @ts-ignore - Add the function to the window for testing
        window.setShouldThrowInTest = setShouldThrow;
      }, []);
      
      return (
        <ErrorBoundary>
          {shouldThrow ? (
            <ErrorThrowingComponent />
          ) : (
            <div>Error resolved</div>
          )}
        </ErrorBoundary>
      );
    };
    
    render(<TestComponent />);
    
    // Initially shows error
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    
    // Click "Try again" button
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    
    // Still shows error because the component still throws
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    
    // Now resolve the error using the exposed function
    // @ts-ignore - Access the function we added to window
    window.setShouldThrowInTest(false);
    
    // Click "Try again" again
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    
    // Now it should show the resolved content
    expect(screen.getByText('Error resolved')).toBeInTheDocument();
    
    // Clean up
    // @ts-ignore
    delete window.setShouldThrowInTest;
  });
}); 