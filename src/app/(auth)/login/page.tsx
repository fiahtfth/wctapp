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
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const { login, user } = useAuth();

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

  // Handle all redirects for authenticated users
  useEffect(() => {
    // Only redirect if user exists and we haven't redirected yet
    if (user && !hasRedirected) {
      console.log('User authenticated, preparing redirect...');
      setHasRedirected(true);
      
      const storedRedirect = localStorage.getItem('redirectAfterLogin');
      const destination = storedRedirect || (user.role === 'admin' ? '/users' : '/dashboard');
      
      if (storedRedirect) {
        localStorage.removeItem('redirectAfterLogin');
      }
      
      console.log('Redirecting to:', destination);
      // Use a longer timeout to ensure cookies are fully set by the browser
      setTimeout(() => {
        window.location.replace(destination);
      }, 500);
    }
  }, [user, hasRedirected]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        // The auth state change will trigger the redirect in the useEffect
        setLoginSuccess(true);
      } else {
        setError(result.error || 'Login failed');
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
