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
    InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { 
    getDistinctValues, 
    getCascadingOptions 
} from '@/lib/database/queries';

interface CascadingFiltersProps {
    onFilterChange?: (filters: {
        subject?: string[];
        module?: string[];
        topic?: string[];
        sub_topic?: string[];
        question_type?: string[];
        search?: string;
    }) => void;
    subject?: string[];
    module?: string[];
    topic?: string[];
    sub_topic?: string[];
    question_type?: string[];
    search?: string;
}

const filterLevelMap = {
    subject: 'subject',
    module: 'module',
    topic: 'topic',
    sub_topic: 'sub_topic',
    question_type: 'question_type'
};

export default function CascadingFilters({ 
    onFilterChange 
}: CascadingFiltersProps) {
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [selectedSubTopics, setSelectedSubTopics] = useState<string[]>([]);
    const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [subjects, setSubjects] = useState<string[]>([]);
    const [modules, setModules] = useState<string[]>([]);
    const [topics, setTopics] = useState<string[]>([]);
    const [subTopics, setSubTopics] = useState<string[]>([]);
    const [questionTypes, setQuestionTypes] = useState<string[]>([]);

    useEffect(() => {
        const loadSubjects = async () => {
            const data = await getDistinctValues('subject');
            setSubjects(data);
        };

        loadSubjects();
    }, []);

    useEffect(() => {
        const loadModules = async () => {
            if (selectedSubjects.length > 0) {
                const data = await getCascadingOptions('modules', { subject: selectedSubjects });
                setModules(data);
            } else {
                setModules([]);
            }
        };

        loadModules();
    }, [selectedSubjects]);

    useEffect(() => {
        const loadTopics = async () => {
            if (selectedSubjects.length > 0 && selectedModules.length > 0) {
                const data = await getCascadingOptions('topics', { 
                    subject: selectedSubjects, 
                    module: selectedModules 
                });
                setTopics(data);
            } else {
                setTopics([]);
            }
        };

        loadTopics();
    }, [selectedSubjects, selectedModules]);

    useEffect(() => {
        const loadSubTopics = async () => {
            if (selectedSubjects.length > 0 && selectedModules.length > 0 && selectedTopics.length > 0) {
                const data = await getCascadingOptions('sub_topics', { 
                    subject: selectedSubjects, 
                    module: selectedModules, 
                    topic: selectedTopics 
                });
                setSubTopics(data);
            } else {
                setSubTopics([]);
            }
        };

        loadSubTopics();
    }, [selectedSubjects, selectedModules, selectedTopics]);

    useEffect(() => {
        const loadQuestionTypes = async () => {
            const data = await getDistinctValues('question_type');
            setQuestionTypes(data);
        };

        loadQuestionTypes();
    }, []);

    const handleSubjectChange = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value;
        const subjects = typeof value === 'string' ? value.split(',') : value;
        
        // Reset dependent filters when subject changes
        setSelectedModules([]);
        setSelectedTopics([]);
        setSelectedSubTopics([]);
        setSelectedSubjects(subjects);

        // Notify parent of filter change
        onFilterChange?.({ 
            subject: subjects,
            module: undefined,
            topic: undefined,
            sub_topic: undefined,
            question_type: selectedQuestionTypes,
            search: searchQuery
        });
    };

    const handleModuleChange = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value;
        const modules = typeof value === 'string' ? value.split(',') : value;
        
        // Reset dependent filters when module changes
        setSelectedTopics([]);
        setSelectedSubTopics([]);
        setSelectedModules(modules);

        // Notify parent of filter change
        onFilterChange?.({ 
            subject: selectedSubjects,
            module: modules,
            topic: undefined,
            sub_topic: undefined,
            question_type: selectedQuestionTypes,
            search: searchQuery
        });
    };

    const handleTopicChange = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value;
        const topics = typeof value === 'string' ? value.split(',') : value;
        
        // Reset sub-topics when topic changes
        setSelectedSubTopics([]);
        setSelectedTopics(topics);

        // Notify parent of filter change
        onFilterChange?.({ 
            subject: selectedSubjects,
            module: selectedModules,
            topic: topics,
            sub_topic: undefined,
            question_type: selectedQuestionTypes,
            search: searchQuery
        });
    };

    const handleSubTopicChange = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value;
        const subTopics = typeof value === 'string' ? value.split(',') : value;
        setSelectedSubTopics(subTopics);

        // Notify parent of filter change
        onFilterChange?.({ 
            subject: selectedSubjects,
            module: selectedModules,
            topic: selectedTopics,
            sub_topic: subTopics,
            question_type: selectedQuestionTypes,
            search: searchQuery
        });
    };

    const handleQuestionTypeChange = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value;
        const types = typeof value === 'string' ? value.split(',') : value;
        setSelectedQuestionTypes(types);

        // Notify parent of filter change
        onFilterChange?.({ 
            subject: selectedSubjects,
            module: selectedModules,
            topic: selectedTopics,
            sub_topic: selectedSubTopics,
            question_type: types,
            search: searchQuery
        });
    };

    const notifyFilterChange = () => {
        onFilterChange?.({
            subject: selectedSubjects.length > 0 ? selectedSubjects : undefined,
            module: selectedModules.length > 0 ? selectedModules : undefined,
            topic: selectedTopics.length > 0 ? selectedTopics : undefined,
            sub_topic: selectedSubTopics.length > 0 ? selectedSubTopics : undefined,
            question_type: selectedQuestionTypes.length > 0 ? selectedQuestionTypes : undefined,
            search: searchQuery || undefined
        });
    };

    // Update filters whenever any selection changes
    useEffect(() => {
        notifyFilterChange();
    }, [
        selectedSubjects,
        selectedModules,
        selectedTopics,
        selectedSubTopics,
        selectedQuestionTypes,
        searchQuery
    ]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchQuery(value);

        // Notify parent of filter change
        onFilterChange?.({ 
            subject: selectedSubjects,
            module: selectedModules,
            topic: selectedTopics,
            sub_topic: selectedSubTopics,
            question_type: selectedQuestionTypes,
            search: value
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
                borderColor: 'divider'
            }} 
            data-testid="cascading-filters"
        >
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
                                py: 1
                            }
                        }}
                    >
                        <InputLabel>Subject</InputLabel>
                        <Select
                            data-testid="subject-filter"
                            multiple
                            value={selectedSubjects}
                            label="Subject"
                            onChange={handleSubjectChange}
                            renderValue={(selected) => selected.join(', ')}
                        >
                            {subjects.map((subject) => (
                                <MenuItem 
                                    key={subject} 
                                    value={subject} 
                                    sx={{ 
                                        py: 0.5,
                                        '& .MuiTypography-root': {
                                            fontSize: '0.875rem'
                                        }
                                    }}
                                >
                                    <Checkbox checked={selectedSubjects.includes(subject)} />
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
                                py: 1
                            }
                        }}
                    >
                        <InputLabel>Module</InputLabel>
                        <Select
                            data-testid="module-filter"
                            multiple
                            value={selectedModules}
                            label="Module"
                            onChange={handleModuleChange}
                            renderValue={(selected) => selected.join(', ')}
                        >
                            {modules.map((module) => (
                                <MenuItem key={module} value={module}>
                                    <Checkbox checked={selectedModules.includes(module)} />
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
                                py: 1
                            }
                        }}
                    >
                        <InputLabel>Topic</InputLabel>
                        <Select
                            data-testid="topic-filter"
                            multiple
                            value={selectedTopics}
                            label="Topic"
                            onChange={handleTopicChange}
                            renderValue={(selected) => selected.join(', ')}
                        >
                            {topics.map((topic) => (
                                <MenuItem key={topic} value={topic}>
                                    <Checkbox checked={selectedTopics.includes(topic)} />
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
                        disabled={
                            selectedSubjects.length === 0 || 
                            selectedModules.length === 0 || 
                            selectedTopics.length === 0
                        }
                        sx={{ 
                            '& .MuiInputBase-root': { 
                                fontSize: '0.875rem',
                            },
                            '& .MuiInputLabel-root': {
                                fontSize: '0.875rem',
                            },
                            '& .MuiSelect-select': {
                                py: 1
                            }
                        }}
                    >
                        <InputLabel>Sub Topic</InputLabel>
                        <Select
                            data-testid="sub-topic-filter"
                            multiple
                            value={selectedSubTopics}
                            label="Sub Topic"
                            onChange={handleSubTopicChange}
                            renderValue={(selected) => selected.join(', ')}
                        >
                            {subTopics.map((subTopic) => (
                                <MenuItem 
                                    key={subTopic} 
                                    value={subTopic}
                                    sx={{ 
                                        py: 0.5,
                                        '& .MuiTypography-root': {
                                            fontSize: '0.875rem'
                                        }
                                    }}
                                >
                                    <Checkbox checked={selectedSubTopics.includes(subTopic)} />
                                    <ListItemText primary={subTopic} />
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
                                py: 1
                            }
                        }}
                    >
                        <InputLabel>Question Type</InputLabel>
                        <Select
                            data-testid="question-type-filter"
                            multiple
                            value={selectedQuestionTypes}
                            label="Question Type"
                            onChange={handleQuestionTypeChange}
                            renderValue={(selected) => selected.join(', ')}
                        >
                            {questionTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    <Checkbox checked={selectedQuestionTypes.includes(type)} />
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
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
