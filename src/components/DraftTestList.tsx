import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Collapse,
  Typography,
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { 
  ExpandLess, 
  ExpandMore, 
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { removeFromCart, removeQuestionFromTest } from '@/lib/client-actions';

interface DraftTest {
  id: string;
  name: string;
  date: string;
  questions: any[];
}

const DraftTestList: React.FC = () => {
  const [draftTests, setDraftTests] = useState<DraftTest[]>([]);
  const [open, setOpen] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<DraftTest | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddQuestionsDialogOpen, setIsAddQuestionsDialogOpen] = useState(false);
  const [editedTestName, setEditedTestName] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [removingQuestion, setRemovingQuestion] = useState<{ testId: string, questionId: number } | null>(null);
  
  const router = useRouter();
  const { addQuestion, questions: cartQuestions } = useCartStore();

  const fetchDraftTests = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get test IDs from local storage
      const testIdsString = localStorage.getItem('testIds');
      const testIds = testIdsString ? JSON.parse(testIdsString) : [];

      if (testIds.length === 0) {
        setDraftTests([]);
        setLoading(false);
        return;
      }

      // Fetch draft tests from the database for each test ID
      const draftTestsData = await Promise.all(
        testIds.map(async (testId: string) => {
          try {
            const response = await fetch(`/api/cart?testId=${testId}`);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // Transform the data to match the DraftTest interface
            const testName = localStorage.getItem(`testName-${testId}`) || `Test ${testId}`;
            return {
              id: testId,
              name: testName,
              date: new Date().toLocaleDateString(),
              questions: data.questions || [],
            };
          } catch (error) {
            console.error(`Error fetching draft test ${testId}:`, error);
            return null;
          }
        })
      );

      // Filter out any null results (failed fetches)
      const validDraftTests = draftTestsData.filter(Boolean);
      setDraftTests(validDraftTests as DraftTest[]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching draft tests:', error);
      setError('Failed to load draft tests.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDraftTests();
  }, []);

  const handleClick = (id: string) => {
    setOpen({
      ...open,
      [id]: !open[id],
    });
  };

  const handleEditTest = (test: DraftTest) => {
    setSelectedTest(test);
    setEditedTestName(test.name);
    setIsEditDialogOpen(true);
  };

  const handleSaveTestName = async () => {
    if (selectedTest && editedTestName.trim()) {
      // Save the updated test name to localStorage
      localStorage.setItem(`testName-${selectedTest.id}`, editedTestName);
      
      // Update the test in the state
      setDraftTests(prevTests => 
        prevTests.map(test => 
          test.id === selectedTest.id ? { ...test, name: editedTestName } : test
        )
      );
      
      setSnackbarMessage('Test name updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setIsEditDialogOpen(false);
    }
  };

  const handleAddQuestionsToTest = (test: DraftTest) => {
    setSelectedTest(test);
    setIsAddQuestionsDialogOpen(true);
    
    // Navigate to questions page with test ID in query params
    router.push(`/questions?testId=${test.id}`);
  };

  const handleRemoveQuestion = async (testId: string, questionId: number) => {
    setRemovingQuestion({ testId, questionId });
    
    try {
      await removeQuestionFromTest({ testId, questionId });
      
      // Update the local state to remove the question
      setDraftTests(prevTests => 
        prevTests.map(test => 
          test.id === testId 
            ? { 
                ...test, 
                questions: test.questions.filter(q => q.id !== questionId) 
              } 
            : test
        )
      );
      
      setSnackbarMessage('Question removed successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error removing question:', error);
      setSnackbarMessage('Failed to remove question');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setRemovingQuestion(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return <Typography>Loading draft tests...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (draftTests.length === 0) {
    return <Typography>No draft tests found.</Typography>;
  }

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Your Draft Tests</Typography>
        <Button 
          variant="outlined" 
          startIcon={<SearchIcon />}
          onClick={() => router.push('/questions')}
        >
          Browse Questions
        </Button>
      </Box>
      
      <List>
        {draftTests.map((test) => (
          <React.Fragment key={test.id}>
            <ListItem 
              sx={{ 
                bgcolor: 'background.paper', 
                mb: 1, 
                borderRadius: 1,
                boxShadow: 1
              }}
            >
              <ListItemText
                primary={test.name}
                secondary={`${test.date} - ${test.questions.length} Questions`}
                onClick={() => handleClick(test.id)}
                sx={{ cursor: 'pointer' }}
              />
              <IconButton onClick={() => handleEditTest(test)}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => handleAddQuestionsToTest(test)}>
                <AddIcon />
              </IconButton>
              <IconButton onClick={() => handleClick(test.id)}>
                {open[test.id] ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </ListItem>
            <Collapse in={open[test.id]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ pl: 2, pr: 2 }}>
                {test.questions.map((question) => (
                  <ListItem 
                    key={question.id} 
                    sx={{ 
                      pl: 2, 
                      bgcolor: 'background.paper', 
                      mb: 1, 
                      borderRadius: 1,
                      boxShadow: 1
                    }}
                  >
                    <ListItemText 
                      primary={question.Question} 
                      secondary={`${question.Subject} - ${question.Topic}`}
                    />
                    <IconButton 
                      onClick={() => handleRemoveQuestion(test.id, question.id)}
                      disabled={removingQuestion && removingQuestion.testId === test.id && removingQuestion.questionId === question.id}
                    >
                      {removingQuestion && removingQuestion.testId === test.id && removingQuestion.questionId === question.id ? (
                        <CircularProgress size={24} />
                      ) : (
                        <DeleteIcon />
                      )}
                    </IconButton>
                  </ListItem>
                ))}
                {test.questions.length === 0 && (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2">No questions in this test.</Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />}
                      onClick={() => handleAddQuestionsToTest(test)}
                      sx={{ mt: 1 }}
                    >
                      Add Questions
                    </Button>
                  </Box>
                )}
              </List>
            </Collapse>
          </React.Fragment>
        ))}
      </List>

      {/* Edit Test Name Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogTitle>Edit Test Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Test Name"
            type="text"
            fullWidth
            value={editedTestName}
            onChange={(e) => setEditedTestName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTestName} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DraftTestList;
