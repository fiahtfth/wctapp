import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Box,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Grid,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PreviewIcon from '@mui/icons-material/Preview';
import type { Question } from '@/lib/database/queries';

const formatQuestion = (questionText: string): React.ReactNode => {
    if (!questionText) return null;
    
    const lines = questionText.split(/\n/).map(line => line.trim()).filter(line => line.length > 0);
    const formattedParts: React.ReactNode[] = [];
    
    let statements: string[] = [];
    let questionPart = '';
    let options: string[] = [];
    let currentSection: 'intro' | 'statements' | 'question' | 'options' = 'intro';
    
    lines.forEach(line => {
        if (line.toLowerCase().includes('consider the following statements')) {
            formattedParts.push(<Box key="intro" sx={{ mb: 0.5 }}>{line}</Box>);
            currentSection = 'statements';
        } else if (line.match(/^\d+\./)) {
            if (currentSection !== 'statements') {
                currentSection = 'statements';
            }
            statements.push(line);
        } else if (line.match(/^\([a-d]\)/i)) {
            if (currentSection !== 'options') {
                // Add the question part before starting options
                if (questionPart) {
                    formattedParts.push(
                        <Box key="question" sx={{ my: 0.5 }}>{questionPart.trim()}</Box>
                    );
                    questionPart = '';
                }
                currentSection = 'options';
            }
            options.push(line);
        } else if (line.toLowerCase().includes('which') || line.toLowerCase().includes('what') || line.toLowerCase().includes('select')) {
            // If we were in statements, add them first
            if (statements.length > 0) {
                formattedParts.push(
                    <Box key="statements" sx={{ ml: 1 }}>
                        {statements.map((stmt, idx) => (
                            <Box key={idx} sx={{ mb: 0.25 }}>{stmt}</Box>
                        ))}
                    </Box>
                );
                statements = [];
            }
            currentSection = 'question';
            questionPart = line;
        } else {
            switch (currentSection) {
                case 'statements':
                    statements.push(line);
                    break;
                case 'options':
                    options.push(line);
                    break;
                case 'question':
                    questionPart += ' ' + line;
                    break;
                default:
                    formattedParts.push(<Box key={`intro-${line}`}>{line}</Box>);
            }
        }
    });

    // Add any remaining statements
    if (statements.length > 0) {
        formattedParts.push(
            <Box key="statements" sx={{ ml: 1 }}>
                {statements.map((stmt, idx) => (
                    <Box key={idx} sx={{ mb: 0.25 }}>{stmt}</Box>
                ))}
            </Box>
        );
    }

    // Add any remaining question part
    if (questionPart) {
        formattedParts.push(
            <Box key="question" sx={{ my: 0.5 }}>{questionPart.trim()}</Box>
        );
    }

    // Add options
    if (options.length > 0) {
        formattedParts.push(
            <Box key="options" sx={{ ml: 1 }}>
                {options.map((opt, idx) => (
                    <Box key={idx} sx={{ mb: 0.25 }}>{opt}</Box>
                ))}
            </Box>
        );
    }

    return <>{formattedParts}</>;
};

interface QuestionCardProps {
    question: Question;
    onAddToTest: (questionId: number) => Promise<void>;
    onEdit?: (question: Question) => void;
}

export default function QuestionCard({ question, onAddToTest, onEdit }: QuestionCardProps) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState<Question>({
        ...question,
        'Faculty Approved': question['Faculty Approved'] || false
    });

    const difficultyLevels = ['Easy', 'Medium', 'Hard'];
    const questionTypes = [
        'Objective', 
        'Subjective', 
    ];

    const natureOfQuestions = [
        'Factual', 
        'Conceptual', 
        'Analytical'
    ];

    const handleAddToTest = async () => {
        try {
            if (question.id) {
                await onAddToTest(question.id);
            }
        } catch (error) {
            console.error('Error adding question to test:', error);
        }
    };

    const handleEditClick = () => {
        setEditModalOpen(true);
        setEditedQuestion({
            ...question,
            'Faculty Approved': question['Faculty Approved'] || false
        });
    };

    const handleSaveEdit = () => {
        if (onEdit) {
            // Ensure all fields are passed, even if they're undefined
            const completeQuestion: Question = {
                ...question,  // Original question as base
                ...editedQuestion,  // Overwrite with edited values
                id: question.id,  // Ensure original ID is preserved
                
                // Explicitly set fields to ensure they're included
                'Explanation': editedQuestion['Explanation'] || null,
                'Sub Topic': editedQuestion['Sub Topic'] || null,
                'Micro Topic': editedQuestion['Micro Topic'] || null,
                'Difficulty Level': editedQuestion['Difficulty Level'] || null,
                'Nature of Question': editedQuestion['Nature of Question'] || null,
                'Question Type': editedQuestion['Question Type'] || null,
                'Module Name': editedQuestion['Module Name'] || null,
                'Module Number': editedQuestion['Module Number'] || null,
                'Faculty Approved': editedQuestion['Faculty Approved'] || false
            };

            console.log('Saving complete question:', completeQuestion);
            onEdit(completeQuestion);
            setEditModalOpen(false);
        }
    };

    const handleEditChange = (field: keyof Question, value: string | boolean) => {
        setEditedQuestion(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', pb: 0 }}>
                <CardContent sx={{ 
                    flexGrow: 1, 
                    pb: '0 !important',
                    pt: 1,
                    px: 1.5,
                    '&:last-child': { pb: '0 !important' }
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                color: 'error.main', 
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}
                        >
                            {question.Subject}
                        </Typography>
                        <Chip 
                            label={question["Module Name"]} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                                fontSize: '0.75rem',
                                height: 22
                            }}
                        />
                    </Box>
                    <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 1, 
                        mb: 1,
                        alignItems: 'center'
                    }}>
                        {question.Topic && (
                            <Chip 
                                label={`Topic: ${question.Topic}`} 
                                size="small" 
                                color="secondary"
                                variant="outlined"
                                sx={{ fontSize: '0.675rem', height: 20 }}
                            />
                        )}
                        {question["Sub Topic"] && (
                            <Chip 
                                label={`Sub Topic: ${question["Sub Topic"]}`} 
                                size="small" 
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '0.675rem', height: 20 }}
                            />
                        )}
                        {question["Micro Topic"] && (
                            <Chip 
                                label={`Micro Topic: ${question["Micro Topic"]}`} 
                                size="small" 
                                color="info"
                                variant="outlined"
                                sx={{ fontSize: '0.675rem', height: 20 }}
                            />
                        )}
                    </Box>
                    <Box 
                        sx={{ 
                            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                            fontSize: '0.75rem',
                            lineHeight: 1.3,
                            letterSpacing: '0.01em',
                            mb: 0.5
                        }}
                    >
                        {formatQuestion(question.Question)}
                    </Box>
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 0.5, 
                        flexWrap: 'wrap', 
                        alignItems: 'center',
                        mt: 0.25
                    }}>
                        <Chip 
                            label={question['Difficulty Level'] || 'Unknown'} 
                            size="small" 
                            sx={{ fontSize: '0.625rem', height: 20 }}
                            color={
                                question['Difficulty Level'] === 'easy' ? 'success' :
                                question['Difficulty Level'] === 'medium' ? 'warning' :
                                'error'
                            } 
                        />
                        <Chip 
                            label={question['Nature of Question'] || 'Unknown'} 
                            size="small" 
                            sx={{ fontSize: '0.625rem', height: 20 }}
                        />
                    </Box>
                </CardContent>
                <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 0.5,
                    pr: 1,
                    mt: -0.5,
                    mb: 0.5
                }}>
                    <IconButton 
                        size="small" 
                        onClick={() => setPreviewOpen(true)}
                        title="Preview"
                    >
                        <PreviewIcon fontSize="small" />
                    </IconButton>
                    {onEdit && (
                        <IconButton 
                            size="small" 
                            onClick={handleEditClick}
                            title="Edit"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    )}
                    <IconButton 
                        size="small" 
                        onClick={handleAddToTest}
                        title="Add to Test"
                        color="primary"
                    >
                        <AddShoppingCartIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Card>

            <Dialog 
                open={editModalOpen} 
                onClose={() => setEditModalOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Edit Question Details</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        {/* Question and Answer */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Question"
                                value={editedQuestion.Question}
                                onChange={(e) => handleEditChange('Question', e.target.value)}
                                variant="outlined"
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Answer"
                                value={editedQuestion.Answer}
                                onChange={(e) => handleEditChange('Answer', e.target.value)}
                                variant="outlined"
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Explanation"
                                value={editedQuestion['Explanation']}
                                onChange={(e) => handleEditChange('Explanation', e.target.value)}
                                variant="outlined"
                                margin="normal"
                            />
                        </Grid>

                        {/* Metadata Fields */}
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Subject"
                                value={editedQuestion.Subject}
                                onChange={(e) => handleEditChange('Subject', e.target.value)}
                                variant="outlined"
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Module Name"
                                value={editedQuestion['Module Name']}
                                onChange={(e) => handleEditChange('Module Name', e.target.value)}
                                variant="outlined"
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Module Number"
                                value={editedQuestion['Module Number']}
                                onChange={(e) => handleEditChange('Module Number', e.target.value)}
                                variant="outlined"
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Topic"
                                value={editedQuestion.Topic}
                                onChange={(e) => handleEditChange('Topic', e.target.value)}
                                variant="outlined"
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Sub Topic"
                                value={editedQuestion['Sub Topic']}
                                onChange={(e) => handleEditChange('Sub Topic', e.target.value)}
                                variant="outlined"
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Micro Topic"
                                value={editedQuestion['Micro Topic']}
                                onChange={(e) => handleEditChange('Micro Topic', e.target.value)}
                                variant="outlined"
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <FormControl fullWidth variant="outlined" margin="normal">
                                <InputLabel>Difficulty Level</InputLabel>
                                <Select
                                    value={editedQuestion['Difficulty Level'] || ''}
                                    onChange={(e) => handleEditChange('Difficulty Level', e.target.value)}
                                    label="Difficulty Level"
                                >
                                    {difficultyLevels.map((level) => (
                                        <MenuItem key={level} value={level}>
                                            {level}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={4}>
                            <FormControl fullWidth variant="outlined" margin="normal">
                                <InputLabel>Question Type</InputLabel>
                                <Select
                                    value={editedQuestion['Question Type'] || ''}
                                    onChange={(e) => handleEditChange('Question Type', e.target.value)}
                                    label="Question Type"
                                >
                                    {questionTypes.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={4}>
                            <FormControl fullWidth variant="outlined" margin="normal">
                                <InputLabel>Nature of Question</InputLabel>
                                <Select
                                    value={editedQuestion['Nature of Question'] || ''}
                                    onChange={(e) => handleEditChange('Nature of Question', e.target.value)}
                                    label="Nature of Question"
                                >
                                    {natureOfQuestions.map((nature) => (
                                        <MenuItem key={nature} value={nature}>
                                            {nature}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Additional Metadata */}
                        <Grid item xs={12}>
                            <Box display="flex" alignItems="center">
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={!!editedQuestion['Faculty Approved']}
                                            onChange={(e) => handleEditChange('Faculty Approved', e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label="Faculty Approved"
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditModalOpen(false)} color="secondary">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSaveEdit} 
                        color="primary" 
                        variant="contained"
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog 
                open={previewOpen} 
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Question Preview
                        {onEdit && (
                            <IconButton 
                                onClick={handleEditClick}
                                color="primary"
                                size="large"
                            >
                                <EditIcon fontSize="medium" />
                            </IconButton>
                        )}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Question
                        </Typography>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                mb: 2,  
                                fontWeight: 'normal', 
                                whiteSpace: 'pre-line', 
                                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                                fontSize: '0.875rem',
                                lineHeight: 1.4,
                                letterSpacing: '0.01071em',
                                '& .statement': { mb: 0.5 },
                                '& .options': { mt: 0.5 }
                            }}
                        >
                            {formatQuestion(question.Question)}
                        </Typography>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Answer
                        </Typography>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                mb: 2,  
                                fontWeight: 'normal' 
                            }}
                        >
                            <strong>Answer:</strong> {formatQuestion(question.Answer)}
                        </Typography>
                    </Box>

                    {question.Explanation && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Explanation
                            </Typography>
                            <Typography variant="body1" paragraph>
                                {question.Explanation}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Subject:</strong> {question.Subject}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Topic:</strong> {question.Topic}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Sub Topic:</strong> {question["Sub Topic"]}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Micro Topic:</strong> {question["Micro Topic"]}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Difficulty:</strong> {question['Difficulty Level']}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Type:</strong> {question['Nature of Question']}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                    <Button onClick={handleAddToTest} variant="contained" startIcon={<AddShoppingCartIcon />}>
                        Add to Test
                    </Button>
                    {onEdit && (
                        <Button 
                            onClick={handleEditClick} 
                            variant="outlined" 
                            startIcon={<EditIcon />}
                        >
                            Edit Question
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
}
