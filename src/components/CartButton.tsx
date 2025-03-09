import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import { useCartStore } from '@/store/cartStore';
import { Question } from '@/types/question';

interface CartButtonProps {
  question?: Question;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onAddToTest?: (question: Question) => Promise<void>;
}

export default function CartButton({ 
  question, 
  size = 'medium', 
  disabled = false,
  onAddToTest 
}: CartButtonProps) {
  const { addQuestion, removeQuestion, isInCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const inCart = question ? isInCart(question.id) : false;
  
  const handleClick = async () => {
    if (!question?.id || disabled) return;

    try {
      setIsLoading(true);
      
      if (inCart) {
        removeQuestion(question.id);
      } else {
        // Convert Question to CartQuestion format
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
        
        addQuestion(cartQuestion);
      }
      
      // If onAddToTest is provided, call it
      if (onAddToTest) {
        await onAddToTest(question);
      }
    } catch (error) {
      console.error('Error handling cart action:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      variant="contained"
      color={inCart ? "error" : "primary"}
      size={size}
      onClick={handleClick}
      disabled={disabled || isLoading}
      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : 
                inCart ? <RemoveShoppingCartIcon /> : <AddShoppingCartIcon />}
    >
      {inCart ? "Remove" : "Add to Cart"}
    </Button>
  );
}
