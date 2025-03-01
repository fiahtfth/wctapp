'use client';
import React, { useState, useEffect, useMemo } from 'react';
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
import SearchIcon from '@mui/icons-material/Search';
import hierarchicalData, { Subject, Module, Topic } from '@/lib/database/hierarchicalData';

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

  // Handler for filter changes
  const handleFilterChange = () => {
    const filters = {
      subject: selectedSubjects.length > 0 ? selectedSubjects : undefined,
      module: selectedModules.length > 0 ? selectedModules : undefined,
      topic: selectedTopics.length > 0 ? selectedTopics : undefined,
      questionType: selectedQuestionTypes.length > 0 ? selectedQuestionTypes : undefined,
      search: searchQuery || undefined,
    };

    onFilterChange?.(filters);
  };

  // Event handlers for filter selections
  const handleSubjectChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const subjects = typeof value === 'string' ? value.split(',') : value;
    
    setSelectedSubjects(subjects);
    // Reset dependent filters when subject changes
    setSelectedModules([]);
    setSelectedTopics([]);
    
    handleFilterChange();
  };

  const handleModuleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const modules = typeof value === 'string' ? value.split(',') : value;
    
    setSelectedModules(modules);
    // Reset dependent filters when module changes
    setSelectedTopics([]);
    
    handleFilterChange();
  };

  const handleTopicChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const topics = typeof value === 'string' ? value.split(',') : value;
    
    setSelectedTopics(topics);
    handleFilterChange();
  };

  const handleQuestionTypeChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const types = typeof value === 'string' ? value.split(',') : value;
    
    setSelectedQuestionTypes(types);
    handleFilterChange();
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    handleFilterChange();
  };

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
          <FormControl fullWidth variant="outlined">
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
          </FormControl>
        </Grid>

        {/* Module Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth variant="outlined" disabled={selectedSubjects.length === 0}>
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
          </FormControl>
        </Grid>

        {/* Topic Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth variant="outlined" disabled={selectedModules.length === 0}>
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
          </FormControl>
        </Grid>

        {/* Question Type Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth variant="outlined">
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
          </FormControl>
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
