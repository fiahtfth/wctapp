import { useCartStore } from '@/store/cartStore';
import { Question } from '@/types/question';

// Reset the store before each test
beforeEach(() => {
  const { clearCart } = useCartStore.getState();
  clearCart();
});

describe('Cart Store', () => {
  it('should initialize with an empty cart', () => {
    const { questions } = useCartStore.getState();
    expect(questions).toEqual([]);
  });

  it('should add a question to the cart', () => {
    const { addQuestion, questions } = useCartStore.getState();
    
    const testQuestion: Question = {
      id: 1,
      text: 'Test question',
      answer: 'Test answer',
      subject: 'Test subject',
      topic: 'Test topic',
      questionType: 'Objective',
      difficulty: 'Medium',
      module: 'Test module',
      sub_topic: 'Test subtopic',
      marks: 5,
      tags: ['test']
    };
    
    addQuestion(testQuestion);
    
    const updatedQuestions = useCartStore.getState().questions;
    expect(updatedQuestions.length).toBe(1);
    expect(updatedQuestions[0].id).toBe(1);
    expect(updatedQuestions[0].text).toBe('Test question');
    expect(updatedQuestions[0].Question).toBe('Test question');
  });

  it('should not add duplicate questions to the cart', () => {
    const { addQuestion, questions } = useCartStore.getState();
    
    const testQuestion: Question = {
      id: 1,
      text: 'Test question',
      answer: 'Test answer',
      subject: 'Test subject',
      topic: 'Test topic',
      questionType: 'Objective'
    };
    
    addQuestion(testQuestion);
    addQuestion(testQuestion); // Try to add the same question again
    
    const updatedQuestions = useCartStore.getState().questions;
    expect(updatedQuestions.length).toBe(1);
  });

  it('should remove a question from the cart', () => {
    const { addQuestion, removeQuestion } = useCartStore.getState();
    
    const testQuestion: Question = {
      id: 1,
      text: 'Test question',
      answer: 'Test answer',
      subject: 'Test subject',
      topic: 'Test topic',
      questionType: 'Objective'
    };
    
    addQuestion(testQuestion);
    
    let updatedQuestions = useCartStore.getState().questions;
    expect(updatedQuestions.length).toBe(1);
    
    removeQuestion(1);
    
    updatedQuestions = useCartStore.getState().questions;
    expect(updatedQuestions.length).toBe(0);
  });

  it('should clear the cart', () => {
    const { addQuestion, clearCart } = useCartStore.getState();
    
    const testQuestion1: Question = {
      id: 1,
      text: 'Test question 1',
      answer: 'Test answer 1',
      subject: 'Test subject',
      topic: 'Test topic',
      questionType: 'Objective'
    };
    
    const testQuestion2: Question = {
      id: 2,
      text: 'Test question 2',
      answer: 'Test answer 2',
      subject: 'Test subject',
      topic: 'Test topic',
      questionType: 'Objective'
    };
    
    addQuestion(testQuestion1);
    addQuestion(testQuestion2);
    
    let updatedQuestions = useCartStore.getState().questions;
    expect(updatedQuestions.length).toBe(2);
    
    clearCart();
    
    updatedQuestions = useCartStore.getState().questions;
    expect(updatedQuestions.length).toBe(0);
  });

  it('should check if a question is in the cart', () => {
    const { addQuestion, isInCart } = useCartStore.getState();
    
    const testQuestion: Question = {
      id: 1,
      text: 'Test question',
      answer: 'Test answer',
      subject: 'Test subject',
      topic: 'Test topic',
      questionType: 'Objective'
    };
    
    addQuestion(testQuestion);
    
    expect(isInCart(1)).toBe(true);
    expect(isInCart(2)).toBe(false);
  });

  it('should get the cart count', () => {
    const { addQuestion, getCartCount } = useCartStore.getState();
    
    expect(getCartCount()).toBe(0);
    
    const testQuestion1: Question = {
      id: 1,
      text: 'Test question 1',
      answer: 'Test answer 1',
      subject: 'Test subject',
      topic: 'Test topic',
      questionType: 'Objective'
    };
    
    const testQuestion2: Question = {
      id: 2,
      text: 'Test question 2',
      answer: 'Test answer 2',
      subject: 'Test subject',
      topic: 'Test topic',
      questionType: 'Objective'
    };
    
    addQuestion(testQuestion1);
    expect(getCartCount()).toBe(1);
    
    addQuestion(testQuestion2);
    expect(getCartCount()).toBe(2);
  });

  it('should not add sample questions to the cart', () => {
    const { addQuestion, getCartCount } = useCartStore.getState();
    
    const sampleQuestion1: Question = {
      id: 1,
      text: 'Sample Question 1',
      answer: 'Test answer',
      subject: 'Test subject',
      topic: 'Test topic',
      questionType: 'Objective'
    };
    
    const sampleQuestion2: Question = {
      id: 2,
      text: 'Test question',
      answer: 'Test answer',
      subject: 'Sample Subject',
      topic: 'Test topic',
      questionType: 'Objective'
    };
    
    addQuestion(sampleQuestion1);
    addQuestion(sampleQuestion2);
    
    expect(getCartCount()).toBe(0);
  });

  it('should handle string IDs correctly', () => {
    const { addQuestion, removeQuestion, isInCart } = useCartStore.getState();
    
    const testQuestion: Question = {
      id: '123' as unknown as number, // Simulate a string ID
      text: 'Test question',
      answer: 'Test answer',
      subject: 'Test subject',
      topic: 'Test topic',
      questionType: 'Objective'
    };
    
    addQuestion(testQuestion);
    
    expect(isInCart('123')).toBe(true);
    expect(isInCart(123)).toBe(true); // Should work with number too
    
    removeQuestion('123');
    
    expect(isInCart('123')).toBe(false);
  });
}); 