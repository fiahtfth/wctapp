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
        console.log('Adding question to cart', question);
        set((state) => {
          // Prevent adding sample questions
          const safeQuestion = { ...question };
          
          if (
            (typeof safeQuestion.Question === 'string' && safeQuestion.Question.includes('Sample Question')) || 
            (typeof safeQuestion.Subject === 'string' && safeQuestion.Subject === 'Sample Subject')
          ) {
            console.warn('Attempted to add a sample question, skipping');
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
            console.log('Question already in cart, skipping');
            return state;
          }
          
          const newQuestions = [...state.questions, cartQuestion];
          console.log('Updated cart questions', newQuestions);
          return { questions: newQuestions };
        });
      },
      removeQuestion: (questionId) => {
        console.log('Removing question from cart', questionId);
        set((state) => {
          // Convert both IDs to strings for comparison
          const newQuestions = state.questions.filter((q) => 
            String(q.id) !== String(questionId)
          );
          console.log('Updated cart questions after removal', newQuestions);
          return { questions: newQuestions };
        });
      },
      clearCart: () => {
        console.log('Clearing entire cart');
        set({ questions: [] });
      },
      isInCart: (questionId) => {
        const inCart = get().questions.some((question) => 
          String(question.id) === String(questionId) || 
          (typeof question.text === 'string' && question.text === questionId) || 
          (typeof question.Question === 'string' && question.Question === questionId)
        );
        console.log('Checking if question is in cart', { questionId, inCart });
        return inCart;
      },
    }),
    {
      name: 'question-cart',
    }
  )
);
