'use client';

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme,
  List,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Container,
  Drawer,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  QuestionMark as QuestionIcon,
  Person as UserIcon,
  ShoppingCart as CartIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import CartIndicator from '@/components/CartIndicator';
import Link from 'next/link';

// Define menu items with role-based access
const getMenuItems = (isAdmin: boolean) => {
  // Basic items for all users
  const items = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Questions', icon: <QuestionIcon />, path: '/questions' },
    { text: 'Cart', icon: <CartIcon />, path: '/cart' },
    { text: 'Add Question', icon: <AddIcon />, path: '/add-question' },
  ];
  
  // Add Users menu item only for admin users
  if (isAdmin) {
    items.push({ text: 'User Management', icon: <UserIcon />, path: '/users' });
  }
  
  return items;
};

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('User');
  
  // Get menu items based on user role
  const menuItems = getMenuItems(isAdmin);
  
  // Load user info and cart count on mount
  useEffect(() => {
    // Check if user is admin
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsAdmin(user.role === 'admin');
        setUserEmail(user.email || '');
        setUserName(user.name || 'User');
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
    
    // Fetch cart count
    const fetchCartCount = async () => {
      try {
        const testId = localStorage.getItem('testId') || '';
        // This is a placeholder - replace with actual cart fetching logic
        const cartItems = localStorage.getItem('cartItems') ? 
          JSON.parse(localStorage.getItem('cartItems') || '[]') : [];
        setCartCount(cartItems.length);
      } catch (error) {
        console.error("Failed to fetch cart items", error);
      }
    };
    fetchCartCount();
  }, []);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    // Clear user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login
    router.push('/login');
  };

  // Mobile menu drawer content
  const mobileMenuDrawer = (
    <Box sx={{ width: '100%', maxWidth: 300, p: 0 }} role="presentation">
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Menu
        </Typography>
        <IconButton onClick={handleMobileMenuToggle} aria-label="close menu">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <List sx={{ pt: 1 }}>
        {menuItems.map((item) => (
          <MenuItem 
            key={item.text} 
            onClick={() => {
              router.push(item.path);
              handleMobileMenuToggle();
            }}
            selected={pathname === item.path}
            sx={{
              py: 1.5,
              '&.Mui-selected': {
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderLeft: '3px solid',
                borderColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(37, 99, 235, 0.15)',
                },
              },
            }}
          >
            <ListItemIcon sx={{ 
              color: pathname === item.path ? 'primary.main' : 'inherit',
              minWidth: '40px'
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{
                fontWeight: pathname === item.path ? 600 : 400,
                color: pathname === item.path ? 'primary.main' : 'inherit',
              }}
            />
          </MenuItem>
        ))}
      </List>
      
      {/* User info at bottom of drawer */}
      <Box sx={{ 
        mt: 'auto', 
        p: 2, 
        borderTop: '1px solid', 
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {userName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {userEmail}
            </Typography>
            {isAdmin && (
              <Typography variant="caption" sx={{ 
                display: 'block',
                mt: 0.5,
                color: 'primary.main',
                fontWeight: 500
              }}>
                Admin
              </Typography>
            )}
          </Box>
        </Box>
        <Button 
          variant="outlined" 
          color="error" 
          size="small"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          fullWidth
          sx={{ mt: 1 }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="fixed" 
        color="default" 
        elevation={0}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth="xl" disableGutters={!isSmallScreen}>
          <Toolbar sx={{ 
            justifyContent: 'space-between',
            minHeight: { xs: '56px', sm: '64px' },
            px: { xs: 2, sm: 3 },
            py: 1
          }}>
            {/* Logo and Brand - Acts as Dashboard link */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Go to Dashboard">
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: { xs: '1.1rem', sm: '1.3rem' },
                    color: pathname === '/dashboard' ? 'primary.main' : 'inherit',
                    transition: 'color 0.2s ease',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                  onClick={() => router.push('/dashboard')}
                >
                  {isSmallScreen ? 'WCT App' : 'WCT Exam Creator'}
                </Typography>
              </Tooltip>
            </Box>
            
            {/* Right side controls */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Mobile menu button */}
              {isMobile && (
                <IconButton
                  color="inherit"
                  aria-label="open menu"
                  edge="start"
                  onClick={handleMobileMenuToggle}
                  sx={{ mr: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              
              <Tooltip title="Cart">
                <CartIndicator count={cartCount} />
              </Tooltip>
              
              <Tooltip title="Account">
                <IconButton
                  size={isSmallScreen ? "medium" : "large"}
                  edge="end"
                  aria-label="account of current user"
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                  sx={{ ml: 1 }}
                >
                  <Avatar 
                    sx={{ 
                      width: { xs: 28, sm: 32 }, 
                      height: { xs: 28, sm: 32 }, 
                      bgcolor: 'primary.main',
                      fontSize: { xs: '0.8rem', sm: '1rem' }
                    }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 2,
            minWidth: 180,
            boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
            mt: 1.5,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{userName}</Typography>
          <Typography variant="body2" color="text.secondary">{userEmail}</Typography>
          {isAdmin && (
            <Typography variant="caption" sx={{ 
              display: 'inline-block',
              mt: 0.5,
              px: 1,
              py: 0.25,
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 1,
              fontWeight: 500
            }}>
              Admin
            </Typography>
          )}
        </Box>
        <Divider />
        <MenuItem onClick={() => {
          handleMenuClose();
          router.push('/dashboard');
        }}>
          <ListItemIcon>
            <DashboardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Dashboard</ListItemText>
        </MenuItem>
        {isAdmin && (
          <MenuItem onClick={() => {
            handleMenuClose();
            router.push('/users');
          }}>
            <ListItemIcon>
              <UserIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>User Management</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleMobileMenuToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: '85%',
            maxWidth: 300,
          },
          display: { xs: 'block', md: 'none' },
        }}
      >
        {mobileMenuDrawer}
      </Drawer>
      
      {/* Content padding to account for the fixed AppBar */}
      <Box component="div" sx={{ 
        height: { xs: '56px', sm: '64px' },
        mb: 2
      }} />
    </>
  );
}

// Now let's update the MainLayout component to utilize the full width
export const updateMainLayout = `
// This is a comment to guide the implementation in MainLayout.tsx
// The MainLayout should be updated to use the full width of the screen
// by removing any side padding or margin that was previously accounting for the side navigation
`; 