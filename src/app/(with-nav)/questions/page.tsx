'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionList } from '@/components/QuestionList';
import { addQuestionToCart, getCartItems } from '@/lib/actions';
import MainLayout from '@/components/MainLayout';
import { withAuth } from '@/components/AuthProvider';
import QuestionFilter from '@/components/QuestionFilter';
import { Box, Paper, Typography } from '@mui/material';

function QuestionsPage() {
  const [testId] = useState('questions-list');
  const [cartCount, setCartCount] = useState(0);
  const [filters, setFilters] = useState<{
    subject?: string[];
    module?: string[];
    topic?: string[];
    sub_topic?: string[];
    question_type?: string[];
    search?: string;
  }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Load cart count on mount
    const fetchCartCount = async () => {
      try {
        const cartItems = await getCartItems(testId);
        setCartCount(cartItems.count);
      } catch (error) {
        console.error('Failed to fetch cart items', error);
      }
    };
    fetchCartCount();
  }, [testId, router]);

  const handleAddToCart = async (questionId: number) => {
    try {
      console.log('handleAddToCart called with questionId:', questionId, 'testId:', testId);
      const result = await addQuestionToCart(questionId, testId);
      console.log('addQuestionToCart result:', result);
      
      if (result && result.success) {
        setCartCount((prev) => prev + 1);
        console.log('Question added successfully, cart count updated');
        return; // Success - exit early
      }
      
      // If server sync failed but it's client-only (not logged in), that's okay
      if (result && result.clientOnly) {
        console.log('Question added to client-side cart only (not logged in)');
        setCartCount((prev) => prev + 1);
        return; // Client-side cart is updated, so this is still a success
      }
      
      // Only throw error if it's a real failure (not just auth issue)
      const errorMessage = result?.message || 'Failed to add question to cart';
      console.error('Failed to add question to cart:', errorMessage);
      throw new Error(errorMessage);
    } catch (error) {
      console.error('Error adding question to cart:', error);
      // Re-throw to let QuestionCard handle the error display
      throw error;
    }
  };

  const handleFilterChange = (newFilters: any) => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
    
    // Convert single string values to arrays for compatibility with QuestionList
    const formattedFilters: any = {};
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        formattedFilters[key] = Array.isArray(value) ? value : [value];
      }
    });
    
    setFilters(formattedFilters);
  };

  return (
    <MainLayout title="Questions" subtitle="Browse and manage your question bank">
      <Box sx={{ height: '100%' }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            🔍 Filter Questions
          </Typography>
          <Box sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: 2, 
            p: 2,
            '& .MuiInputBase-root': {
              backgroundColor: 'white',
            }
          }}>
            <QuestionFilter onFilterChange={handleFilterChange} />
          </Box>
        </Paper>
        
        <Box sx={{ pb: 4 }}>
          <QuestionList
            testId={testId}
            filters={filters}
            onFilterChange={setFilters}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalPages={totalPages}
            onTotalPagesChange={setTotalPages}
            pageSize={pageSize}
            onAddToCart={handleAddToCart}
          />
        </Box>
      </Box>
    </MainLayout>
  );
}

export default withAuth(QuestionsPage);
