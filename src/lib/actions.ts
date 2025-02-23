import { v4 as uuidv4 } from 'uuid';

// Client-side functions for managing test ID
export function generateTestId(): string {
  if (typeof window === 'undefined') return '';
  
  const testId = localStorage.getItem('testId');
  if (testId) {
    console.log('Using existing testId:', testId);
    return testId;
  }

  const newTestId = uuidv4();
  console.log('Generated new testId:', newTestId);
  localStorage.setItem('testId', newTestId);
  return newTestId;
}

export function getTestId(): string {
  if (typeof window === 'undefined') return '';
  return generateTestId();
}

// Re-export server actions
export { addQuestionToCart, exportTest, getCartItems } from './server-actions';
