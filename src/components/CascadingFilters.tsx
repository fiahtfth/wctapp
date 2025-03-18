'use client';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Typography
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import hierarchicalData, { Subject, Module, Topic } from '@/lib/database/hierarchicalData';
import SafeFormControl from '@/components/SafeFormControl';

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
  subject: initialSubject,
  module: initialModule,
  topic: initialTopic,
  questionType: initialQuestionType,
  search: initialSearch,
  testId = 'cascading-filters',
}: CascadingFiltersProps) => {
  // State for selected filters
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(initialSubject || []);
  const [selectedModules, setSelectedModules] = useState<string[]>(initialModule || []);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(initialTopic || []);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>(initialQuestionType || []);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialRenderRef = useRef(true);

  // Derived state from hierarchical data
  const subjects = useMemo(() => hierarchicalData.map(subject => subject.name), []);
  const modules = useMemo(() => {
    return selectedSubjects.length > 0
      ? hierarchicalData
          .filter(subject => selectedSubjects.includes(subject.name))
          .flatMap(subject => subject.modules.map(module => module.name))
      : [];
  }, [selectedSubjects]);

  const topics = useMemo(() => {
    if (selectedSubjects.length === 0 || selectedModules.length === 0) return [];
    
    return hierarchicalData
      .filter(subject => selectedSubjects.includes(subject.name))
      .flatMap(subject => 
        subject.modules
          .filter(module => selectedModules.includes(module.name))
          .flatMap(module => module.topics.map(topic => topic.name))
      );
  }, [selectedSubjects, selectedModules]);

  const questionTypes = ['Objective', 'Subjective'];

  // Handler for filter changes with debounce
  const handleFilterChange = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const filters = {
        subject: selectedSubjects.length > 0 ? selectedSubjects : undefined,
        module: selectedModules.length > 0 ? selectedModules : undefined,
        topic: selectedTopics.length > 0 ? selectedTopics : undefined,
        questionType: selectedQuestionTypes.length > 0 ? selectedQuestionTypes : undefined,
        search: searchQuery || undefined,
      };

      onFilterChange?.(filters);
      debounceTimerRef.current = null;
    }, 300);
  }, [selectedSubjects, selectedModules, selectedTopics, selectedQuestionTypes, searchQuery, onFilterChange]);

  // Event handlers for filter selections
  const handleSubjectChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const subjects = typeof value === 'string' ? value.split(',') : value;
    
    setSelectedSubjects(subjects);
    // Reset dependent filters when subject changes
    setSelectedModules([]);
    setSelectedTopics([]);
  };

  const handleModuleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const modules = typeof value === 'string' ? value.split(',') : value;
    
    setSelectedModules(modules);
    // Reset dependent filters when module changes
    setSelectedTopics([]);
  };

  const handleTopicChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const topics = typeof value === 'string' ? value.split(',') : value;
    
    setSelectedTopics(topics);
  };

  const handleQuestionTypeChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const types = typeof value === 'string' ? value.split(',') : value;
    
    setSelectedQuestionTypes(types);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
  };

  // Add useEffect to handle filter changes
  useEffect(() => {
    // Skip the first render to prevent unnecessary API calls on mount
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }
    
    handleFilterChange();
    
    // Clean up the timeout on component unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [handleFilterChange]);

  return (
    <Box 
      id={testId} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2, 
        mb: 3,
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2
      }}
    >
      <Typography variant="h6" gutterBottom>
        Filter Questions
      </Typography>

      <Grid container spacing={2}>
        {/* Subject Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <SafeFormControl fullWidth variant="outlined">
            <InputLabel>Subject</InputLabel>
            <Select
              multiple
              label="Subject"
              value={selectedSubjects}
              onChange={handleSubjectChange}
              renderValue={(selected) => (selected as string[]).join(', ')}
            >
              {subjects.map((subjectName) => (
                <MenuItem key={subjectName} value={subjectName}>
                  <Checkbox checked={selectedSubjects.indexOf(subjectName) > -1} />
                  <ListItemText primary={subjectName} />
                </MenuItem>
              ))}
            </Select>
          </SafeFormControl>
        </Grid>

        {/* Module Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <SafeFormControl fullWidth variant="outlined" disabled={selectedSubjects.length === 0}>
            <InputLabel>Module</InputLabel>
            <Select
              multiple
              label="Module"
              value={selectedModules}
              onChange={handleModuleChange}
              renderValue={(selected) => (selected as string[]).join(', ')}
            >
              {modules.map((moduleName) => (
                <MenuItem key={moduleName} value={moduleName}>
                  <Checkbox checked={selectedModules.indexOf(moduleName) > -1} />
                  <ListItemText primary={moduleName} />
                </MenuItem>
              ))}
            </Select>
          </SafeFormControl>
        </Grid>

        {/* Topic Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <SafeFormControl fullWidth variant="outlined" disabled={selectedModules.length === 0}>
            <InputLabel>Topic</InputLabel>
            <Select
              multiple
              label="Topic"
              value={selectedTopics}
              onChange={handleTopicChange}
              renderValue={(selected) => (selected as string[]).join(', ')}
            >
              {topics.map((topicName) => (
                <MenuItem key={topicName} value={topicName}>
                  <Checkbox checked={selectedTopics.indexOf(topicName) > -1} />
                  <ListItemText primary={topicName} />
                </MenuItem>
              ))}
            </Select>
          </SafeFormControl>
        </Grid>

        {/* Question Type Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <SafeFormControl fullWidth variant="outlined">
            <InputLabel>Question Type</InputLabel>
            <Select
              multiple
              label="Question Type"
              value={selectedQuestionTypes}
              onChange={handleQuestionTypeChange}
              renderValue={(selected) => (selected as string[]).join(', ')}
            >
              {questionTypes.map((typeName) => (
                <MenuItem key={typeName} value={typeName}>
                  <Checkbox checked={selectedQuestionTypes.indexOf(typeName) > -1} />
                  <ListItemText primary={typeName} />
                </MenuItem>
              ))}
            </Select>
          </SafeFormControl>
        </Grid>

        {/* Search Input */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            label="Search Questions"
            value={searchQuery}
            onChange={handleSearchChange}
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
