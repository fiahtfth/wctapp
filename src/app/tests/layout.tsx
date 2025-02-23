'use client';

import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import SideNav from '@/components/SideNav';

export default function TestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SideNav />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: isMobile ? '100%' : `calc(100% - 240px)`,
          ml: isMobile ? 0 : '240px',
          mt: '64px', // Account for AppBar height
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
