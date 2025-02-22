'use client';
import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  CssBaseline,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined as LockIcon,
  EmailOutlined as EmailIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Adjust to match your brand
    },
    background: {
      default: '#f4f6f8', // Soft background
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: '1rem',
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
          },
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
  const router = useRouter();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        // Handle login errors
        setError(data.error || 'Login failed');
        return;
      }
      // Store token and user info
      localStorage.setItem('token', data.token);
      // Store user details in localStorage
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
        })
      );
      // Redirect based on user role
      if (data.user.role === 'admin') {
        router.push('/users');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    }
  };
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .login-container {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
          }}
        >
          <Paper
            className="login-container"
            elevation={6}
            sx={{
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 4,
              width: '100%',
              maxWidth: 400,
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
              <LockIcon
                sx={{
                  fontSize: 60,
                  color: theme.palette.primary.main,
                  mb: 2,
                }}
              />
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette.text.primary,
                }}
              >
                WCT Test Creator
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  color: theme.palette.text.secondary,
                  mt: 1,
                }}
              >
                Sign in to continue
              </Typography>
            </Box>
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
              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                  {error}
                </Typography>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold',
                }}
              >
                Sign In
              </Button>
            </form>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
