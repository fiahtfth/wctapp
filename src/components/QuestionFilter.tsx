'use client';

import React, { useState, useEffect } from 'react';
import { 
    TextField, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    Grid, 
    Chip, 
    SelectChangeEvent,
    Button,
    Box
} from '@mui/material';

interface QuestionFilterProps {
    onFilterChange: (filters: {
        subject?: string;
        topic?: string;
        module?: string;
        sub_topic?: string;
        difficulty_level?: 'easy' | 'medium' | 'hard';
        nature_of_question?: string;
        search?: string;
    }) => void;
}

const SUBJECTS = [
    { value: 'Economics', color: '#3f51b5' },
    { value: 'Mathematics', color: '#2196f3' },
    { value: 'Science', color: '#4caf50' },
    { value: 'History', color: '#ff9800' }
];

const DIFFICULTY_LEVELS = [
    { value: 'easy', color: 'success' },
    { value: 'medium', color: 'warning' },
    { value: 'hard', color: 'error' }
];

export default function QuestionFilter({ onFilterChange }: QuestionFilterProps) {
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [module, setModule] = useState('');
    const [subTopic, setSubTopic] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [natureOfQuestion, setNatureOfQuestion] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleFilterChange = () => {
        onFilterChange({
            subject: subject || undefined,
            topic: topic || undefined,
            module: module || undefined,
            sub_topic: subTopic || undefined,
            difficulty_level: difficulty as 'easy' | 'medium' | 'hard' || undefined,
            nature_of_question: natureOfQuestion || undefined,
            search: searchTerm || undefined
        });
    };

    const handleResetFilters = () => {
        setSubject('');
        setTopic('');
        setModule('');
        setSubTopic('');
        setDifficulty('');
        setNatureOfQuestion('');
        setSearchTerm('');
        onFilterChange({});
    };

    return (
        <Box sx={{ flexGrow: 1, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>Subject</InputLabel>
                        <Select
                            value={subject}
                            label="Subject"
                            onChange={(e) => {
                                setSubject(e.target.value);
                                handleFilterChange();
                            }}
                        >
                            <MenuItem value="">All Subjects</MenuItem>
                            {SUBJECTS.map((subj) => (
                                <MenuItem key={subj.value} value={subj.value}>{subj.value}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        label="Topic"
                        value={topic}
                        onChange={(e) => {
                            setTopic(e.target.value);
                            handleFilterChange();
                        }}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>Difficulty</InputLabel>
                        <Select
                            value={difficulty}
                            label="Difficulty"
                            onChange={(e) => {
                                setDifficulty(e.target.value);
                                handleFilterChange();
                            }}
                        >
                            <MenuItem value="">All Difficulties</MenuItem>
                            {DIFFICULTY_LEVELS.map((diff) => (
                                <MenuItem key={diff.value} value={diff.value}>{diff.value}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        label="Module"
                        value={module}
                        onChange={(e) => {
                            setModule(e.target.value);
                            handleFilterChange();
                        }}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        label="Sub Topic"
                        value={subTopic}
                        onChange={(e) => {
                            setSubTopic(e.target.value);
                            handleFilterChange();
                        }}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>Nature of Question</InputLabel>
                        <Select
                            value={natureOfQuestion}
                            label="Nature of Question"
                            onChange={(e) => {
                                setNatureOfQuestion(e.target.value);
                                handleFilterChange();
                            }}
                        >
                            <MenuItem value="">All Types</MenuItem>
                            <MenuItem value="Conceptual">Conceptual</MenuItem>
                            <MenuItem value="Numerical">Numerical</MenuItem>
                            <MenuItem value="Theoretical">Theoretical</MenuItem>
                            <MenuItem value="Applied">Applied</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Search Questions"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            handleFilterChange();
                        }}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Button 
                        variant="outlined" 
                        color="secondary" 
                        onClick={handleResetFilters}
                    >
                        Reset All Filters
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}
