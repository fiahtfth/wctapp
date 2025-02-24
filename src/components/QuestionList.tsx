import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Box,
  Typography,
  Skeleton,
  Pagination,
  Chip,
  CardActions,
  Alert,
  Button,
} from '@mui/material';
import { Question } from '@/types/question';
import PaginationControls from './PaginationControls';
import ErrorBoundary from './ErrorBoundary';
import { CascadingFilters } from './CascadingFilters';
import TestCart from './TestCart';
import { addQuestionToCart } from '@/lib/actions';
import { QuestionCard } from './QuestionCard';
import EditQuestionModal from './EditQuestionModal';

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
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  onTotalPagesChange: (pages: number) => void;
}

interface ErrorState {
  type: 'fetch' | 'general';
  message: string;
  details?: string;
  filters?: Record<string, string[] | string | undefined>;
}

export default function QuestionList({
  filters = {},
  onFilterChange,
  testId,
  currentPage,
  pageSize,
  onPageChange,
  totalPages,
  onTotalPagesChange,
}: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Log initial filters for debugging
  useEffect(() => {
    console.log('Initial QuestionList filters:', filters);
  }, [filters]);

  // Fetch questions with enhanced error handling
  const fetchQuestions = async () => {
    try {
      // Reset loading and error states
      setLoading(true);
      setError(null);

      // Prepare filters for the API call
      const sanitizedFilters: Record<string, string | string[]> = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.length > 0) {
          sanitizedFilters[key] = value;
        }
      });

      console.log('Fetching Questions with Filters:', {
        page: currentPage,
        pageSize,
        filters: sanitizedFilters
      });

      // Set a timeout to prevent indefinite loading
      const timeoutId = setTimeout(() => {
        setError({
          type: 'fetch',
          message: 'Request timed out. Please try again.',
          filters: sanitizedFilters
        });
        setLoading(false);
      }, 15000); // 15 seconds timeout

      try {
        // Prepare request body
        const requestBody = {
          page: currentPage,
          pageSize,
          ...sanitizedFilters
        };

        console.log('🔍 Request Details:', {
          url: '/api/questions',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        });

        // Fetch questions from the database with comprehensive parameters
        const response = await fetch('/api/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        // Clear timeout
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();

        console.log('Received response data:', responseData);

        // Comprehensive response validation
        if (!responseData) {
          throw new Error('Empty response received from server');
        }

        // Validate response structure
        if (!responseData.questions || !Array.isArray(responseData.questions)) {
          console.error('Invalid response structure:', responseData);
          throw new Error('Invalid response format: questions is not an array');
        }

        // Validate questions data
        const validQuestions = responseData.questions.filter((q: any) => {
          const isValid = q &&
            typeof q === 'object' &&
            q.hasOwnProperty('id') &&
            q.hasOwnProperty('Question') &&
            q.hasOwnProperty('Answer') &&
            q.hasOwnProperty('Subject');

          if (!isValid) {
            console.warn('Invalid question found:', q);
          }

          return isValid;
        });

        // Update state with validated data
        setQuestions(validQuestions);
        setTotalQuestions(responseData.total || 0);
        
        // Update total pages if provided
        if (responseData.totalPages) {
          onTotalPagesChange(responseData.totalPages);
        } else {
          // Calculate total pages if not provided
          const calculatedTotalPages = Math.ceil((responseData.total || 0) / 1000);
          onTotalPagesChange(calculatedTotalPages);
        }

        setLoading(false);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('Fetch Questions Error:', {
          error: fetchError,
          filters: sanitizedFilters,
          page: currentPage,
          pageSize: 1000
        });

        setError({
          type: 'fetch',
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          details: fetchError instanceof Error ? fetchError.stack : undefined,
          filters: sanitizedFilters
        });
        setLoading(false);
      }
    } catch (generalError) {
      console.error('General Fetch Questions Error:', generalError);
      setError({
        type: 'general',
        message: generalError instanceof Error ? generalError.message : String(generalError),
        details: generalError instanceof Error ? generalError.stack : undefined
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [filters, currentPage]);

  const handleFilterChange = useCallback(
    (filterParams: {
      subject?: string[];
      module?: string[];
      topic?: string[];
      sub_topic?: string[];
      question_type?: string[];
      search?: string;
    }) => {
      console.log('Filter params:', filterParams);
      // Reset to first page when filters change
      onPageChange(1);
      // Update parent component's filters
      if (onFilterChange) {
        onFilterChange(filterParams);
      }
    },
    [onFilterChange]
  );

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
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedQuestion: Question) => {
    // Implement the logic to update the question in the database
    const response = await fetch(`/api/questions/edit`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedQuestion),
    });
    if (response.ok) {
        const newQuestion = await response.json();
        handleQuestionUpdate(newQuestion);
    } else {
        console.error('Failed to update question');
    }
  };

  const handleRemoveFromTest = async (questionId: number) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
  };

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    console.group('Question List Update');
    console.log('Updating question:', updatedQuestion);
    // Replace the question in the existing list
    setQuestions(prevQuestions =>
      prevQuestions.map(q => (q.id === updatedQuestion.id ? updatedQuestion : q))
    );
    // If the updated question was the editing question, reset editing state
    if (editingQuestion && editingQuestion.id === updatedQuestion.id) {
      setEditingQuestion(null);
    }
    console.log('Updated questions list');
    console.groupEnd();
  };

  const renderQuestionContent = () => {
    if (loading) {
      return (
        <Grid container spacing={2}>
          {[...Array(9)].map((_, index) => (
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
        {safeQuestions.slice(0, 9).map((question, index) => {
          if (!question) return null;
          const uniqueKey = `question-${question.id || 'no-id'}-${index}-${question.Subject || 'no-subject'}-${question.Topic || 'no-topic'}-${question.Question.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '-')}`;
          return (
            <Grid item xs={12} sm={6} md={4} key={uniqueKey}>
              <QuestionCard
                key={uniqueKey}
                question={question}
                onAddToTest={handleAddToTest}
                onEdit={handleEdit}
                onQuestionUpdate={handleQuestionUpdate}
              />
            </Grid>
          );
        })}
      </Grid>
    );
  };

  if (error) return <ErrorBoundary error={new Error(error.message)} reset={() => setError(null)} />;

  return (
    <>
      <EditQuestionModal
        open={isEditModalOpen}
        question={editingQuestion}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveEdit}
      />
      <Box>
        <CascadingFilters
          onFilterChange={filters => {
            console.log('CascadingFilters filters:', filters);
            handleFilterChange(filters);
          }}
        />
        {renderQuestionContent()}
        <Box display='flex' justifyContent='center' mt={4}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => onPageChange(page)}
            color='primary'
          />
        </Box>
      </Box>
    </>
  );
}

interface QuestionCardProps {
  key?: string;
  question: Question;
  onAddToTest?: (questionId: number) => Promise<void>;
  onEdit?: (question: Question) => void;
  onQuestionUpdate?: (updatedQuestion: Question) => void;
}
