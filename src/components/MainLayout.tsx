'use client';

import React from 'react';
import { Box, Container } from '@mui/material';
import NavBar from '@/components/NavBar';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Main layout component that wraps the application content.
 * Provides consistent layout structure across pages.
 */
export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <NavBar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 8, sm: 9 }, // Padding top to account for the navbar height
          pb: 4,
          minHeight: '100vh',
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
          {children}
        </Container>
      </Box>
    </>
  );
} 