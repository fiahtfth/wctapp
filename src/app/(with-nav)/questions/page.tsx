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
    const token = localStorage.getItem('token');
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
      await addQuestionToCart(questionId, testId);
      setCartCount((prev) => prev + 1);
    } catch (error) {
      console.error('Error adding question to cart:', error);
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
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter Questions
        </Typography>
        <QuestionFilter onFilterChange={handleFilterChange} />
      </Paper>
      
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
    </MainLayout>
  );
}

export default withAuth(QuestionsPage);
