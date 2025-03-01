'use client';

import { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  Alert, 
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CodeIcon from '@mui/icons-material/Code';
import Link from 'next/link';

export default function RunMigrationsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigrations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/database/run-migrations', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error running migrations:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Run Database Migrations
        </Typography>
        
        <Typography variant="body1" paragraph>
          This tool will run all SQL migration files to set up your database tables. 
          Use this if you're experiencing database-related errors or if you've just set up a new database.
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={runMigrations} 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Running Migrations...' : 'Run Migrations'}
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
                ? "All migrations completed successfully!" 
                : "Some migrations failed. Please check the details below."}
            </Alert>
            
            {results.migrations && results.migrations.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Migration Results
                </Typography>
                
                <List>
                  {results.migrations.map((migration: any, index: number) => (
                    <Box key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {migration.success ? 
                            <CheckCircleIcon color="success" /> : 
                            <ErrorIcon color="error" />
                          }
                        </ListItemIcon>
                        <ListItemText 
                          primary={migration.file} 
                          secondary={migration.success ? 
                            'Successfully executed' : 
                            `Error: ${migration.error}`
                          } 
                        />
                      </ListItem>
                      {index < results.migrations.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </>
            )}
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Next Steps
              </Typography>
              
              {results.success ? (
                <Typography paragraph>
                  Your database is now set up with all required tables. You can now use the application's features that require database access.
                </Typography>
              ) : (
                <Typography paragraph>
                  Some migrations failed. You may need to check your database connection or permissions.
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  component={Link} 
                  href="/database-test" 
                  variant="outlined"
                >
                  Test Database
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
          </Box>
        )}
        
        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Need help? Check the <Link href="/DATABASE_SETUP.md" target="_blank">Database Setup Guide</Link> for more information.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}