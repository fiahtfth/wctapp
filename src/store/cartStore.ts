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

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      questions: [],
      addQuestion: (question) => {
        console.log('Adding question to cart', question);
        set((state) => {
          // Ensure the question has a valid id
          const questionId = question.id ?? crypto.randomUUID();
          const cartQuestion: CartQuestion = 'Question' in question ? {
            ...question,
            id: questionId,
            Question: question.Question,
            Subject: question.Subject,
            Topic: question.Topic,
            FacultyApproved: question.FacultyApproved,
            QuestionType: question.QuestionType,
          } : question as CartQuestion;

          // Check if question is already in cart
          const isAlreadyInCart = state.questions.some(q => q.id === questionId);
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
          question.id === questionId || 
          question.text === questionId || 
          question.Question === questionId
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
