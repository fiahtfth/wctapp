import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemButton,
  Divider
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import StorageIcon from '@mui/icons-material/Storage';
import BuildIcon from '@mui/icons-material/Build';
import CodeIcon from '@mui/icons-material/Code';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ScienceIcon from '@mui/icons-material/Science';
import Link from 'next/link';

export default function DiagnosticTools() {
  const tools = [
    {
      name: 'Database Test & Fix',
      description: 'Test your database setup and automatically fix any issues',
      icon: <BuildIcon color="primary" />,
      path: '/database-test'
    },
    {
      name: 'Cart Debug Tool',
      description: 'Diagnose issues with loading saved draft carts',
      icon: <ShoppingCartIcon color="primary" />,
      path: '/cart-debug'
    },
    {
      name: 'Cart Test Suite',
      description: 'Run comprehensive tests on cart functionality',
      icon: <ScienceIcon color="primary" />,
      path: '/cart-test'
    },
    {
      name: 'Run Migrations',
      description: 'Run SQL migrations to set up your database tables',
      icon: <CodeIcon color="primary" />,
      path: '/run-migrations'
    },
    {
      name: 'Database Setup',
      description: 'Set up required database tables for cart functionality',
      icon: <StorageIcon color="primary" />,
      path: '/setup-database'
    }
  ];

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <BugReportIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h5">
          Diagnostic Tools
        </Typography>
      </Box>
      
      <Typography paragraph>
        These tools will help you diagnose and fix issues with your application's database setup.
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      <List>
        {tools.map((tool, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton component={Link} href={tool.path}>
              <ListItemIcon>
                {tool.icon}
              </ListItemIcon>
              <ListItemText 
                primary={tool.name} 
                secondary={tool.description} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
} 