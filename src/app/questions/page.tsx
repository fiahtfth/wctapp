'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Snackbar, 
  Alert 
} from '@mui/material';
import QuestionList from '@/components/QuestionList';

export default function QuestionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<{
    subject?: string[];
    module?: string[];
    topic?: string[];
    sub_topic?: string[];
    question_type?: string[];
    search?: string;
  }>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  const searchParams = useSearchParams();
  const router = useRouter();
  const testId = searchParams.get('testId') || '';

  // Extract initial filters from search params
  useEffect(() => {
    const initialFilters: {
      subject?: string[];
      module?: string[];
      topic?: string[];
      sub_topic?: string[];
      question_type?: string[];
      search?: string;
    } = {};

    // Convert search params to filter object
    searchParams.forEach((value, key) => {
      switch (key) {
        case 'subject':
        case 'module':
        case 'topic':
        case 'sub_topic':
        case 'question_type':
          initialFilters[key] = value.split(',');
          break;
        case 'search':
          initialFilters[key] = value;
          break;
        case 'page':
          setCurrentPage(parseInt(value, 10) || 1);
          break;
      }
    });

    setFilters(initialFilters);
  }, [searchParams]);

  // Update URL based on filters and page
  useEffect(() => {
    const params = new URLSearchParams();

    // Add filters to URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, Array.isArray(value) ? value.join(',') : value);
      }
    });

    // Add page to URL
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }

    // Update URL without triggering a page reload
    router.replace(`/questions?${params.toString()}`, { scroll: false });
  }, [filters, currentPage]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: {
    subject?: string[];
    module?: string[];
    topic?: string[];
    sub_topic?: string[];
    question_type?: string[];
    search?: string;
  }) => {
    // Reset to first page when filters change
    setCurrentPage(1);
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  };

  // Handle adding question to cart/test
  const handleAddToCart = async (questionId: number) => {
    if (!testId) {
      setSnackbarMessage('Please select a test first');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          testId, 
          questionId 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add question to test');
      }

      setSnackbarMessage('Question added to test successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Questions Bank
      </Typography>

      <QuestionList 
        filters={filters}
        onFilterChange={handleFilterChange}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        totalPages={totalPages}
        onTotalPagesChange={setTotalPages}
        onAddToCart={handleAddToCart}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
