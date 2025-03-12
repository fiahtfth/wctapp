'use client';
import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';

interface DatabaseSetupAlertProps {
  onSetupClick: () => void;
}

const DatabaseSetupAlert: React.FC<DatabaseSetupAlertProps> = ({ onSetupClick }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Alert 
        severity="warning"
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={onSetupClick}
          >
            Setup Now
          </Button>
        }
      >
        <AlertTitle>Database Setup Required</AlertTitle>
        The database needs to be initialized before you can use this feature.
      </Alert>
    </Box>
  );
};

export default DatabaseSetupAlert; 