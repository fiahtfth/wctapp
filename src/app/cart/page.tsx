'use client';
import React from 'react';
import Cart from '@/components/Cart';
import MainLayout from '@/components/MainLayout';

export default function CartPage() {
  return (
    <MainLayout title="Cart" subtitle="Review and manage your selected questions">
      <Cart />
    </MainLayout>
  );
}
