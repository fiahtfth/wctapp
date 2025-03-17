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
}

// Type guard to check if a question has CartQuestion specific properties
function hasCartQuestionProperties(question: any): boolean {
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
          
          // Check for sample questions in both formats
          const isQuestionSample = 
            (typeof (safeQuestion as any).Question === 'string' && (safeQuestion as any).Question.includes('Sample Question')) || 
            (typeof (safeQuestion as any).Subject === 'string' && (safeQuestion as any).Subject === 'Sample Subject') ||
            (typeof safeQuestion.text === 'string' && safeQuestion.text.includes('Sample Question')) ||
            (typeof safeQuestion.subject === 'string' && safeQuestion.subject === 'Sample Subject');
          
          if (isQuestionSample) {
            return state;
          }

          // Ensure the question has a valid id
          const questionId = safeQuestion.id ?? crypto.randomUUID();
          
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

          // Check if question is already in cart by comparing string IDs
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
      getCartCount: () => {
        return get().questions.length;
      }
    }),
    {
      name: 'question-cart',
    }
  )
);
