import { Box, Typography, Container } from '@mui/material';
import DiagnosticTools from '@/components/DiagnosticTools';

export default function DiagnosticToolsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Database Diagnostic Tools
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Tools to help diagnose and fix database issues
        </Typography>
      </Box>
      
      <DiagnosticTools />
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          If you continue to experience issues after using these tools, please refer to the 
          <a href="/DATABASE_SETUP.md" target="_blank" style={{ marginLeft: '4px' }}>
            DATABASE_SETUP.md
          </a> file for manual setup instructions.
        </Typography>
      </Box>
    </Container>
  );
} 