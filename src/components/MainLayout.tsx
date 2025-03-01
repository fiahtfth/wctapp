'use client';

import React from 'react';
import { Box, Container, Paper, Typography, Breadcrumbs } from '@mui/material';
import NavBar from './NavBar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

// Helper function to generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string) {
  const paths = pathname.split('/').filter(Boolean);
  
  // Start with home
  const breadcrumbs = [{ name: 'Home', path: '/' }];
  
  // Build up the breadcrumbs
  let currentPath = '';
  paths.forEach(path => {
    currentPath += `/${path}`;
    const name = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
    breadcrumbs.push({ name, path: currentPath });
  });
  
  return breadcrumbs;
}

export default function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname || '/');
  
  // Determine page title from pathname if not provided
  const lastPathSegment = pathname?.split('/').filter(Boolean).pop() || '';
  const pageTitle = title || (pathname === '/' 
    ? 'Home' 
    : lastPathSegment.charAt(0).toUpperCase() + 
      lastPathSegment.slice(1).replace(/-/g, ' ') || 'Page');
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <NavBar />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: '100%',
          mt: '64px', // Adjust based on AppBar height
        }}
      >
        <Container maxWidth="xl" sx={{ py: 2 }}>
          {/* Breadcrumbs */}
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />} 
            aria-label="breadcrumb"
            sx={{ mb: 2 }}
          >
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              
              return isLast ? (
                <Typography key={crumb.path} color="text.primary" fontWeight={500}>
                  {crumb.name}
                </Typography>
              ) : (
                <Link key={crumb.path} href={crumb.path} style={{ textDecoration: 'none' }}>
                  <Typography color="primary" fontWeight={400}>
                    {crumb.name}
                  </Typography>
                </Link>
              );
            })}
          </Breadcrumbs>
          
          {/* Page Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
              {pageTitle}
            </Typography>
            {subtitle && (
              <Typography variant="subtitle1" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          
          {/* Main Content */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              borderRadius: 2,
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            }}
          >
            {children}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
} 