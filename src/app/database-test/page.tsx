'use client';

import { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BuildIcon from '@mui/icons-material/Build';
import SettingsIcon from '@mui/icons-material/Settings';

export default function DatabaseTestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const runTest = async () => {
    setLoading(true);
    setResults(null);
    setError(null);
    
    try {
      const response = await fetch('/api/database/test-and-fix');
      const data = await response.json();
      
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <CircularProgress size={20} />;
    }
  };
  
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SettingsIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4">
            Database Test & Fix Tool
          </Typography>
        </Box>
        
        <Typography paragraph>
          This tool will test your database setup and automatically fix any issues it finds. It will:
        </Typography>
        
        <List sx={{ mb: 3 }}>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Check database connection" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Create missing tables (carts, cart_items, questions)" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Create a test cart with items" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Verify cart retrieval works correctly" />
          </ListItem>
        </List>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Button
            variant="contained"
            onClick={runTest}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <BuildIcon />}
            size="large"
          >
            {loading ? 'Running Tests...' : 'Test & Fix Database'}
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
                ? "All tests passed successfully! Your database is now properly set up." 
                : results.error || "There was an issue with the database setup."}
            </Alert>
            
            <Typography variant="h6" gutterBottom>
              Test Results
            </Typography>
            
            <Stepper orientation="vertical" sx={{ mb: 3 }}>
              {results.steps.map((step: any, index: number) => (
                <Step key={index} active={true} completed={step.status === 'success'}>
                  <StepLabel 
                    error={step.status === 'error'} 
                    icon={getStatusIcon(step.status)}
                  >
                    {step.name}
                  </StepLabel>
                  <StepContent>
                    <Typography color={step.status === 'error' ? 'error' : 'textPrimary'}>
                      {step.message || step.error || (step.status === 'running' ? 'In progress...' : '')}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
            
            {results.fixes && results.fixes.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Fixes Applied
                </Typography>
                
                <List sx={{ mb: 3 }}>
                  {results.fixes.map((fix: any, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {getStatusIcon(fix.status)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={fix.name} 
                        secondary={fix.message || fix.error || (fix.status === 'running' ? 'In progress...' : '')} 
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
            
            {results.testCart && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Test Cart Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="subtitle1" gutterBottom>
                    Test ID: <strong>{results.testCart.test_id}</strong>
                  </Typography>
                  <Typography variant="body2" paragraph>
                    You can use this test ID to debug your cart using the <Button href={`/cart-debug?testId=${results.testCart.test_id}`} size="small" color="primary">Cart Debug Tool</Button>
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Raw Test Data:
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'background.default', 
                    borderRadius: 1,
                    maxHeight: 300,
                    overflow: 'auto'
                  }}>
                    <pre style={{ margin: 0 }}>
                      {JSON.stringify(results, null, 2)}
                    </pre>
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                href="/cart-debug"
              >
                Go to Cart Debug Tool
              </Button>
              
              <Button 
                variant="outlined" 
                color="secondary" 
                href="/"
              >
                Return to Home
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
} 