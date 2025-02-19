'use client';

import { CircularProgress, Box, Typography } from '@mui/material';

export default function ExportLoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        justifyContent: 'center',
      }}
    >
      <CircularProgress size={24} />
      <Typography variant="body1">Preparing your export...</Typography>
    </Box>
  );
}
