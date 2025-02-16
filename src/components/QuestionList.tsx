import React, { useState, useEffect, useCallback } from 'react';
import { 
    Grid, 
    Card, 
    CardContent, 
    Typography, 
    Chip, 
    CardActions,
    Skeleton,
    Alert,
    Button,
    Box
} from '@mui/material';
import { Question } from '@/lib/database/queries';
import PaginationControls from './PaginationControls';
import ErrorBoundary from './ErrorBoundary';
import CascadingFilters from './CascadingFilters';
import QuestionCard from './QuestionCard';
import TestCart from './TestCart';
import { addQuestionToCart } from '@/lib/actions';

interface QuestionListProps {
    filters?: {
        subject?: string[];
        module?: string[];
        topic?: string[];
        sub_topic?: string[];
        question_type?: string[];
        search?: string;
    };
    onFilterChange?: (filters: {
        subject?: string[];
        module?: string[];
        topic?: string[];
        sub_topic?: string[];
        question_type?: string[];
        search?: string;
    }) => void;
    testId: number;
}

export default function QuestionList({ 
    filters = {}, 
    onFilterChange,
    testId
}: QuestionListProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    });
    const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                setLoading(true);
                const currentPage = pagination?.page ?? 1;
                const pageSize = pagination?.pageSize ?? 10;
                
                // Build query parameters
                const queryParams = new URLSearchParams();
                
                // Add pagination params
                queryParams.set('page', currentPage.toString());
                queryParams.set('pageSize', pageSize.toString());
                
                // Add filter params
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== '') {
                        if (Array.isArray(value)) {
                            // For array values, join with commas
                            queryParams.set(key, value.join(','));
                        } else {
                            queryParams.set(key, value.toString());
                        }
                    }
                });

                console.log('Built query params:', Object.fromEntries(queryParams.entries()));

                console.log('Fetching questions with params:', Object.fromEntries(queryParams));

                const response = await fetch(`/api/questions?${queryParams}`);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Response status:', response.status);
                    console.error('Response headers:', Object.fromEntries(response.headers.entries()));
                    console.error('Error response text:', errorText);
                    throw new Error(`Failed to fetch questions. Status: ${response.status}, Text: ${errorText}`);
                }

                const responseData = await response.json();
                console.log('Received response data:', responseData);

                // Validate response structure
                if (!responseData || !responseData.data || !Array.isArray(responseData.data)) {
                    throw new Error('Invalid response format: data is not an array');
                }

                // Validate questions data
                const validQuestions = responseData.data.filter(q => 
                    q && typeof q === 'object' && 
                    typeof q.Question === 'string' && 
                    typeof q.Answer === 'string' && 
                    typeof q.Subject === 'string'
                );

                console.log('Valid questions:', validQuestions);
                setQuestions(validQuestions);
                
                // Update pagination state
                if (responseData.pagination) {
                    setPagination({
                        page: responseData.pagination.currentPage,
                        pageSize: responseData.pagination.pageSize,
                        total: responseData.pagination.totalItems,
                        totalPages: responseData.pagination.totalPages
                    });
                }

                setError(null);
            } catch (error) {
                console.error('Full error in fetchQuestions:', error);
                setError(error instanceof Error ? error.message : 'An unknown error occurred');
                setQuestions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [filters, pagination?.page, pagination?.pageSize]);

    const handleFilterChange = useCallback((filterParams: {
        subject?: string[];
        module?: string[];
        topic?: string[];
        sub_topic?: string[];
        question_type?: string[];
        search?: string;
    }) => {
        console.log('Filter params:', filterParams);
        // Reset to first page when filters change
        setPagination(prev => ({ ...prev, page: 1 }));
        // Update parent component's filters
        if (onFilterChange) {
            onFilterChange(filterParams);
        }
    }, [onFilterChange]);

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleAddToTest = async (questionId: number) => {
        try {
            // Call server action to add question to cart
            await addQuestionToCart(questionId, testId);

            const questionToAdd = questions.find(q => q.id === questionId);
            if (questionToAdd && !selectedQuestions.some(q => q.id === questionId)) {
                setSelectedQuestions([...selectedQuestions, questionToAdd]);
            }
        } catch (error) {
            console.error('Error adding question to cart:', error);
            // Optional: show error notification to user
        }
    };

    const handleEdit = (question: Question) => {
        console.log('Editing question:', question);
        // TODO: Implement edit functionality
    };

    const handleRemoveFromTest = async (questionId: number) => {
        setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
    };

    const renderQuestionContent = () => {
        if (loading) {
            return (
                <Grid container spacing={2}>
                    {[...Array(10)].map((_, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Box sx={{ height: '100%' }}>
                                <Skeleton variant="rectangular" height={200} />
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            );
        }

        const safeQuestions = Array.isArray(questions) ? questions : [];

        if (safeQuestions.length === 0) {
            return (
                <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
                    No questions found. Try adjusting your filters.
                </Typography>
            );
        }

        return (
            <Grid container spacing={2}>
                {safeQuestions.map((question, index) => {
                    if (!question) return null;

                    return (
                        <Grid item xs={12} sm={6} md={4} key={`${index}-${question.id || 'no-id'}-${question.Subject || 'no-subject'}-${question.Topic || 'no-topic'}-${question.Question.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '-')}`}>
                            <QuestionCard
                                question={question}
                                onAddToTest={handleAddToTest}
                                onEdit={handleEdit}
                            />
                        </Grid>
                    );
                })}
            </Grid>
        );
    };

    if (error) return <ErrorBoundary error={new Error(error)} reset={() => setError(null)} />;

    return (
        <Box>
            <CascadingFilters 
                onFilterChange={(filters) => {
                    console.log('CascadingFilters filters:', filters);
                    handleFilterChange(filters);
                }} 
            />
            
            {renderQuestionContent()}
            
            {questions && questions.length > 0 && (
                <PaginationControls 
                    data-testid="pagination-controls"
                    currentPage={pagination.page} 
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                />
            )}
        </Box>
    );
}
