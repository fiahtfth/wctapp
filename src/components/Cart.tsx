'use client';

import React, { useEffect, useState } from 'react';
import { 
    Typography, 
    Box, 
    Button, 
    Container,
    Grid,
    Paper,
    Snackbar,
    Alert,
    IconButton
} from '@mui/material';
import { 
    Delete as DeleteIcon,
    ArrowBack as ArrowBackIcon,
    RemoveCircleOutline as RemoveCircleIcon
} from '@mui/icons-material';
import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QuestionCard from './QuestionCard';

export default function Cart() {
    const [mounted, setMounted] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [removedQuestion, setRemovedQuestion] = useState<string | null>(null);
    const { questions, removeQuestion, clearCart } = useCartStore();
    const router = useRouter();

    useEffect(() => {
        // Ensure this only runs on the client
        setMounted(true);
        // Hydrate the store
        useCartStore.persist.rehydrate();
        
        // Log cart contents on mount
        console.log('Cart Component Mounted, Current Questions:', questions);
    }, []);

    const handleRemoveQuestion = (questionId: string) => {
        console.log('Attempting to remove question from cart:', questionId);
        
        // Find the question being removed (for snackbar)
        const removedQuestionDetails = questions.find(q => q.id === questionId);
        
        // Remove the question
        removeQuestion(questionId);
        
        // Set snackbar state
        if (removedQuestionDetails) {
            setRemovedQuestion(removedQuestionDetails.text || 'Question');
            setSnackbarOpen(true);
        }

        console.log('Updated cart after removal:', useCartStore.getState().questions);
    };

    const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    if (!mounted) {
        return (
            <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography>Loading...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.back()}
                        variant="outlined"
                    >
                        Back to Questions
                    </Button>
                    <Typography variant="h5" component="h1">
                        Cart ({questions.length} items)
                    </Typography>
                    {questions.length > 0 && (
                        <Button
                            onClick={() => {
                                console.log('Clearing entire cart');
                                clearCart();
                            }}
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                        >
                            Clear Cart
                        </Button>
                    )}
                </Box>

                {questions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Your cart is empty
                        </Typography>
                        <Button
                            component={Link}
                            href="/questions"
                            variant="contained"
                            color="primary"
                            sx={{ mt: 2 }}
                        >
                            Browse Questions
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={3} position="relative">
                        {questions.map((question) => (
                            <Grid item xs={12} sm={6} md={4} key={question.id} position="relative">
                                <QuestionCard 
                                    question={question}
                                    initialInCart={true}
                                    showCartButton={false}
                                />
                                <IconButton
                                    onClick={() => handleRemoveQuestion(question.id)}
                                    sx={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        zIndex: 10,
                                        backgroundColor: 'rgba(255,255,255,0.7)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255,100,100,0.2)'
                                        }
                                    }}
                                    title="Remove from Cart"
                                >
                                    <RemoveCircleIcon color="error" />
                                </IconButton>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Paper>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity="info" 
                    sx={{ width: '100%' }}
                >
                    {removedQuestion} removed from cart
                </Alert>
            </Snackbar>
        </Container>
    );
}
