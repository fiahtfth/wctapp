import React from 'react';
import { render, screen } from '@testing-library/react';
import { QuestionCard } from '@/components/QuestionCard';
import type { Question } from '@/types/question';
import '@testing-library/jest-dom';

describe('QuestionCard', () => {
  const mockQuestion: Question = {
    id: 1,
    Question: 'Test question text',
    Answer: 'Test answer',
    Subject: 'Math',
    Topic: 'Linear Equations',
    FacultyApproved: false,
    QuestionType: 'Objective',
    Explanation: 'Test explanation',
    ModuleName: 'Algebra',
    DifficultyLevel: 'medium'
  };

  it('renders question text', () => {
    const mockOnQuestionUpdate = jest.fn();

    render(
      <QuestionCard 
        question={mockQuestion} 
        onQuestionUpdate={mockOnQuestionUpdate} 
      />
    );

    expect(screen.getByText('Test question text')).toBeInTheDocument();
  });
});
