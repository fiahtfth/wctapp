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
  useTheme
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { addQuestionToTest } from '@/lib/client-actions';
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
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
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
                switch(question.DifficultyLevel?.toLowerCase()) {
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
            {question.DifficultyLevel || 'Unspecified'} Difficulty
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
          {question.Question}
        </Typography>

        {/* Metadata Details */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 1,
          mb: 1,
          backgroundColor: (theme) => alpha(theme.palette.background.default, 0.6),
          p: 1,
          borderRadius: 1
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
                  alignItems: 'flex-start',
                  gap: 0.5,
                  p: 0.75,
                  borderRadius: 1,
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
                  border: '1px solid',
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08)
                  }
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 600, 
                    color: 'primary.main',
                    minWidth: 'fit-content',
                    pr: 0.5,
                    fontSize: '0.7rem'
                  }}
                >
                  {item.label}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flexGrow: 1,
                    color: 'text.primary',
                    fontWeight: 500,
                    wordBreak: 'break-word',
                    fontSize: '0.75rem',
                    lineHeight: 1.3
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
                onClick={handleAddToTest}
                disabled={isInCart || isLoading}
                size="small"
                sx={{
                  '&:hover': {
                    backgroundColor: (theme) => 
                      alpha(theme.palette[isInCart ? 'success' : 'primary'].main, 0.08)
                  }
                }}
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
