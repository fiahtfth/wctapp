import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  Box 
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

        {question.marks !== undefined && (
          <Typography variant="body2" color="textSecondary">
            Marks: {question.marks}
          </Typography>
        )}
      </CardContent>

      {onAddToTest && (
        <Box p={2} pt={0}>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            onClick={onAddToTest}
          >
            Add to Test
          </Button>
        </Box>
      )}
    </Card>
  );
};
