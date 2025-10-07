import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import type { Question } from '@/types/question';

export interface FormattedQuestionCardProps {
  question: Question;
  onAddToTest?: () => void;
}

export const FormattedQuestionCard: React.FC<FormattedQuestionCardProps> = ({ 
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

  // Parse the question text to extract statements and options
  const parseQuestion = (text: string) => {
    // This is a simplified parser - in a real implementation, you would want to
    // store the statements and options separately in the database
    const lines = text.split('\n');
    
    // Find the line with "consider the following statements"
    const statementStartIndex = lines.findIndex(line => 
      line.toLowerCase().includes('consider the following statements')
    );
    
    // Extract the topic (text before "consider the following statements")
    const topicLine = statementStartIndex > 0 ? 
      lines[statementStartIndex - 1].replace('With reference to', '').replace(',', '').trim() : 
      'Unknown Topic';
    
    // Extract statements (numbered items)
    const statements: string[] = [];
    let optionsStartIndex = -1;
    
    for (let i = statementStartIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line is a statement (starts with a number followed by a period)
      if (/^\d+\./.test(line)) {
        statements.push(line);
      }
      // Check if this line is the question about how many statements are correct
      else if (line.toLowerCase().includes('how many of the above')) {
        optionsStartIndex = i + 1;
        break;
      }
    }
    
    // Extract options (a) through (d)
    const options: string[] = [];
    if (optionsStartIndex > 0) {
      for (let i = optionsStartIndex; i < lines.length && options.length < 4; i++) {
        const line = lines[i].trim();
        if (/^\([a-d]\)/.test(line)) {
          options.push(line);
        }
      }
    }
    
    return { topicLine, statements, options };
  };

  // Parse the question if it's in the new format, otherwise use the old display
  const { topicLine, statements, options } = parseQuestion(question.text || '');
  
  const isFormattedQuestion = statements.length > 0 && options.length > 0;

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
        {isFormattedQuestion ? (
          // New format display
          <>
            <Typography variant="h6" gutterBottom>
              With reference to {topicLine}, consider the following statements:
            </Typography>
            
            <List sx={{ pl: 2 }}>
              {statements.map((statement, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemText 
                    primary={statement} 
                    primaryTypographyProps={{ variant: 'body1' }} 
                  />
                </ListItem>
              ))}
            </List>
            
            <Typography variant="body1" sx={{ mt: 1 }}>
              How many of the above given statements is/are correct?
            </Typography>
            
            <List sx={{ pl: 2 }}>
              {options.map((option, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemText 
                    primary={option} 
                    primaryTypographyProps={{ variant: 'body1' }} 
                  />
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          // Fallback to old format for unformatted questions
          <>
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
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              <strong>Answer:</strong> {question.answer ?? 'No answer provided'}
            </Typography>
          </>
        )}
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
