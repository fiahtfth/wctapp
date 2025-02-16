'use client';

import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Container, 
    Typography, 
    ThemeProvider, 
    CssBaseline,
    AppBar,
    Toolbar,
    Button,
    IconButton,
    Drawer,
    Grid,
    Paper,
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { createTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';

import QuestionList from '@/components/QuestionList';
import { addQuestionToCart, getCartItems } from '@/lib/actions';

export default function Home() {
    const [testId] = useState(uuidv4());
    const [cartCount, setCartCount] = useState(0);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [filters, setFilters] = useState<{
        subject?: string[];
        module?: string[];
        topic?: string[];
        sub_topic?: string[];
        question_type?: string[];
        search?: string;
    }>({});
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Load cart count on mount
    useEffect(() => {
        const loadCartCount = async () => {
            try {
                const items = await getCartItems(testId);
                setCartCount(items.length);
            } catch (error) {
                console.error('Error loading cart count:', error);
            }
        };
        loadCartCount();
    }, [testId]);

    const handleAddToTest = async (questionId: number) => {
        try {
            await addQuestionToCart(questionId, testId);
            setCartCount(prev => prev + 1);
        } catch (error) {
            console.error('Error adding question to cart:', error);
        }
    };

    const handleLogout = () => {
        setLogoutDialogOpen(true);
    };

    const confirmLogout = () => {
        // TODO: Implement actual logout logic here
        window.location.href = '/login'; // Redirect to login page
    };

    const theme = createTheme({
        palette: {
            mode: 'light',
            primary: {
                main: '#1976d2',
            },
        },
    });

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
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
                                <Badge 
                                    badgeContent={cartCount} 
                                    color="primary"
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            fontSize: '0.7rem',
                                            height: '18px',
                                            minWidth: '18px'
                                        }
                                    }}
                                >
                                    <AddShoppingCartIcon />
                                </Badge>
                            </IconButton>
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
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        Are you sure you want to logout?
                                    </Typography>
                                </DialogContent>
                                <DialogActions sx={{ px: 3, pb: 2 }}>
                                    <Button 
                                        onClick={() => setLogoutDialogOpen(false)}
                                        variant="text"
                                        sx={{ 
                                            textTransform: 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={confirmLogout}
                                        variant="contained"
                                        color="error"
                                        sx={{ 
                                            textTransform: 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Logout
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </Box>
                    </Toolbar>
                </AppBar>

                {/* Mobile Drawer Menu */}
                <Drawer
                    anchor="right"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    sx={{ 
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { width: '100%' } 
                    }}
                >
                    <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Menu</Typography>
                            <IconButton onClick={() => setDrawerOpen(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </Drawer>

                {/* Main Content */}
                <Container 
                    maxWidth="xl" 
                    sx={{ 
                        flexGrow: 1, 
                        py: 1,
                        px: { xs: 1, sm: 2, md: 3 },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                    }}
                >
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            overflow: 'hidden',
                            border: 1,
                            borderColor: 'divider'
                        }}
                    >
                        <QuestionList 
                            filters={filters} 
                            onFilterChange={(newFilters) => {
                                setFilters(newFilters);
                            }}
                            testId={testId}
                        />
                    </Paper>
                </Container>

            </Box>
        </ThemeProvider>
    );
}
