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
  Menu,
  MenuItem,
  ListItemText,
  Divider,
  Breadcrumbs,
  Link,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  RemoveCircleOutline as RemoveCircleIcon,
  FileDownload as ExportIcon,
  Save as SaveIcon,
  List as ListIcon,
  DeleteForever as DeleteForeverIcon,
  Home as HomeIcon,
  QuestionAnswer as QuestionIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import { useCartStore } from '@/store/cartStore';
import { removeFromCart, fetchCartItems } from '@/lib/client-actions';
import { useRouter } from 'next/navigation';
import { QuestionCard } from './QuestionCard';
import * as XLSX from 'xlsx';
import { saveDraftCart } from '@/lib/database/queries';
import { Question } from '@/types/question';
import { exportTest } from '@/lib/exportUtils';
import { getTestId } from '@/lib/actions';
import DatabaseSetupAlert from './DatabaseSetupAlert';

// Helper function to convert CartQuestion to Question
const convertToQuestion = (cartQuestion: any): Question => {
  return {
    id: cartQuestion.id,
    text: cartQuestion.Question || '',
    answer: cartQuestion.Answer || '',
    explanation: cartQuestion.Explanation || '',
    subject: cartQuestion.Subject || '',
    moduleName: cartQuestion['Module Name'] || cartQuestion.ModuleName || '',
    topic: cartQuestion.Topic || '',
    subTopic: cartQuestion['Sub Topic'] || cartQuestion.SubTopic || '',
    difficultyLevel: cartQuestion['Difficulty Level'] || cartQuestion.DifficultyLevel || '',
    questionType: cartQuestion.QuestionType || cartQuestion.Question_Type || '',
    natureOfQuestion: cartQuestion['Nature of Question'] || cartQuestion.NatureOfQuestion || '',
    // Copy over any other properties
    ...cartQuestion
  };
};

// Debug helper to inspect question structure
const inspectQuestionStructure = (question: any) => {
  const structure = {
    keys: Object.keys(question),
    hasQuestion: 'Question' in question,
    hasText: 'text' in question,
    hasAnswer: 'Answer' in question,
    hasAnswerLower: 'answer' in question,
    hasExplanation: 'Explanation' in question,
    hasExplanationLower: 'explanation' in question,
    hasModuleName: 'ModuleName' in question,
    hasModuleNameSpaced: 'Module Name' in question,
    hasModuleNameLower: 'moduleName' in question,
    questionValue: question.Question || question.text,
    answerValue: question.Answer || question.answer,
    explanationValue: question.Explanation || question.explanation,
    moduleNameValue: question.ModuleName || question['Module Name'] || question.moduleName,
  };
  console.log('Question structure:', structure);
  return structure;
};

interface CartProps {
  testId?: string;
}

export default function Cart({ testId: propTestId }: CartProps) {
  const [mounted, setMounted] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
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
  const [testId, setTestId] = useState<string>('');
  const [savedDrafts, setSavedDrafts] = useState<{id: string, name: string}[]>([]);
  const [draftsMenuAnchor, setDraftsMenuAnchor] = useState<null | HTMLElement>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [confirmDeleteDraftId, setConfirmDeleteDraftId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    // Ensure this only runs on the client
    setMounted(true);
    // Hydrate the store
    useCartStore.persist.rehydrate();
    // Log cart contents on mount
    console.log('Cart Component Mounted, Current Questions:', questions);

    // Get testId from props or localStorage
    const storedTestId = localStorage.getItem('currentTestId');
    const currentTestId = propTestId || storedTestId || getTestId();
    console.log('Cart component using stored testId:', currentTestId);
    setTestId(currentTestId);
    
    // Store the testId in localStorage as the current working draft
    localStorage.setItem('currentTestId', currentTestId);

    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    console.log('Cart Component Mounted, Current Questions:', questions);
    
    // Load saved drafts from localStorage
    const storedTestIds = localStorage.getItem('savedTestIds');
    if (storedTestIds) {
      try {
        const testIds = JSON.parse(storedTestIds);
        const drafts = testIds.map((id: string) => ({
          id,
          name: localStorage.getItem(`testName-${id}`) || 'Unnamed Draft'
        }));
        setSavedDrafts(drafts);
        console.log('Loaded saved drafts:', drafts);
      } catch (error) {
        console.error('Error parsing saved drafts from localStorage:', error);
      }
    }
    
    // Fetch cart items from server
    console.log('Fetching cart items with testId:', currentTestId);
    fetchCartItems(currentTestId).then(data => {
      console.log('Fetched cart items:', data);
      // Note: fetchCartItems already updates the cart store
      console.log('Cart store after fetching:', useCartStore.getState().questions);
    }).catch(error => {
      console.error('Error fetching cart items:', error);
    });
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }

    console.log('Cart component questions on mount:', questions);
    console.log('Cart store questions on mount:', useCartStore.getState().questions);
  }, []);
  
  // Separate useEffect for keyboard shortcuts
  useEffect(() => {
    // Add keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (testDetails.testName && questions.length > 0) {
          handleSaveDraft();
        } else {
          setExportModalOpen(true);
        }
      }
      
      // Ctrl/Cmd + D to open drafts menu
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (!draftsMenuAnchor && !loadingDraft) {
          // Create a fake anchor element at the top right
          const fakeAnchor = document.createElement('div');
          fakeAnchor.style.position = 'absolute';
          fakeAnchor.style.top = '100px';
          fakeAnchor.style.right = '100px';
          document.body.appendChild(fakeAnchor);
          setDraftsMenuAnchor(fakeAnchor);
          
          // Clean up the fake anchor when menu closes
          setTimeout(() => {
            document.body.removeChild(fakeAnchor);
          }, 100);
        }
      }
      
      // Ctrl/Cmd + E to open export modal
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setExportModalOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [testDetails.testName, questions.length, draftsMenuAnchor, loadingDraft]);

  const handleRemoveQuestion = async (questionId: string | number) => {
    console.log('Attempting to remove question from cart:', questionId);
    // Find the question being removed (for snackbar)
    const removedQuestionDetails = questions.find(q => q.id === questionId);
    
    try {
      // Remove the question from the store first for immediate UI update
      removeQuestion(String(questionId));
      
      // Then remove from server - ensure questionId is a string
      await removeFromCart(String(questionId), testId);
      
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
    // Debug: Inspect the first question's structure
    if (questions.length > 0) {
      console.log('First question structure:');
      inspectQuestionStructure(questions[0]);
    }
    
    // Prepare export data with ALL available question details
    const exportData = questions.map((question, index) => {
      // First convert to a standardized format to ensure all fields are available
      const standardizedQuestion = convertToQuestion(question);
      
      // Create a structured row with specific fields in desired order
      console.log('Processing question:', standardizedQuestion); // Debug log
      
      // Ensure we access all possible field name variations
      const exportRow = {
        'S.No': index + 1,
        Question: standardizedQuestion.text || standardizedQuestion.Question || '',
        Answer: standardizedQuestion.answer || standardizedQuestion.Answer || '',
        Explanation: standardizedQuestion.explanation || standardizedQuestion.Explanation || '',
        Subject: standardizedQuestion.subject || standardizedQuestion.Subject || '',
        'Module Name': standardizedQuestion.moduleName || standardizedQuestion['Module Name'] || standardizedQuestion.ModuleName || '',
        Topic: standardizedQuestion.topic || standardizedQuestion.Topic || '',
        'Difficulty Level': standardizedQuestion.difficultyLevel || standardizedQuestion['Difficulty Level'] || standardizedQuestion.DifficultyLevel || '',
        'Question Type': standardizedQuestion.questionType || standardizedQuestion.QuestionType || standardizedQuestion.Question_Type || '',
        'Nature of Question': standardizedQuestion.natureOfQuestion || standardizedQuestion['Nature of Question'] || standardizedQuestion.NatureOfQuestion || '',
      };
      console.log('Export row:', exportRow); // Debug log
      return exportRow;
    });
    
    // Debug: Log the full export data
    console.log('Full export data:', JSON.stringify(exportData, null, 2));
    
    // Export the data
    exportTest({
      testName: testDetails.testName,
      batch: testDetails.batch,
      date: testDetails.date,
      questions: exportData
    });
    
    // Close the modal
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
      
      // Use a default user ID of 1 if no user is found
      let userId = 1;
      
      // Try to parse the user from localStorage, but don't fail if it's not valid
      try {
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id && !isNaN(Number(parsedUser.id))) {
            userId = Number(parsedUser.id);
          }
        }
      } catch (parseError) {
        console.warn('Error parsing user from localStorage, using default user ID:', parseError);
      }
      
      console.log('Using User ID:', userId); // Debug log
      
      // Validate questions
      if (questions.length === 0) {
        setDraftSaveError('Cart is empty. Add questions before saving draft.');
        return;
      }
      
      // Extract question IDs and validate each one
      const questionIds = [];
      for (const question of questions) {
        // Try to convert to number, use a default if it fails
        let id;
        try {
          id = Number(question.id);
          if (isNaN(id) || id <= 0) {
            console.warn(`Invalid question ID: ${question.id}, using a placeholder`);
            id = Math.floor(Math.random() * 10000) + 1; // Generate a random positive ID
          }
        } catch (e) {
          console.warn(`Error converting question ID: ${question.id}, using a placeholder`);
          id = Math.floor(Math.random() * 10000) + 1; // Generate a random positive ID
        }
        questionIds.push(id);
      }
      
      console.log('Saving draft with question IDs:', questionIds);
      
      // Show loading state
      setDraftSaveError('Saving draft...');
      
      // Save draft cart
      try {
        const draftCartId = await saveDraftCart(
          userId,
          testDetails.testName,
          testDetails.batch,
          testDetails.date,
          questionIds,
          testId // Pass the current testId for updating existing drafts
        );
        
        // Reset modal and show success message
        setExportModalOpen(false);
        setDraftSaveError(null);
        
        // Update the current testId if it's a new draft
        if (!testId) {
          setTestId(draftCartId);
          localStorage.setItem('currentTestId', draftCartId);
        }
        
        // Store the testId and testName in local storage
        // Get existing saved test IDs
        const storedTestIds = localStorage.getItem('savedTestIds');
        let testIds = [];
        if (storedTestIds) {
          try {
            testIds = JSON.parse(storedTestIds);
            // Make sure it's an array
            if (!Array.isArray(testIds)) {
              testIds = [];
            }
          } catch (e) {
            console.warn('Error parsing saved test IDs, resetting:', e);
            testIds = [];
          }
        }
        
        // Add the new testId if it's not already in the list
        if (!testIds.includes(draftCartId)) {
          testIds.push(draftCartId);
        }
        
        // Save the updated list
        localStorage.setItem('savedTestIds', JSON.stringify(testIds));
        localStorage.setItem(`testName-${draftCartId}`, testDetails.testName);
        
        // Update the saved drafts state
        setSavedDrafts(testIds.map(id => ({
          id,
          name: localStorage.getItem(`testName-${id}`) || 'Unnamed Draft'
        })));
        
        // Show a success message to the user
        setSnackbarOpen(true);
        setRemovedQuestion(`Draft "${testDetails.testName}" saved successfully`);
        
        console.log('Draft cart saved successfully with ID:', draftCartId);
      } catch (error) {
        console.error('Error saving draft:', error);
        setDraftError(error instanceof Error ? error.message : 'Failed to save draft');
        setLoadingDraft(false);
      }
    } catch (saveError) {
      console.error('Error saving draft cart:', saveError);
      // Provide a more user-friendly error message
      const errorMessage = saveError instanceof Error 
        ? saveError.message 
        : 'Failed to save draft cart';
      
      // Set the draft error for the DatabaseSetupAlert component
      setDraftError(errorMessage);
      
      // Check for specific error types and provide more helpful messages
      if (errorMessage.includes('foreign key constraint')) {
        setDraftSaveError('Unable to save draft: One or more questions no longer exist in the database.');
      } else if (errorMessage.includes('user')) {
        setDraftSaveError('Unable to save draft: User authentication issue. Please try logging in again.');
      } else {
        setDraftSaveError(`Unable to save draft: ${errorMessage}`);
      }
      
      setLoadingDraft(false);
    }
  };

  // Add a function to load a draft
  const handleLoadDraft = async (draftId: string) => {
    try {
      setLoadingDraft(true);
      console.log('Loading draft:', draftId);
      
      // Close the menu
      setDraftsMenuAnchor(null);
      
      // Set the current testId
      setTestId(draftId);
      localStorage.setItem('currentTestId', draftId);
      
      // Clear the current cart
      clearCart();
      
      // Fetch the cart items for this draft
      await fetchCartItems(draftId);
      
      // Update the test details
      const testName = localStorage.getItem(`testName-${draftId}`) || '';
      setTestDetails(prev => ({
        ...prev,
        testName
      }));
      
      // Show success message
      setSnackbarOpen(true);
      setRemovedQuestion(`Draft "${testName}" loaded successfully`);
    } catch (error) {
      console.error('Error loading draft:', error);
      setSnackbarOpen(true);
      setRemovedQuestion(`Error loading draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingDraft(false);
    }
  };
  
  // Add a function to create a new draft
  const handleNewDraft = () => {
    // Close the menu
    setDraftsMenuAnchor(null);
    
    // Clear the current cart and test details
    clearCart();
    setTestId('');
    localStorage.removeItem('currentTestId');
    
    // Reset test details
    setTestDetails({
      testName: '',
      batch: '',
      date: new Date().toISOString().split('T')[0],
    });
    
    // Show message
    setSnackbarOpen(true);
    setRemovedQuestion('New draft created');
  };

  // Add a function to delete a draft
  const handleDeleteDraft = async (draftId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent triggering the parent MenuItem onClick
    }
    
    // If we're just asking for confirmation
    if (confirmDeleteDraftId !== draftId) {
      setConfirmDeleteDraftId(draftId);
      return;
    }
    
    // If confirmation is already shown and user clicked delete again
    try {
      console.log('Deleting draft:', draftId);
      
      // Close the menu
      setDraftsMenuAnchor(null);
      
      // Remove from localStorage
      const storedTestIds = localStorage.getItem('savedTestIds');
      if (storedTestIds) {
        try {
          const testIds = JSON.parse(storedTestIds);
          const updatedIds = testIds.filter((id: string) => id !== draftId);
          localStorage.setItem('savedTestIds', JSON.stringify(updatedIds));
          localStorage.removeItem(`testName-${draftId}`);
          
          // Update the saved drafts state
          setSavedDrafts(updatedIds.map((id: string) => ({
            id,
            name: localStorage.getItem(`testName-${id}`) || 'Unnamed Draft'
          })));
        } catch (error) {
          console.error('Error updating saved drafts:', error);
        }
      }
      
      // If we're deleting the current draft, create a new one
      if (draftId === testId) {
        handleNewDraft();
      }
      
      // Show success message
      setSnackbarOpen(true);
      setRemovedQuestion('Draft deleted successfully');
      
      // Reset confirmation state
      setConfirmDeleteDraftId(null);
    } catch (error) {
      console.error('Error deleting draft:', error);
      setSnackbarOpen(true);
      setRemovedQuestion(`Error deleting draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConfirmDeleteDraftId(null);
    }
  };
  
  // Cancel delete confirmation
  const handleCancelDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmDeleteDraftId(null);
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

  console.log('Cart component rendering with questions:', questions);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Add breadcrumb navigation */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => router.push('/')}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => router.push('/questions')}
        >
          <QuestionIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Questions
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <CartIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {testDetails.testName ? testDetails.testName : 'Cart'}
        </Typography>
      </Breadcrumbs>
      
      {/* Add keyboard shortcuts help */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Keyboard shortcuts: 
          <Box component="span" sx={{ ml: 1, fontFamily: 'monospace', bgcolor: 'background.default', px: 0.5, py: 0.25, borderRadius: 0.5 }}>
            Ctrl+S
          </Box> Save Draft, 
          <Box component="span" sx={{ ml: 1, fontFamily: 'monospace', bgcolor: 'background.default', px: 0.5, py: 0.25, borderRadius: 0.5 }}>
            Ctrl+D
          </Box> My Drafts, 
          <Box component="span" sx={{ ml: 1, fontFamily: 'monospace', bgcolor: 'background.default', px: 0.5, py: 0.25, borderRadius: 0.5 }}>
            Ctrl+E
          </Box> Export
        </Typography>
        <Button 
          size="small" 
          variant="text" 
          color="primary"
          onClick={() => router.push('/questions')}
        >
          Add More Questions
        </Button>
      </Paper>
      
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
            {testDetails.testName ? `${testDetails.testName} (${questions.length} items)` : `Cart (${questions.length} items)`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              onClick={(e) => setDraftsMenuAnchor(e.currentTarget)}
              color="primary"
              variant="outlined"
              startIcon={<ListIcon />}
              disabled={loadingDraft}
            >
              {loadingDraft ? 'Loading...' : `My Drafts (${savedDrafts.length})`}
            </Button>
            <Menu
              anchorEl={draftsMenuAnchor}
              open={Boolean(draftsMenuAnchor)}
              onClose={() => setDraftsMenuAnchor(null)}
              PaperProps={{
                style: {
                  maxHeight: 300,
                  width: '250px',
                },
              }}
            >
              <MenuItem onClick={handleNewDraft}>
                <ListItemText primary="Create New Draft" />
              </MenuItem>
              {savedDrafts.length > 0 && <Divider />}
              {savedDrafts.map((draft) => (
                <MenuItem 
                  key={draft.id} 
                  onClick={() => handleLoadDraft(draft.id)}
                  selected={draft.id === testId}
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    backgroundColor: draft.id === testId ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    '&:hover': {
                      backgroundColor: draft.id === testId ? 'rgba(25, 118, 210, 0.12)' : undefined,
                    }
                  }}
                >
                  <ListItemText 
                    primary={draft.name} 
                    primaryTypographyProps={{
                      style: {
                        fontWeight: draft.id === testId ? 'bold' : 'normal',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '180px'
                      }
                    }}
                  />
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleDeleteDraft(draft.id, e)}
                    color={confirmDeleteDraftId === draft.id ? "error" : "default"}
                    title={confirmDeleteDraftId === draft.id ? "Click again to confirm deletion" : "Delete draft"}
                  >
                    {confirmDeleteDraftId === draft.id ? (
                      <DeleteForeverIcon fontSize="small" />
                    ) : (
                      <DeleteIcon fontSize="small" />
                    )}
                  </IconButton>
                  {confirmDeleteDraftId === draft.id && (
                    <IconButton 
                      size="small" 
                      onClick={handleCancelDelete}
                      color="primary"
                      title="Cancel deletion"
                      sx={{ ml: 0.5 }}
                    >
                      <ArrowBackIcon fontSize="small" />
                    </IconButton>
                  )}
                </MenuItem>
              ))}
              {savedDrafts.length === 0 && (
                <MenuItem disabled>
                  <ListItemText primary="No saved drafts" />
                </MenuItem>
              )}
            </Menu>
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
        
        {/* Add a current draft indicator if we have a test name */}
        {testDetails.testName && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2, 
              p: 1, 
              borderRadius: 1,
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
            }}
          >
            <Typography variant="body2" color="primary" sx={{ fontWeight: 'medium' }}>
              Current Draft: <strong>{testDetails.testName}</strong>
            </Typography>
            <Button 
              size="small" 
              sx={{ ml: 2 }} 
              onClick={() => setExportModalOpen(true)}
              startIcon={<SaveIcon fontSize="small" />}
            >
              Edit Details
            </Button>
          </Box>
        )}
        
        {questions.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Your cart is empty
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Add questions to your cart to create a test
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push('/questions')}
            >
              Browse Questions
            </Button>
          </Box>
        ) : (
          <>
            {/* Add question count and filter summary */}
            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={`${questions.length} Questions`} 
                color="primary" 
                variant="outlined" 
              />
              
              {/* Get unique subjects */}
              {(() => {
                const subjects = new Set<string>();
                questions.forEach(q => {
                  const subject = (q.Subject || q.subject || '').toString();
                  if (subject) subjects.add(subject);
                });
                
                return Array.from(subjects).map(subject => (
                  <Chip 
                    key={subject} 
                    label={subject} 
                    color="default" 
                    size="small"
                    variant="outlined" 
                  />
                ));
              })()}
            </Box>
            
            <Grid container spacing={2}>
              {questions.map((question, index) => (
                <Grid item xs={12} key={question.id}>
                  <Box sx={{ position: 'relative' }}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        '&:hover': {
                          boxShadow: 3
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Question {index + 1}
                        </Typography>
                        <IconButton
                          onClick={() => handleRemoveQuestion(question.id)}
                          size="small"
                          color="error"
                          title="Remove from Cart"
                        >
                          <RemoveCircleIcon />
                        </IconButton>
                      </Box>
                      
                      <Typography variant="body1" gutterBottom>
                        {question.Question || question.text}
                      </Typography>
                      
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(question.Subject || question.subject) && (
                          <Chip 
                            label={question.Subject || question.subject || ''} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        )}
                        {(question.Topic || question.topic) && (
                          <Chip 
                            label={question.Topic || question.topic || ''} 
                            size="small" 
                            color="secondary" 
                            variant="outlined" 
                          />
                        )}
                        {(question['Difficulty Level'] || question.difficultyLevel) && (
                          <Chip 
                            label={(question['Difficulty Level'] || question.difficultyLevel || '')} 
                            size="small" 
                            color="default" 
                            variant="outlined" 
                          />
                        )}
                      </Box>
                    </Paper>
                  </Box>
                </Grid>
              ))}
            </Grid>
            
            {/* Add a quick save button */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                onClick={() => setExportModalOpen(true)}
                color="primary"
                variant="contained"
                startIcon={<ExportIcon />}
              >
                Export Test
              </Button>
              <Button
                onClick={handleSaveDraft}
                color="secondary"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={!testDetails.testName}
              >
                {testId ? 'Update Draft' : 'Save Draft'}
              </Button>
            </Box>
            
            {/* Show error message if there is one */}
            {draftSaveError && (
              <Typography color="error" align="center" sx={{ mt: 2 }}>
                {draftSaveError}
              </Typography>
            )}
          </>
        )}
      </Paper>
      {/* Export Modal */}
      <Dialog
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
          {testId ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SaveIcon sx={{ mr: 1, color: 'secondary.main' }} />
              <Typography variant="h6">Update Draft: {testDetails.testName}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SaveIcon sx={{ mr: 1, color: 'secondary.main' }} />
              <Typography variant="h6">Save Draft or Export Test</Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Test Information
              </Typography>
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
                InputProps={{
                  sx: { borderRadius: 1 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Batch"
                value={testDetails.batch}
                onChange={e => setTestDetails(prev => ({ ...prev, batch: e.target.value }))}
                InputProps={{
                  sx: { borderRadius: 1 }
                }}
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
                InputProps={{
                  sx: { borderRadius: 1 }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ 
                mt: 1, 
                p: 2, 
                borderRadius: 1, 
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="subtitle2" gutterBottom>
                  Test Summary
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  <Chip 
                    label={`${questions.length} Questions`} 
                    color="primary" 
                    size="small"
                  />
                  {questions.length > 0 && (
                    <Chip 
                      label={`${Array.from(new Set(questions.map(q => q.Subject || q.subject))).filter(Boolean).length} Subjects`} 
                      color="secondary" 
                      size="small"
                    />
                  )}
                </Box>
              </Box>
            </Grid>
            
            {draftSaveError && draftSaveError !== 'Saving draft...' && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ mt: 1 }}>
                  {draftSaveError}
                </Alert>
              </Grid>
            )}
            
            {draftSaveError === 'Saving draft...' && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Saving draft...
                  </Box>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={handleSaveDraft} 
            color="secondary" 
            variant="contained"
            disabled={!testDetails.testName || draftSaveError === 'Saving draft...'}
            startIcon={<SaveIcon />}
          >
            {testId ? 'Update Draft' : 'Save Draft'}
          </Button>
          <Button
            onClick={handleExport}
            color="primary"
            variant="contained"
            disabled={!testDetails.testName}
            startIcon={<ExportIcon />}
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
          {removedQuestion}
        </Alert>
      </Snackbar>
      {/* Add the DatabaseSetupAlert component at the top */}
      {draftError && (
        <DatabaseSetupAlert 
          errorMessage={draftError} 
          onSetupComplete={() => {
            setDraftError(null);
            // Retry the last operation if there was one
            if (loadingDraft) {
              handleSaveDraft();
            }
          }}
        />
      )}
    </Container>
  );
}
