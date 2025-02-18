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
import CloseIcon from '@mui/icons-material/Close';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';

import QuestionList from '@/components/QuestionList';
import CartIndicator from '@/components/CartIndicator';
import { addQuestionToCart, getCartItems } from '@/lib/actions';
import { useRouter } from 'next/navigation';

export default function Home() {
    const [testId] = useState("home-question-list");
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
    const router = useRouter();

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
                            testId={"home-question-list"}
                        />
                    </Paper>
                </Container>

            </Box>
        </ThemeProvider>
    );
}
