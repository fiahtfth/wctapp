'use client';
import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import {
  Assessment as AssessmentIcon,
  QuestionAnswer as QuestionAnswerIcon,
  AddCircle as AddQuestionIcon,
  People as PeopleIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  
  // Check if user is admin on component mount and handle authentication
  useEffect(() => {
    // Set admin status based on user role
    if (user && user.role === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);
  
  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome to the WCT Exam Creation Manager
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Test Management - Only visible to admin users */}
        {isAdmin && (
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.2s',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              <AssessmentIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Test Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                Create, edit, and manage your tests
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                href="/tests"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 3,
                }}
              >
                View Tests
              </Button>
            </Paper>
          </Grid>
        )}
        
        {/* Question Bank */}
        <Grid item xs={12} md={isAdmin ? 4 : 6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'all 0.2s',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <QuestionAnswerIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Question Bank
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
              Browse and search through all available questions
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => router.push('/questions')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
              }}
            >
              View Questions
            </Button>
          </Paper>
        </Grid>
        
        {/* Add Question */}
        <Grid item xs={12} md={isAdmin ? 4 : 6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'all 0.2s',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <AddQuestionIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Add Question
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
              Create and submit new questions to the database
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => router.push('/add-question')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
              }}
            >
              Add New Question
            </Button>
          </Paper>
        </Grid>
        
        {/* Cart */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'all 0.2s',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <CartIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Question Cart
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
              Review and manage your selected questions
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => router.push('/cart')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
              }}
            >
              View Cart
            </Button>
          </Paper>
        </Grid>
        
        {/* User Management - Only visible to admin users */}
        {isAdmin && (
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.2s',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              <PeopleIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                User Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                Manage users and their permissions
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => router.push('/users')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 3,
                }}
              >
                Manage Users
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>
    </>
  );
}
