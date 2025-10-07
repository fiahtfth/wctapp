'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Define the User type
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login?: string;
}

// Define the AuthContext type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const checkAuthOnMount = async () => {
      try {
        console.log('Checking auth on mount...');
        
        // Skip auth check if we don't have a token
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.log('No token found, skipping auth check');
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        const isAuthenticated = await checkAuth();
        console.log('Auth check result:', isAuthenticated);
      } catch (err) {
        console.error('Error checking auth on mount:', err);
        setError('Failed to authenticate');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthOnMount();
  }, []);

  // Function to check authentication status
  const checkAuth = async (): Promise<boolean> => {
    try {
      console.log('Checking authentication status...');
      
      // Check if we have a token in localStorage
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No access token found in localStorage');
        setUser(null);
        return false;
      }
      
      console.log('Access token found, verifying with server...');
      
      // Add timeout and better error handling for fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Use absolute URL to ensure we're hitting the right endpoint
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
      const apiUrl = `${baseUrl}/api/auth/me`;
      console.log('Making auth check request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log('Auth check failed with status:', response.status);
        // Clear invalid token
        localStorage.removeItem('accessToken');
        setUser(null);
        return false;
      }

      const data = await response.json();
      console.log('Auth check response:', data);
      
      if (!data.success) {
        console.log('Auth check returned unsuccessful response');
        localStorage.removeItem('accessToken');
        setUser(null);
        return false;
      }

      // Update user state with the returned user data
      setUser(data.user);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error checking authentication:', err);
      
      // Handle specific network errors
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.log('Network error during auth check - using fallback mode');
        
        // In development, if we have a token but can't verify it due to network issues,
        // try to decode it locally to extract user info
        const storedToken = localStorage.getItem('accessToken');
        if (process.env.NODE_ENV === 'development' && storedToken) {
          try {
            const payload = JSON.parse(atob(storedToken.split('.')[1]));
            console.log('Decoded token payload:', payload);
            
            // Check if token is not expired
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp > now) {
              console.log('Token appears valid, using fallback user data');
              const fallbackUser = {
                id: payload.userId || '1',
                username: payload.email?.split('@')[0] || 'user',
                email: payload.email || 'admin@nextias.com',
                role: payload.role || 'admin',
                is_active: true,
                last_login: new Date().toISOString(),
              };
              setUser(fallbackUser);
              setError(null);
              return true;
            }
          } catch (decodeErr) {
            console.log('Could not decode token:', decodeErr);
          }
        }
        
        // Don't clear token on network errors, just return false
        setUser(null);
        return false;
      }
      
      // For other errors, clear the token
      localStorage.removeItem('accessToken');
      setUser(null);
      return false;
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      console.log('Attempting login for:', email);
      
      // Add timeout and better error handling for login
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for login
      
      // Use absolute URL to ensure we're hitting the right endpoint
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
      const loginUrl = `${baseUrl}/api/auth/login`;
      console.log('Making login request to:', loginUrl);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important for cookies
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();
      console.log('Login response:', data);

      if (!response.ok) {
        console.error('Login failed:', data.message || 'Unknown error');
        return { 
          success: false, 
          error: data.message || 'Login failed' 
        };
      }

      if (!data.accessToken) {
        console.error('No access token in response');
        return { 
          success: false, 
          error: 'No access token received' 
        };
      }

      // Store the token
      localStorage.setItem('accessToken', data.accessToken);
      console.log('Access token stored in localStorage');

      // Update user state
      setUser(data.user);
      setError(null);

      // Reset any error counters
      sessionStorage.removeItem('loginAttempted');
      
      // Determine redirect URL based on role
      if (data.user && data.user.role) {
        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          localStorage.removeItem('redirectAfterLogin');
          console.log('Will redirect to stored URL:', redirectUrl);
        } else {
          // Set default redirect based on role
          if (data.user.role === 'admin') {
            console.log('User is admin, will redirect to /users');
          } else {
            console.log('User is not admin, will redirect to /dashboard');
          }
        }
      }
      
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle specific network errors
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Unable to connect to server. Please check your connection and try again.' 
        };
      }
      
      if (err instanceof Error && err.name === 'AbortError') {
        return { 
          success: false, 
          error: 'Login request timed out. Please try again.' 
        };
      }
      
      return { 
        success: false, 
        error: 'An unexpected error occurred' 
      };
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      console.log('Logging out...');
      
      // Get the access token from localStorage
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        // Call the logout API to invalidate the token on the server
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
      
      // Clear user state and token regardless of API response
      setUser(null);
      localStorage.removeItem('accessToken');
      
      // Clear cookies (client-side)
      if (typeof document !== 'undefined') {
        // Clear accessToken cookie
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
        // Clear refresh_token cookie
        document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
        // Clear refreshToken cookie (alternative name)
        document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
        // Clear ls_token cookie
        document.cookie = 'ls_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
        console.log('All cookies cleared');
      }
      
      // Clear any redirection flags
      sessionStorage.removeItem('redirectCount');
      sessionStorage.removeItem('loginAttempted');
      
      console.log('Logout successful, all auth data cleared');
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Error during logout:', err);
      
      // Still clear local data even if API call fails
      setUser(null);
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('redirectCount');
      
      // Clear cookies even on error
      if (typeof document !== 'undefined') {
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
        document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
        document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
        document.cookie = 'ls_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
      }
      
      // Redirect to login page even if there was an error
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  // Create the context value
  const contextValue: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component to protect routes
export function withAuth(Component: React.ComponentType) {
  return function AuthenticatedComponent(props: any) {
    const { user, isLoading, error } = useAuth();
    const router = useRouter();
    const redirectAttemptedRef = useRef(false);

    useEffect(() => {
      // Only attempt to redirect once per component mount
      if (!isLoading && !user && !redirectAttemptedRef.current) {
        redirectAttemptedRef.current = true;
        
        // Store the current URL to redirect back after login
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            localStorage.setItem('redirectAfterLogin', currentPath);
            console.log('Stored redirect path:', currentPath);
          }
          
          // Check if we're already in a redirection loop
          const redirectCount = parseInt(sessionStorage.getItem('redirectCount') || '0', 10);
          if (redirectCount < 3) { // Limit redirect attempts
            sessionStorage.setItem('redirectCount', (redirectCount + 1).toString());
            console.log('Redirecting to login, count:', redirectCount + 1);
            // Use window.location.href instead of router.push
            window.location.href = '/login';
          } else {
            console.error('Too many redirect attempts, stopping redirection loop');
            sessionStorage.removeItem('redirectCount');
          }
        }
      }
    }, [user, isLoading, router]);

    if (isLoading) {
      return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    if (error) {
      return <div className="text-red-500">Error: {error}</div>;
    }

    if (!user) {
      return <div className="flex justify-center items-center min-h-screen">Redirecting to login...</div>;
    }

    return <Component {...props} />;
  };
}

// Higher-order component to protect admin routes
export function withAdminAuth(Component: React.ComponentType) {
  return function AdminAuthenticatedComponent(props: any) {
    const { user, isLoading, error } = useAuth();
    const router = useRouter();
    const redirectAttemptedRef = useRef(false);

    useEffect(() => {
      console.log('withAdminAuth - Auth state:', { 
        isLoading, 
        user: user ? { id: user.id, role: user.role } : null,
        redirectAttempted: redirectAttemptedRef.current
      });
      
      // Only attempt to redirect once per component mount
      if (!isLoading && !redirectAttemptedRef.current) {
        redirectAttemptedRef.current = true;
        
        if (!user) {
          console.log('withAdminAuth - No user, redirecting to login');
          // Store the current URL to redirect back after login
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            if (currentPath !== '/login') {
              localStorage.setItem('redirectAfterLogin', currentPath);
              console.log('Stored admin redirect path:', currentPath);
            }
            
            // Check if we're already in a redirection loop
            const redirectCount = parseInt(sessionStorage.getItem('redirectCount') || '0', 10);
            if (redirectCount < 3) { // Limit redirect attempts
              sessionStorage.setItem('redirectCount', (redirectCount + 1).toString());
              console.log('Redirecting to login (admin), count:', redirectCount + 1);
              // Use window.location.href for a full page navigation
              window.location.href = '/login?redirect=%2Fusers';
            } else {
              console.error('Too many redirect attempts, stopping redirection loop');
              sessionStorage.removeItem('redirectCount');
            }
          }
        } else if (user.role !== 'admin') {
          console.log('User is not admin, redirecting to dashboard');
          // Use window.location.href for a full page navigation
          window.location.href = '/dashboard';
        } else {
          console.log('User is admin, allowing access to admin page');
        }
      }
    }, [user, isLoading, router]);

    if (isLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Loading...</div>
        </div>
      );
    }

    if (!user) {
      return null; // Will be redirected in useEffect
    }

    if (user.role !== 'admin') {
      return null; // Will be redirected in useEffect
    }

    return <Component {...props} />;
  };
} 