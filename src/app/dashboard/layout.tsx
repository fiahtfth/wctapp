'use client';

import React, { useState, useEffect } from 'react';
import { 
    Box, 
    AppBar, 
    Toolbar, 
    Typography, 
    IconButton, 
    Button,
    Dialog,
    DialogTitle,
    DialogContent
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useRouter } from 'next/navigation';
import CartIndicator from '@/components/CartIndicator';
import { addQuestionToCart, getCartItems } from '@/lib/actions';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    // Load cart count on mount
    useEffect(() => {
        const fetchCartCount = async () => {
            try {
                const cartItems = await getCartItems();
                setCartCount(cartItems.length);
            } catch (error) {
                console.error('Failed to fetch cart items', error);
            }
        };
        fetchCartCount();
    }, []);

    const handleLogout = () => {
        setLogoutDialogOpen(true);
    };

    const confirmLogout = () => {
        // Implement logout logic
        router.push('/login');
    };

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh',
            bgcolor: '#f5f5f7'
        }}>
            {/* Navbar */}
            <AppBar 
                position="static" 
                color="transparent" 
                elevation={0} 
                sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.85)', 
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
            >
                <Toolbar 
                    sx={{ 
                        minHeight: '48px !important', 
                        px: { xs: 1, sm: 2, md: 3 },
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                            variant="h6" 
                            onClick={() => window.location.reload()}
                            sx={{ 
                                fontSize: '1.1rem', 
                                fontWeight: 600,
                                color: 'text.primary',
                                letterSpacing: '-0.5px',
                                cursor: 'pointer',
                                '&:hover': {
                                    color: 'primary.main'
                                }
                            }}
                        >
                            Weekly Test Creator
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton 
                            color="inherit"
                            onClick={() => setDrawerOpen(true)}
                            sx={{ 
                                p: 0.75,
                                transition: 'all 0.2s',
                                '& .MuiSvgIcon-root': { 
                                    fontSize: '1.25rem',
                                    transition: 'all 0.2s'
                                },
                                '&:hover': {
                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                    '& .MuiSvgIcon-root': {
                                        transform: 'scale(1.1)'
                                    }
                                }
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <CartIndicator count={cartCount} />
                        <Button 
                            variant="outlined"
                            color="primary"
                            onClick={() => router.push('/dashboard')}
                            sx={{ 
                                fontSize: '0.8rem',
                                textTransform: 'none',
                                px: 1,
                                py: 0.5,
                                mr: 1,
                                borderRadius: 2,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    backgroundColor: 'primary.light',
                                    color: 'white',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            Dashboard
                        </Button>
                        <Button 
                            variant="outlined"
                            color="error"
                            onClick={handleLogout}
                            sx={{ 
                                fontSize: '0.8rem',
                                textTransform: 'none',
                                px: 1,
                                py: 0.5,
                                borderRadius: 2,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    backgroundColor: 'error.light',
                                    color: 'white',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            Logout
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Box sx={{ flex: 1, p: 3 }}>
                {children}
            </Box>

            {/* Logout Confirmation Dialog */}
            <Dialog
                open={logoutDialogOpen}
                onClose={() => setLogoutDialogOpen(false)}
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: 2,
                        minWidth: 300
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    Confirm Logout
                </DialogTitle>
                <DialogContent sx={{ pb: 2 }}>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            mb: 0.5,
                            display: 'block'  
                        }}
                    >
                        Are you sure you want to logout?
                    </Typography>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        mt: 2 
                    }}>
                        <Button 
                            onClick={() => setLogoutDialogOpen(false)} 
                            color="secondary"
                            sx={{ mr: 1 }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={confirmLogout} 
                            color="error" 
                            variant="contained"
                        >
                            Logout
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
