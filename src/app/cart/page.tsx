'use client';
import React from 'react';
import Cart from '@/components/Cart';
import MainLayout from '@/components/MainLayout';
import { withAuth } from '@/components/AuthProvider';

function CartPage() {
  return (
    <MainLayout title="Cart" subtitle="Review and manage your selected questions">
      <Cart />
    </MainLayout>
  );
}

export default withAuth(CartPage);
