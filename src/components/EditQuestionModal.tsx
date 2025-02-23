import React, { useState, useEffect } from 'react';
import { 
    Modal, 
    Box, 
    Button, 
    TextField, 
    Typography, 
    MenuItem, 
    Grid,
    Paper,
    Divider
} from '@mui/material';
import { Question } from '@/types/question';

interface EditQuestionModalProps {
    open: boolean;
    question: Question | null;
    onClose: () => void;
    onSave: (updatedQuestion: Question) => Promise<void>;
}

interface ModuleTopics {
    module: string;
    topics: string[];
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({ open, question, onClose, onSave }) => {
    const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [moduleTopics, setModuleTopics] = useState<ModuleTopics[]>([]);
    const [selectedModule, setSelectedModule] = useState<string>('');
    const [topics, setTopics] = useState<string[]>([]);
    const [subtopics, setSubtopics] = useState<string[]>([]);
    const [microtopics, setMicrotopics] = useState<string[]>([]);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await fetch('/api/subjects');
                if (!response.ok) {
                    throw new Error(`Failed to fetch subjects: ${response.statusText}`);
                }
                const data = await response.json();
                setSubjects(data);
            } catch (error) {
                console.error('Error fetching subjects:', error);
                setSubjects([
                    'Economics',
                    'History',
                    'Geography',
                    'Polity and Governance',
                    'Science and Technology',
                    'Ecology and Environment'
                ]);
            }
        };

        const fetchModuleTopics = async (subject: string) => {
            try {
                const response = await fetch(`/api/topics?subject=${subject}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch topics: ${response.statusText}`);
                }
                const data = await response.json();
                setModuleTopics(data);
                
                // If there's a selected module, fetch its topics
                if (selectedModule) {
                    const moduleData = data.find((m: ModuleTopics) => m.module === selectedModule);
                    if (moduleData) {
                        setTopics(moduleData.topics);
                    }
                }
            } catch (error) {
                console.error('Error fetching module topics:', error);
                setModuleTopics([]);
                setTopics([]);
            }
        };

        fetchSubjects();

        if (question) {
            setEditedQuestion({ ...question });
            if (question.Subject) {
                fetchModuleTopics(question.Subject);
            }
        }
    }, [question, selectedModule]);

    const handleModuleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const moduleName = e.target.value;
        setSelectedModule(moduleName);
        
        if (editedQuestion?.Subject && moduleName) {
            try {
                const response = await fetch(`/api/topics?subject=${editedQuestion.Subject}&module=${moduleName}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch topics: ${response.statusText}`);
                }
                const data = await response.json();
                setTopics(data);
            } catch (error) {
                console.error('Error fetching topics:', error);
                setTopics([]);
            }
        }
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (editedQuestion) {
            const { name, value } = e.target;
            
            // Update the edited question with the new value
            setEditedQuestion(prev => {
                if (!prev) return prev;
                const updated = { ...prev, [name]: value };
                
                // Clear dependent fields when parent field changes
                if (name === 'Subject') {
                    updated.Topic = '';
                    updated.Subtopic = '';
                    updated.Microtopic = '';
                    setTopics([]);
                } else if (name === 'Topic') {
                    updated.Subtopic = '';
                    updated.Microtopic = '';
                }
                
                return updated;
            });

            try {
                // Only fetch data for Subject and Topic changes
                if (name === 'Subject') {
                    const response = await fetch(`/api/topics?subject=${value}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch topics: ${response.statusText}`);
                    }
                    const data = await response.json();
                    setTopics(data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                // You might want to show an error message to the user here
            }
        }
    };

    const handleSubmit = async () => {
        if (editedQuestion) {
            await onSave(editedQuestion);
            onClose();
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                maxWidth: 1000,
                maxHeight: '90vh',
                bgcolor: 'background.paper',
                boxShadow: 24,
                borderRadius: 1,
                overflow: 'hidden',
            }}>
                <Box sx={{
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.default'
                }}>
                    <Typography variant="h6" component="h2">Edit Question</Typography>
                </Box>
                
                <Box sx={{
                    p: 2,
                    maxHeight: 'calc(90vh - 120px)',
                    overflow: 'auto'
                }}>
                {editedQuestion && (
                    <>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Question"
                                    name="Question"
                                    value={editedQuestion.Question}
                                    onChange={handleChange}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Answer"
                                    name="Answer"
                                    value={editedQuestion.Answer}
                                    onChange={handleChange}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Difficulty Level"
                                    name="Difficulty Level"
                                    value={editedQuestion['Difficulty Level']}
                                    onChange={handleChange}
                                    size="small"
                                >
                                    <MenuItem value="Easy">Easy</MenuItem>
                                    <MenuItem value="Medium">Medium</MenuItem>
                                    <MenuItem value="Hard">Hard</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                                    Classification
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Subject"
                                    name="Subject"
                                    value={editedQuestion.Subject}
                                    onChange={handleChange}
                                    size="small"
                                >
                                    {subjects.map((subject) => (
                                        <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Module"
                                    name="Module"
                                    value={selectedModule}
                                    onChange={handleModuleChange}
                                    size="small"
                                >
                                    {moduleTopics.map((mt) => (
                                        <MenuItem key={mt.module} value={mt.module}>{mt.module}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Topic"
                                    name="Topic"
                                    value={editedQuestion.Topic}
                                    onChange={handleChange}
                                    disabled={!selectedModule}
                                    size="small"
                                >
                                    {topics.map((topic) => (
                                        <MenuItem key={topic} value={topic}>{topic}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Subtopic"
                                    name="Subtopic"
                                    value={editedQuestion.Subtopic}
                                    onChange={handleChange}
                                    size="small"
                                    placeholder="Enter subtopic"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Microtopic"
                                    name="Microtopic"
                                    value={editedQuestion.Microtopic}
                                    onChange={handleChange}
                                    size="small"
                                    placeholder="Enter microtopic"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nature of Question"
                                    name="Nature of Question"
                                    value={editedQuestion['Nature of Question']}
                                    onChange={handleChange}
                                    size="small"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                                    Explanation
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Detailed Explanation"
                                    name="Explanation"
                                    value={editedQuestion.Explanation}
                                    onChange={handleChange}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={handleSubmit}
                                size="small"
                            >
                                Save Changes
                            </Button>
                        </Box>
                    </>
                )}
                </Box>
            </Box>
        </Modal>
    );
};

export default EditQuestionModal;
