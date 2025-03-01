'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import Link from 'next/link';

export default function CartTestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cart/test');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error running cart tests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get status icon based on test status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'running':
        return <PendingIcon color="warning" />;
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  // Get status chip based on test status
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'success':
        return <Chip label="Success" color="success" size="small" />;
      case 'error':
        return <Chip label="Failed" color="error" size="small" />;
      case 'running':
        return <Chip label="Running" color="warning" size="small" />;
      default:
        return <Chip label="Pending" color="default" size="small" />;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Cart Functionality Test
        </Typography>
        
        <Typography variant="body1" paragraph>
          This tool runs a comprehensive test of the cart functionality, including creating, updating, and deleting carts and cart items.
          It will help diagnose any issues with the cart system.
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={runTests} 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Running Tests...' : 'Run Cart Tests'}
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {results && (
          <Box>
            <Alert 
              severity={results.success ? "success" : "error"} 
              sx={{ mb: 3 }}
            >
              {results.success 
                ? "All cart tests passed successfully! The cart system is working properly." 
                : "Some tests failed. Please check the details below."}
            </Alert>
            
            <Typography variant="h6" gutterBottom>
              Test Results
            </Typography>
            
            <List>
              {results.tests && results.tests.map((test: any, index: number) => (
                <Box key={index}>
                  <Accordion defaultExpanded={test.status === 'error'}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        {getStatusIcon(test.status)}
                        <Typography sx={{ ml: 1, flex: 1 }}>
                          {test.name}
                        </Typography>
                        {getStatusChip(test.status)}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {test.status === 'success' && (
                        <Typography color="success.main">
                          {test.message}
                        </Typography>
                      )}
                      
                      {test.status === 'error' && (
                        <Typography color="error.main">
                          Error: {test.error}
                        </Typography>
                      )}
                      
                      {test.status === 'running' && (
                        <Typography color="text.secondary">
                          Test is still running...
                        </Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </Box>
              ))}
            </List>
            
            {results.success && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Next Steps
                </Typography>
                <Typography paragraph>
                  All cart functionality is working correctly. You can now use the cart system with confidence.
                </Typography>
                <Button 
                  component={Link} 
                  href="/diagnostic-tools" 
                  variant="outlined"
                >
                  Back to Diagnostic Tools
                </Button>
              </Box>
            )}
            
            {!results.success && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Troubleshooting
                </Typography>
                <Typography paragraph>
                  Some tests failed. You may need to check your database setup or run migrations.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    component={Link} 
                    href="/database-test" 
                    variant="outlined"
                  >
                    Database Test & Fix
                  </Button>
                  <Button 
                    component={Link} 
                    href="/run-migrations" 
                    variant="outlined"
                  >
                    Run Migrations
                  </Button>
                  <Button 
                    component={Link} 
                    href="/diagnostic-tools" 
                    variant="outlined"
                  >
                    Back to Diagnostic Tools
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
} 