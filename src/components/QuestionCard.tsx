import React, { useState, useEffect } from 'react';
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
    FormControlLabel,
    InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PreviewIcon from '@mui/icons-material/Preview';
import type { Question } from '@/lib/database/queries';
import { useCartStore } from '@/store/cartStore';

const formatQuestion = (questionText: string): React.ReactNode => {
    if (!questionText) return null;

    const lines = questionText.split(/\n/).map(line => line.trim()).filter(line => line.length > 0);
    const formattedParts: React.ReactNode[] = [];
    
    let introText = '';
    let statements: { text: string, index: number }[] = [];
    let questionPart = '';
    let options: { text: string, index: number }[] = [];
    let currentSection: 'intro' | 'statements' | 'question' | 'options' = 'intro';
    
    lines.forEach((line, lineIndex) => {
        // Prioritize capturing context lines
        if (line.toLowerCase().includes('consider the following') || 
            line.toLowerCase().includes('with respect to') || 
            line.toLowerCase().includes('based on')) {
            introText += line + ' ';
            currentSection = 'intro';
        } 
        // Capture statements
        else if (line.match(/^\d+\./)) {
            statements.push({ text: line, index: lineIndex });
            currentSection = 'statements';
        } 
        // Capture question part
        else if (line.toLowerCase().includes('which of the statements') || 
                 line.toLowerCase().includes('how many') || 
                 line.toLowerCase().includes('select')) {
            questionPart += line + ' ';
            currentSection = 'question';
        } 
        // Capture options - ALWAYS ensure parentheses
        else if (line.match(/^[a-d]\)/) || line.match(/^\([a-d]\)/) || line.match(/^[a-d]\./)) {
            // Normalize to (a), (b), (c), (d) format
            const normalizedLine = line.replace(/^([a-d])[).]/, '($1)');
            options.push({ text: normalizedLine, index: lineIndex });
            currentSection = 'options';
        } 
        // Fallback for other lines
        else {
            // Add line to the most recent section
            if (currentSection === 'intro') introText += line + ' ';
            else if (currentSection === 'question') questionPart += line + ' ';
        }
    });

    // Add intro text if present
    if (introText.trim()) {
        formattedParts.push(
            <Box key="intro" sx={{ mb: 0.5 }}>
                {introText.trim()}
            </Box>
        );
    }

    // Add statements if any
    if (statements.length > 0) {
        formattedParts.push(
            <Box key="statements-container" sx={{ ml: 1 }}>
                {statements.map((stmt) => (
                    <Box key={`statement-${stmt.index}`} sx={{ mb: 0.25 }}>
                        {stmt.text}
                    </Box>
                ))}
            </Box>
        );
    }

    // Add question part if any
    if (questionPart) {
        formattedParts.push(
            <Box key={`question-final`} sx={{ my: 0.5 }}>
                {questionPart.trim()}
            </Box>
        );
    }

    // Add options if any
    if (options.length > 0) {
        formattedParts.push(
            <Box key="options-container" sx={{ ml: 1 }}>
                {options.map((opt) => (
                    <Box key={`option-${opt.index}`} sx={{ mb: 0.25 }}>
                        {opt.text}
                    </Box>
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
    initialInCart?: boolean;
    onRemove?: () => void;
    showCartButton?: boolean;
}

export default function QuestionCard({ 
    question, 
    onAddToTest, 
    onEdit, 
    initialInCart, 
    onRemove, 
    showCartButton = true 
}: QuestionCardProps) {
    const [mounted, setMounted] = useState(false);
    const { addQuestion, removeQuestion, isInCart } = useCartStore();
    const [inCart, setInCart] = useState(initialInCart ?? false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState<Question>({
        ...question
    });
    const [editChanges, setEditChanges] = useState<{[key: string]: any}>({});

    useEffect(() => {
        setMounted(true);
        // Check if question is already in cart
        const checkInCart = isInCart(question.id);
        setInCart(checkInCart);
    }, []);

    const handleCartToggle = () => {
        console.log('Cart Toggle Called', {
            questionId: question.id,
            currentCartState: inCart,
            fullQuestion: question
        });

        try {
            if (inCart) {
                console.log('Removing question from cart', question.id);
                removeQuestion(question.id);
                if (onRemove) onRemove();
            } else {
                console.log('Adding question to cart', {
                    id: question.id,
                    text: question.text || question.Question,
                    subject: question.subject || question.Subject,
                    module: question.module || question['Module Name']
                });
                addQuestion({
                    id: question.id,
                    text: question.text || question.Question,
                    subject: question.subject || question.Subject,
                    module: question.module || question['Module Name'],
                    topic: question.topic || question.Topic,
                    // Add any other necessary fields
                    ...question
                });
            }
            
            // Force a re-render and state update
            setInCart(!inCart);
        } catch (error) {
            console.error('Error in cart toggle:', error);
        }
    };

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
            ...question
        });
    };

    const handleEditChange = (field: string, value: string | boolean | number) => {
        // Capitalize Difficulty Level
        let processedValue = value;
        if (field === 'Difficulty Level' && typeof value === 'string') {
            const validDifficultyLevels = ['Easy', 'Medium', 'Hard'];
            const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            
            // Ensure only valid difficulty levels are used
            processedValue = validDifficultyLevels.includes(capitalizedValue) 
                ? capitalizedValue 
                : value;
        }

        // Track which fields have been changed
        const newChanges = {
            ...editChanges,
            [field]: processedValue
        };
        setEditChanges(newChanges);

        // Update the edited question
        const updatedQuestion = {
            ...editedQuestion,
            [field]: processedValue
        };
        setEditedQuestion(updatedQuestion);

        // Log changes for debugging
        console.group('Question Edit Changes');
        console.log('Field Changed:', field);
        console.log('Original Value:', value);
        console.log('Processed Value:', processedValue);
        console.log('All Changes:', newChanges);
        console.groupEnd();
    };

    const handleSaveEdit = () => {
        console.group('Question Edit Process');
        console.log('1. Original Question:', JSON.parse(JSON.stringify(question)));
        console.log('2. Edited Question:', JSON.parse(JSON.stringify(editedQuestion)));
        console.log('3. Edit Changes:', JSON.parse(JSON.stringify(editChanges)));

        // Create a complete question object with all changes
        const completeQuestion = {
            ...question,  // Start with original question
            ...editedQuestion,  // Overlay edited question details
            ...editChanges,  // Ensure any specific changes are captured
            // Explicitly map potential key mismatches
            'Question_Type': editChanges['Question Type'] || editedQuestion['Question Type'] || question['Question Type'],
            'Difficulty Level': editChanges['Difficulty Level'] || editedQuestion['Difficulty Level'] || question['Difficulty Level'],
            'Nature of Question': editChanges['Nature of Question'] || editedQuestion['Nature of Question'] || question['Nature of Question'],
            'Faculty Approved': editChanges['Faculty Approved'] ?? editedQuestion['Faculty Approved'] ?? question['Faculty Approved']
        };

        console.log('4. Complete Question for Saving:', JSON.parse(JSON.stringify(completeQuestion)));
        console.groupEnd();

        // Call onEdit with the complete question
        if (onEdit) {
            try {
                console.log('Calling onEdit with:', JSON.parse(JSON.stringify(completeQuestion)));
                onEdit(completeQuestion);
            } catch (error) {
                console.error('Error in onEdit callback:', error);
            }
        }

        // Close the edit modal
        setEditModalOpen(false);
        
        // Reset changes after saving
        setEditChanges({});
    };

    const getDifficultyColor = (level?: string) => {
        const normalizedLevel = level?.toLowerCase();
        return normalizedLevel === 'easy' ? 'success' :
               normalizedLevel === 'medium' ? 'warning' :
               normalizedLevel === 'hard' ? 'error' : 'default';
    };

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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
                        color={getDifficultyColor(question['Difficulty Level'])} 
                    />
                    <Chip 
                        label={question['Nature of Question'] || 'Unknown'} 
                        size="small" 
                        sx={{ fontSize: '0.625rem', height: 20 }}
                    />
                </Box>
            </CardContent>
            <CardActions 
                sx={{ 
                    position: 'absolute', 
                    bottom: 8, 
                    right: 8, 
                    display: 'flex', 
                    gap: 1, 
                    justifyContent: 'flex-end' 
                }}
            >
                {onEdit && (
                    <IconButton
                        size="small"
                        onClick={() => setEditModalOpen(true)}
                        title="Edit Question"
                    >
                        <EditIcon />
                    </IconButton>
                )}
                <IconButton
                    size="small"
                    onClick={() => setPreviewOpen(true)}
                    title="Preview Question"
                >
                    <PreviewIcon />
                </IconButton>
                {showCartButton && (
                    <IconButton
                        size="small"
                        onClick={handleCartToggle}
                        title={inCart ? 'Remove from Cart' : 'Add to Cart'}
                        color={inCart ? 'primary' : 'default'}
                        sx={{
                            transition: 'transform 0.2s',
                            '&:active': {
                                transform: 'scale(0.95)',
                            },
                            '&:hover': {
                                transform: 'scale(1.1)',
                            },
                        }}
                    >
                        <AddShoppingCartIcon />
                    </IconButton>
                )}
            </CardActions>

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
                                variant="outlined"
                                value={editedQuestion.Question}
                                onChange={(e) => handleEditChange('Question', e.target.value)}
                                sx={{
                                    marginBottom: 2,
                                    '& .MuiOutlinedInput-root': editChanges.Question 
                                        ? { 
                                            '& fieldset': { 
                                                borderColor: 'primary.main',
                                                borderWidth: 2 
                                            }
                                        } 
                                        : {}
                                }}
                                InputProps={{
                                    endAdornment: editChanges.Question ? (
                                        <InputAdornment position="end">
                                            <Chip 
                                                label="Changed" 
                                                color="primary" 
                                                size="small" 
                                            />
                                        </InputAdornment>
                                    ) : null
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Answer"
                                variant="outlined"
                                value={editedQuestion.Answer}
                                onChange={(e) => handleEditChange('Answer', e.target.value)}
                                sx={{
                                    marginBottom: 2,
                                    '& .MuiOutlinedInput-root': editChanges.Answer 
                                        ? { 
                                            '& fieldset': { 
                                                borderColor: 'primary.main',
                                                borderWidth: 2 
                                            }
                                        } 
                                        : {}
                                }}
                                InputProps={{
                                    endAdornment: editChanges.Answer ? (
                                        <InputAdornment position="end">
                                            <Chip 
                                                label="Changed" 
                                                color="primary" 
                                                size="small" 
                                            />
                                        </InputAdornment>
                                    ) : null
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Explanation"
                                variant="outlined"
                                value={editedQuestion['Explanation'] || ''}
                                onChange={(e) => handleEditChange('Explanation', e.target.value)}
                                sx={{
                                    marginBottom: 2,
                                    '& .MuiOutlinedInput-root': editChanges.Explanation 
                                        ? { 
                                            '& fieldset': { 
                                                borderColor: 'primary.main',
                                                borderWidth: 2 
                                            }
                                        } 
                                        : {}
                                }}
                                InputProps={{
                                    endAdornment: editChanges.Explanation ? (
                                        <InputAdornment position="end">
                                            <Chip 
                                                label="Changed" 
                                                color="primary" 
                                                size="small" 
                                            />
                                        </InputAdornment>
                                    ) : null
                                }}
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
                                    sx={editChanges['Difficulty Level'] 
                                        ? { 
                                            '& .MuiOutlinedInput-notchedOutline': { 
                                                borderColor: 'primary.main',
                                                borderWidth: 2 
                                            }
                                        } 
                                        : {}}
                                >
                                    {difficultyLevels.map((level) => (
                                        <MenuItem key={level} value={level}>
                                            {level}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {editChanges['Difficulty Level'] && (
                                    <Chip 
                                        label="Changed" 
                                        color="primary" 
                                        size="small" 
                                        sx={{ 
                                            position: 'absolute', 
                                            right: 10, 
                                            top: '50%', 
                                            transform: 'translateY(-50%)' 
                                        }} 
                                    />
                                )}
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
                            Answer: {formatQuestion(question.Answer)}
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
                        <Box component="span">
                            <Typography variant="body2" component="span" color="text.secondary">
                                <strong>Subject:</strong> {question.Subject}
                            </Typography>
                        </Box>
                        <Box component="span">
                            <Typography variant="body2" component="span" color="text.secondary">
                                <strong>Topic:</strong> {question.Topic}
                            </Typography>
                        </Box>
                        <Box component="span">
                            <Typography variant="body2" component="span" color="text.secondary">
                                <strong>Sub Topic:</strong> {question["Sub Topic"]}
                            </Typography>
                        </Box>
                        <Box component="span">
                            <Typography variant="body2" component="span" color="text.secondary">
                                <strong>Micro Topic:</strong> {question["Micro Topic"]}
                            </Typography>
                        </Box>
                        <Box component="span">
                            <Typography variant="body2" component="span" color="text.secondary">
                                <strong>Difficulty:</strong> {question['Difficulty Level']}
                            </Typography>
                        </Box>
                        <Box component="span">
                            <Typography variant="body2" component="span" color="text.secondary">
                                <strong>Type:</strong> {question['Nature of Question']}
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                    <Button onClick={handleAddToTest} variant="contained" startIcon={<AddShoppingCartIcon />}>
                        Add to Test
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
}
