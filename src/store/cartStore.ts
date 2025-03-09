import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Question } from '@/types/question';
import crypto from 'crypto';

interface CartQuestion extends Omit<Question, 'id'> {
  id: number | string;
  Question: string;
  Subject: string;
  Topic: string;
  FacultyApproved: boolean;
  QuestionType: 'Objective' | 'Subjective';
  quantity?: number;
}

interface CartStore {
  questions: CartQuestion[];
  addQuestion: (question: Question | CartQuestion) => void;
  removeQuestion: (questionId: string | number) => void;
  clearCart: () => void;
  isInCart: (questionId: string | number) => boolean;
}

// Type guard to check if a question is a CartQuestion
function isCartQuestion(question: any): question is CartQuestion {
  return question && 
    typeof question.Question === 'string' && 
    typeof question.Subject === 'string' && 
    typeof question.Topic === 'string';
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      questions: [],
      addQuestion: (question) => {
        set((state) => {
          // Prevent adding sample questions
          const safeQuestion = { ...question };
          
          if (
            (typeof safeQuestion.Question === 'string' && safeQuestion.Question.includes('Sample Question')) || 
            (typeof safeQuestion.Subject === 'string' && safeQuestion.Subject === 'Sample Subject')
          ) {
            return state;
          }

          // Ensure the question has a valid id
          const questionId = safeQuestion.id ?? crypto.randomUUID();
          
          // Normalize the question to CartQuestion type
          const cartQuestion: CartQuestion = isCartQuestion(safeQuestion) 
            ? {
                ...safeQuestion,
                id: questionId,
              } 
            : {
                id: questionId,
                Question: String(safeQuestion.text || ''),
                Subject: String(safeQuestion.subject || ''),
                Topic: String(safeQuestion.topic || ''),
                text: safeQuestion.text || '',
                subject: safeQuestion.subject || '',
                topic: safeQuestion.topic || '',
                answer: safeQuestion.answer || '',
                explanation: safeQuestion.explanation || '',
                moduleName: safeQuestion.moduleName || '',
                subTopic: safeQuestion.subTopic || '',
                difficultyLevel: safeQuestion.difficultyLevel || '',
                questionType: safeQuestion.questionType || '',
                natureOfQuestion: safeQuestion.natureOfQuestion || '',
                FacultyApproved: false,
                QuestionType: 'Objective'
              };

          // Check if question is already in cart
          const isAlreadyInCart = state.questions.some(q => String(q.id) === String(questionId));
          if (isAlreadyInCart) {
            return state;
          }
          
          return { questions: [...state.questions, cartQuestion] };
        });
      },
      removeQuestion: (questionId) => {
        set((state) => {
          // Convert both IDs to strings for comparison
          const newQuestions = state.questions.filter((q) => 
            String(q.id) !== String(questionId)
          );
          return { questions: newQuestions };
        });
      },
      clearCart: () => {
        set({ questions: [] });
      },
      isInCart: (questionId) => {
        return get().questions.some((question) => 
          String(question.id) === String(questionId) || 
          (typeof question.text === 'string' && question.text === questionId) || 
          (typeof question.Question === 'string' && question.Question === questionId)
        );
      },
    }),
    {
      name: 'question-cart',
      // Optional: Add storage configuration if needed
      // storage: createJSONStorage(() => localStorage),
    }
  )
);
