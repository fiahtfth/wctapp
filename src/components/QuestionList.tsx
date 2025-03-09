import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  CircularProgress,
  Pagination,
  Button
} from '@mui/material';
import { QuestionCard } from './QuestionCard';
import { getQuestions } from '@/lib/database/queries';
import { addQuestionToCart } from '@/lib/client-actions';
import type { Question } from '@/types/question';

export const QuestionList: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async (currentPage: number) => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate network delay for testing
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await getQuestions({ page: currentPage });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch questions');
      }

      if (result.questions && result.questions.length > 0) {
        setQuestions(result.questions);
        setTotalPages(result.totalPages ?? 1);
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

  useEffect(() => {
    fetchQuestions(page);
  }, [page]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleAddToCart = async (question: Question) => {
    try {
      await addQuestionToCart(question.id, 'default-test-id');
    } catch (error) {
      console.error('Error adding question to cart:', error);
    }
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
    </Box>
  );
};
