import React from 'react';
import { render, screen } from '@testing-library/react';
import { QuestionCard } from '@/components/QuestionCard';
import type { Question } from '@/types/question';
import '@testing-library/jest-dom';

describe('QuestionCard', () => {
  const mockQuestion: Question = {
    id: 1,
    text: 'Test question text',
    answer: 'Test answer',
    subject: 'Math',
    topic: 'Linear Equations',
    questionType: 'Objective',
    explanation: 'Test explanation',
    moduleName: 'Algebra',
    difficultyLevel: 'medium',
    natureOfQuestion: 'Conceptual',
    subTopic: 'Subtopic',
  };

  it('renders question text', () => {
    const mockOnQuestionUpdate = jest.fn();
    const mockOnAddToTest = jest.fn().mockResolvedValue(undefined);

    render(
      <QuestionCard 
        question={mockQuestion} 
        onQuestionUpdate={mockOnQuestionUpdate} 
        onAddToTest={mockOnAddToTest} 
      />
    );

    expect(screen.getByText('Test question text')).toBeInTheDocument();
  });
});
