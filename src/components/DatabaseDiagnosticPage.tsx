'use client';
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';

const DatabaseDiagnosticPage: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Checking database status...');

  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        const response = await fetch('/api/database/status');
        const data = await response.json();
        
        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Database is connected and operational.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Database connection failed.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Failed to check database status. Server may be unavailable.');
      }
    };

    checkDatabaseStatus();
  }, []);

  const handleInitDatabase = async () => {
    setStatus('loading');
    setMessage('Initializing database...');
    
    try {
      const response = await fetch('/api/database/init', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Database initialized successfully.');
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to initialize database.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to initialize database. Server may be unavailable.');
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Database Diagnostic
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Status
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {status === 'loading' && <CircularProgress size={24} sx={{ mr: 2 }} />}
          <Alert 
            severity={status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}
            sx={{ width: '100%' }}
          >
            {message}
          </Alert>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleInitDatabase}
            disabled={status === 'loading'}
          >
            Initialize Database
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Database Information
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This page provides diagnostic information about the database connection and allows you to initialize or reset the database structure.
        </Typography>
      </Paper>
    </Box>
  );
};

export default DatabaseDiagnosticPage; 