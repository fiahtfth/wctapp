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
import Image from 'next/image';
import { useAuth, User } from '@/components/AuthProvider';

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
          fontWeight: 500,
          padding: '0.75rem 1.5rem',
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
          background: 'linear-gradient(to right, #f0f9ff, #e0f2fe)',
        }}
      >
        {/* Left side - Login Form */}
        <Box
          sx={{
            flex: { xs: '1', md: '0.4' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
          }}
        >
          <Container maxWidth="sm">
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 5 },
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                width: '100%',
                maxWidth: 450,
                mx: 'auto',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 4,
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
                  <LockIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography
                  component="h1"
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    mb: 1,
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
                    p: 1,
                    bgcolor: 'info.lighter',
                    borderRadius: 1,
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
                    p: 1,
                    bgcolor: 'error.lighter',
                    borderRadius: 1,
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
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </Paper>
          </Container>
        </Box>

        {/* Right side - Illustration/Branding (hidden on mobile) */}
        <Box
          sx={{
            flex: '0.6',
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'primary.main',
            color: 'white',
            p: 8,
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%23ffffff" fill-opacity="1" fill-rule="evenodd"/%3E%3C/svg%3E")',
            }}
          />
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              mb: 3,
              textAlign: 'center',
              position: 'relative',
            }}
          >
            WCT Exam Creation Manager
          </Typography>
          <Typography
            variant="h6"
            sx={{
              maxWidth: 500,
              textAlign: 'center',
              mb: 6,
              position: 'relative',
            }}
          >
            Create, manage, and organize your exam questions with ease
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              mt: 4,
            }}
          >
            <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
              Streamline your exam creation process
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  p: 2,
                  borderRadius: 2,
                  textAlign: 'center',
                  width: 120,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Organize
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  p: 2,
                  borderRadius: 2,
                  textAlign: 'center',
                  width: 120,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Create
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  p: 2,
                  borderRadius: 2,
                  textAlign: 'center',
                  width: 120,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Export
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
