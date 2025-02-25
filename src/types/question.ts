/**
 * Represents a Question entity with comprehensive type definitions
 * Ensures type consistency across the entire application
 */
export interface Question {
  // Unique identifier
  id: number;
  // Core question content (required)
  Question: string;
  Answer: string;
  // Optional explanatory fields
  Explanation?: string | null;
  // Taxonomical Classification (required)
  Subject: string;
  // Optional Hierarchical Details
  ModuleNumber?: string;
  ModuleName?: string;
  Topic: string;
  SubTopic?: string | null;
  MicroTopic?: string | null;
  // Metadata and Classification
  FacultyApproved: boolean;
  DifficultyLevel?: 'easy' | 'medium' | 'hard' | null;
  NatureOfQuestion?: string | null;
  Objective?: string;
  // Question Type (required)
  QuestionType: 'Objective' | 'Subjective';
  // Allows for additional dynamic properties
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Type guard to validate Question objects
 * @param obj - Unknown object to validate
 * @returns Boolean indicating if the object is a valid Question
 */
export function isQuestion(obj: any): obj is Question {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.Question === 'string' &&
    typeof obj.Answer === 'string' &&
    typeof obj.Subject === 'string' &&
    typeof obj.Topic === 'string' &&
    typeof obj.FacultyApproved === 'boolean' &&
    ['Objective', 'Subjective'].includes(obj.QuestionType)
  );
}

/**
 * Creates a default Question object with minimal required fields
 * @returns A Question object with default values
 */
export function createDefaultQuestion(): Question {
  return {
    id: 0,
    Question: '',
    Answer: '',
    Subject: '',
    Topic: '',
    FacultyApproved: false,
    QuestionType: 'Objective',
  };
}

/**
 * Adds a question to the cart
 * @param question The question to add to the cart
 * @returns A promise with the added question's id
 */
export async function addQuestion(question: Question): Promise<{ id: number }> {
  // Validate question before submission
  if (!isQuestion(question)) {
    throw new Error('Invalid question format');
  }

  // Delegate to actual implementation
  const dbAddQuestion = (await import('@/lib/database/queries')).addQuestion;
  const result = await dbAddQuestion(question);
  
  // Ensure the ID is a number
  return { id: Number(result.id) };
}

/**
 * Adds a question to the cart
 * @param questionId The ID of the question to add to the cart
 * @param testId The ID of the test to add the question to
 * @returns A promise with the added question's id
 */
export async function addQuestionToCart(questionId: number, testId: string, userId: number): Promise<{ id: number }> {
  const { addQuestionToCart: dbAddToCart } = await import('@/lib/database/cartQueries');
  const success = await dbAddToCart(questionId, testId, userId);
  return { id: success ? Number(questionId) : 0 };
}

/**
 * Removes a question from the cart
 * @param questionId The ID of the question to remove from the cart
 * @param testId The ID of the test to remove the question from
 * @returns A promise that resolves when the question is removed
 */
export async function removeQuestionFromCart(questionId: number | string, testId: string, userId: number): Promise<boolean> {
  const { removeQuestionFromCart: dbRemoveFromCart } = await import('@/lib/database/cartQueries');
  return dbRemoveFromCart(questionId, testId, userId);
}

/**
 * Retrieves all questions currently in the cart for a specific test
 * @param {string} testId - The ID of the test to retrieve cart questions for
 * @returns An array of questions in the cart
 */
export async function getCartQuestions(testId: string, userId: number): Promise<Question[]> {
  const { getCartQuestions: dbGetCartQuestions } = await import('@/lib/database/cartQueries');
  return dbGetCartQuestions(testId, userId);
}

/**
 * Retrieves distinct values for a given field across questions
 * @param field The field to retrieve distinct values for
 * @returns An array of unique values for the specified field
 */
export async function getDistinctValues(field: keyof Question): Promise<string[]> {
  // Implementation will be provided by the actual query service
  return [];
}

export default Question;
