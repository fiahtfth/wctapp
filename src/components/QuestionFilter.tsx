'use client';
import React, { useState, useEffect } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Button,
  Box,
  CircularProgress,
  Chip,
  Typography,
  Alert,
} from '@mui/material';
import SafeFormControl from '@/components/SafeFormControl';
import hierarchicalData, { 
  getSubjects, 
  getModules, 
  getTopics, 
  getSubtopics 
} from '@/lib/database/hierarchicalData';

interface QuestionFilterProps {
  onFilterChange: (filters: {
    subject?: string;
    module?: string;
    topic?: string;
    sub_topic?: string;
    difficulty_level?: 'Easy' | 'Medium' | 'Hard';
    question_type?: string;
    search?: string;
  }) => void;
}

const DIFFICULTY_LEVELS = [
  { value: 'Easy', label: 'Easy' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Hard', label: 'Hard' },
];

const QUESTION_TYPES = [
  'Objective',
  'Subjective',
  'Multiple Choice',
  'Short Answer',
  'Long Answer',
  'Case Study',
  'Numerical',
  'Theoretical',
  'Conceptual',
  'Applied'
];

export default function QuestionFilter({ onFilterChange }: QuestionFilterProps) {
  // Filter state
  const [subject, setSubject] = useState<string>('');
  const [module, setModule] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [subTopic, setSubTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [questionType, setQuestionType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Options state
  const [subjects, setSubjects] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [subTopics, setSubTopics] = useState<string[]>([]);
  
  // Loading states
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);
  const [loadingModules, setLoadingModules] = useState<boolean>(false);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false);
  const [loadingSubTopics, setLoadingSubTopics] = useState<boolean>(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  
  // Fetch subjects on component mount
  useEffect(() => {
    fetchSubjects();
  }, []);
  
  // Fetch modules when subject changes
  useEffect(() => {
    if (subject) {
      fetchModules(subject);
      // Reset dependent fields
      setModule('');
      setTopic('');
      setSubTopic('');
    } else {
      setModules([]);
    }
  }, [subject]);
  
  // Fetch topics when module changes
  useEffect(() => {
    if (subject && module) {
      fetchTopics(subject, module);
      // Reset dependent fields
      setTopic('');
      setSubTopic('');
    } else {
      setTopics([]);
    }
  }, [subject, module]);
  
  // Fetch sub-topics when topic changes
  useEffect(() => {
    if (subject && topic) {
      fetchSubTopics(subject, topic);
      // Reset dependent fields
      setSubTopic('');
    } else {
      setSubTopics([]);
    }
  }, [subject, topic]);
  
  // Update filters when any filter value changes
  useEffect(() => {
    handleFilterChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, module, topic, subTopic, difficulty, questionType, searchTerm]);
  
  // Fetch subjects from hierarchicalData
  const fetchSubjects = () => {
    try {
      setLoadingSubjects(true);
      setError(null);
      
      const subjectList = getSubjects();
      setSubjects(subjectList);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Failed to load subjects. Please try again.');
    } finally {
      setLoadingSubjects(false);
    }
  };
  
  // Fetch modules from hierarchicalData
  const fetchModules = (selectedSubject: string) => {
    try {
      setLoadingModules(true);
      setError(null);
      
      const moduleList = getModules(selectedSubject);
      setModules(moduleList);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setError('Failed to load modules. Please try again.');
    } finally {
      setLoadingModules(false);
    }
  };
  
  // Fetch topics from hierarchicalData
  const fetchTopics = (selectedSubject: string, selectedModule: string) => {
    try {
      setLoadingTopics(true);
      setError(null);
      
      const topicList = getTopics(selectedSubject, selectedModule);
      setTopics(topicList);
    } catch (error) {
      console.error('Error fetching topics:', error);
      setError('Failed to load topics. Please try again.');
    } finally {
      setLoadingTopics(false);
    }
  };
  
  // Fetch sub-topics from hierarchicalData
  const fetchSubTopics = (selectedSubject: string, selectedTopic: string) => {
    try {
      setLoadingSubTopics(true);
      setError(null);
      
      // Find the module that contains this topic
      const subjectData = hierarchicalData.find(s => s.name === selectedSubject);
      if (!subjectData) {
        setSubTopics([]);
        return;
      }
      
      // Look through all modules to find the topic
      let subtopicList: string[] = [];
      
      for (const moduleItem of subjectData.modules) {
        const topicItem = moduleItem.topics.find(t => t.name === selectedTopic);
        if (topicItem) {
          subtopicList = topicItem.subtopics.map(st => st.name);
          break;
        }
      }
      
      setSubTopics(subtopicList);
    } catch (error) {
      console.error('Error fetching sub-topics:', error);
      setError('Failed to load sub-topics. Please try again.');
    } finally {
      setLoadingSubTopics(false);
    }
  };
  
  // Handle filter change
  const handleFilterChange = () => {
    onFilterChange({
      subject: subject || undefined,
      module: module || undefined,
      topic: topic || undefined,
      sub_topic: subTopic || undefined,
      difficulty_level: difficulty
        ? ((difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase()) as
            | 'Easy'
            | 'Medium'
            | 'Hard')
        : undefined,
      question_type: questionType || undefined,
      search: searchTerm || undefined,
    });
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setSubject('');
    setModule('');
    setTopic('');
    setSubTopic('');
    setDifficulty('');
    setQuestionType('');
    setSearchTerm('');
    onFilterChange({});
  };
  
  return (
    <Box sx={{ flexGrow: 1, mb: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={2} alignItems="center">
        {/* Subject Dropdown */}
        <Grid item xs={12} sm={6} md={4}>
          <SafeFormControl fullWidth>
            <InputLabel>Subject</InputLabel>
            <Select
              value={subject}
              label="Subject"
              onChange={(e) => setSubject(e.target.value)}
              disabled={loadingSubjects}
              startAdornment={
                loadingSubjects ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : null
              }
            >
              <MenuItem value="">All Subjects</MenuItem>
              {subjects.map((subj) => (
                <MenuItem key={subj} value={subj}>
                  {subj}
                </MenuItem>
              ))}
            </Select>
          </SafeFormControl>
        </Grid>
        
        {/* Module Dropdown */}
        <Grid item xs={12} sm={6} md={4}>
          <SafeFormControl fullWidth>
            <InputLabel>Module</InputLabel>
            <Select
              value={module}
              label="Module"
              onChange={(e) => setModule(e.target.value)}
              disabled={!subject || loadingModules}
              startAdornment={
                loadingModules ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : null
              }
            >
              <MenuItem value="">All Modules</MenuItem>
              {modules.map((mod) => (
                <MenuItem key={mod} value={mod}>
                  {mod}
                </MenuItem>
              ))}
            </Select>
          </SafeFormControl>
        </Grid>
        
        {/* Topic Dropdown */}
        <Grid item xs={12} sm={6} md={4}>
          <SafeFormControl fullWidth>
            <InputLabel>Topic</InputLabel>
            <Select
              value={topic}
              label="Topic"
              onChange={(e) => setTopic(e.target.value)}
              disabled={!module || loadingTopics}
              startAdornment={
                loadingTopics ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : null
              }
            >
              <MenuItem value="">All Topics</MenuItem>
              {topics.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </SafeFormControl>
        </Grid>
        
        {/* Sub Topic Dropdown */}
        <Grid item xs={12} sm={6} md={4}>
          <SafeFormControl fullWidth>
            <InputLabel>Sub Topic</InputLabel>
            <Select
              value={subTopic}
              label="Sub Topic"
              onChange={(e) => setSubTopic(e.target.value)}
              disabled={!topic || loadingSubTopics}
              startAdornment={
                loadingSubTopics ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : null
              }
            >
              <MenuItem value="">All Sub Topics</MenuItem>
              {subTopics.map((st) => (
                <MenuItem key={st} value={st}>
                  {st}
                </MenuItem>
              ))}
            </Select>
          </SafeFormControl>
        </Grid>
        
        {/* Difficulty Level Dropdown */}
        <Grid item xs={12} sm={6} md={4}>
          <SafeFormControl fullWidth>
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={difficulty}
              label="Difficulty"
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <MenuItem value="">All Difficulties</MenuItem>
              {DIFFICULTY_LEVELS.map((diff) => (
                <MenuItem key={diff.value} value={diff.value}>
                  {diff.label}
                </MenuItem>
              ))}
            </Select>
          </SafeFormControl>
        </Grid>
        
        {/* Question Type Dropdown */}
        <Grid item xs={12} sm={6} md={4}>
          <SafeFormControl fullWidth>
            <InputLabel>Question Type</InputLabel>
            <Select
              value={questionType}
              label="Question Type"
              onChange={(e) => setQuestionType(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              {QUESTION_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </SafeFormControl>
        </Grid>
        
        {/* Search Field */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Search Questions"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter keywords to search questions"
          />
        </Grid>
        
        {/* Reset Button */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handleResetFilters}
              startIcon={<span>🔄</span>}
            >
              Reset All Filters
            </Button>
            
            <Typography variant="body2" color="text.secondary">
              {subject && <Chip label={subject} size="small" sx={{ mr: 0.5 }} />}
              {module && <Chip label={module} size="small" sx={{ mr: 0.5 }} />}
              {topic && <Chip label={topic} size="small" sx={{ mr: 0.5 }} />}
              {subTopic && <Chip label={subTopic} size="small" sx={{ mr: 0.5 }} />}
              {difficulty && <Chip label={difficulty} size="small" sx={{ mr: 0.5 }} />}
              {questionType && <Chip label={questionType} size="small" sx={{ mr: 0.5 }} />}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
