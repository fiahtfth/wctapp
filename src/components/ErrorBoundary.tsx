'use client';

import { useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';

interface ErrorBoundaryProps {
  error: Error;
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Snackbar open={true} autoHideDuration={6000} onClose={reset}>
      <Alert severity="error" onClose={reset} sx={{ width: '100%' }} variant="filled">
        {error.message}
      </Alert>
    </Snackbar>
  );
}
