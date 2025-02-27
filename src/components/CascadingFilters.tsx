'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Checkbox,
  FormControl,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  InputAdornment,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { 
  getSubjects, 
  getModules, 
  getTopics, 
  getQuestions 
} from '@/lib/database/hierarchicalData';
import { 
  FilterConfig, 
  validateFilters, 
  logFilterProcessing,
  sanitizeFilters
} from '@/config/filters';

interface CascadingFiltersProps {
  onFilterChange?: (filters: {
    subject?: string[];
    module?: string[];
    topic?: string[];
    questionType?: string[];
    search?: string;
  }) => void;
  subject?: string[];
  module?: string[];
  topic?: string[];
  questionType?: string[];
  search?: string;
  testId?: string;
}

export const CascadingFilters = ({
  onFilterChange,
  testId = 'cascading-filters',
}: CascadingFiltersProps) => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  const [filterErrors, setFilterErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const subjects = getSubjects();
    console.log('Loaded Subjects:', subjects);
    setSubjects(subjects);
  }, []);

  useEffect(() => {
    console.log('Current Selected Subjects:', selectedSubjects);
  }, [selectedSubjects]);

  useEffect(() => {
    console.log('Current Selected Modules:', selectedModules);
  }, [selectedModules]);

  useEffect(() => {
    console.log('Current Selected Topics:', selectedTopics);
  }, [selectedTopics]);

  useEffect(() => {
    if (selectedSubjects.length > 0) {
      const uniqueModules = selectedSubjects.flatMap(subject => {
        console.log('Fetching modules for subject:', subject);
        return getModules(subject);
      });
      const deduplicatedModules = [...new Set(uniqueModules)];
      setModules(deduplicatedModules);
      const validModules = selectedModules.filter(module => deduplicatedModules.includes(module));
      setSelectedModules(validModules);
    } else {
      setModules([]);
      setSelectedModules([]);
      setTopics([]);
      setSelectedTopics([]);
    }
  }, [selectedSubjects]);

  useEffect(() => {
    if (selectedSubjects.length > 0 && selectedModules.length > 0) {
      const uniqueTopics = selectedSubjects.flatMap(subject =>
        selectedModules.flatMap(module => {
          console.log('Fetching topics for subject:', subject, 'module:', module);
          return getTopics(subject, module);
        })
      );
      const deduplicatedTopics = [...new Set(uniqueTopics)];
      setTopics(deduplicatedTopics);
      const validTopics = selectedTopics.filter(topic => deduplicatedTopics.includes(topic));
      setSelectedTopics(validTopics);
    } else {
      setTopics([]);
      setSelectedTopics([]);
    }
  }, [selectedSubjects, selectedModules]);

  useEffect(() => {
    const questionTypes = ['Objective', 'Subjective'];
    console.log('Loaded Question Types:', questionTypes);
    setQuestionTypes(questionTypes);
  }, []);

  useEffect(() => {
    console.log('Current Selected Subjects:', selectedSubjects);
  }, [selectedSubjects]);

  const handleFilterChange = (filterState: {
    subject?: string[];
    module?: string[];
    topic?: string[];
    questionType?: string[];
    search?: string;
  }) => {
    const sanitizedFilters = sanitizeFilters(filterState);
    const validationResult = validateFilters(sanitizedFilters);
    logFilterProcessing('CascadingFilters', filterState, validationResult);
    setFilterErrors(validationResult.errors);
    if (validationResult.isValid) {
      console.log('CascadingFilters filterState:', filterState);
      onFilterChange?.(sanitizedFilters);
    }
  };

  const handleSubjectChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const subjects = typeof value === 'string' ? value.split(',') : value;
    console.log('Selected Subjects:', subjects);
    setSelectedSubjects(subjects);
    console.log('Updated selectedSubjects:', subjects);
    handleFilterChange({
      subject: subjects.length > 0 ? subjects : undefined,
      module: selectedModules.length > 0 ? selectedModules : undefined,
      topic: selectedTopics.length > 0 ? selectedTopics : undefined,
      questionType: selectedQuestionTypes.length > 0 ? selectedQuestionTypes : undefined,
      search: searchQuery,
    });
  };

  const handleModuleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const modules = typeof value === 'string' ? value.split(',') : value;
    console.log('Selected Modules:', modules); 
    setSelectedModules(modules);
    console.log('Updated Selected Modules:', modules);
    console.log('Updated selectedModules:', modules);
    setSelectedTopics([]);
    handleFilterChange({
      subject: selectedSubjects.length > 0 ? selectedSubjects : undefined,
      module: modules.length > 0 ? modules : undefined,
      topic: undefined,
      questionType: selectedQuestionTypes.length > 0 ? selectedQuestionTypes : undefined,
      search: searchQuery,
    });
  };

  const handleTopicChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const topics = typeof value === 'string' ? value.split(',') : value;
    console.log('Selected Topics:', topics); 
    setSelectedTopics(topics);
    console.log('Updated Selected Topics:', topics);
    console.log('Updated selectedTopics:', topics);
    handleFilterChange({
      subject: selectedSubjects.length > 0 ? selectedSubjects : undefined,
      module: selectedModules.length > 0 ? selectedModules : undefined,
      topic: topics.length > 0 ? topics : undefined,
      questionType: selectedQuestionTypes.length > 0 ? selectedQuestionTypes : undefined,
      search: searchQuery,
    });
  };

  const handleQuestionTypeChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const types = typeof value === 'string' ? value.split(',') : value;
    console.log('Selected Question Types:', types); 
    setSelectedQuestionTypes(types);
    console.log('Updated Selected Question Types:', types); 
    handleFilterChange({
      subject: selectedSubjects.length > 0 ? selectedSubjects : undefined,
      module: selectedModules.length > 0 ? selectedModules : undefined,
      topic: selectedTopics.length > 0 ? selectedTopics : undefined,
      questionType: types.length > 0 ? types : undefined,
      search: searchQuery,
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    console.log('Search Query:', value); 
    setSearchQuery(value);
    console.log('Updated Search Query:', value); 
    handleFilterChange({
      subject: selectedSubjects.length > 0 ? selectedSubjects : undefined,
      module: selectedModules.length > 0 ? selectedModules : undefined,
      topic: selectedTopics.length > 0 ? selectedTopics : undefined,
      questionType: selectedQuestionTypes.length > 0 ? selectedQuestionTypes : undefined,
      search: value,
    });
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        mb: 1,
        py: 0.75,
        px: 1.5,
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
      data-testid={testId}
    >
      {Object.entries(filterErrors).map(([key, errors]) => (
        <Alert 
          key={key} 
          severity="warning" 
          sx={{ mb: 1 }}
        >
          {errors.join(', ')}
        </Alert>
      ))}
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={12} sm={6} md={2}>
          <FormControl
            fullWidth
            size="small"
            sx={{
              '& .MuiInputBase-root': {
                fontSize: '0.875rem',
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.875rem',
              },
              '& .MuiSelect-select': {
                py: 1,
              },
            }}
          >
            <InputLabel>Subject</InputLabel>
            <Select
              data-testid="subject-filter"
              multiple
              value={selectedSubjects}
              label="Subject"
              onChange={handleSubjectChange}
              renderValue={selected => selected.join(', ')}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300
                  }
                }
              }}
            >
              {subjects.map(subject => (
                <MenuItem key={`subject-${subject}`} value={subject}>
                  <Checkbox 
                    checked={selectedSubjects.includes(subject)} 
                  />
                  <ListItemText primary={subject} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl
            fullWidth
            size="small"
            disabled={selectedSubjects.length === 0}
            sx={{
              '& .MuiInputBase-root': {
                fontSize: '0.875rem',
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.875rem',
              },
              '& .MuiSelect-select': {
                py: 1,
              },
            }}
          >
            <InputLabel>Module</InputLabel>
            <Select
              data-testid="module-filter"
              multiple
              value={selectedModules}
              label="Module"
              onChange={handleModuleChange}
              renderValue={selected => selected.join(', ')}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300
                  }
                }
              }}
            >
              {modules.map(module => (
                <MenuItem key={`module-${module}`} value={module}>
                  <Checkbox 
                    checked={selectedModules.includes(module)} 
                  />
                  <ListItemText primary={module} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl
            fullWidth
            size="small"
            disabled={selectedSubjects.length === 0 || selectedModules.length === 0}
            sx={{
              '& .MuiInputBase-root': {
                fontSize: '0.875rem',
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.875rem',
              },
              '& .MuiSelect-select': {
                py: 1,
              },
            }}
          >
            <InputLabel>Topic</InputLabel>
            <Select
              data-testid="topic-filter"
              multiple
              value={selectedTopics}
              label="Topic"
              onChange={handleTopicChange}
              renderValue={selected => selected.join(', ')}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300
                  }
                }
              }}
            >
              {topics.map(topic => (
                <MenuItem key={`topic-${topic}`} value={topic}>
                  <Checkbox 
                    checked={selectedTopics.includes(topic)} 
                  />
                  <ListItemText primary={topic} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl
            fullWidth
            size="small"
            sx={{
              '& .MuiInputBase-root': {
                fontSize: '0.875rem',
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.875rem',
              },
              '& .MuiSelect-select': {
                py: 1,
              },
            }}
          >
            <InputLabel>Question Type</InputLabel>
            <Select
              data-testid="question-type-filter"
              multiple
              value={selectedQuestionTypes}
              label="Question Type"
              onChange={handleQuestionTypeChange}
              renderValue={selected => selected.join(', ')}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300
                  }
                }
              }}
            >
              {questionTypes.map(type => (
                <MenuItem key={`question-type-${type}`} value={type}>
                  <Checkbox 
                    checked={selectedQuestionTypes.includes(type)} 
                  />
                  <ListItemText primary={type} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            data-testid="search-filter"
            fullWidth
            size="small"
            label="Search Questions"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{
              '& .MuiInputBase-root': {
                fontSize: '0.875rem',
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.875rem',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
