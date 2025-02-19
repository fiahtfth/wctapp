'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
} from '@mui/material';
import {
  AssessmentOutlined as TestIcon,
  VisibilityOutlined as ViewIcon,
  DeleteOutline as DeleteIcon,
  ListAlt as DraftIcon,
} from '@mui/icons-material';
import { getExportedTests, ExportedTest } from '@/lib/actions/test-actions';
import { getDraftCarts } from '@/lib/database/queries';

export default function TestManagement() {
  const [activeTab, setActiveTab] = useState<'exported' | 'drafts'>('exported');
  const [tests, setTests] = useState<ExportedTest[]>([]);
  const [draftCarts, setDraftCarts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedTest, setSelectedTest] = useState<ExportedTest | null>(null);
  const [selectedDraftCart, setSelectedDraftCart] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchTests() {
      try {
        const fetchedTests = await getExportedTests();
        setTests(fetchedTests);
      } catch (error) {
        console.error('Failed to fetch tests', error);
      }
    }

    async function fetchDraftCarts() {
      try {
        // Get user ID from localStorage
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        if (user?.id) {
          const drafts = await getDraftCarts(user.id);
          setDraftCarts(drafts);
        }
      } catch (error) {
        console.error('Failed to fetch draft carts', error);
      }
    }

    if (activeTab === 'exported') {
      fetchTests();
    } else {
      fetchDraftCarts();
    }
  }, [activeTab]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewTest = (test: ExportedTest) => {
    setSelectedTest(test);
  };

  const handleViewDraftCart = (draftCart: any) => {
    setSelectedDraftCart(draftCart);
  };

  const handleDeleteTest = (test: ExportedTest) => {
    setSelectedTest(test);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDraftCart = (draftCart: any) => {
    setSelectedDraftCart(draftCart);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTest = () => {
    // Implement test deletion logic
    console.log('Deleting test:', selectedTest);
    setDeleteDialogOpen(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: 'exported' | 'drafts') => {
    setActiveTab(newValue);
    setPage(0);
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <TestIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          Test Management
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Exported Tests" value="exported" icon={<TestIcon />} />
        <Tab label="Draft Carts" value="drafts" icon={<DraftIcon />} />
      </Tabs>

      <Paper elevation={3} sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{activeTab === 'exported' ? 'Test Name' : 'Draft Name'}</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell>{activeTab === 'exported' ? 'Created Date' : 'Draft Date'}</TableCell>
                <TableCell>{activeTab === 'exported' ? 'Question Count' : 'Questions'}</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeTab === 'exported'
                ? (rowsPerPage > 0
                    ? tests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    : tests
                  ).map(test => (
                    <TableRow key={test.id}>
                      <TableCell>{test.name}</TableCell>
                      <TableCell>{test.batch}</TableCell>
                      <TableCell>{new Date(test.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{test.questionCount}</TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 1,
                          }}
                        >
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => handleViewTest(test)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteTest(test)}
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                : (rowsPerPage > 0
                    ? draftCarts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    : draftCarts
                  ).map(draftCart => (
                    <TableRow key={draftCart.id}>
                      <TableCell>{draftCart.test_name}</TableCell>
                      <TableCell>{draftCart.batch}</TableCell>
                      <TableCell>{new Date(draftCart.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{draftCart.questions.length}</TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 1,
                          }}
                        >
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => handleViewDraftCart(draftCart)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteDraftCart(draftCart)}
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
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={activeTab === 'exported' ? tests.length : draftCarts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Test Details Dialog */}
      <Dialog open={!!selectedTest} onClose={() => setSelectedTest(null)} maxWidth="md" fullWidth>
        <DialogTitle>Test Details: {selectedTest?.name}</DialogTitle>
        <DialogContent>
          {selectedTest && (
            <Box>
              <Typography variant="body1">
                <strong>Batch:</strong> {selectedTest.batch}
              </Typography>
              <Typography variant="body1">
                <strong>Created Date:</strong> {new Date(selectedTest.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="body1">
                <strong>Number of Questions:</strong> {selectedTest.questionCount}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTest(null)} color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Draft Cart Details Dialog */}
      <Dialog
        open={!!selectedDraftCart}
        onClose={() => setSelectedDraftCart(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Draft Cart Details: {selectedDraftCart?.test_name}</DialogTitle>
        <DialogContent>
          {selectedDraftCart && (
            <Box>
              <Typography variant="body1">
                <strong>Batch:</strong> {selectedDraftCart.batch}
              </Typography>
              <Typography variant="body1">
                <strong>Draft Date:</strong>{' '}
                {new Date(selectedDraftCart.created_at).toLocaleString()}
              </Typography>
              <Typography variant="body1">
                <strong>Number of Questions:</strong> {selectedDraftCart.questions.length}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDraftCart(null)} color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the {activeTab === 'exported' ? 'test' : 'draft cart'}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteTest} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
