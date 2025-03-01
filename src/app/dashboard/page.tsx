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
import MainLayout from '@/components/MainLayout';

export default function Dashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user is admin on component mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsAdmin(user.role === 'admin');
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, []);
  
  return (
    <MainLayout title="Dashboard" subtitle="Welcome to the WCT Exam Creation Manager">
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
        
        <Grid item xs={12} md={isAdmin ? 4 : 4}>
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
            <QuestionAnswerIcon color="secondary" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Question Bank
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
              Browse and search through all questions
            </Typography>
            <Button 
              variant="contained" 
              color="secondary" 
              href="/questions"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
              }}
            >
              Manage Questions
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={isAdmin ? 4 : 4}>
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
            <AddQuestionIcon color="info" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Add Question
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
              Create and add new questions to the database
            </Typography>
            <Button 
              variant="contained" 
              color="info" 
              href="/add-question"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
              }}
            >
              Add Question
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
              <PeopleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                User Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                Manage users and their permissions
              </Typography>
              <Button 
                variant="contained" 
                color="success" 
                href="/users"
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
        
        <Grid item xs={12} md={isAdmin ? 6 : 4}>
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
            <CartIcon color="warning" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Cart & Checkout
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
              View your cart and checkout to create tests
            </Typography>
            <Button 
              variant="contained" 
              color="warning" 
              href="/cart"
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
      </Grid>
    </MainLayout>
  );
}
