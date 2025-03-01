import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Pagination,
  CircularProgress,
  Alert
} from '@mui/material';
import { QuestionCard } from './QuestionCard';
import { CascadingFilters } from './CascadingFilters';
import type { Question } from '@/types/question';



interface QuestionListProps {
  filters?: {
    subject?: string[];
    module?: string[];
    topic?: string[];
    sub_topic?: string[];
    question_type?: string[];
    search?: string;
  } | null;
  onFilterChange?: (filters: {
    subject?: string[];
    module?: string[];
    topic?: string[];
    sub_topic?: string[];
    question_type?: string[];
    search?: string;
  }) => void;
  testId?: string;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  totalPages?: number;
  onTotalPagesChange?: (pages: number) => void;
  onAddToCart?: (questionId: number) => Promise<void>;
}

export default function QuestionList({
  filters,
  onFilterChange,
  testId,
  currentPage,
  pageSize,
  onPageChange,
  totalPages,
  onTotalPagesChange,
  onAddToCart,
}: QuestionListProps) {
  // Comprehensive default filters
  const defaultFilters = {
    subject: [],
    module: [],
    topic: [],
    sub_topic: [],
    question_type: [],
    search: ''
  };

  // Safely merge provided filters with default filters
  const safeFilters = filters ?? defaultFilters;

  const {
    subject = [],
    module: moduleFilters = [],
    topic: topicFilters = [],
    sub_topic: subTopicFilters = [],
    question_type: questionTypeFilters = [],
    search: searchFilter = ''
  } = safeFilters;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const usedTestId = testId ?? 'question-list';
  const usedCurrentPage = currentPage ?? 1;
  const usedPageSize = pageSize ?? 10;
  const usedTotalPages = totalPages ?? 1;

  // Fetch questions based on filters
  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      // Log debug information
      const debugPayload = {
        filters: safeFilters,
        page: usedCurrentPage,
        pageSize: usedPageSize
      };
      setDebugInfo(debugPayload);

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          page: usedCurrentPage,
          pageSize: usedPageSize,
          filters: safeFilters || {},
          ...(searchFilter ? { search: searchFilter } : {})
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const responseData = await response.json();
      
      // Validate response structure
      if (!responseData || typeof responseData !== 'object') {
        throw new Error('Invalid response format: response is not an object');
      }

      const { questions, total } = responseData;

      // Validate questions
      if (!Array.isArray(questions)) {
        throw new Error(`Invalid response format: questions is not an array. Received: ${JSON.stringify(questions)}`);
      }

      setQuestions(questions);
      
      // Calculate total pages
      const calculatedTotalPages = Math.ceil(total / usedPageSize);
      onTotalPagesChange?.(calculatedTotalPages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setQuestions([]);
      
      // Log full error details
      console.error('Fetch Questions Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch questions when filters or page changes
  useEffect(() => {
    fetchQuestions();
  }, [usedCurrentPage, JSON.stringify(safeFilters)]);

  // Handle filter changes from CascadingFilters
  const handleFilterChange = (newFilters: {
    subject?: string[];
    module?: string[];
    topic?: string[];
    questionType?: string[];
    search?: string;
  }) => {
    const mappedFilters = {
      subject: newFilters.subject,
      module: newFilters.module,
      topic: newFilters.topic,
      question_type: newFilters.questionType,
      search: newFilters.search
    };

    onFilterChange?.(mappedFilters);
  };

  // Render method
  return (
    <Box 
      id={usedTestId} 
      data-testid="question-list-mock"  
      sx={{ width: '100%' }}
    >
      {/* Debug Information */}
      {debugInfo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Debug Info: {JSON.stringify(debugInfo)}
          </Typography>
        </Alert>
      )}

      {/* Cascading Filters */}
      <CascadingFilters 
        onFilterChange={handleFilterChange}
        subject={subject}
        module={moduleFilters}
        topic={topicFilters}
        questionType={questionTypeFilters}
        search={searchFilter}
      />

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {/* Questions Grid */}
      {!loading && !error && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {questions.map((question) => (
            <Grid item xs={12} sm={6} md={4} key={question.id}>
              <QuestionCard 
                question={question} 
                onAddToCart={onAddToCart} 
                testId={usedTestId} 
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {!loading && !error && questions.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination 
            count={usedTotalPages} 
            page={usedCurrentPage} 
            onChange={(_, page) => onPageChange?.(page)} 
            color="primary" 
          />
        </Box>
      )}

      {/* No Questions State */}
      {!loading && !error && questions.length === 0 && (
        <Typography variant="body1" align="center" sx={{ mt: 4, color: 'text.secondary' }}>
          No questions found matching your filters.
        </Typography>
      )}
    </Box>
  );
}
