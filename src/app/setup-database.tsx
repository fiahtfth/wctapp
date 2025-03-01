import { useState } from 'react';
import { Button, Typography, Box, Paper, Alert, CircularProgress } from '@mui/material';

export default function SetupDatabasePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{success?: boolean; message?: string; error?: string; tablesCreated?: string[]} | null>(null);

  const setupDatabase = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/database/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Database Setup
        </Typography>
        
        <Typography paragraph>
          This page will help you set up the necessary database tables for the application.
          Click the button below to create the required tables if they don't exist.
        </Typography>
        
        <Box sx={{ my: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={setupDatabase}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
            Setup Database Tables
          </Button>
        </Box>
        
        {result && (
          <Box sx={{ mt: 3 }}>
            {result.success ? (
              <Alert severity="success">
                <Typography variant="body1">
                  {result.message || 'Database setup completed successfully'}
                </Typography>
                {result.tablesCreated && result.tablesCreated.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Tables created: {result.tablesCreated.join(', ')}
                  </Typography>
                )}
              </Alert>
            ) : (
              <Alert severity="error">
                <Typography variant="body1">
                  {result.error || 'Failed to set up database'}
                </Typography>
              </Alert>
            )}
          </Box>
        )}
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Troubleshooting
          </Typography>
          <Typography paragraph>
            If you continue to experience issues with saving or loading draft carts:
          </Typography>
          <ul>
            <li>Check that your Supabase database is accessible</li>
            <li>Verify that the user has permission to create tables</li>
            <li>Check the browser console for specific error messages</li>
            <li>Refer to the DATABASE_SETUP.md file for manual setup instructions</li>
          </ul>
        </Box>
      </Paper>
    </Box>
  );
} 