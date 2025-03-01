'use client';

import { useState, useEffect } from 'react';
import { 
  Alert, 
  AlertTitle, 
  Button, 
  Box, 
  Typography, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link
} from '@mui/material';
import { checkDatabaseTables, setupDatabase } from '@/lib/database/setupUtils';

interface DatabaseSetupAlertProps {
  errorMessage?: string;
  onSetupComplete?: () => void;
}

export default function DatabaseSetupAlert({ errorMessage, onSetupComplete }: DatabaseSetupAlertProps) {
  const [loading, setLoading] = useState(false);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [setupResult, setSetupResult] = useState<{success?: boolean; message?: string; error?: string} | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  useEffect(() => {
    // Check if the error message indicates a database setup issue
    if (errorMessage && (
      errorMessage.includes('does not exist') ||
      errorMessage.includes('Failed to save draft cart') ||
      errorMessage.includes('Failed to fetch cart')
    )) {
      checkTables();
    }
  }, [errorMessage]);
  
  const checkTables = async () => {
    setLoading(true);
    
    try {
      const result = await checkDatabaseTables();
      
      if (result.success) {
        const cartsTable = result.tables?.find((t: any) => t.name === 'carts');
        const cartItemsTable = result.tables?.find((t: any) => t.name === 'cart_items');
        
        setSetupNeeded(!cartsTable?.exists || !cartItemsTable?.exists);
      } else {
        // If we can't check tables, assume setup is needed
        setSetupNeeded(true);
      }
    } catch (error) {
      console.error('Error checking tables:', error);
      setSetupNeeded(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSetupDatabase = async () => {
    setLoading(true);
    setSetupResult(null);
    
    try {
      const result = await setupDatabase();
      setSetupResult(result);
      
      if (result.success) {
        setSetupNeeded(false);
        if (onSetupComplete) {
          onSetupComplete();
        }
      }
    } catch (error) {
      console.error('Error setting up database:', error);
      setSetupResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const openDialog = () => {
    setDialogOpen(true);
  };
  
  const closeDialog = () => {
    setDialogOpen(false);
  };
  
  if (!setupNeeded && !setupResult) {
    return null;
  }
  
  return (
    <>
      {setupNeeded && (
        <Alert 
          severity="error" 
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                color="inherit" 
                size="small" 
                onClick={openDialog}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Fix Now'}
              </Button>
              <Button
                color="inherit"
                size="small"
                component={Link}
                href="/database-test"
                target="_blank"
              >
                Diagnostic Tools
              </Button>
            </Box>
          }
          sx={{ mb: 2 }}
        >
          {errorMessage || 'Database setup required. Tables for cart functionality are missing.'}
        </Alert>
      )}
      
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md">
        <DialogTitle>Database Setup Required</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            The application requires database tables that don't exist yet. This is needed for saving draft carts.
          </Typography>
          
          <Typography paragraph>
            You can set up the database automatically by clicking the button below, or follow the manual instructions in the <Link href="/DATABASE_SETUP.md" target="_blank">DATABASE_SETUP.md</Link> file.
          </Typography>
          
          <Typography paragraph>
            For more advanced diagnostics, you can use our <Link href="/database-test" target="_blank">Database Test Tool</Link> or <Link href="/cart-debug" target="_blank">Cart Debug Tool</Link>.
          </Typography>
          
          {setupResult && (
            <Alert severity={setupResult.success ? "success" : "error"} sx={{ mt: 2 }}>
              {setupResult.message}
            </Alert>
          )}
          
          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
            Required Tables:
          </Typography>
          <ul>
            <li>carts</li>
            <li>cart_items</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Close</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSetupDatabase}
            disabled={loading || setupResult?.success}
          >
            {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
            {setupResult?.success ? 'Setup Complete' : 'Setup Database'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 