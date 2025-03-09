'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/database/supabaseClient';
import { Database } from '@/types/supabase';
import { isTokenExpired, getTokenTimeRemaining } from '@/lib/auth';

// Define user type
export interface User {
  id: number;
  email: string;
  username: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Authentication hook
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use a ref for the refresh timer
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use a ref for the refreshToken function to avoid circular dependencies
  const refreshTokenRef = useRef<() => Promise<boolean>>(async () => false);

  // Get the singleton Supabase client
  const supabase = getSupabaseBrowserClient();

  // Setup refresh timer
  const setupRefreshTimer = useCallback((expiresIn: number) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    
    // Calculate refresh time (refresh 1 minute before expiration)
    const refreshTime = Math.max(0, (expiresIn - 60) * 1000);
    console.log(`Setting up refresh timer for ${refreshTime}ms`);
    
    // Set new timer
    refreshTimerRef.current = setTimeout(() => {
      refreshTokenRef.current();
    }, refreshTime);
  }, []);

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Important for cookies
      });
      
      if (!response.ok) {
        // If not authenticated, clear state
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Setup refresh timer if expiresIn is provided
        if (data.expiresIn) {
          setupRefreshTimer(data.expiresIn);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [setupRefreshTimer]);

  // Refresh token implementation
  const refreshToken = useCallback(async () => {
    try {
      console.log('Refreshing token...');
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Important for cookies
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Setup refresh timer for the new token
        if (data.expiresIn) {
          setupRefreshTimer(data.expiresIn);
        }
        
        return true;
      } else {
        // If refresh fails, log the user out
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (err) {
      console.error('Token refresh error:', err);
      return false;
    }
  }, [setupRefreshTimer]);
  
  // Assign the refreshToken function to the ref
  refreshTokenRef.current = refreshToken;

  // Load authentication status on initialization
  useEffect(() => {
    checkAuthStatus();
    
    // Cleanup function to clear the timer
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [checkAuthStatus]);

  // Login method
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important for cookies
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
        setError(null);
        
        // Setup refresh timer
        if (data.expiresIn) {
          setupRefreshTimer(data.expiresIn);
        }
        
        return { success: true };
      } else {
        setError(data.error || 'Login failed');
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [setupRefreshTimer]);

  // Logout method
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Clear user state
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      // Clear refresh timer
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if user has a specific role
  const hasRole = useCallback((role: string) => {
    return user?.role === role;
  }, [user]);

  // Check if user is admin
  const isAdmin = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
    hasRole,
    isAdmin
  };
}