/**
 * Represents a Question entity with comprehensive type definitions
 * Ensures type consistency across the entire application
 */
export interface Question {
  // Unique identifier, optional for new questions
  id?: number;

  // Core question content (required)
  Question: string;
  Answer: string;

  // Optional explanatory fields
  Explanation?: string | null;
  Objective?: string | null;

  // Taxonomical Classification (required)
  Subject: string;
  'Module Number': string;
  'Module Name': string;
  Topic: string;

  // Optional Hierarchical Details
  'Sub Topic'?: string | null;
  'Micro Topic'?: string | null;

  // Metadata and Classification
  'Faculty Approved': boolean;
  'Difficulty Level'?: 'Easy' | 'Medium' | 'Hard' | null;
  'Nature of Question'?: 'Conceptual' | 'Analytical' | 'Application' | 'Theoretical' | null;

  // Question Type (required)
  Question_Type: 'Objective' | 'Subjective' | 'Multiple Choice' | 'Short Answer' | 'Long Answer';

  // Allows for additional dynamic properties
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Type guard to validate Question objects
 * @param q - Unknown object to validate
 * @returns Boolean indicating if the object is a valid Question
 */
export function isQuestion(q: unknown): q is Question {
  if (q === null || typeof q !== 'object') return false;

  const question = q as Question;

  // Check required fields
  return (
    typeof question.Question === 'string' &&
    typeof question.Answer === 'string' &&
    typeof question.Subject === 'string' &&
    typeof question['Module Number'] === 'string' &&
    typeof question['Module Name'] === 'string' &&
    typeof question.Topic === 'string' &&
    typeof question['Faculty Approved'] === 'boolean' &&
    typeof question.Question_Type === 'string'
  );
}

/**
 * Creates a default Question object with minimal required fields
 * @returns A Question object with default values
 */
export function createDefaultQuestion(): Question {
  return {
    Question: '',
    Answer: '',
    Subject: '',
    'Module Number': '',
    'Module Name': '',
    Topic: '',
    'Faculty Approved': false,
    Question_Type: 'Objective',
  };
}

/**
 * Adds a question to the cart
 * @param questionId The ID of the question to add to the cart
 * @param testId The ID of the test to add the question to
 */
export async function addQuestionToCart(questionId: number, testId: string): Promise<boolean> {
  // Implementation will be provided by the actual cart service
}

/**
 * Removes a question from the cart
 * @param questionId The ID of the question to remove from the cart
 * @param testId The ID of the test from which to remove the question
 */
export async function removeQuestionFromCart(questionId: number, testId: string): Promise<boolean> {
  // Implementation will be provided by the actual cart service
}

/**
 * Retrieves all questions currently in the cart
 * @returns An array of questions in the cart
 */
export async function getCartQuestions(): Promise<Question[]> {
  // Implementation will be provided by the actual cart service
  return [];
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

// Export for use across the application
export default Question;
