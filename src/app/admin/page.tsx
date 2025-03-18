'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Grid, Paper, Button, CircularProgress } from '@mui/material';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Import icons
import { 
  People as PeopleIcon, 
  Quiz as QuizIcon, 
  Storage as StorageIcon, 
  ShoppingCart as ShoppingCartIcon 
} from '@mui/icons-material';

export default function AdminDashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated or not an admin
    if (!isLoading && (!isAuthenticated || (user && user.role !== 'admin'))) {
      router.push('/login?redirect=/admin');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || (user && user.role !== 'admin')) {
    return null; // Will redirect in useEffect
  }

  const adminModules = [
    {
      title: 'User Management',
      description: 'Create, edit, and manage user accounts',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      path: '/admin/users',
      color: '#3f51b5'
    },
    {
      title: 'Question Bank',
      description: 'Manage questions and create exams',
      icon: <QuizIcon sx={{ fontSize: 40 }} />,
      path: '/admin/questions',
      color: '#f50057'
    },
    {
      title: 'Database Tools',
      description: 'Database diagnostics and maintenance',
      icon: <StorageIcon sx={{ fontSize: 40 }} />,
      path: '/admin/database',
      color: '#00bcd4'
    },
    {
      title: 'Cart Management',
      description: 'View and manage user carts',
      icon: <ShoppingCartIcon sx={{ fontSize: 40 }} />,
      path: '/admin/carts',
      color: '#4caf50'
    }
  ];

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        
        <Typography variant="body1" paragraph>
          Welcome back, {user?.username}! Use the tools below to manage your application.
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {adminModules.map((module, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper 
                sx={{ 
                  p: 3, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderTop: `4px solid ${module.color}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, color: module.color }}>
                  {module.icon}
                </Box>
                <Typography variant="h6" align="center" gutterBottom>
                  {module.title}
                </Typography>
                <Typography variant="body2" align="center" sx={{ mb: 2, flexGrow: 1 }}>
                  {module.description}
                </Typography>
                <Link href={module.path} style={{ textDecoration: 'none' }}>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    sx={{ 
                      borderColor: module.color, 
                      color: module.color,
                      '&:hover': {
                        borderColor: module.color,
                        backgroundColor: `${module.color}10`
                      }
                    }}
                  >
                    Access
                  </Button>
                </Link>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </AdminLayout>
  );
} 