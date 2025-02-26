'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Chip,
  Snackbar,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { addToCart } from '@/lib/client-actions';
import { Question } from '@/types/question';

function QuestionsContent() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [addingToCart, setAddingToCart] = useState<{[key: number]: boolean}>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const testId = searchParams.get('testId');
  
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSubjects();
    fetchQuestions();
  }, [page, subject, topic, searchTerm]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/questions/subjects');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTopics = async (selectedSubject: string) => {
    if (!selectedSubject) {
      setTopics([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/questions/topics?subject=${encodeURIComponent(selectedSubject)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `/api/questions?page=${page}&limit=${itemsPerPage}`;
      
      if (subject) {
        url += `&subject=${encodeURIComponent(subject)}`;
      }
      
      if (topic) {
        url += `&topic=${encodeURIComponent(topic)}`;
      }
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setQuestions(data.questions || []);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load questions.');
      setLoading(false);
    }
  };

  const handleSubjectChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newSubject = event.target.value as string;
    setSubject(newSubject);
    setTopic(''); // Reset topic when subject changes
    fetchTopics(newSubject);
    setPage(1); // Reset to first page
  };

  const handleTopicChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTopic(event.target.value as string);
    setPage(1); // Reset to first page
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleAddToCart = async (question: Question) => {
    setAddingToCart(prev => ({ ...prev, [question.id]: true }));
    
    try {
      await addToCart({
        questionId: question.id,
        testId: testId || undefined, // Use the testId from URL if available
      });
      
      setSnackbarMessage(`Added "${question.Question.substring(0, 30)}..." to cart`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setSnackbarMessage('Failed to add question to cart');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setAddingToCart(prev => ({ ...prev, [question.id]: false }));
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {testId ? 'Add Questions to Test' : 'Browse Questions'}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {testId ? 'Select questions to add to your test' : 'Browse and search for questions'}
            </Typography>
          </Box>
          {testId && (
            <Button 
              variant="outlined" 
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/tests')}
            >
              Back to Tests
            </Button>
          )}
        </Box>

        {/* Filters */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Questions"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={subject}
                  label="Subject"
                  onChange={handleSubjectChange}
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {subjects.map((subj) => (
                    <MenuItem key={subj} value={subj}>
                      {subj}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!subject}>
                <InputLabel>Topic</InputLabel>
                <Select
                  value={topic}
                  label="Topic"
                  onChange={handleTopicChange}
                >
                  <MenuItem value="">All Topics</MenuItem>
                  {topics.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Questions List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : questions.length === 0 ? (
          <Typography>No questions found.</Typography>
        ) : (
          <Grid container spacing={3}>
            {questions.map((question) => (
              <Grid item xs={12} key={question.id}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {question.Question}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={question.Subject} 
                        size="small" 
                        sx={{ mr: 1, mb: 1 }} 
                      />
                      <Chip 
                        label={question.Topic} 
                        size="small" 
                        sx={{ mr: 1, mb: 1 }} 
                      />
                      <Chip 
                        label={question.DifficultyLevel} 
                        size="small" 
                        sx={{ mr: 1, mb: 1 }} 
                        color={
                          question.DifficultyLevel === 'Easy' ? 'success' :
                          question.DifficultyLevel === 'Medium' ? 'warning' : 'error'
                        }
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Answer:</strong> {question.Answer}
                    </Typography>
                    {question.Explanation && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        <strong>Explanation:</strong> {question.Explanation}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddToCart(question)}
                      disabled={addingToCart[question.id]}
                    >
                      {addingToCart[question.id] ? (
                        <CircularProgress size={24} />
                      ) : (
                        testId ? 'Add to Test' : 'Add to Cart'
                      )}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}>
      <QuestionsContent />
    </Suspense>
  );
}
