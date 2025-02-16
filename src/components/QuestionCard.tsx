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

    const handleAddToTest = async () => {
        try {
            if (question.id) {
                await onAddToTest(question.id);
            }
        } catch (error) {
            console.error('Error adding question to test:', error);
        }
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(question);
            setPreviewOpen(false);
        }
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
                            onClick={() => onEdit(question)}
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
                                onClick={handleEdit}
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
                            onClick={handleEdit} 
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
