'use client';
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Typography,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  RemoveCircleOutline as RemoveCircleIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { useCartStore } from '@/store/cartStore';
import { removeFromCart, fetchCartItems } from '@/lib/client-actions';
import { useRouter } from 'next/navigation';
import { QuestionCard } from './QuestionCard';
import * as XLSX from 'xlsx';
import { saveDraftCart } from '@/lib/database/queries';
import { Question } from '@/types/question';

export default function Cart() {
  const [mounted, setMounted] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [testId] = useState(() => {
    // Use the same test ID from actions.ts
    if (typeof window !== 'undefined') {
      const storedTestId = localStorage.getItem('testId');
      if (storedTestId) {
        console.log('Using stored testId:', storedTestId);
        return storedTestId;
      }
      const newTestId = uuidv4();
      console.log('Generated new testId:', newTestId);
      localStorage.setItem('testId', newTestId);
      return newTestId;
    }
    const fallbackTestId = uuidv4();
    console.log('Using fallback testId:', fallbackTestId);
    return fallbackTestId;
  });
  const [testDetails, setTestDetails] = useState({
    testName: '',
    batch: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [removedQuestion, setRemovedQuestion] = useState<string | null>(null);
  const [draftSaveError, setDraftSaveError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id?: number } | null>(null);
  const { questions, removeQuestion, clearCart } = useCartStore();
  const router = useRouter();
  useEffect(() => {
    // Ensure this only runs on the client
    setMounted(true);
    // Hydrate the store
    useCartStore.persist.rehydrate();
    // Log cart contents on mount
    console.log('Cart Component Mounted, Current Questions:', questions);

    // Initialize cart items
    if (testId) {
      console.log('Fetching cart items with testId:', testId); // Debug log
      fetchCartItems(testId).then(result => {
        console.log('Fetched cart items:', result); // Debug log
        if (result.questions && Array.isArray(result.questions)) {
          console.log('Cart items structure:', result.questions);
          result.questions.forEach((item: Question) => {
            useCartStore.getState().addQuestion(item);
          });
        }
      }).catch(error => {
        console.error('Error fetching cart items:', error);
      });
    }
  }, [testId]);
  useEffect(() => {
    // Check for user in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
  }, []);
  const handleRemoveQuestion = async (questionId: string | number) => {
    console.log('Attempting to remove question from cart:', questionId);
    // Find the question being removed (for snackbar)
    const removedQuestionDetails = questions.find(q => q.id === questionId);
    
    try {
      // Remove the question from the store first for immediate UI update
      removeQuestion(String(questionId));
      
      // Then remove from server
      await removeFromCart(questionId, testId);
      
      // Set snackbar state
      if (removedQuestionDetails) {
        setRemovedQuestion(
          (removedQuestionDetails.text || 'Question').toString()
        );
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error removing question:', error);
      // If server removal fails, add the question back to the store
      if (removedQuestionDetails) {
        useCartStore.getState().addQuestion(removedQuestionDetails);
      }
    }
  };
  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };
  const handleExport = () => {
    // Prepare export data with ALL available question details
    const exportData = questions.map((question, index) => {
      // Create a structured row with specific fields in desired order
      console.log('Processing question:', question); // Debug log
      const exportRow = {
        'S.No': index + 1,
        Question: question.Question,
        Answer: question.Answer || '',
        Explanation: question.Explanation || '',
        Subject: question.Subject,
        'Module Name': question.ModuleName || question['Module Name'] || '',
        Topic: question.Topic,
        'Difficulty Level': question.DifficultyLevel || question['Difficulty Level'] || '',
        'Question Type': question.QuestionType || question.Question_Type || '',
        'Nature of Question': question.NatureOfQuestion || question['Nature of Question'] || '',
      };
      console.log('Export row:', exportRow); // Debug log
      return exportRow;
    });
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    // Create first sheet with test details
    const testDetailsSheet = XLSX.utils.json_to_sheet([
      {
        'Test Name': testDetails.testName,
        Batch: testDetails.batch,
        Date: testDetails.date,
      },
    ]);
    XLSX.utils.book_append_sheet(wb, testDetailsSheet, 'Test Details');
    // Create second sheet with questions
    const questionsSheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, questionsSheet, 'Questions');
    // Export to Excel
    XLSX.writeFile(wb, `${testDetails.testName || 'Test'}_Export.xlsx`);
    // Close modal
    setExportModalOpen(false);
  };
  const handleSaveDraft = async () => {
    try {
      // Validate test details
      if (!testDetails.testName) {
        setDraftSaveError('Test Name is required');
        return;
      }
      // Check for user authentication with more robust checks
      const storedUser = localStorage.getItem('user');
      console.log('Stored User:', storedUser); // Debug log
      let parsedUser = null;
      try {
        parsedUser = storedUser ? JSON.parse(storedUser) : null;
      } catch (parseError) {
        console.error('Error parsing user from localStorage:', parseError);
        setDraftSaveError('Invalid user authentication');
        return;
      }
      console.log('Parsed User:', parsedUser); // Debug log
      // Use default user ID if no user found or user ID is invalid
      const userId = parsedUser && parsedUser.id ? Number(parsedUser.id) : 1;
      console.log('Using User ID:', userId); // Debug log
      // Validate questions
      if (questions.length === 0) {
        setDraftSaveError('Cart is empty. Add questions before saving draft.');
        return;
      }
      // Extract question IDs
      const questionIds = questions.map(q => {
        const id = Number(q.id);
        if (isNaN(id)) {
          console.error('Invalid question ID:', q.id);
          throw new Error(`Invalid question ID: ${q.id}`);
        }
        return id;
      });
      // Save draft cart
      const draftCartId = await saveDraftCart(
        userId,
        testDetails.testName,
        testDetails.batch,
        testDetails.date,
        questionIds
      );
      // Reset modal and show success message
      setExportModalOpen(false);
      setDraftSaveError(null);
      // Optional: Show a success snackbar or toast
      console.log('Draft cart saved successfully with ID:', draftCartId);
      // Store the testId and testName in local storage
      localStorage.setItem('testIds', JSON.stringify([testId]));
      localStorage.setItem(`testName-${testId}`, testDetails.testName);

      // Show a success message to the user
      setSnackbarOpen(true);
    } catch (error: unknown) {
      console.error('Error saving draft cart:', error);
      setDraftSaveError(error instanceof Error ? error.message : 'Failed to save draft cart');
    }
  };
  if (!mounted) {
    return (
      <Container
        maxWidth="lg"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Typography>Loading...</Typography>
      </Container>
    );
  }
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} variant="outlined">
            Back to Questions
          </Button>
          <Typography variant="h5" component="h1">
            Cart ({questions.length} items)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {questions.length > 0 && (
              <Button
                onClick={() => setExportModalOpen(true)}
                color="primary"
                variant="contained"
                startIcon={<ExportIcon />}
              >
                Export
              </Button>
            )}
            {questions.length > 0 && (
              <Button
                onClick={() => {
                  console.log('Clearing entire cart');
                  clearCart();
                }}
                color="error"
                variant="outlined"
                startIcon={<DeleteIcon />}
              >
                Clear Cart
              </Button>
            )}
          </Box>
        </Box>
        {questions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Your cart is empty
            </Typography>
            <Button
              onClick={() => router.push('/')}
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Back to Home
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3} position="relative">
            {(questions as Question[]).map((question) => (
              <Grid item xs={12} sm={6} md={4} key={question.id} position="relative">
                <QuestionCard
                  question={question}
                  onQuestionUpdate={() => {}}
                  initialInCart={true}
                  showCartButton={false}
                />
                <IconButton
                  onClick={() => handleRemoveQuestion(question.id)}
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 10,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,100,100,0.2)',
                    },
                  }}
                  title="Remove from Cart"
                >
                  <RemoveCircleIcon color="error" />
                </IconButton>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      {/* Export Modal */}
      <Dialog
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Test</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Test Name"
                value={testDetails.testName}
                onChange={e =>
                  setTestDetails(prev => ({
                    ...prev,
                    testName: e.target.value,
                  }))
                }
                required
                error={!testDetails.testName}
                helperText={!testDetails.testName ? 'Test Name is required' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Batch"
                value={testDetails.batch}
                onChange={e => setTestDetails(prev => ({ ...prev, batch: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={testDetails.date}
                onChange={e => setTestDetails(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            {draftSaveError && (
              <Grid item xs={12}>
                <Typography color="error">{draftSaveError}</Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveDraft} color="secondary" variant="outlined">
            Save Draft
          </Button>
          <Button
            onClick={handleExport}
            color="primary"
            variant="contained"
            disabled={!testDetails.testName}
          >
            Export
          </Button>
          <Button onClick={() => setExportModalOpen(false)} color="error">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="info" sx={{ width: '100%' }}>
          {removedQuestion} removed from cart
        </Alert>
      </Snackbar>
    </Container>
  );
}
