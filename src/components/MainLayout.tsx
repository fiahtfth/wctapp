'use client';

import React from 'react';
import { Box, Container } from '@mui/material';
import NavBar from '@/components/NavBar';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Main layout component that wraps the application content.
 * Provides consistent layout structure across pages.
 */
export default function MainLayout({ children, title, subtitle }: MainLayoutProps) {
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
          {title && (
            <Box sx={{ mb: 4 }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{ color: '#666', fontSize: '1rem' }}>
                  {subtitle}
                </p>
              )}
            </Box>
          )}
          {children}
        </Container>
      </Box>
    </>
  );
} 