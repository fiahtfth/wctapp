'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BugReportIcon from '@mui/icons-material/BugReport';

export default function CartDebugPage() {
  const [testId, setTestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get testId from URL or localStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTestId = params.get('testId');
    
    if (urlTestId) {
      setTestId(urlTestId);
      debugCart(urlTestId);
    } else {
      const storedTestId = localStorage.getItem('currentTestId');
      if (storedTestId) {
        setTestId(storedTestId);
      }
    }
  }, []);
  
  const debugCart = async (id: string) => {
    if (!id) {
      setError('Please enter a Test ID');
      return;
    }
    
    setLoading(true);
    setResults(null);
    setError(null);
    
    try {
      const response = await fetch(`/api/cart/debug?testId=${encodeURIComponent(id)}`);
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
          <BugReportIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4">
            Cart Debug Tool
          </Typography>
        </Box>
        
        <Typography paragraph>
          This tool helps diagnose issues with loading saved draft carts. Enter the Test ID of the cart you want to debug.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Test ID"
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
            fullWidth
            placeholder="e.g. test_1740336602528"
            variant="outlined"
          />
          <Button
            variant="contained"
            onClick={() => debugCart(testId)}
            disabled={loading || !testId}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Debug'}
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
              severity={results.success ? "success" : results.warning ? "warning" : "error"} 
              sx={{ mb: 3 }}
            >
              {results.success 
                ? "All checks passed successfully! The cart should load correctly." 
                : results.error || "There was an issue with the cart."}
            </Alert>
            
            <Typography variant="h6" gutterBottom>
              Diagnostic Steps
            </Typography>
            
            <List>
              {results.steps.map((step: any, index: number) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {getStatusIcon(step.status)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={step.name} 
                    secondary={step.message || step.error || (step.status === 'running' ? 'In progress...' : '')} 
                  />
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ my: 3 }} />
            
            {results.cart && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Cart Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>ID</TableCell>
                          <TableCell>{results.cart.id}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Test ID</TableCell>
                          <TableCell>{results.cart.test_id}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>User ID</TableCell>
                          <TableCell>{results.cart.user_id}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Created At</TableCell>
                          <TableCell>{new Date(results.cart.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Metadata</TableCell>
                          <TableCell>
                            <pre>{JSON.stringify(results.cart.metadata, null, 2)}</pre>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )}
            
            {results.cartItems && results.cartItems.length > 0 && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Cart Items ({results.cartItems.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Cart ID</TableCell>
                          <TableCell>Question ID</TableCell>
                          <TableCell>Created At</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.cartItems.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell>{item.cart_id}</TableCell>
                            <TableCell>{item.question_id}</TableCell>
                            <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )}
            
            {results.questions && results.questions.length > 0 && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Questions ({results.questions.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Text</TableCell>
                          <TableCell>Subject</TableCell>
                          <TableCell>Topic</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.questions.map((question: any) => (
                          <TableRow key={question.id}>
                            <TableCell>{question.id}</TableCell>
                            <TableCell>{question.text?.substring(0, 50)}...</TableCell>
                            <TableCell>{question.subject}</TableCell>
                            <TableCell>{question.topic}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )}
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Troubleshooting
              </Typography>
              
              <Typography paragraph>
                If the diagnostic shows issues, try the following:
              </Typography>
              
              <List sx={{ listStyleType: 'disc', pl: 4 }}>
                <ListItem sx={{ display: 'list-item' }}>
                  <Typography>
                    Visit the <Button href="/setup-database" color="primary" size="small">Database Setup</Button> page to ensure all required tables exist
                  </Typography>
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <Typography>
                    Check that your Supabase database is properly configured and accessible
                  </Typography>
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <Typography>
                    Verify that the questions with the specified IDs exist in your database
                  </Typography>
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <Typography>
                    Try saving the draft again with the current questions
                  </Typography>
                </ListItem>
              </List>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
} 