'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Avatar,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined as LockIcon,
  EmailOutlined as EmailIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Match with our main theme
    },
    background: {
      default: '#f8fafc', // Soft background
    },
  },
  typography: {
    fontFamily: 'var(--font-inter), sans-serif',
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: '1rem',
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const { login, user } = useAuth();
  const isAuthenticated = !!user;

  // Clear any redirection loop counters on page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Reset redirect count when landing on login page
      sessionStorage.setItem('redirectCount', '0');
      console.log('Reset redirect count on login page load');
    }
  }, []);

  // Check for expired token query parameter
  useEffect(() => {
    // Check URL for expired=true parameter
    const urlParams = new URLSearchParams(window.location.search);
    const expired = urlParams.get('expired');
    if (expired === 'true') {
      setInfoMessage('Your session has expired. Please sign in again to continue.');
    }
  }, []);

  // Function to handle role-based redirection
  const handleRoleBasedRedirect = (userRole: string) => {
    // Check if there's a redirect URL stored
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    
    if (redirectUrl) {
      console.log('Redirecting to stored URL:', redirectUrl);
      localStorage.removeItem('redirectAfterLogin');
      router.push(redirectUrl);
    } else {
      // Default redirect based on role
      if (userRole === 'admin') {
        console.log('User is admin, redirecting to /users');
        router.push('/users');
      } else {
        console.log('User is not admin, redirecting to /dashboard');
        router.push('/dashboard');
      }
    }
  };

  // Check if user is already authenticated
  useEffect(() => {
    if (user) {
      console.log('User already authenticated, checking for redirect URL');
      handleRoleBasedRedirect(user.role);
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    
    // Clear any existing tokens to ensure a fresh login
    localStorage.removeItem('accessToken');
    
    console.log('Login attempt started for email:', email);
    
    try {
      console.log('Calling login function...');
      const result = await login(email, password);
      console.log('Login function returned:', result);
      
      if (!result.success) {
        console.log('Login failed:', result.error);
        setError(result.error || 'Login failed');
      } else {
        console.log('Login successful, token should be stored');
        
        // Get the token from localStorage and set it as a cookie for middleware
        const token = localStorage.getItem('accessToken');
        if (token) {
          // Set a cookie with the token to help middleware access it
          document.cookie = `ls_token=${token}; path=/; max-age=3600; SameSite=Strict`;
          console.log('Token cookie set for middleware access');
        }
        
        // Add a small delay to ensure the token is properly stored
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if there's a redirect URL stored
        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        
        if (redirectUrl) {
          console.log('Redirecting to stored URL:', redirectUrl);
          localStorage.removeItem('redirectAfterLogin');
          
          // Use window.location.href for a full page navigation
          window.location.href = redirectUrl;
        } else {
          // Default redirect based on role
          // We need to check the user again as it might have been updated
          const currentUser = result.user || user;
          
          if (currentUser && currentUser.role === 'admin') {
            console.log('User is admin, redirecting to /users');
            
            // Use window.location.href for a full page navigation
            window.location.href = '/users';
          } else {
            console.log('User is not admin, redirecting to /dashboard');
            
            // Use window.location.href for a full page navigation
            window.location.href = '/dashboard';
          }
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={1}
            sx={{
              p: 4,
              borderRadius: 2,
              width: '100%',
              maxWidth: '450px',
              mx: 'auto',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 56,
                  height: 56,
                  mb: 2,
                }}
              >
                <LockIcon sx={{ fontSize: 30 }} />
              </Avatar>
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 1,
                  fontSize: { xs: '1.75rem', sm: '2rem' },
                }}
              >
                Welcome Back
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  textAlign: 'center',
                }}
              >
                Sign in to WCT Exam Creation Manager
              </Typography>
            </Box>

            {infoMessage && (
              <Typography 
                color="info.main" 
                variant="body2" 
                sx={{ 
                  mt: 1, 
                  textAlign: 'center', 
                  mb: 2,
                  p: 1.5,
                  bgcolor: 'info.lighter',
                  borderRadius: 2,
                }}
              >
                {infoMessage}
              </Typography>
            )}

            {error && (
              <Typography 
                color="error" 
                variant="body2" 
                sx={{ 
                  mt: 1, 
                  textAlign: 'center', 
                  mb: 2,
                  p: 1.5,
                  bgcolor: 'error.lighter',
                  borderRadius: 2,
                }}
              >
                {error}
              </Typography>
            )}

            <form onSubmit={handleLogin}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                sx={{ 
                  mt: 1, 
                  mb: 2,
                  py: 1.5,
                  fontWeight: 600,
                }}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
