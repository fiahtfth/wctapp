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
          minHeight: 'calc(100vh - 64px)', // Subtract navbar height
          backgroundColor: '#f8fafc', // Light gray background for modern look
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 }, height: '100%' }}>
          {title && (
            <Box sx={{ 
              mb: 4,
              pb: 3,
              borderBottom: '2px solid',
              borderColor: 'divider',
            }}>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                marginBottom: '0.5rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{ 
                  color: '#64748b', 
                  fontSize: '1.1rem',
                  marginTop: '0.5rem',
                  fontWeight: '400'
                }}>
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