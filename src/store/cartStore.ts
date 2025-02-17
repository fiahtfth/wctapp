import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Question } from '@/lib/database/queries';

interface CartQuestion extends Partial<Question> {
  id: string | number;
  text?: string;
  Question?: string;
}

interface CartStore {
  questions: CartQuestion[];
  addQuestion: (question: CartQuestion) => void;
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
          // Check if question is already in cart
          const isAlreadyInCart = state.questions.some(q => 
            q.id === question.id || 
            q.text === question.text || 
            q.Question === question.Question
          );

          if (isAlreadyInCart) {
            console.log('Question already in cart, skipping');
            return state;
          }

          const newQuestions = [...state.questions, question];
          console.log('Updated cart questions', newQuestions);
          return { questions: newQuestions };
        });
      },
      removeQuestion: (questionId) => {
        console.log('Removing question from cart', questionId);
        set((state) => {
          const newQuestions = state.questions.filter((q) => 
            q.id !== questionId && 
            q.text !== questionId && 
            q.Question !== questionId
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
      skipHydration: true,
    }
  )
);
