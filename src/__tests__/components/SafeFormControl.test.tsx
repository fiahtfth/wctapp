import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SafeFormControl from '@/components/SafeFormControl';
import { TextField } from '@mui/material';

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

describe('SafeFormControl', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders children correctly', () => {
    render(
      <SafeFormControl>
        <TextField label="Test Input" />
      </SafeFormControl>
    );
    
    expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
  });
  
  it('handles onChange events safely', () => {
    const handleChange = jest.fn();
    
    render(
      <SafeFormControl onChange={handleChange}>
        <TextField label="Test Input" />
      </SafeFormControl>
    );
    
    const input = screen.getByLabelText('Test Input');
    
    // Trigger a change event
    fireEvent.change(input, { target: { value: 'test value' } });
    
    // The handler should not be called immediately due to the timeout
    expect(handleChange).not.toHaveBeenCalled();
    
    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });
    
    // Now the handler should have been called
    expect(handleChange).toHaveBeenCalled();
  });
  
  it('prevents recursive onChange calls', () => {
    const handleChange = jest.fn();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(
      <SafeFormControl onChange={handleChange}>
        <TextField label="Test Input" />
      </SafeFormControl>
    );
    
    const input = screen.getByLabelText('Test Input');
    
    // Trigger multiple change events in quick succession
    fireEvent.change(input, { target: { value: 'test1' } });
    fireEvent.change(input, { target: { value: 'test2' } });
    fireEvent.change(input, { target: { value: 'test3' } });
    
    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });
    
    // The handler should have been called only once
    expect(handleChange).toHaveBeenCalledTimes(1);
    
    consoleLogSpy.mockRestore();
  });
  
  it('handles errors in onChange handler', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Create a handler that throws an error
    const handleChange = jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    });
    
    render(
      <SafeFormControl onChange={handleChange}>
        <TextField label="Test Input" />
      </SafeFormControl>
    );
    
    const input = screen.getByLabelText('Test Input');
    
    // Trigger a change event
    fireEvent.change(input, { target: { value: 'test value' } });
    
    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });
    
    // The handler should have been called
    expect(handleChange).toHaveBeenCalled();
    
    // Console.error should have been called with the error
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });
  
  it('passes through other props correctly', () => {
    render(
      <SafeFormControl data-testid="safe-form-control" className="test-class">
        <TextField label="Test Input" />
      </SafeFormControl>
    );
    
    const formControl = screen.getByTestId('safe-form-control');
    expect(formControl).toHaveClass('test-class');
  });
}); 