import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Question } from '@/types/question';
import crypto from 'crypto';

interface CartQuestion {
  id: number | string;
  Question: string;
  Subject: string;
  Topic: string;
  FacultyApproved: boolean;
  QuestionType: 'Objective' | 'Subjective';
  quantity?: number;
  // Standard Question fields
  text: string;
  answer: string;
  subject: string;
  topic: string;
  questionType: 'Objective' | 'Subjective';
  // Optional fields
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  module?: string;
  sub_topic?: string;
  marks?: number;
  tags?: string[];
  // Additional fields that might be present
  explanation?: string;
  moduleName?: string;
  subTopic?: string;
  difficultyLevel?: string;
  natureOfQuestion?: string;
}

interface CartStore {
  questions: CartQuestion[];
  addQuestion: (question: Question | Partial<CartQuestion>) => void;
  removeQuestion: (questionId: string | number) => void;
  clearCart: () => void;
  isInCart: (questionId: string | number) => boolean;
  getCartCount: () => number;
  initializeCart: () => void;
}

// Type guard to check if a question has CartQuestion specific properties
function hasCartQuestionProperties(question: any): boolean {
  return question && 
    typeof question.Question === 'string' && 
    typeof question.Subject === 'string' && 
    typeof question.Topic === 'string';
}

// Function to check if a question is a sample question
function isSampleQuestion(question: any): boolean {
  return (
    (typeof question.Question === 'string' && question.Question.includes('Sample Question')) || 
    (typeof question.Subject === 'string' && question.Subject === 'Sample Subject') ||
    (typeof question.text === 'string' && question.text.includes('Sample Question')) ||
    (typeof question.subject === 'string' && question.subject === 'Sample Subject') ||
    (typeof question.id === 'string' && question.id.includes('sample')) ||
    (typeof question.id === 'number' && question.id < 0)
  );
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      questions: [],
      addQuestion: (question) => {
        console.log('Adding question to cart:', question);
        set((state) => {
          // Prevent adding sample questions
          const safeQuestion = { ...question };
          
          // Check if this is a sample question
          if (isSampleQuestion(safeQuestion)) {
            console.log('Prevented adding sample question to cart:', safeQuestion);
            return state;
          }

          // Ensure the question has a valid id
          const questionId = safeQuestion.id ?? crypto.randomUUID();
          console.log('Using question ID:', questionId);
          
          // Normalize the question to CartQuestion type
          const cartQuestion: CartQuestion = hasCartQuestionProperties(safeQuestion) 
            ? {
                ...safeQuestion as CartQuestion,
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
                questionType: safeQuestion.questionType || 'Objective',
                FacultyApproved: false,
                QuestionType: 'Objective',
                // Optional fields with safe access
                difficulty: safeQuestion.difficulty,
                module: safeQuestion.module,
                sub_topic: safeQuestion.sub_topic,
                marks: safeQuestion.marks,
                tags: safeQuestion.tags,
                // Additional fields that might be present in the source object
                explanation: (safeQuestion as any).explanation,
                moduleName: (safeQuestion as any).moduleName,
                subTopic: (safeQuestion as any).subTopic,
                difficultyLevel: (safeQuestion as any).difficultyLevel,
                natureOfQuestion: (safeQuestion as any).natureOfQuestion
              };

          console.log('Normalized cart question:', cartQuestion);

          // Check if question is already in cart by comparing string IDs
          const isAlreadyInCart = state.questions.some(q => String(q.id) === String(questionId));
          if (isAlreadyInCart) {
            console.log('Question already in cart:', questionId);
            return state;
          }
          
          console.log('Adding new question to cart. Current count:', state.questions.length);
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
        // Also clear local storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('question-cart');
          localStorage.removeItem('localCart');
        }
      },
      isInCart: (questionId) => {
        return get().questions.some((question) => 
          String(question.id) === String(questionId) || 
          (typeof question.text === 'string' && question.text === questionId) || 
          (typeof question.Question === 'string' && question.Question === questionId)
        );
      },
      getCartCount: () => {
        return get().questions.length;
      },
      initializeCart: () => {
        // Clear any sample questions from the cart
        set((state) => ({
          questions: state.questions.filter(q => !isSampleQuestion(q))
        }));
      }
    }),
    {
      name: 'question-cart',
      // Only persist non-sample questions
      partialize: (state) => {
        console.log('Persisting cart state:', state);
        return {
          ...state,
          questions: state.questions.filter(q => !isSampleQuestion(q))
        };
      }
    }
  )
);

// Initialize the cart when the module loads
if (typeof window !== 'undefined') {
  console.log('Initializing cart store...');
  useCartStore.getState().initializeCart();
  console.log('Cart initialized with questions:', useCartStore.getState().questions);
}
