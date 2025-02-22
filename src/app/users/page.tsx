'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  FormControl,
  InputLabel,
  Typography,
} from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import LogoutIcon from '@mui/icons-material/Logout';
interface User {
  id: number;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}
interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  exp: number;
}
export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // Check user role on component mount
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      // Validate token expiration
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        console.error('Token expired');
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }
      // Validate role and required fields
      if (!decoded.role || decoded.role !== 'admin') {
        console.error('Unauthorized role');
        router.push('/dashboard');
        return;
      }
      setIsAdmin(true);
      fetchUsers();
    } catch (error) {
      console.error('Token decoding error:', error);
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, []);
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      let response;
      try {
        response = await fetch('/api/users/list', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (networkError) {
        // Handle network-level errors (no connection, DNS failure, etc.)
        console.error('Network error:', networkError);
        throw new Error(
          `Network error: ${networkError instanceof Error ? networkError.message : 'Unable to connect'}`
        );
      }
      // Detailed error handling for non-OK responses
      if (!response.ok) {
        let errorDetails = '';
        let errorData = {};
        try {
          // Safely attempt to parse error response
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
            errorDetails = (errorData as any)?.error || (errorData as any)?.details || response.statusText;
          } else {
            // Fallback for non-JSON responses
            errorDetails = (await response.text()) || response.statusText;
          }
        } catch (parseError) {
          // If parsing fails, use default error details
          console.warn('Error parsing response:', parseError);
          errorDetails = response.statusText;
        }
        // Construct a detailed error message
        const errorMessage = `HTTP error! status: ${response.status}, details: ${errorDetails}`;
        console.error(errorMessage, {
          status: response.status,
          errorData,
          contentType: response.headers.get('content-type'),
        });
        throw new Error(errorMessage);
      }
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError);
        throw new Error('Invalid response format');
      }
      // Validate the response structure
      if (!data || !Array.isArray(data.users)) {
        // Log detailed response for debugging
        console.warn('Invalid response structure', {
          data,
          usersType: typeof data?.users,
          dataKeys: data ? Object.keys(data) : 'No data',
        });
        // Check for specific message or suggested action
        const errorMessage = data?.message || data?.suggestedAction || 'Invalid users data format';
        throw new Error(errorMessage);
      }
      // Validate each user object with more detailed logging
      const validUsers = data.users.filter((user: User) => {
        const isValid =
          user &&
          typeof user.id === 'number' &&
          typeof user.email === 'string' &&
          ['admin', 'user'].includes(user.role) &&
          typeof user.created_at === 'string';

        if (!isValid) {
          console.warn('Invalid user object:', user);
        }

        return isValid;
      });
      // Check if any valid users were found
      if (validUsers.length === 0) {
        // Log additional context about the response
        console.warn('No valid users found', {
          totalUsers: data.users.length,
          responseMessage: data.message,
          timestamp: data.timestamp,
        });
        throw new Error(data.message || 'No valid users found. Please contact your administrator.');
      }
      // Set users and log details
      setUsers(validUsers);
      // Log total users for debugging with additional context
      console.log(`Fetched ${validUsers.length} users`, {
        totalResponseUsers: data.users.length,
        responseMessage: data.message,
        timestamp: data.timestamp,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      // Detailed error handling
      let errorMessage = 'Failed to fetch users';
      let shouldRedirect = false;
      if (error instanceof Error) {
        // Check for specific error types
        if (
          error.message.includes('authentication') ||
          error.message.includes('token') ||
          error.message.includes('401') ||
          error.message.includes('403')
        ) {
          // Token-related errors
          errorMessage = 'Authentication failed. Please log in again.';
          shouldRedirect = true;
        } else if (
          error.message.includes('HTTP error') ||
          error.message.includes('Network error') ||
          error.message.includes('500')
        ) {
          // Server-side or network errors
          errorMessage = `Server error: ${error.message}`;
        } else {
          // Generic error
          errorMessage = error.message;
        }
      }
      // Show error message
      setError(errorMessage);
      setUsers([]);
      // Redirect if authentication failed
      if (shouldRedirect) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleCreateUser = async () => {
    try {
      // Validate input
      if (!currentUser.email || !currentUser.password) {
        setError('Email and password are required');
        return;
      }
      // Prepare create payload
      const createPayload = {
        email: currentUser.email,
        password: currentUser.password,
        role: currentUser.role || 'user',
      };
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        router.push('/login');
        return;
      }
      // Send create request
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createPayload),
      });
      // Handle response
      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = (errorData as any)?.error || (errorData as any)?.details || response.statusText;
        } catch {
          errorDetails = response.statusText;
        }
        // Log detailed error
        console.error('User create error', {
          status: response.status,
          errorDetails,
        });
        // Set error state
        setError(`Failed to create user: ${errorDetails}`);
        return;
      }
      // Parse successful response
      const data = await response.json();
      // Add new user to users list
      if (data.user) {
        setUsers(prevUsers => [...prevUsers, data.user]);
      }
      // Close dialog and reset current user
      setOpenCreateDialog(false);
      setCurrentUser({});
      // Show success message
      console.log('User created successfully', data);
    } catch (error) {
      console.error('Unexpected error in user creation:', error);
      setError(
        error instanceof Error
          ? `Creation failed: ${error.message}`
          : 'An unexpected error occurred'
      );
    }
  };
  const handleUpdateUser = async () => {
    try {
      // Validate input
      if (!currentUser.id) {
        setError('User ID is required');
        return;
      }
      // Prepare update payload
      const updatePayload = {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
      };
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        router.push('/login');
        return;
      }
      // Send update request
      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });
      // Handle response
      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = (errorData as any)?.error || (errorData as any)?.details || response.statusText;
        } catch {
          errorDetails = response.statusText;
        }
        // Log detailed error
        console.error('User update error', {
          status: response.status,
          errorDetails,
        });
        // Set error state
        setError(`Failed to update user: ${errorDetails}`);
        return;
      }
      // Parse successful response
      const data = await response.json();
      // Update users list with the updated user
      if (data.user) {
        setUsers(prevUsers => prevUsers.map(user => (user.id === data.user.id ? data.user : user)));
      }
      // Close dialog and reset current user
      setOpenEditDialog(false);
      setCurrentUser({});
      // Show success message
      console.log('User updated successfully', data);
    } catch (error) {
      console.error('Unexpected error in user update:', error);
      setError(
        error instanceof Error ? `Update failed: ${error.message}` : 'An unexpected error occurred'
      );
    }
  };
  const handleLogout = () => {
    // Remove token from local storage
    localStorage.removeItem('token');
    // Clear any other authentication-related local storage items
    localStorage.removeItem('user');
    // Redirect to login page
    router.push('/login');
  };
  if (!isAdmin) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Typography variant="h6" color="error">
          Access Denied: Administrators Only
        </Typography>
      </Box>
    );
  }
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Typography variant="h6">Loading Users...</Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Typography variant="h6" color="error">
          Error: {error}
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ width: '100%', padding: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">User Management</Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
        >
          Logout
        </Button>
      </Box>
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          setCurrentUser({});
          setOpenCreateDialog(true);
        }}
      >
        Create New User
      </Button>
      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Updated At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                  <TableCell>{new Date(user.updated_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        setCurrentUser(user);
                        setOpenEditDialog(true);
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Create User Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={currentUser.email || ''}
            onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            onChange={e => setCurrentUser({ ...currentUser, password: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              value={currentUser.role || 'user'}
              label="Role"
              onChange={e =>
                setCurrentUser({
                  ...currentUser,
                  role: e.target.value as User['role'],
                })
              }
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={currentUser.email || ''}
            onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Password (leave blank to keep current)"
            type="password"
            fullWidth
            onChange={e => {
              if (e.target.value) {
                setCurrentUser({ ...currentUser, password: e.target.value });
              }
            }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              value={currentUser.role || 'user'}
              label="Role"
              onChange={e =>
                setCurrentUser({
                  ...currentUser,
                  role: e.target.value as User['role'],
                })
              }
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateUser} color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
