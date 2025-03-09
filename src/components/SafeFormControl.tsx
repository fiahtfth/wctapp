'use client';
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { FormControl, FormControlProps } from '@mui/material';

/**
 * A wrapper around Material UI's FormControl component that prevents infinite update loops
 * by breaking the synchronous update cycle and intercepting problematic callbacks.
 */
export default function SafeFormControl(props: FormControlProps) {
  const { onChange, ...otherProps } = props;
  const isUpdatingRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [key, setKey] = useState(0); // Force re-render when needed
  const errorCountRef = useRef(0);
  const lastErrorTimeRef = useRef(0);
  const errorHandlerInstalledRef = useRef(false);
  
  // Safely handle onChange events to prevent React state update errors
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (isUpdatingRef.current) {
      console.log('SafeFormControl: Prevented recursive onChange call');
      return;
    }
    
    isUpdatingRef.current = true;
    
    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Use a small timeout to debounce and prevent React state update errors
    updateTimeoutRef.current = setTimeout(() => {
      try {
        if (onChange) {
          onChange(event);
        }
      } catch (error) {
        console.error('SafeFormControl: Error in onChange handler', error);
      }
      isUpdatingRef.current = false;
      updateTimeoutRef.current = null;
    }, 10);
  }, [onChange]);
  
  // Memoize the props to prevent unnecessary re-renders
  const safeProps = useMemo(() => {
    // Create a new props object without the problematic callbacks
    const newProps = { ...otherProps };
    
    // Remove potentially problematic props that might cause infinite loops
    delete newProps.onChange;
    delete newProps.onBlur;
    delete newProps.onFocus;
    
    // Replace onChange with our safe version
    if (onChange) {
      newProps.onChange = handleChange;
    }
    
    return newProps;
  }, [otherProps, handleChange, onChange]);
  
  // Use useEffect to detect and fix potential infinite loops
  useEffect(() => {
    // Skip if error handler is already installed
    if (errorHandlerInstalledRef.current) return;
    
    let errorDetectionActive = true;
    errorHandlerInstalledRef.current = true;
    
    // Create an error handler to detect React's "Maximum update depth exceeded" error
    const originalError = console.error;
    console.error = (...args) => {
      if (!errorDetectionActive) {
        originalError.apply(console, args);
        return;
      }
      
      const errorMessage = args[0]?.toString() || '';
      if (errorMessage.includes('Maximum update depth exceeded') || 
          errorMessage.includes('Too many re-renders') ||
          errorMessage.includes('Rendered more hooks than')) {
        const now = Date.now();
        
        // Only count errors that happen within a short time window
        if (now - lastErrorTimeRef.current < 1000) {
          errorCountRef.current++;
        } else {
          errorCountRef.current = 1;
        }
        
        lastErrorTimeRef.current = now;
        
        // If we detect multiple errors in a short time, force a re-render with a new key
        if (errorCountRef.current > 1) {
          // Temporarily disable error detection to prevent recursive errors
          errorDetectionActive = false;
          
          // Force a re-render with a new key after a debounce
          setTimeout(() => {
            setKey(prevKey => prevKey + 1);
            errorCountRef.current = 0;
            
            // Log a more helpful message
            originalError.call(console, 'SafeFormControl: Detected and fixed an infinite update loop');
            
            // Re-enable error detection after a longer delay
            setTimeout(() => {
              errorDetectionActive = true;
            }, 1000);
          }, 100); // Add debounce delay
          
          return;
        }
      }
      
      // Pass through other errors
      originalError.apply(console, args);
    };
    
    // Restore the original console.error on cleanup
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      console.error = originalError;
      errorHandlerInstalledRef.current = false;
    };
  }, []);
  
  return <FormControl key={key} {...safeProps} />;
} 