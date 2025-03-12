import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  CircularProgress,
  Pagination,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import { QuestionCard } from './QuestionCard';
import { getQuestions } from '@/lib/database/queries';
import { addQuestionToCart } from '@/lib/client-actions';
import { useCartStore } from '@/store/cartStore';
import type { Question } from '@/types/question';

interface QuestionListProps {
  testId: string;
  filters?: {
    subject?: string[];
    module?: string[];
    topic?: string[];
    sub_topic?: string[];
    question_type?: string[];
    search?: string;
  };
  onFilterChange?: (filters: any) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  totalPages?: number;
  onTotalPagesChange?: (totalPages: number) => void;
  pageSize?: number;
  onAddToCart?: (questionId: number) => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  testId = 'default-test-id',
  filters = {},
  onFilterChange,
  currentPage = 1,
  onPageChange,
  totalPages: externalTotalPages,
  onTotalPagesChange,
  pageSize = 10,
  onAddToCart
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [page, setPage] = useState(currentPage);
  const [totalPages, setTotalPages] = useState(externalTotalPages || 1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // Get the addQuestion function from the cart store
  const addQuestionToStore = useCartStore(state => state.addQuestion);

  const fetchQuestions = async (currentPage: number) => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate network delay for testing
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await getQuestions({ 
        page: currentPage,
        pageSize,
        ...filters
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch questions');
      }

      if (result.questions && result.questions.length > 0) {
        setQuestions(result.questions);
        const newTotalPages = result.totalPages ?? 1;
        setTotalPages(newTotalPages);
        if (onTotalPagesChange) {
          onTotalPagesChange(newTotalPages);
        }
      } else {
        throw new Error('No questions found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred while fetching questions';
      
      console.error('Error fetching questions:', errorMessage);
      setError(errorMessage);
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update internal page when external currentPage changes
  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  // Fetch questions when page or filters change
  useEffect(() => {
    fetchQuestions(page);
  }, [page, filters, pageSize]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    if (onPageChange) {
      onPageChange(value);
    }
  };

  const handleAddToCart = async (question: Question) => {
    try {
      console.log('Adding question to cart:', question);
      
      // First, add to the local store for immediate UI update
      addQuestionToStore(question);
      
      // Then, add to the server-side cart
      const result = await addQuestionToCart(question.id, testId);
      
      // Show success message
      setSnackbarMessage(result.message || 'Question added to cart');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Call the parent component's onAddToCart callback if provided
      if (onAddToCart) {
        onAddToCart(question.id);
      }
    } catch (error) {
      console.error('Error adding question to cart:', error);
      setSnackbarMessage('Failed to add question to cart');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleRetry = () => {
    fetchQuestions(page);
  };

  // Render loading state
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100%"
        data-testid="loading-container"
      >
        <CircularProgress 
          data-testid="loading-spinner" 
          role="progressbar" 
          size={40}
        />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box 
        textAlign="center" 
        mt={4} 
        data-testid="error-container"
      >
        <Typography 
          variant="h6" 
          color="error" 
          data-testid="error-message"
        >
          Failed to load questions: {error}
        </Typography>
        <Button 
          onClick={handleRetry} 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          data-testid="retry-button"
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Render questions list
  return (
    <Box data-testid="questions-container">
      {questions.length === 0 ? (
        <Box 
          textAlign="center" 
          mt={4} 
          data-testid="no-questions-container"
        >
          <Typography variant="h6">
            No questions found
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {questions.map((question) => (
            <Grid 
              item 
              xs={12} 
              sm={6} 
              md={4} 
              key={question.id}
              data-testid={`question-item-${question.id}`}
            >
              <QuestionCard 
                question={question} 
                onAddToTest={() => handleAddToCart(question)}
                data-testid={`question-card-${question.id}`}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
            data-testid="pagination-controls"
          />
        </Box>
      )}
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
