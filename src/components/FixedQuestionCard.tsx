import React, { useState, useEffect } from 'react';
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
  ListItemText,
  Divider,
  Grid,
  Collapse,
  IconButton,
  Alert
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, History as HistoryIcon } from '@mui/icons-material';
import type { Question } from '@/types/question';

// Define types for parsed question formats
interface WithReferenceFormat {
  type: 'withReference';
  topicLine: string;
  statements: string[];
  options: string[];
}

interface WhichOfFollowingFormat {
  type: 'whichOfFollowing';
  questionText: string;
  options: string[];
}

interface ConsiderStatementsFormat {
  type: 'considerStatements';
  statements: string[];
  options: string[];
}

interface DefaultFormat {
  type: 'default';
  questionText: string;
}

type ParsedQuestion = WithReferenceFormat | WhichOfFollowingFormat | ConsiderStatementsFormat | DefaultFormat;

export interface QuestionCardProps {
  question: Question;
  onAddToTest?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  onAddToTest 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showUsageHistory, setShowUsageHistory] = useState(false);
  const [usageHistory, setUsageHistory] = useState<Array<{test_name: string; used_date: string}>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

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
        setAddError(null);
        setAddSuccess(false);
        console.log('Adding question to cart:', question.id);
        await onAddToTest();
        setAddSuccess(true);
        setTimeout(() => setAddSuccess(false), 2000);
      } catch (error) {
        console.error('Error adding question to cart:', error);
        setAddError(error instanceof Error ? error.message : 'Failed to add question');
      } finally {
        setIsAdding(false);
      }
    }
  };

  const fetchUsageHistory = async () => {
    setLoadingHistory(true);
    try {
      // TODO: Implement actual API call to fetch usage history
      // For now, showing placeholder
      await new Promise(resolve => setTimeout(resolve, 500));
      setUsageHistory([
        // Placeholder data - will be replaced with actual API call
      ]);
    } catch (error) {
      console.error('Error fetching usage history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleUsageHistory = () => {
    if (!showUsageHistory && usageHistory.length === 0) {
      fetchUsageHistory();
    }
    setShowUsageHistory(!showUsageHistory);
  };

  // Parse the question text to extract statements and options
  const parseQuestion = (text: string) => {
    // Handle empty or invalid text
    if (!text || text.trim().length === 0) {
      return { 
        type: 'default',
        questionText: 'No question text available'
      };
    }
    
    // Split text into lines and clean them
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Check for "With reference to" format
    const withReferenceIndex = lines.findIndex(line => 
      line.toLowerCase().startsWith('with reference to')
    );
    
    if (withReferenceIndex >= 0) {
      // Format 1: "With reference to X, consider the following statements:"
      const topicLine = lines[withReferenceIndex]
        .replace('With reference to', '')
        .replace('consider the following statements:', '')
        .replace('consider the following statements', '')
        .replace(',', '')
        .trim();
      
      // Extract statements (numbered items)
      const statements: string[] = [];
      let optionsStartIndex = -1;
      
      for (let i = withReferenceIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this line is a statement (starts with a number followed by a period)
        if (/^\d+\.\s*/.test(line)) {
          statements.push(line);
        }
        // Check if this line is the question about how many statements are correct
        else if (line.toLowerCase().includes('how many of the above')) {
          optionsStartIndex = i + 1;
          break;
        }
      }
      
      // Extract options (a) through (d) - handle both (a) and a) formats
      const options: string[] = [];
      if (optionsStartIndex > 0) {
        for (let i = optionsStartIndex; i < lines.length && options.length < 4; i++) {
          const line = lines[i];
          if (/^[\(]?[a-d][\)]?\.?\s+/.test(line)) {
            options.push(line);
          }
        }
      }
      
      // If we found statements and options, return this format
      if (statements.length > 0 && options.length > 0) {
        return { 
          type: 'withReference',
          topicLine, 
          statements, 
          options 
        };
      }
    }
    
    // Check for "Consider the following statements" format (without "With reference to")
    const considerStatementsIndex = lines.findIndex(line => 
      line.toLowerCase().includes('consider the following statements')
    );
    
    if (considerStatementsIndex >= 0) {
      // Format 2: "Consider the following statements:"
      
      // Extract statements (numbered items)
      const statements: string[] = [];
      let optionsStartIndex = -1;
      
      for (let i = considerStatementsIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this line is a statement (starts with a number followed by a period)
        if (/^\d+\.\s*/.test(line)) {
          statements.push(line);
        }
        // Check if this line is "Which of the statements given above"
        else if (line.toLowerCase().includes('which of the statements given above') || 
                 line.toLowerCase().includes('which of the above')) {
          optionsStartIndex = i + 1;
          break;
        }
      }
      
      // Extract options (a) through (d) - handle both (a) and a) formats
      const options: string[] = [];
      if (optionsStartIndex > 0) {
        for (let i = optionsStartIndex; i < lines.length && options.length < 4; i++) {
          const line = lines[i];
          if (/^[\(]?[a-d][\)]?\.?\s+/.test(line)) {
            options.push(line);
          }
        }
      }
      
      // If we found statements and options, return this format
      if (statements.length > 0 && options.length > 0) {
        return { 
          type: 'considerStatements',
          statements, 
          options 
        };
      }
    }
    
    // Check for "Which of the following" format
    const whichOfFollowingIndex = lines.findIndex(line => 
      line.toLowerCase().includes('which of the following')
    );
    
    if (whichOfFollowingIndex >= 0) {
      // Format 3: "Which of the following..."
      const questionText = lines[whichOfFollowingIndex];
      
      // Extract options (a) through (d) - handle both (a) and a) formats
      const options: string[] = [];
      for (let i = whichOfFollowingIndex + 1; i < lines.length && options.length < 4; i++) {
        const line = lines[i];
        if (/^[\(]?[a-d][\)]?\.?\s+/.test(line)) {
          options.push(line);
        }
      }
      
      // Special handling for question ID 12 - it has options a), b), c), d) without proper formatting
      if (options.length === 3 && lines.some(line => line.toLowerCase().includes('none of the above'))) {
        // Add the missing "d) None of the above" option
        options.push('d)None of the above');
      }
      
      // If we found options, return this format
      if (options.length > 0) {
        return { 
          type: 'whichOfFollowing',
          questionText,
          options 
        };
      }
    }
    
    // Check for numbered list followed by options (like question ID 20)
    const numberedLines = lines.filter(line => /^\d+\.\s+/.test(line));
    if (numberedLines.length > 0) {
      // Find the start of the numbered list
      const firstNumberedIndex = lines.findIndex(line => /^\d+\.\s+/.test(line));
      
      // Extract statements (numbered items)
      const statements: string[] = [];
      let questionText = '';
      
      // Collect lines before the numbered list as question text
      if (firstNumberedIndex > 0) {
        questionText = lines.slice(0, firstNumberedIndex).join(' ');
      }
      
      // Collect numbered lines as statements
      for (let i = firstNumberedIndex; i < lines.length; i++) {
        const line = lines[i];
        if (/^\d+\.\s+/.test(line)) {
          statements.push(line);
        } else {
          break;
        }
      }
      
      // Extract options (a) through (d) - handle both (a) and a) formats
      const options: string[] = [];
      for (let i = firstNumberedIndex + statements.length; i < lines.length && options.length < 4; i++) {
        const line = lines[i];
        if (/^[\(]?[a-d][\)]?\.?\s+/.test(line)) {
          options.push(line);
        }
      }
      
      // Special case for question ID 20 - it has numbered items but no options in the standard format
      // We'll treat it as a "whichOfFollowing" format with the numbered items as part of the question
      if (statements.length > 0 && options.length === 0) {
        const fullQuestionText = questionText + ' ' + statements.join(' ');
        // Look for any remaining lines that might be options
        const remainingLines = lines.slice(firstNumberedIndex + statements.length);
        const potentialOptions = remainingLines.filter(line => /^[\(]?[a-d][\)]?\.?\s+/.test(line));
        
        if (potentialOptions.length > 0) {
          return { 
            type: 'whichOfFollowing',
            questionText: fullQuestionText,
            options: potentialOptions
          };
        }
      }
      
      // If we found statements and options, return considerStatements format
      if (statements.length > 0 && options.length > 0) {
        return { 
          type: 'considerStatements',
          statements, 
          options 
        };
      }
      
      // If we found statements but no options, treat as whichOfFollowing with the statements as part of question
      if (statements.length > 0) {
        const fullQuestionText = questionText + ' ' + statements.join(' ');
        // Look for options after the statements
        const options: string[] = [];
        for (let i = firstNumberedIndex + statements.length; i < lines.length && options.length < 4; i++) {
          const line = lines[i];
          if (/^[\(]?[a-d][\)]?\.?\s+/.test(line)) {
            options.push(line);
          }
        }
        
        if (options.length > 0) {
          return { 
            type: 'whichOfFollowing',
            questionText: fullQuestionText,
            options 
          };
        }
      }
    }
    
    // Check for simple multiple choice format (question followed by options)
    // Look for options at the end of the question
    const options: string[] = [];
    let questionLines: string[] = [];
    
    // Go through lines from the end to find options
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (/^[\(]?[a-d][\)]?\.?\s+/.test(line) && options.length < 4) {
        options.unshift(line); // Add to beginning to maintain order
      } else {
        // Once we stop finding options, the rest is the question
        questionLines = lines.slice(0, i + 1);
        break;
      }
    }
    
    // If we found options, treat as simple multiple choice
    if (options.length >= 2) {
      return { 
        type: 'whichOfFollowing',
        questionText: questionLines.join(' '),
        options 
      };
    }
    
    // Default case - no special formatting
    return { 
      type: 'default',
      questionText: text
    };
  };

  // Parse the question to determine its format
  const parsedQuestion = parseQuestion(question.text || '');

  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease-in-out',
        backgroundColor: 'white',
        '&:hover': {
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          transform: 'translateY(-4px)',
          borderColor: 'primary.main',
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Question Metadata Section - Always Show */}
        <Box mb={2}>
          <Grid container spacing={1} mb={1}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                <strong>Subject:</strong> {question.subject || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                <strong>Module:</strong> {question.module || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                <strong>Topic:</strong> {question.topic || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                <strong>Sub-topic:</strong> {question.sub_topic || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
          
          <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
            <Chip 
              label={question.questionType || 'Objective'} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
            {question.difficulty && (
              <Chip 
                label={question.difficulty} 
                size="small" 
                className={getDifficultyColor()} 
              />
            )}
            {question.nature_of_question && (
              <Chip 
                label={question.nature_of_question} 
                size="small" 
                color="info" 
                variant="outlined" 
              />
            )}
            <IconButton 
              size="small" 
              onClick={toggleUsageHistory}
              title="View usage history"
              sx={{ ml: 'auto' }}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        {/* Usage History Section */}
        <Collapse in={showUsageHistory}>
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              <HistoryIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Usage History
            </Typography>
            {loadingHistory ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={20} />
              </Box>
            ) : usageHistory.length > 0 ? (
              <List dense>
                {usageHistory.map((usage, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary={usage.test_name}
                      secondary={`Used on: ${new Date(usage.used_date).toLocaleDateString()}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                This question hasn't been used in any tests yet.
              </Typography>
            )}
          </Box>
        </Collapse>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Question Content Section */}
        {parsedQuestion.type === 'withReference' && 
         (parsedQuestion as WithReferenceFormat).statements && 
         (parsedQuestion as WithReferenceFormat).options ? (
          // Format 1: "With reference to X, consider the following statements:"
          <>
            <Typography variant="h6" gutterBottom>
              With reference to {(parsedQuestion as WithReferenceFormat).topicLine}, consider the following statements:
            </Typography>
            
            <List sx={{ pl: 2 }}>
              {(parsedQuestion as WithReferenceFormat).statements.map((statement, index) => (
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
              {(parsedQuestion as WithReferenceFormat).options.map((option, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemText 
                    primary={option} 
                    primaryTypographyProps={{ variant: 'body1' }} 
                  />
                </ListItem>
              ))}
            </List>
          </>
        ) : parsedQuestion.type === 'whichOfFollowing' && 
          (parsedQuestion as WhichOfFollowingFormat).options ? (
          // Format 2: "Which of the following..." or simple multiple choice
          <>
            <Typography variant="h6" gutterBottom>
              {(parsedQuestion as WhichOfFollowingFormat).questionText}
            </Typography>
            
            <List sx={{ pl: 2 }}>
              {(parsedQuestion as WhichOfFollowingFormat).options.map((option, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemText 
                    primary={option} 
                    primaryTypographyProps={{ variant: 'body1' }} 
                  />
                </ListItem>
              ))}
            </List>
          </>
        ) : parsedQuestion.type === 'considerStatements' && 
          (parsedQuestion as ConsiderStatementsFormat).statements && 
          (parsedQuestion as ConsiderStatementsFormat).options ? (
          // Format 3: "Consider the following statements:"
          <>
            <Typography variant="h6" gutterBottom>
              Consider the following statements:
            </Typography>
            
            <List sx={{ pl: 2 }}>
              {(parsedQuestion as ConsiderStatementsFormat).statements.map((statement, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemText 
                    primary={statement} 
                    primaryTypographyProps={{ variant: 'body1' }} 
                  />
                </ListItem>
              ))}
            </List>
            
            <Typography variant="body1" sx={{ mt: 1 }}>
              Which of the statements given above is/are correct?
            </Typography>
            
            <List sx={{ pl: 2 }}>
              {(parsedQuestion as ConsiderStatementsFormat).options.map((option, index) => (
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
            <Typography variant="body1" gutterBottom>
              {question.text ?? 'No question text'}
            </Typography>
            
            <Divider sx={{ my: 1 }} />
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Answer:</strong> {question.answer ?? 'No answer provided'}
            </Typography>
            
            {question.explanation && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Explanation:</strong> {question.explanation}
              </Typography>
            )}
          </>
        )}
      </CardContent>

      {onAddToTest && (
        <Box p={2} pt={0}>
          {addError && (
            <Alert severity="error" sx={{ mb: 1 }} onClose={() => setAddError(null)}>
              {addError}
            </Alert>
          )}
          {addSuccess && (
            <Alert severity="success" sx={{ mb: 1 }}>
              Question added to cart successfully!
            </Alert>
          )}
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            onClick={handleAddToTest}
            disabled={isAdding || addSuccess}
            data-testid="add-to-test-button"
            startIcon={isAdding ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isAdding ? 'Adding...' : addSuccess ? 'Added!' : 'Add to Cart'}
          </Button>
        </Box>
      )}
    </Card>
  );
};
