'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Alert,
  Divider,
  Link
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';

interface TableStatus {
  name: string;
  exists: boolean;
  error?: string;
  columns?: string[];
  rowCount?: number;
}

export default function DatabaseDiagnostics() {
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [setupAvailable, setSetupAvailable] = useState<boolean>(false);
  
  useEffect(() => {
    checkConnection();
  }, []);
  
  const checkConnection = async () => {
    try {
      const response = await fetch('/api/database/diagnostics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'checkConnection' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setConnectionError(data.error || 'Unknown connection error');
      }
      
      // Check if setup endpoint is available
      try {
        const setupResponse = await fetch('/api/database/setup', {
          method: 'HEAD'
        });
        
        setSetupAvailable(setupResponse.ok);
      } catch (error) {
        setSetupAvailable(false);
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Unknown error');
    }
  };
  
  const checkTables = async () => {
    setLoading(true);
    setTables([]);
    
    try {
      const response = await fetch('/api/database/diagnostics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'checkTables' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTables(data.tables || []);
      } else {
        console.error('Error checking tables:', data.error);
      }
    } catch (error) {
      console.error('Error in checkTables:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const setupDatabase = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/database/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Database setup completed successfully!');
        // Refresh table status
        checkTables();
      } else {
        alert(`Failed to set up database: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error setting up database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Database Diagnostics
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Connection Status
          </Typography>
          
          {connectionStatus === 'checking' ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography>Checking database connection...</Typography>
            </Box>
          ) : connectionStatus === 'success' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
              <CheckCircleIcon sx={{ mr: 1 }} />
              <Typography>Connected to database successfully</Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main', mb: 1 }}>
                <ErrorIcon sx={{ mr: 1 }} />
                <Typography>Failed to connect to database</Typography>
              </Box>
              {connectionError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {connectionError}
                </Alert>
              )}
            </Box>
          )}
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Table Status
          </Typography>
          
          <Button 
            variant="contained" 
            onClick={checkTables} 
            disabled={loading || connectionStatus !== 'success'}
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
            Check Tables
          </Button>
          
          {setupAvailable && (
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={setupDatabase} 
              disabled={loading || connectionStatus !== 'success'}
            >
              Setup Database
            </Button>
          )}
          
          {tables.length > 0 && (
            <TableContainer component={Paper} sx={{ mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Table Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Row Count</TableCell>
                    <TableCell>Columns</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tables.map((table) => (
                    <TableRow key={table.name}>
                      <TableCell>{table.name}</TableCell>
                      <TableCell>
                        {table.exists ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                            <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">Exists</Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
                            <ErrorIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">Missing</Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        {table.exists ? (
                          table.rowCount !== undefined ? table.rowCount : 'Unknown'
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {table.exists && table.columns ? (
                          <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {table.columns.join(', ')}
                          </Typography>
                        ) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Box>
          <Typography variant="h6" gutterBottom>
            Troubleshooting
          </Typography>
          
          <Typography paragraph>
            If you're experiencing issues with saving or loading draft carts, try the following:
          </Typography>
          
          <ul>
            <li>
              <Typography>
                Visit the <Link href="/setup-database" color="primary">Database Setup</Link> page to create the necessary tables
              </Typography>
            </li>
            <li>
              <Typography>
                Check that your Supabase database is accessible and properly configured
              </Typography>
            </li>
            <li>
              <Typography>
                Verify that the user has permission to create and access tables
              </Typography>
            </li>
            <li>
              <Typography>
                Refer to the <Link href="/DATABASE_SETUP.md" target="_blank" color="primary">DATABASE_SETUP.md</Link> file for manual setup instructions
              </Typography>
            </li>
          </ul>
        </Box>
      </Paper>
    </Box>
  );
} 