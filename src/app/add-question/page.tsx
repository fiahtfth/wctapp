'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import { getSubjects, getModules, getTopics } from '@/lib/database/hierarchicalData';
export default function AddQuestionPage() {
  const [formData, setFormData] = useState({
    Question: '',
    Answer: '',
    Explanation: '',
    Subject: '',
    'Module Number': '',
    'Module Name': '',
    Topic: '',
    'Sub Topic': '',
    'Micro Topic': '',
    'Faculty Approved': false,
    'Difficulty Level': '',
    'Nature of Question': '',
    Objective: '',
    Question_Type: '',
  });
  const [subjects, setSubjects] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  // Fetch subjects on component mount
  useEffect(() => {
    const loadSubjects = () => {
      const availableSubjects = getSubjects();
      setSubjects(availableSubjects);
    };
    loadSubjects();
  }, []);
  // Dynamically update modules when subject changes
  useEffect(() => {
    const loadModules = () => {
      if (formData.Subject) {
        const availableModules = getModules(formData.Subject);
        setModules(availableModules);
      } else {
        setModules([]);
      }
    };
    loadModules();
  }, [formData.Subject]);
  // Dynamically update topics when module changes
  useEffect(() => {
    const loadTopics = () => {
      if (formData.Subject && formData['Module Name']) {
        const availableTopics = getTopics(formData.Subject, formData['Module Name']);
        setTopics(availableTopics);
      } else {
        setTopics([]);
      }
    };
    loadTopics();
  }, [formData.Subject, formData['Module Name']]);
  // Dynamic handler for form inputs
  const handleInputChange = (field: string, value: string | boolean) => {
    const updatedFormData = {
      ...formData,
      [field]: value,
    };
    // Reset dependent fields when parent field changes
    if (field === 'Subject') {
      updatedFormData['Module Name'] = '';
      updatedFormData['Topic'] = '';
      updatedFormData['Sub Topic'] = '';
      updatedFormData['Micro Topic'] = '';
    } else if (field === 'Module Name') {
      updatedFormData['Topic'] = '';
      updatedFormData['Sub Topic'] = '';
      updatedFormData['Micro Topic'] = '';
    }
    setFormData(updatedFormData);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    const requiredFields = ['Question', 'Answer', 'Subject', 'Question_Type'];
    const missingFields = requiredFields.filter(field => !(formData as any)[field]);
    if (missingFields.length > 0) {
      setSnackbarMessage(
        `Please fill in the following required fields: ${missingFields.join(', ')}`
      );
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const result = await response.json();
        setSnackbarMessage(`Question added successfully! ID: ${result.questionId}`);
        setSnackbarSeverity('success');
        // Reset form
        setFormData({
          Question: '',
          Answer: '',
          Explanation: '',
          Subject: '',
          'Module Number': '',
          'Module Name': '',
          Topic: '',
          'Sub Topic': '',
          'Micro Topic': '',
          'Faculty Approved': false,
          'Difficulty Level': '',
          'Nature of Question': '',
          Objective: '',
          Question_Type: '',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add question');
      }
    } catch (error) {
      console.error('Error adding question:', error);
      setSnackbarMessage(error instanceof Error ? error.message : 'Error adding question');
      setSnackbarSeverity('error');
    }
    setOpenSnackbar(true);
  };
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', p: 3 }}>
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: 600,
          color: 'text.primary',
          textAlign: 'center',
        }}
      >
        Add Question to Database
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Question Text */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Question Text *"
              variant="outlined"
              value={formData.Question}
              onChange={e => handleInputChange('Question', e.target.value)}
              required
            />
          </Grid>
          {/* Answer */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Answer *"
              variant="outlined"
              value={formData.Answer}
              onChange={e => handleInputChange('Answer', e.target.value)}
              required
            />
          </Grid>
          {/* Explanation (Optional) */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Explanation"
              variant="outlined"
              value={formData.Explanation}
              onChange={e => handleInputChange('Explanation', e.target.value)}
            />
          </Grid>
          {/* Subject */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth required>
              <InputLabel>Subject *</InputLabel>
              <Select
                value={formData.Subject}
                label="Subject *"
                onChange={e => handleInputChange('Subject', e.target.value)}
              >
                {subjects.map(subject => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Module Name */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Module Name</InputLabel>
              <Select
                value={formData['Module Name']}
                label="Module Name"
                onChange={e => handleInputChange('Module Name', e.target.value)}
                disabled={!formData.Subject}
              >
                <MenuItem value="">None</MenuItem>
                {modules.map(module => (
                  <MenuItem key={module} value={module}>
                    {module}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Topic */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Topic</InputLabel>
              <Select
                value={formData.Topic}
                label="Topic"
                onChange={e => handleInputChange('Topic', e.target.value)}
                disabled={!formData.Subject || !formData['Module Name']}
              >
                <MenuItem value="">None</MenuItem>
                {topics.map(topic => (
                  <MenuItem key={topic} value={topic}>
                    {topic}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Sub Topic */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Sub Topic"
              variant="outlined"
              value={formData['Sub Topic']}
              onChange={e => handleInputChange('Sub Topic', e.target.value)}
            />
          </Grid>
          {/* Micro Topic */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Micro Topic"
              variant="outlined"
              value={formData['Micro Topic']}
              onChange={e => handleInputChange('Micro Topic', e.target.value)}
            />
          </Grid>
          {/* Difficulty Level */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={formData['Difficulty Level']}
                label="Difficulty Level"
                onChange={e => handleInputChange('Difficulty Level', e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {/* Question Type */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth required>
              <InputLabel>Question Type *</InputLabel>
              <Select
                value={formData.Question_Type}
                label="Question Type *"
                onChange={e => handleInputChange('Question_Type', e.target.value)}
              >
                <MenuItem value="Objective">Objective</MenuItem>
                <MenuItem value="Subjective">Subjective</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {/* Faculty Approved */}
          <Grid item xs={12} md={4}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData['Faculty Approved']}
                    onChange={e => handleInputChange('Faculty Approved', e.target.checked)}
                  />
                }
                label="Faculty Approved"
              />
            </FormGroup>
          </Grid>
          {/* Nature of Question */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nature of Question"
              variant="outlined"
              value={formData['Nature of Question']}
              onChange={e => handleInputChange('Nature of Question', e.target.value)}
            />
          </Grid>
          {/* Objective */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Objective"
              variant="outlined"
              value={formData.Objective}
              onChange={e => handleInputChange('Objective', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ py: 1.5 }}>
              Add Question
            </Button>
          </Grid>
        </Grid>
      </form>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
