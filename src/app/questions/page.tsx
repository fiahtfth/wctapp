'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QuestionList from '@/components/QuestionList';
import { addQuestionToCart, getCartItems } from '@/lib/actions';
import MainLayout from '@/components/MainLayout';

export default function QuestionsPage() {
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

  return (
    <MainLayout title="Questions" subtitle="Browse and manage your question bank">
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
