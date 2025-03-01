import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  alpha,
  useTheme,
  Collapse,
  Button
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { addQuestionToTest, removeQuestionFromTest } from '@/lib/client-actions';
import type { Question } from '@/types/question';
import { useCartStore } from '@/store/cartStore';

// Define a type that can be either Question or CartQuestion
type QuestionOrCartQuestion = Question | {
  id: number | string;
  Question: string;
  Subject: string;
  Topic: string;
  Answer?: string;
  Explanation?: string;
  FacultyApproved?: boolean;
  QuestionType?: string;
  'Difficulty Level'?: string;
  'Nature of Question'?: string;
  [key: string]: any;
};

export function QuestionCard({ 
  question, 
  onQuestionUpdate,
  initialInCart = false,
  showCartButton = true,
  onAddToTest,
  onEdit
}: { 
  question: QuestionOrCartQuestion, 
  onQuestionUpdate: (question: Question) => void,
  initialInCart?: boolean,
  showCartButton?: boolean,
  onAddToTest?: (questionId: number) => Promise<void>,
  onEdit?: (question: Question) => void
}) {
  const [isInCart, setIsInCart] = useState(initialInCart);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { addQuestion, removeQuestion, isInCart: cartIsInCart } = useCartStore();

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleAddToTest = async () => {
    if (isInCart) return;
    
    setIsLoading(true);
    try {
      await addQuestionToTest(question.id);
      setIsInCart(true);
      if (onAddToTest) {
        await onAddToTest(question.id);
      }
    } catch (error) {
      console.error('Error adding question to test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      // Add to local store first for immediate UI feedback
      addQuestion(question);
      setIsInCart(true);
      
      // Then add to server
      await addQuestionToTest(Number(question.id));
    } catch (error) {
      console.error('Error adding to cart:', error);
      // If server fails, remove from local store
      removeQuestion(String(question.id));
      setIsInCart(false);
    }
  };
  
  const handleRemoveFromCart = async () => {
    try {
      // Remove from local store first for immediate UI feedback
      removeQuestion(String(question.id));
      setIsInCart(false);
      
      // Then remove from server
      const testId = localStorage.getItem('testId') || '';
      await removeQuestionFromTest({ questionId: Number(question.id), testId });
    } catch (error) {
      console.error('Error removing from cart:', error);
      // If server fails, add back to local store
      addQuestion(question);
      setIsInCart(true);
    }
  };

  // Add this debug log
  console.log('QuestionCard rendering with question:', question);
  
  // Determine the text to display - be more defensive
  const questionText = question.text || question.Question || '';
  const answerText = question.answer || question.Answer || '';
  const explanationText = question.explanation || question.Explanation || '';
  const subjectText = question.subject || question.Subject || '';
  const topicText = question.topic || question.Topic || '';
  const difficultyText = question.difficultyLevel || question['Difficulty Level'] || '';

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.shadows[4]
        },
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* Difficulty Indicator */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 1,
          gap: 0.5
        }}>
          <FiberManualRecordIcon 
            sx={{ 
              fontSize: '0.8rem',
              color: (theme) => {
                switch(difficultyText.toLowerCase()) {
                  case 'easy': return theme.palette.success.main;
                  case 'medium': return theme.palette.warning.main;
                  case 'hard': return theme.palette.error.main;
                  default: return theme.palette.grey[400];
                }
              }
            }} 
          />
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              textTransform: 'capitalize'
            }}
          >
            {difficultyText || 'Unspecified'} Difficulty
          </Typography>
        </Box>

        {/* Question Text */}
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 1.5,
            whiteSpace: 'pre-line',
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            lineHeight: 1.4,
            fontSize: '0.9rem',
            color: 'text.primary',
            fontWeight: 500
          }}
        >
          {questionText}
        </Typography>

        {/* Metadata Details */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 1,
          mb: 1,
          p: 1,
          borderRadius: 1
        }}>
          {[
            { label: 'Subject', value: subjectText },
            { label: 'Module', value: question.moduleName },
            { label: 'Topic', value: topicText },
            { label: 'Sub Topic', value: question.subTopic },
            { label: 'Difficulty', value: difficultyText },
            { label: 'Answer', value: answerText }
          ].map((item, index) => (
            item.value && (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#e0e0e0',
                  color: '#424242',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  margin: '4px',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}
              >
                {item.label}: {item.value}
              </Box>
            )
          ))}
        </Box>
      </CardContent>

      {/* Action Buttons */}
      <Box sx={{ 
        px: 1,
        py: 1,
        display: 'flex', 
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderTop: '1px solid',
        borderColor: (theme) => alpha(theme.palette.divider, 0.1),
        backgroundColor: (theme) => alpha(theme.palette.background.default, 0.8)
      }}>
        {onEdit && (
          <Tooltip title="Edit Question">
            <IconButton 
              size="small" 
              onClick={() => onEdit(question)}
              sx={{ 
                mr: 1,
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08)
                }
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}

        {showCartButton && (
          <Tooltip title={isInCart ? 'Added to Test' : 'Add to Test'}>
            <span>
              <IconButton
                color={isInCart ? 'success' : 'primary'}
                onClick={isInCart ? handleRemoveFromCart : handleAddToCart}
                disabled={isInCart || isLoading}
                size="small"
              >
                {isLoading ? (
                  <CircularProgress size={20} />
                ) : isInCart ? (
                  <RemoveShoppingCartIcon />
                ) : (
                  <AddShoppingCartIcon />
                )}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    </Card>
  );
}
