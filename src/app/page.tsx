'use client';

import React, { useState } from 'react';
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
    Paper
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { createTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';

import QuestionList from '@/components/QuestionList';
import { addQuestionToCart } from '@/lib/actions';

export default function Home() {
    const [testId] = useState(uuidv4());
    const [filters, setFilters] = useState<{
        subject?: string[];
        module?: string[];
        topic?: string[];
        sub_topic?: string[];
        question_type?: string[];
        search?: string;
    }>({});
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleAddToTest = async (questionId: number) => {
        try {
            await addQuestionToCart(questionId, testId);
        } catch (error) {
            console.error('Error adding question to cart:', error);
        }
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
                                onClick={() => {
                                    // Navigate to cart/selected questions
                                    setDrawerOpen(true);
                                }}
                                sx={{ 
                                    p: 0.75,
                                    '& .MuiSvgIcon-root': { 
                                        fontSize: '1.25rem' 
                                    },
                                    '&:hover': {
                                        backgroundColor: 'rgba(0,0,0,0.05)'
                                    }
                                }}
                            >
                                <AddShoppingCartIcon />
                            </IconButton>
                            <Button 
                                variant="outlined"
                                color="error"
                                onClick={() => {
                                    // TODO: Implement actual logout logic
                                    alert('Logout functionality to be implemented');
                                }}
                                sx={{ 
                                    fontSize: '0.8rem',
                                    textTransform: 'none',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 2,
                                    '&:hover': {
                                        backgroundColor: 'error.light',
                                        color: 'white'
                                    }
                                }}
                            >
                                Logout
                            </Button>
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
                            onFilterChange={setFilters} 
                            filters={filters}
                            onAddToTest={handleAddToTest}
                        />
                    </Paper>
                </Container>

            </Box>
        </ThemeProvider>
    );
}
