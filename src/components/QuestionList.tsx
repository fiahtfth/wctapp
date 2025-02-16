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
import PaginationControls from '@/components/PaginationControls';
import ErrorBoundary from '@/components/ErrorBoundary';
import CascadingFilters from '@/components/CascadingFilters';

interface QuestionListProps {
    filters?: {
        subject?: string[];
        module?: string[];
        topic?: string[];
        sub_topic?: string[];
        question_type?: string[];
        search?: string;
    };
    onAddToTest?: (questionId: number) => Promise<void>;
    onFilterChange?: (filters: {
        subject?: string[];
        module?: string[];
        topic?: string[];
        sub_topic?: string[];
        question_type?: string[];
        search?: string;
    }) => void;
}

export default function QuestionList({ 
    filters = {}, 
    onAddToTest,
    onFilterChange 
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

    const renderQuestionContent = () => {
        // Add logging to understand the state
        console.log('Rendering questions:', {
            questions, 
            loading, 
            questionsType: typeof questions, 
            questionsLength: questions?.length
        });

        if (loading) {
            return (
                <Grid container spacing={2}>
                    {[...Array(10)].map((_, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card>
                                <CardContent>
                                    <Skeleton variant="text" width="60%" />
                                    <Skeleton variant="rectangular" height={100} sx={{ mt: 1 }} />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            );
        }

        // Ensure questions is an array before mapping
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
                    // Add additional null checks
                    if (!question) return null;

                    return (
                        <Grid item xs={12} sm={6} md={4} key={`${index}-${question.id || 'no-id'}-${question.Subject || 'no-subject'}-${question.Topic || 'no-topic'}-${question.Question.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '-')}`}>
                            <Card>
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">
                                        {question.Subject || 'Unknown Subject'} | {question.Topic || 'Unknown Topic'}
                                    </Typography>
                                    <Typography variant="body1" sx={{ mt: 1 }}>
                                        {typeof question.Question === 'string' 
                                            ? (question.Question.length > 100 
                                                ? question.Question.substring(0, 100) + '...' 
                                                : question.Question)
                                            : 'No question text available'}
                                    </Typography>
                                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                        {console.log('Question difficulty details:', {
                                            difficultyLevel: question['Difficulty Level'],
                                            natureOfQuestion: question['Nature of Question']
                                        })}
                                        <Chip 
                                            label={question['Difficulty Level'] || 'Unknown'} 
                                            size="small" 
                                            color={
                                                question['Difficulty Level'] === 'easy' ? 'success' :
                                                question['Difficulty Level'] === 'medium' ? 'warning' :
                                                'error'
                                            } 
                                        />
                                        <Chip 
                                            label={question['Nature of Question'] || 'Unknown'} 
                                            size="small" 
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
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
