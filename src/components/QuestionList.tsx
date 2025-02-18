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
import { CascadingFilters } from './CascadingFilters';
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
    testId: string;
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
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

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
                if (!responseData || !responseData.questions || !Array.isArray(responseData.questions)) {
                    throw new Error('Invalid response format: questions is not an array');
                }

                // Validate questions data
                const validQuestions = responseData.questions.filter((q: any) => 
                    q && typeof q === 'object' && 
                    typeof q.Question === 'string' && 
                    typeof q.Answer === 'string' && 
                    typeof q.Subject === 'string'
                );

                console.log('Valid questions:', validQuestions);
                setQuestions(validQuestions);
                
                // Update pagination state
                setPagination({
                    page: responseData.page,
                    pageSize: responseData.pageSize,
                    total: responseData.total,
                    totalPages: Math.ceil(responseData.total / responseData.pageSize)
                });

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
        setEditingQuestion(question);
    };

    const handleSaveEdit = async () => {
        if (!editingQuestion) return;

        try {
            console.group('Question Edit Process');
            console.log('Original Editing Question:', JSON.parse(JSON.stringify(editingQuestion)));

            // Create a deep copy of the editing question to avoid mutation
            const questionToSave = JSON.parse(JSON.stringify(editingQuestion));

            // Validate key fields before sending
            const requiredFields = ['Question', 'Answer', 'Subject', 'Topic', 'id'];
            const missingFields = requiredFields.filter(field => !questionToSave[field]);
            
            if (missingFields.length > 0) {
                console.error('Cannot save question. Missing required fields:', missingFields);
                console.groupEnd();
                return;
            }

            // Validate Difficulty Level
            const validDifficultyLevels = ['Easy', 'Medium', 'Hard'];
            if (questionToSave['Difficulty Level'] && 
                !validDifficultyLevels.includes(questionToSave['Difficulty Level'])) {
                console.error('Invalid Difficulty Level. Must be one of:', validDifficultyLevels);
                console.groupEnd();
                return;
            }

            console.log('Attempting to save question:', JSON.parse(JSON.stringify(questionToSave)));

            // Ensure id is present and is a number
            if (!questionToSave.id || typeof questionToSave.id !== 'number') {
                throw new Error('Invalid question ID');
            }

            const response = await fetch('/api/questions/edit', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...questionToSave,
                    id: Number(questionToSave.id) // Ensure ID is a number
                })
            });

            console.log('Edit response status:', response.status);
            console.log('Edit response headers:', Object.fromEntries(response.headers));

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Edit error response:', errorData);
                console.groupEnd();
                throw new Error(errorData.error || 'Failed to update question');
            }

            const updatedQuestion = await response.json();
            console.log('Updated question from server:', JSON.parse(JSON.stringify(updatedQuestion)));

            // Update local questions list
            const updatedQuestions = questions.map(q => 
                q.id === updatedQuestion.id ? updatedQuestion : q
            );
            
            console.log('Updated Questions List:', JSON.parse(JSON.stringify(updatedQuestions)));
            setQuestions(updatedQuestions);

            // Close edit modal
            setEditingQuestion(null);

            console.log('Question updated successfully');
            console.groupEnd();

            // Optional: Show success notification
        } catch (error) {
            console.error('Error updating question:', error);
            // TODO: Show error notification to user
            console.groupEnd();
        }
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

                    const uniqueKey = `question-${question.id || 'no-id'}-${index}-${question.Subject || 'no-subject'}-${question.Topic || 'no-topic'}-${question.Question.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '-')}`;

                    return (
                        <Grid item xs={12} sm={6} md={4} key={uniqueKey}>
                            <QuestionCard
                                key={uniqueKey}
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
                key={`cascading-filters-${Object.keys(filters).join('-')}`}
                onFilterChange={(filters) => {
                    console.log('CascadingFilters filters:', filters);
                    handleFilterChange(filters);
                }} 
            />
            
            {renderQuestionContent()}
            
            {questions && questions.length > 0 && (
                <PaginationControls 
                    key={`pagination-${pagination.page}-${pagination.totalPages}`}
                    data-testid="pagination-controls"
                    currentPage={pagination.page} 
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                />
            )}
        </Box>
    );
}
