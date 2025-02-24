'use client';

import React from 'react';
import { Box } from '@mui/material';

export default function TestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        width: '100%',
        mt: '64px', // Account for AppBar height
      }}
    >
      {children}
    </Box>
  );
}
