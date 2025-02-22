import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Question } from '@/types/question';



export function QuestionCard({ 
  question, 
  onQuestionUpdate,
  initialInCart = false,
  showCartButton = true,
  onAddToTest,
  onEdit
}: { 
  question: Question, 
  onQuestionUpdate: (question: Question) => void,
  initialInCart?: boolean,
  showCartButton?: boolean,
  onAddToTest?: (questionId: number) => Promise<void>,
  onEdit?: (question: Question) => void
}) {
  const [isInCart, setIsInCart] = useState(initialInCart);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToTest = async () => {
    if (!onAddToTest || isInCart) return;
    
    setIsLoading(true);
    try {
      await onAddToTest(question.id);
      setIsInCart(true);
    } catch (error) {
      console.error('Error adding question to test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 2 }}>
        {/* Question Text */}
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 2,
            whiteSpace: 'pre-line',
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            lineHeight: 1.6,
            fontSize: '0.95rem'
          }}
        >
          {question.Question}
        </Typography>

        {/* Metadata Details */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: 1,
          mb: 2 
        }}>
          {[
            { label: 'Subject', value: question.Subject },
            { label: 'Module', value: question.ModuleName },
            { label: 'Topic', value: question.Topic },
            { label: 'SubTopic', value: question.SubTopic },
            { label: 'MicroTopic', value: question.MicroTopic },
            { label: 'Nature', value: question.NatureOfQuestion },
            { label: 'Difficulty', value: question.DifficultyLevel },
            { label: 'Answer', value: question.Answer }
          ].map((item, index) => (
            item.value && (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  p: 0.5,
                  borderRadius: 1,
                  backgroundColor: 'rgba(0,0,0,0.05)'
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: 'text.secondary',
                    minWidth: 80,
                    textAlign: 'right',
                    pr: 1
                  }}
                >
                  {item.label}:
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flexGrow: 1,
                    color: 'text.primary'
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            )
          ))}
        </Box>
      </CardContent>

      {/* Action Buttons */}
      <Box sx={{ 
        p: 1, 
        display: 'flex', 
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        {onEdit && (
          <Tooltip title="Edit Question">
            <IconButton 
              size="small" 
              onClick={() => onEdit(question)}
              sx={{ mr: 1 }}
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
                onClick={handleAddToTest}
                disabled={isInCart || isLoading}
                size="small"
              >
                {isLoading ? (
                  <CircularProgress size={20} />
                ) : isInCart ? (
                  <CheckCircleIcon />
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
