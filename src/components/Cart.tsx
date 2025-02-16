'use client';

import React, { useState, useEffect } from 'react';
import { 
    List, 
    ListItem, 
    ListItemText, 
    Button, 
    Typography, 
    Box, 
    Chip,
    Divider,
    IconButton,
    Alert,
    Skeleton,
    CircularProgress
} from '@mui/material';
import { 
    Delete as DeleteIcon, 
    FileDownload as DownloadIcon 
} from '@mui/icons-material';
import { Question } from '@/lib/database/queries';
import ExportLoader from '@/components/ExportLoader';

interface CartProps {
    testId: string;
    onExport: (testId: string) => Promise<void>;
}

export default function Cart({ testId, onExport }: CartProps) {
    const [cartQuestions, setCartQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        async function fetchCartQuestions() {
            try {
                setLoading(true);
                setError(null);

                if (!testId) {
                    console.warn('No test ID provided');
                    setCartQuestions([]);
                    return;
                }

                const response = await fetch(`/api/cart?testId=${testId}`);
                
                console.log('Cart response status:', response.status);
                console.log('Cart response headers:', Object.fromEntries(response.headers.entries()));

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Cart error response text:', errorText);
                    
                    // Try to parse error JSON if possible
                    let errorDetails = {};
                    try {
                        errorDetails = JSON.parse(errorText);
                    } catch {
                        errorDetails = { error: errorText };
                    }

                    // Special handling for empty cart scenarios
                    if (response.status === 404 || errorDetails.error?.includes('No questions')) {
                        console.log('Empty cart detected');
                        setCartQuestions([]);
                        return;
                    }

                    throw new Error(
                        `Failed to fetch cart questions. Status: ${response.status}, ` +
                        `Details: ${JSON.stringify(errorDetails)}`
                    );
                }

                const responseData = await response.json();
                console.log('Cart response data:', responseData);

                // Handle different possible response structures
                const cartQuestionsData = Array.isArray(responseData) 
                    ? responseData 
                    : (responseData.data || []);

                // Validate each question
                const validCartQuestions = cartQuestionsData.filter(q => 
                    q && typeof q === 'object' && 
                    q.id !== undefined && 
                    q.question_text !== undefined
                );

                // If no valid questions, treat as empty cart
                if (validCartQuestions.length === 0) {
                    console.log('No valid questions found in cart');
                }

                setCartQuestions(validCartQuestions);
            } catch (error) {
                console.error('Full error in fetchCartQuestions:', error);
                
                // Set a user-friendly error message
                setError(
                    error instanceof Error 
                        ? `Unable to load cart questions: ${error.message}` 
                        : 'An unknown error occurred while loading cart questions'
                );
                setCartQuestions([]);
            } finally {
                setLoading(false);
            }
        }

        if (testId) {
            fetchCartQuestions();
        }
    }, [testId]);

    const handleRemoveQuestion = async (questionId: number) => {
        try {
            const response = await fetch(`/api/cart/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ questionId, testId }),
            });

            if (!response.ok) {
                throw new Error('Failed to remove question');
            }

            // Update local state
            setCartQuestions(prev => 
                prev.filter(q => q.id !== questionId)
            );
        } catch (error) {
            setError('Failed to remove question');
            console.error('Removal error:', error);
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            setError(null);
            await onExport(testId);
        } catch (error) {
            if (error instanceof Error) {
                setError(`Export failed: ${error.message}`);
            } else {
                setError('An unknown error occurred during export');
            }
            console.error('Export Error:', error);
        } finally {
            setExporting(false);
        }
    };

    // Render logic for empty cart
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (cartQuestions.length === 0) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                Your test cart is empty. Add questions to create a test.
            </Alert>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Your Test Questions ({cartQuestions.length})
            </Typography>

            <List>
                {cartQuestions.map((question, index) => (
                    <React.Fragment key={question.id}>
                        <ListItem 
                            secondaryAction={
                                <IconButton 
                                    edge="end" 
                                    aria-label="delete"
                                    onClick={() => handleRemoveQuestion(question.id)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            }
                        >
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="body1" sx={{ flexGrow: 1 }}>
                                            {question.question_text}
                                        </Typography>
                                        <Chip 
                                            label={question.difficulty_level} 
                                            color={
                                                question.difficulty_level === 'easy' ? 'success' :
                                                question.difficulty_level === 'medium' ? 'warning' :
                                                'error'
                                            } 
                                            size="small" 
                                        />
                                    </Box>
                                }
                                secondary={`${question.subject} | ${question.topic || 'No Topic'}`}
                            />
                        </ListItem>
                        {index < cartQuestions.length - 1 && <Divider />}
                    </React.Fragment>
                ))}
            </List>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                {exporting && <ExportLoader />}
                <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                    disabled={cartQuestions.length === 0 || exporting}
                    fullWidth
                >
                    Export Test to Excel
                </Button>
            </Box>
        </Box>
    );
}
