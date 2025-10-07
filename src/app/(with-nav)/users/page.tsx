'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Select,
  MenuItem,
  InputLabel,
  Typography,
  FormControl,
  CircularProgress,
  Alert,
} from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import { Logout as LogoutIcon } from '@mui/icons-material';
import SafeFormControl from '@/components/SafeFormControl';
import { withAdminAuth } from '@/components/AuthProvider';

interface User {
  id: number;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  username: string;
  is_active?: boolean;
}

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  exp: number;
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const didInitialFetch = useRef<boolean>(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Set token cookie on page load to help middleware
  useEffect(() => {
    const setTokenCookie = () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Set a cookie with the token to help middleware access it
        document.cookie = `ls_token=${token}; path=/; max-age=3600; SameSite=Strict`;
        console.log('Token cookie set for middleware access on users page');
      }
    };
    
    setTokenCookie();
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          console.error('No token found, redirecting to login');
          window.location.href = '/login?redirect=%2Fusers';
          return;
        }
        
        try {
          // Decode the token
          const decoded = jwtDecode<JwtPayload>(token);
          
          // Check if token is expired
          const currentTime = Math.floor(Date.now() / 1000);
          if (decoded.exp < currentTime) {
            console.error('Token expired, redirecting to login');
            localStorage.removeItem('accessToken');
            window.location.href = '/login?redirect=%2Fusers';
            return;
          }
          
          // Check if user is admin
          if (decoded.role !== 'admin') {
            console.error('User is not admin, redirecting to dashboard');
            window.location.href = '/dashboard';
            return;
          }
          
          console.log('User is authenticated and is admin');
          setIsAdmin(true);
          setAuthChecked(true);
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError);
          localStorage.removeItem('accessToken');
          window.location.href = '/login?redirect=%2Fusers';
          return;
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setError('Authentication error');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Fetch users once authentication is confirmed
  useEffect(() => {
    const fetchUsers = async () => {
      if (!authChecked || didInitialFetch.current) return;
      
      console.log('Fetching users data...');
      setIsFetching(true);
      didInitialFetch.current = true;
      
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        console.log('Using token for fetch:', token.substring(0, 10) + '...');
        
        // Use a direct fetch to the list endpoint
        const response = await fetch('/api/users/list', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch users:', response.status, errorText);
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Users data received:', data);
        setUsers(data.users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchUsers();
  }, [authChecked]);

  const handleCreateUser = async () => {
    try {
      setIsLoading(true);
      
      // Get the token from localStorage
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Validate required fields
      if (!currentUser.email || !currentUser.password || !currentUser.username) {
        setError('Email, password, and username are required');
        return;
      }
      
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: currentUser.email,
          password: currentUser.password,
          username: currentUser.username,
          role: currentUser.role || 'user',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
      
      // Refresh the user list
      didInitialFetch.current = false;
      const fetchUsers = async () => {
        setIsFetching(true);
        
        try {
          const response = await fetch('/api/users/list', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.statusText}`);
          }
          
          const data = await response.json();
          setUsers(data.users || []);
        } catch (error) {
          console.error('Error fetching users:', error);
          setError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
          setIsFetching(false);
        }
      };
      
      fetchUsers();
      
      // Reset form and close dialog
      setCurrentUser({});
      setOpenCreateDialog(false);
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    try {
      setIsLoading(true);
      
      // Get the token from localStorage
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Prepare update data
      const updateData: Partial<User> = {
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        role: currentUser.role,
        is_active: currentUser.is_active
      };
      
      // Only include password if it was changed
      if (currentUser.password) {
        updateData.password = currentUser.password;
      }
      
      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      // Refresh the user list
      const fetchUsers = async () => {
        setIsFetching(true);
        
        try {
          const response = await fetch('/api/users/list', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.statusText}`);
          }
          
          const data = await response.json();
          setUsers(data.users || []);
        } catch (error) {
          console.error('Error fetching users:', error);
          setError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
          setIsFetching(false);
        }
      };
      
      fetchUsers();
      
      // Reset form and close dialog
      setCurrentUser({});
      setOpenEditDialog(false);
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setIsLoading(true);
      
      // Get the token from localStorage
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userToDelete.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      // Refresh the user list
      const fetchUsers = async () => {
        setIsFetching(true);
        
        try {
          const response = await fetch('/api/users/list', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.statusText}`);
          }
          
          const data = await response.json();
          setUsers(data.users || []);
        } catch (error) {
          console.error('Error fetching users:', error);
          setError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
          setIsFetching(false);
        }
      };
      
      fetchUsers();
      
      // Reset and close dialog
      setUserToDelete(null);
      setOpenDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('accessToken');
    
    // Clear all auth cookies
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    document.cookie = 'ls_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    
    // Clear session storage
    sessionStorage.removeItem('redirectCount');
    sessionStorage.removeItem('loginAttempted');
    
    console.log('Logout complete, redirecting to login');
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">You do not have permission to access this page.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={() => {
            setCurrentUser({});
            setOpenCreateDialog(true);
          }}
        >
          Create New User
        </Button>
      </Box>

      {isFetching ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.is_active ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setCurrentUser(user);
                          setOpenEditDialog(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => {
                          setUserToDelete(user);
                          setOpenDeleteDialog(true);
                        }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create User Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            type="text"
            fullWidth
            value={currentUser.username || ''}
            onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={currentUser.email || ''}
            onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={currentUser.password || ''}
            onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
          />
          <SafeFormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              value={currentUser.role || 'user'}
              onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value as 'admin' | 'user' })}
              label="Role"
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </SafeFormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            type="text"
            fullWidth
            value={currentUser.username || ''}
            onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={currentUser.email || ''}
            onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="New Password (leave blank to keep current)"
            type="password"
            fullWidth
            value={currentUser.password || ''}
            onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
            helperText="Enter a new password only if you want to change it"
          />
          <SafeFormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              value={currentUser.role || 'user'}
              onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value as 'admin' | 'user' })}
              label="Role"
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </SafeFormControl>
          <SafeFormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>
            <Select
              value={currentUser.is_active === undefined ? true : currentUser.is_active}
              onChange={(e) => setCurrentUser({ ...currentUser, is_active: e.target.value === 'true' })}
              label="Status"
            >
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </SafeFormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateUser} variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <Typography>
            Are you sure you want to delete the following user?
          </Typography>
          {userToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Username:</strong> {userToDelete.username}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {userToDelete.email}
              </Typography>
              <Typography variant="body2">
                <strong>Role:</strong> {userToDelete.role}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteUser} 
            variant="contained" 
            color="error"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default withAdminAuth(UserManagement);
