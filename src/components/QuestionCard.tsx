import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  Box,
  CircularProgress
} from '@mui/material';
import type { Question } from '@/types/question';

export interface QuestionCardProps {
  question: Question;
  onAddToTest?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  onAddToTest 
}) => {
  const [isAdding, setIsAdding] = useState(false);

  const getDifficultyColor = () => {
    switch (question.difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100';
      case 'medium':
        return 'bg-yellow-100';
      case 'hard':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  const handleAddToTest = async () => {
    if (onAddToTest) {
      try {
        setIsAdding(true);
        console.log('Adding question to cart:', question.id);
        await onAddToTest();
      } catch (error) {
        console.error('Error adding question to cart:', error);
      } finally {
        setIsAdding(false);
      }
    }
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column' 
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {question.text ?? 'No question text'}
        </Typography>

        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          <Chip 
            label={`Module: ${question.module ?? 'Unknown'}`} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
          <Chip 
            label={`Topic: ${question.topic ?? 'Unknown'}`} 
            size="small" 
            color="secondary" 
            variant="outlined" 
          />
          <Chip 
            label={`Sub Topic: ${question.sub_topic ?? 'Unknown'}`} 
            size="small" 
            color="info" 
            variant="outlined" 
          />
          {question.difficulty && (
            <Chip 
              label={`Difficulty: ${question.difficulty}`} 
              size="small" 
              className={getDifficultyColor()} 
            />
          )}
          <Chip 
            label={`Answer: ${question.answer ?? 'No answer'}`} 
            size="small" 
            color="info" 
            variant="outlined" 
          />
        </Box>
      </CardContent>

      {onAddToTest && (
        <Box p={2} pt={0}>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            onClick={handleAddToTest}
            disabled={isAdding}
            data-testid="add-to-test-button"
            startIcon={isAdding ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </Button>
        </Box>
      )}
    </Card>
  );
};
