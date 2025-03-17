import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Snackbar, Alert, Tooltip } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import { useCartStore } from '@/store/cartStore';
import { Question } from '@/types/question';
import { addQuestionToCart, removeQuestionFromCart } from '@/lib/client-actions';
import { getTestId } from '@/lib/actions';

interface CartButtonProps {
  question?: Question;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onAddToTest?: (question: Question) => Promise<void>;
  showTooltip?: boolean;
}

export default function CartButton({ 
  question, 
  size = 'medium', 
  disabled = false,
  onAddToTest,
  showTooltip = true
}: CartButtonProps) {
  const { addQuestion, removeQuestion, isInCart, getCartCount } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const inCart = question ? isInCart(question.id) : false;
  
  // Debounce function to prevent multiple rapid clicks
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  const handleClick = async () => {
    if (!question?.id || disabled || isLoading) return;

    try {
      setIsLoading(true);
      
      // Convert Question to CartQuestion format for local store
      const cartQuestion = {
        id: question.id,
        text: question.text,
        answer: question.answer,
        subject: question.subject,
        topic: question.topic,
        questionType: question.questionType,
        difficulty: question.difficulty,
        module: question.module,
        sub_topic: question.sub_topic,
        marks: question.marks,
        tags: question.tags,
        // CartQuestion specific fields
        Question: question.text,
        Subject: question.subject,
        Topic: question.topic,
        FacultyApproved: false,
        QuestionType: question.questionType
      };
      
      // Get or create a test ID first to avoid race conditions
      let testId: string;
      try {
        testId = await getTestId();
      } catch (testIdError) {
        console.warn('Could not get test ID:', testIdError);
        testId = 'local-' + Date.now(); // Fallback local ID
      }
      
      if (inCart) {
        // Remove from local store first
        removeQuestion(question.id);
        
        try {
          // Try to remove from server, but don't fail if it doesn't work
          await removeQuestionFromCart(question.id, testId).catch(err => {
            console.warn('Could not remove from server cart, but removed from local cart:', err);
          });
          
          setSnackbar({
            open: true,
            message: 'Question removed from cart',
            severity: 'success'
          });
        } catch (serverError) {
          console.warn('Error with server cart, but removed from local cart:', serverError);
          setSnackbar({
            open: true,
            message: 'Question removed from local cart only',
            severity: 'info'
          });
        }
      } else {
        // Add to local store first
        addQuestion(cartQuestion);
        
        try {
          // Try to add to server, but don't fail if it doesn't work
          await addQuestionToCart(question.id, testId).catch(err => {
            console.warn('Could not add to server cart, but added to local cart:', err);
          });
          
          setSnackbar({
            open: true,
            message: 'Question added to cart',
            severity: 'success'
          });
        } catch (serverError) {
          console.warn('Error with server cart, but added to local cart:', serverError);
          setSnackbar({
            open: true,
            message: 'Question added to local cart only',
            severity: 'info'
          });
        }
      }
      
      // If onAddToTest is provided, call it
      if (onAddToTest) {
        await onAddToTest(question).catch(err => {
          console.error('Error adding to test:', err);
        });
      }
    } catch (error) {
      console.error('Error handling cart action:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error updating cart',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a debounced version of handleClick to prevent double-clicks
  const debouncedHandleClick = React.useCallback(debounce(handleClick, 300), [question, inCart]);
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  const buttonElement = (
    <Button
      variant="contained"
      color={inCart ? "error" : "primary"}
      size={size}
      onClick={debouncedHandleClick}
      disabled={disabled || isLoading}
      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : 
                inCart ? <RemoveShoppingCartIcon /> : <AddShoppingCartIcon />}
    >
      {inCart ? "Remove" : "Add to Cart"}
    </Button>
  );
  
  return (
    <>
      {showTooltip ? (
        <Tooltip title={inCart ? "Remove from cart" : "Add to cart"}>
          {buttonElement}
        </Tooltip>
      ) : buttonElement}
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
