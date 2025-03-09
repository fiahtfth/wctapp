'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import AdminLayout from '@/components/layouts/AdminLayout';
import DatabaseDiagnosticPage from '@/components/DatabaseDiagnosticPage';
import { useAuth } from '@/hooks/useAuth';

export default function DatabaseDiagnosticsPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated or not an admin
    if (!isLoading && (!isAuthenticated || (user && user.role !== 'admin'))) {
      router.push('/login?redirect=/admin/database');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || (user && user.role !== 'admin')) {
    return null; // Will redirect in useEffect
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Database Administration
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <DatabaseDiagnosticPage />
      </Box>
    </AdminLayout>
  );
} 