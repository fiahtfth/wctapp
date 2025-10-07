'use client';
import React, { useState, useEffect, useCallback } from 'react';
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
import { removeQuestionFromCart, fetchCartItems } from '@/lib/client-actions';
import { useRouter } from 'next/navigation';
import { QuestionCard } from './QuestionCard';
import * as XLSX from 'xlsx';
import { saveDraftCart } from '@/lib/client-actions';
import { Question, isQuestion } from '@/types/question';
import { exportTest } from '@/lib/exportUtils';
import { getTestId } from '@/lib/actions';
import DatabaseSetupAlert from '@/components/DatabaseSetupAlert';

// Define a type for the raw question data from the database
interface RawQuestionData {
  id: number;
  Question?: string;
  Answer?: string;
  Subject?: string;
  Topic?: string;
  QuestionType?: string;
  Question_Type?: string;
  question_type?: string;
  Difficulty?: string;
  difficulty_level?: string;
  DifficultyLevel?: string;
  'Difficulty Level'?: string;
  Module?: string;
  module_name?: string;
  ModuleName?: string;
  'Module Name'?: string;
  SubTopic?: string;
  sub_topic?: string;
  'Sub Topic'?: string;
  Marks?: number;
  marks?: number;
  tags?: string[];
  [key: string]: any; // Allow other properties
}

// Helper function to convert CartQuestion to Question
const convertToQuestion = (cartQuestion: RawQuestionData): Question => {
  return {
    id: cartQuestion.id,
    text: cartQuestion.Question || '',
    answer: cartQuestion.Answer || cartQuestion.answer || '',
    explanation: cartQuestion.Explanation || cartQuestion.explanation || '',
    subject: cartQuestion.Subject || cartQuestion.subject || '',
    topic: cartQuestion.Topic || cartQuestion.topic || '',
    questionType: (cartQuestion.QuestionType || cartQuestion.Question_Type || cartQuestion.question_type || 'Objective') as 'Objective' | 'Subjective',
    // Ensure these fields are properly mapped from the database
    difficulty: (cartQuestion.Difficulty || cartQuestion.difficulty_level || cartQuestion.DifficultyLevel || cartQuestion['Difficulty Level'] || 'Medium') as 'Easy' | 'Medium' | 'Hard',
    module: cartQuestion.Module || cartQuestion.module_name || cartQuestion.ModuleName || cartQuestion['Module Name'] || '',
    sub_topic: cartQuestion.SubTopic || cartQuestion.sub_topic || cartQuestion['Sub Topic'] || '',
    marks: cartQuestion.Marks || cartQuestion.marks || 0,
    tags: cartQuestion.tags || []
  };
};

// Function to standardize question format for export
const standardizeQuestionForExport = (question: Question | RawQuestionData): Record<string, any> => {
  return {
    'S.No': 0, // This will be overridden when used
    Question: question.text || (question as RawQuestionData).Question || '',
    Answer: question.answer || (question as RawQuestionData).Answer || '',
    Explanation: (question as RawQuestionData).explanation || (question as RawQuestionData).Explanation || '',
    Subject: question.subject || (question as RawQuestionData).Subject || '',
    'Module Name': question.module || (question as RawQuestionData)['Module Name'] || (question as RawQuestionData).ModuleName || '',
    Topic: question.topic || (question as RawQuestionData).Topic || '',
    'Difficulty Level': question.difficulty || (question as RawQuestionData)['Difficulty Level'] || (question as RawQuestionData).DifficultyLevel || '',
    'Question Type': question.questionType || (question as RawQuestionData).QuestionType || (question as RawQuestionData).Question_Type || '',
    'Nature of Question': (question as RawQuestionData).natureOfQuestion || (question as RawQuestionData)['Nature of Question'] || (question as RawQuestionData).NatureOfQuestion || '',
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
  const [duplicateWarning, setDuplicateWarning] = useState<{
    hasDuplicates: boolean;
    duplicates: any[];
    message: string;
    totalDuplicates?: number;
  } | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Initialize cart when component mounts
  useEffect(() => {
    if (!mounted) {
      // Initialize without clearing
      useCartStore.getState().initializeCart();
      setMounted(true);
    }
  }, [mounted]);

  // Function to check for duplicate questions
  const checkForDuplicates = useCallback(async (batch: string, questionIds: number[]) => {
    try {
      setCheckingDuplicates(true);
      const response = await fetch('/api/questions/check-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionIds, batch }),
      });

      if (!response.ok) {
        throw new Error('Failed to check for duplicates');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return { hasDuplicates: false, duplicates: [], message: 'Could not check for duplicates' };
    } finally {
      setCheckingDuplicates(false);
    }
  }, []);

  // Wrap handleSaveDraft in useCallback to prevent unnecessary re-renders
  const handleSaveDraft = useCallback(async (forceSave = false) => {
    try {
      // Validate test details
      if (!testDetails.testName) {
        setDraftSaveError('Test Name is required');
        return;
      }
      
      if (!testDetails.batch) {
        setDraftSaveError('Batch is required');
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
        console.error('Error parsing user from localStorage:', parseError);
      }
      
      // Get question IDs from the cart
      const questionIds: number[] = [];
      for (const question of questions) {
        const id = typeof question.id === 'string' ? parseInt(question.id, 10) : question.id;
        if (!isNaN(id)) {
          questionIds.push(id);
        }
      }
      
      if (questionIds.length === 0) {
        setDraftSaveError('No valid questions in cart');
        return;
      }
      
      console.log('Saving draft with question IDs:', questionIds);
      
      // Check for duplicates if not forcing save
      if (!forceSave) {
        const duplicateCheck = await checkForDuplicates(testDetails.batch, questionIds);
        
        if (duplicateCheck.hasDuplicates) {
          setDuplicateWarning(duplicateCheck);
          setShowDuplicateDialog(true);
          return; // Stop here and show warning dialog
        }
      }
      
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
        
        // Update the current testId
        setTestId(draftCartId);
        localStorage.setItem('currentTestId', draftCartId);
        
        // Add to saved drafts if it's not already there
        const updatedDrafts = [...savedDrafts];
        const existingDraftIndex = updatedDrafts.findIndex(draft => draft.id === draftCartId);
        
        if (existingDraftIndex >= 0) {
          // Update existing draft
          updatedDrafts[existingDraftIndex] = {
            id: draftCartId,
            name: testDetails.testName
          };
        } else {
          // Add new draft
          updatedDrafts.push({
            id: draftCartId,
            name: testDetails.testName
          });
        }
        
        setSavedDrafts(updatedDrafts);
        
        // Save to localStorage
        localStorage.setItem('savedTestIds', JSON.stringify(updatedDrafts.map(draft => draft.id)));
        localStorage.setItem(`testName-${draftCartId}`, testDetails.testName);
        
        // Store question IDs locally for offline access
        localStorage.setItem(`draft-${draftCartId}-questions`, JSON.stringify(questionIds));
        console.log(`Saved ${questionIds.length} question IDs to localStorage for draft ${draftCartId}`);
        
        // Show success message
        setSnackbarOpen(true);
        setRemovedQuestion('Draft saved successfully');
      } catch (saveError) {
        console.error('Error saving draft:', saveError);
        // Provide a more user-friendly error message
        if (saveError instanceof Error) {
          setDraftSaveError(`Failed to save draft: ${saveError.message}`);
        } else {
          setDraftSaveError('Failed to save draft: Unknown error');
        }
      }
    } catch (error) {
      console.error('Error in handleSaveDraft:', error);
      if (error instanceof Error) {
        setDraftSaveError(`Error: ${error.message}`);
      } else {
        setDraftSaveError('An unexpected error occurred');
      }
    }
  }, [questions, testDetails, testId, savedDrafts]);

  // First useEffect
  useEffect(() => {
    // Ensure this only runs on the client
    setMounted(true);
    // Hydrate the store
    useCartStore.persist.rehydrate();
    
    // Get testId from props or localStorage
    const storedTestId = localStorage.getItem('currentTestId');
    const currentTestId = propTestId || storedTestId || getTestId();
    console.log('Cart component using stored testId:', currentTestId);
    setTestId(currentTestId);
    
    // Store the testId in localStorage as the current working draft
    localStorage.setItem('currentTestId', currentTestId);

    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    
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
    
    // Check if we're using mock data
    const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    
    // We will only fetch cart items once when the component mounts or when testId changes
    // Not when 'questions' changes, as that would create an infinite loop
    const controller = new AbortController();
    const signal = controller.signal;
    
    // Fetch cart items from server with fetch API instead of using the function that updates state
    console.log('Fetching cart items with testId:', currentTestId);
    
    if (useMockData) {
      console.log('Using mock data, skipping server fetch');
      // In mock data mode, we'll just use the local store
      const cartStore = useCartStore.getState();
      console.log('Current cart store state:', cartStore.questions);
    } else {
      // First, try to get local cart items
      const localCartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
      
      // Fetch from server
      fetch(`/api/cart?testId=${currentTestId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
        cache: 'no-store'
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch cart items: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Fetched cart items:', data);
        
        // Only update if the component is still mounted and there are questions
        // Use the store's methods directly, but don't set state that would trigger useEffect
        const cartStore = useCartStore.getState();
        
        // Don't clear the cart completely, as we want to keep local items
        // Instead, we'll add server items and ensure no duplicates
        
        // Add server questions if available
        if (data.questions && Array.isArray(data.questions)) {
          data.questions.forEach((question: any) => {
            // Only add if not already in cart
            if (!cartStore.isInCart(question.id)) {
              cartStore.addQuestion(question);
            }
          });
        }
        
        // Also ensure local cart items are in the store
        if (localCartItems && localCartItems.length > 0) {
          localCartItems.forEach((id: string | number) => {
            // If the item is not already in the cart, create a placeholder
            if (!cartStore.isInCart(id)) {
              cartStore.addQuestion({
                id: typeof id === 'string' ? parseInt(id, 10) : id,
                text: `Question ${id}`,
                answer: '',
                subject: '',
                topic: '',
                questionType: 'Objective',
                difficulty: 'Medium',
                module: '',
                sub_topic: '',
                marks: 0,
                tags: [],
                Question: `Question ${id}`,
                Subject: '',
                Topic: '',
                FacultyApproved: false,
                QuestionType: 'Objective'
              });
            }
          });
        }
      })
      .catch((error) => {
        if (!signal.aborted) {
          console.error('Error fetching cart items:', error);
          
          // If server fetch fails, ensure local items are in the store
          if (localCartItems && localCartItems.length > 0) {
            const cartStore = useCartStore.getState();
            
            localCartItems.forEach((id: string | number) => {
              // If the item is not already in the cart, create a placeholder
              if (!cartStore.isInCart(id)) {
                cartStore.addQuestion({
                  id: typeof id === 'string' ? parseInt(id, 10) : id,
                  text: `Question ${id}`,
                  answer: '',
                  subject: '',
                  topic: '',
                  questionType: 'Objective',
                  difficulty: 'Medium',
                  module: '',
                  sub_topic: '',
                  marks: 0,
                  tags: [],
                  Question: `Question ${id}`,
                  Subject: '',
                  Topic: '',
                  FacultyApproved: false,
                  QuestionType: 'Objective'
                });
              }
            });
          }
        }
      });
    }
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }

    // Cleanup function to abort any pending fetch
    return () => {
      controller.abort();
    };
  }, [propTestId]); // Only depend on propTestId, not questions
  
  // Second useEffect for keyboard shortcuts
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
  }, [testDetails.testName, questions.length, draftsMenuAnchor, loadingDraft, handleSaveDraft, setExportModalOpen]);

  const handleRemoveQuestion = async (questionId: string | number) => {
    console.log('Attempting to remove question from cart:', questionId);
    // Find the question being removed (for snackbar)
    const removedQuestionDetails = questions.find(q => q.id === questionId);
    
    try {
      // Remove the question from the store first for immediate UI update
      removeQuestion(String(questionId));
      
      // Then remove from server - ensure questionId is a string
      await removeQuestionFromCart(String(questionId), testId);
      
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
      // Convert to standard format if needed
      let standardizedQuestion: Question;
      
      if (isQuestion(question)) {
        standardizedQuestion = question;
      } else {
        // Handle CartQuestion or any other format
        try {
          standardizedQuestion = convertToQuestion(question as RawQuestionData);
        } catch (error) {
          console.error('Error converting question:', error);
          // Provide a fallback with minimal data
          standardizedQuestion = {
            id: typeof question.id === 'number' ? question.id : 0,
            text: (question as any).Question || (question as any).text || '',
            answer: (question as any).Answer || (question as any).answer || '',
            explanation: (question as any).Explanation || (question as any).explanation || '',
            subject: (question as any).Subject || (question as any).subject || '',
            topic: (question as any).Topic || (question as any).topic || '',
            questionType: 'Objective',
            difficulty: 'Medium',
            module: '',
            sub_topic: '',
            marks: 0
          };
        }
      }
      
      // Create export row with standardized data
      const exportRowData = standardizeQuestionForExport(standardizedQuestion);
      exportRowData['S.No'] = index + 1; // Add the index
      
      console.log('Export row:', exportRowData); // Debug log
      return exportRowData;
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
      
      // Update the test details first (this doesn't require authentication)
      const testName = localStorage.getItem(`testName-${draftId}`) || '';
      setTestDetails(prev => ({
        ...prev,
        testName
      }));
      
      // Clear the current cart
      clearCart();
      
      // Check if we have locally stored question IDs for this draft
      const localDraftQuestionIds = JSON.parse(localStorage.getItem(`draft-${draftId}-questions`) || '[]');
      console.log(`Found ${localDraftQuestionIds.length} locally stored question IDs for draft ${draftId}`);
      
      // Fetch the cart items for this draft
      try {
        console.log('Fetching cart items for draft:', draftId);
        const loadedQuestions = await fetchCartItems(draftId);
        console.log('Loaded questions:', loadedQuestions);
        
        // Add loaded questions to the cart store
        if (loadedQuestions && loadedQuestions.length > 0) {
          const cartStore = useCartStore.getState();
          loadedQuestions.forEach((question: any) => {
            if (!cartStore.isInCart(question.id)) {
              cartStore.addQuestion(question);
            }
          });
          
          // Show success message
          setSnackbarOpen(true);
          setRemovedQuestion(`Loaded ${loadedQuestions.length} question${loadedQuestions.length === 1 ? '' : 's'} from draft "${testName}"`);
        } else if (localDraftQuestionIds && localDraftQuestionIds.length > 0) {
          // Fallback to local storage if no questions loaded from server
          console.log('No questions from server, loading from local storage');
          const cartStore = useCartStore.getState();
          localDraftQuestionIds.forEach((id: string | number) => {
            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
            if (!cartStore.isInCart(numId)) {
              cartStore.addQuestion({
                id: numId,
                text: `Question ${numId}`,
                answer: '',
                subject: '',
                topic: '',
                questionType: 'Objective',
                difficulty: 'Medium',
                module: '',
                sub_topic: '',
                marks: 0,
                tags: [],
                Question: `Question ${numId}`,
                Subject: '',
                Topic: '',
                FacultyApproved: false,
                QuestionType: 'Objective'
              });
            }
          });
          
          setSnackbarOpen(true);
          setRemovedQuestion(`Loaded ${localDraftQuestionIds.length} question${localDraftQuestionIds.length === 1 ? '' : 's'} from local storage for draft "${testName}"`);
        } else {
          // No questions found
          setSnackbarOpen(true);
          setRemovedQuestion('No questions found in this draft');
        }
      } catch (fetchError) {
        console.error('Error fetching cart items:', fetchError);
        
        // If there's an authentication error, try to use locally stored question IDs
        if (fetchError instanceof Error && fetchError.message === 'Authentication required') {
          console.log('Authentication required, trying to use locally stored question IDs');
          
          // If we have locally stored question IDs for this draft, use them
          if (localDraftQuestionIds && localDraftQuestionIds.length > 0) {
            console.log(`Using ${localDraftQuestionIds.length} locally stored question IDs`);
            
            // Create placeholder questions for the local question IDs
            const cartStore = useCartStore.getState();
            localDraftQuestionIds.forEach((id: string | number) => {
              if (!cartStore.isInCart(id)) {
                cartStore.addQuestion({
                  id: typeof id === 'string' ? parseInt(id, 10) : id,
                  text: `Question ${id}`,
                  answer: '',
                  subject: '',
                  topic: '',
                  questionType: 'Objective',
                  difficulty: 'Medium',
                  module: '',
                  sub_topic: '',
                  marks: 0,
                  tags: [],
                  Question: `Question ${id}`,
                  Subject: '',
                  Topic: '',
                  FacultyApproved: false,
                  QuestionType: 'Objective'
                });
              }
            });
            
            setSnackbarOpen(true);
            setRemovedQuestion(`Loaded ${localDraftQuestionIds.length} question${localDraftQuestionIds.length === 1 ? '' : 's'} from local storage for draft "${testName}"`);
          } else {
            // Try to get items from general local cart
            const localCartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
            if (localCartItems && localCartItems.length > 0) {
              // Add local items to the cart
              const cartStore = useCartStore.getState();
              localCartItems.forEach((id: string | number) => {
                if (!cartStore.isInCart(id)) {
                  cartStore.addQuestion({
                    id: typeof id === 'string' ? parseInt(id, 10) : id,
                    text: `Question ${id}`,
                    answer: '',
                    subject: '',
                    topic: '',
                    questionType: 'Objective',
                    difficulty: 'Medium',
                    module: '',
                    sub_topic: '',
                    marks: 0,
                    tags: [],
                    Question: `Question ${id}`,
                    Subject: '',
                    Topic: '',
                    FacultyApproved: false,
                    QuestionType: 'Objective'
                  });
                }
              });
              
              setSnackbarOpen(true);
              setRemovedQuestion(`Loaded ${localCartItems.length} question${localCartItems.length === 1 ? '' : 's'} from general local cart`);
            } else {
              setSnackbarOpen(true);
              setRemovedQuestion(`Error loading questions: Authentication required and no local data found. Please log in to access this draft.`);
            }
          }
        } else {
          setSnackbarOpen(true);
          setRemovedQuestion(`Error loading questions: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
        }
      }
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
                      
                      <Box 
                        sx={{ 
                          mt: 1, 
                          mb: 2, 
                          p: 2, 
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          borderRadius: 1
                        }}
                      >
                        {/* Format the question text with proper line breaks */}
                        {(question.Question || question.text)?.split('\n').map((line, i) => {
                          // Check if this is a numbered list item (like "1. Something")
                          const isNumberedItem = /^\s*\d+\.\s/.test(line);
                          
                          // Check if this is an option line (like "(a) Something")
                          const isOptionItem = /^\s*\([a-d]\)\s/.test(line);
                          
                          return (
                            <Typography 
                              key={i} 
                              variant="body1" 
                              gutterBottom
                              sx={{ 
                                pl: isNumberedItem || isOptionItem ? 2 : 0,
                                fontWeight: isNumberedItem ? 'medium' : 'normal',
                                color: isOptionItem ? 'text.secondary' : 'text.primary'
                              }}
                            >
                              {line}
                            </Typography>
                          );
                        })}
                        
                        {/* Display multiple choice options if they exist as separate property */}
                        {(question as any).options && Array.isArray((question as any).options) && (
                          <Box sx={{ mt: 1, pl: 2 }}>
                            {(question as any).options.map((option: string, i: number) => (
                              <Typography 
                                key={i} 
                                variant="body1" 
                                gutterBottom
                                sx={{ color: 'text.secondary' }}
                              >
                                ({String.fromCharCode(97 + i)}) {option}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        
                        {/* Alternative way to display options if they're in the question text */}
                        {!((question as any).options && Array.isArray((question as any).options)) && 
                         (question.Question || question.text)?.includes('(a)') && 
                         !(question.Question || question.text)?.includes('\n(a)') && (
                          <Box sx={{ mt: 1, pl: 2, color: 'text.secondary' }}>
                            <Typography variant="body2" fontStyle="italic">
                              Multiple choice options included in question text
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
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
                        {(question.difficulty) && (
                          <Chip 
                            label={question.difficulty || ''} 
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
                onClick={() => handleSaveDraft(false)}
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
            onClick={() => handleSaveDraft(false)} 
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
      {/* Duplicate Warning Dialog */}
      <Dialog
        open={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
          ⚠️ Duplicate Questions Detected
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {duplicateWarning && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>{duplicateWarning.totalDuplicates || duplicateWarning.duplicates.length} question(s)</strong> in your cart have already been used in the batch "{testDetails.batch}".
                </Typography>
                <Typography variant="body2">
                  Reusing questions may compromise test integrity. Please review the list below.
                </Typography>
              </Alert>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
                Duplicate Questions:
              </Typography>
              
              <Box sx={{ maxHeight: 300, overflow: 'auto', mt: 1 }}>
                {duplicateWarning.duplicates.map((dup, index) => (
                  <Paper 
                    key={index} 
                    sx={{ 
                      p: 2, 
                      mb: 1, 
                      border: '1px solid', 
                      borderColor: 'warning.main',
                      bgcolor: 'warning.lighter'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Question ID: {dup.questionId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {dup.questionText}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      <Chip label={dup.subject} size="small" color="primary" variant="outlined" />
                      <Chip label={dup.topic} size="small" color="secondary" variant="outlined" />
                    </Box>
                    {/* Show all places where this question was used */}
                    {dup.usedIn && dup.usedIn.length > 0 ? (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                          Previously used in:
                        </Typography>
                        {dup.usedIn.map((usage: any, usageIndex: number) => (
                          <Chip 
                            key={usageIndex}
                            label={`${usage.testName} (${usage.source})`} 
                            size="small" 
                            color="warning"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Chip 
                        label={`Previously used in: ${dup.testName}`} 
                        size="small" 
                        color="warning" 
                      />
                    )}
                  </Paper>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => {
              setShowDuplicateDialog(false);
              setDuplicateWarning(null);
            }} 
            color="error"
            variant="outlined"
          >
            Cancel - Review Cart
          </Button>
          <Button 
            onClick={() => {
              setShowDuplicateDialog(false);
              handleSaveDraft(true); // Force save despite duplicates
            }} 
            color="warning"
            variant="contained"
            disabled={checkingDuplicates}
          >
            Proceed Anyway
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add the DatabaseSetupAlert component at the top */}
      {draftError && (
        <DatabaseSetupAlert 
          onSetupClick={() => {
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
