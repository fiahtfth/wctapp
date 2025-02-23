'use client';

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import Cart from '@/components/Cart';

export default function TestsPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Test Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Create and manage your tests
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Cart />
        </Box>
      </Box>
    </Container>
  );
}
