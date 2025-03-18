import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Divider,
} from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import { CartQuestion } from '@/types/question';
import * as XLSX from 'xlsx';

interface TestCartProps {
  open: boolean;
  onClose: () => void;
  questions: CartQuestion[];
  onRemoveQuestion: (id: number) => void;
}

export default function TestCart({ open, onClose, questions, onRemoveQuestion }: TestCartProps) {
  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      questions.map(q => ({
        Question: q.Question || '',
        Answer: q.Answer || '',
        Explanation: q.Explanation || q.explanation || '',
        Subject: q.Subject || '',
        Topic: q.Topic || '',
        'Difficulty Level': q.difficulty || '',
        'Nature of Question': q.QuestionType || '',
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
    // Generate Excel file
    XLSX.writeFile(workbook, 'test_questions.xlsx');
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 400 },
          maxWidth: '100%',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">Selected Questions ({questions.length})</Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
        {questions.length > 0 ? (
          <>
            <List sx={{ mb: 2 }}>
              {questions.map((question, index) => (
                <React.Fragment key={question.id}>
                  <ListItem>
                    <ListItemText
                      primary={question.Question}
                      secondary={`${question.Subject} | ${question.Topic}`}
                      secondaryTypographyProps={{
                        sx: {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        },
                      }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => question.id && onRemoveQuestion(question.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < questions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            <Button
              fullWidth
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportToExcel}
            >
              Export to Excel
            </Button>
          </>
        ) : (
          <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
            No questions selected
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}
