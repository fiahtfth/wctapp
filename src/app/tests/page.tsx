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
  DialogActions
} from '@mui/material';
import { 
  AssessmentOutlined as TestIcon, 
  VisibilityOutlined as ViewIcon,
  DeleteOutline as DeleteIcon
} from '@mui/icons-material';
import { getExportedTests, ExportedTest } from '@/lib/actions/test-actions';

export default function TestManagement() {
  const [tests, setTests] = useState<ExportedTest[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedTest, setSelectedTest] = useState<ExportedTest | null>(null);
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
    fetchTests();
  }, []);

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

  const handleDeleteTest = (test: ExportedTest) => {
    setSelectedTest(test);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTest = () => {
    // Implement test deletion logic
    console.log('Deleting test:', selectedTest);
    setDeleteDialogOpen(false);
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <TestIcon 
          color="primary" 
          sx={{ fontSize: 40, mr: 2 }} 
        />
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600, 
            color: 'text.primary' 
          }}
        >
          Test Management
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Test Name</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Question Count</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? tests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : tests
              ).map((test) => (
                <TableRow key={test.id}>
                  <TableCell>{test.name}</TableCell>
                  <TableCell>{test.batch}</TableCell>
                  <TableCell>
                    {new Date(test.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{test.questionCount}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={tests.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Test Details Dialog */}
      <Dialog
        open={!!selectedTest}
        onClose={() => setSelectedTest(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Test Details: {selectedTest?.name}
        </DialogTitle>
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
          <Button 
            onClick={() => setSelectedTest(null)} 
            color="secondary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Confirm Test Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the test "{selectedTest?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            color="secondary"
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteTest} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
