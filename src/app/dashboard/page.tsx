'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button 
} from '@mui/material';
import { 
  Assessment as AssessmentIcon, 
  QuestionAnswer as QuestionAnswerIcon, 
  AddCircle as AddQuestionIcon 
} from '@mui/icons-material';

export default function Dashboard() {
  return (
    <Box>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 3, 
          fontWeight: 600, 
          color: 'text.primary' 
        }}
      >
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              transition: 'transform 0.2s',
              '&:hover': { 
                transform: 'scale(1.02)' 
              } 
            }}
          >
            <AssessmentIcon 
              color="primary" 
              sx={{ fontSize: 60, mb: 2 }} 
            />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Test Management
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              href="/tests"
            >
              View Tests
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              transition: 'transform 0.2s',
              '&:hover': { 
                transform: 'scale(1.02)' 
              } 
            }}
          >
            <QuestionAnswerIcon 
              color="secondary" 
              sx={{ fontSize: 60, mb: 2 }} 
            />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Question Bank
            </Typography>
            <Button 
              variant="contained" 
              color="secondary"
              href="/"
            >
              Manage Questions
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              transition: 'transform 0.2s',
              '&:hover': { 
                transform: 'scale(1.02)' 
              } 
            }}
          >
            <AddQuestionIcon 
              color="info" 
              sx={{ fontSize: 60, mb: 2 }} 
            />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Add Question
            </Typography>
            <Button 
              variant="contained" 
              color="info"
              href="/add-question"
            >
              Add to Database
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
