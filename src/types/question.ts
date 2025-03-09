/**
 * Represents a Question entity with comprehensive type definitions
 * Ensures type consistency across the entire application
 */
export interface Question {
  // Unique identifier
  id: number;
  // Core question content (required)
  text: string;
  answer: string;
  subject: string;
  topic: string;
  questionType: 'Objective' | 'Subjective';
  // Optional explanatory fields
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  module?: string;
  sub_topic?: string;
  marks?: number;
  tags?: string[];
}

/**
 * Represents a Question in the Cart with more flexible typing
 */
export interface CartQuestion {
  id: number;
  cartItemId?: number;  // Added for cart-specific functionality
  Question: string;
  Subject: string;
  Topic: string;
  QuestionType: 'Objective' | 'Subjective';
  FacultyApproved: boolean;
  quantity?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  module?: string;
  sub_topic?: string;
  marks?: number;
  tags?: string[];
}

/**
 * Type guard to validate Question objects
 * @param obj - Unknown object to validate
 * @returns Boolean indicating if the object is a valid Question
 */
export function isQuestion(obj: any): obj is Question {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.text === 'string' &&
    typeof obj.answer === 'string' &&
    typeof obj.subject === 'string' &&
    typeof obj.topic === 'string' &&
    ['Objective', 'Subjective'].includes(obj.questionType)
  );
}

/**
 * Type guard to validate CartQuestion objects
 * @param obj - Unknown object to validate
 * @returns Boolean indicating if the object is a valid CartQuestion
 */
export function isCartQuestion(obj: any): obj is CartQuestion {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.Question === 'string' &&
    typeof obj.Subject === 'string' &&
    typeof obj.Topic === 'string' &&
    ['Objective', 'Subjective'].includes(obj.QuestionType) &&
    typeof obj.FacultyApproved === 'boolean'
  );
}

/**
 * Utility function to convert Question to CartQuestion
 * @param question The question to convert
 * @returns A CartQuestion object
 */
export function convertToCartQuestion(question: Question): CartQuestion {
  return {
    id: question.id ?? 0,
    Question: question.text ?? '',
    Subject: question.subject ?? '',
    Topic: question.topic ?? '',
    QuestionType: question.questionType ?? 'Objective',
    FacultyApproved: false,
    quantity: 1,
    difficulty: question.difficulty,
    module: question.module,
    sub_topic: question.sub_topic,
    marks: question.marks,
    tags: question.tags
  };
}

/**
 * Utility function to convert CartQuestion to Question
 * @param cartQuestion The cart question to convert
 * @returns A Question object
 */
export function convertToQuestion(cartQuestion: CartQuestion): Question {
  return {
    id: cartQuestion.id ?? 0,
    text: cartQuestion.Question ?? '',
    answer: '',  // Note: This is not available in CartQuestion
    subject: cartQuestion.Subject ?? '',
    topic: cartQuestion.Topic ?? '',
    questionType: cartQuestion.QuestionType ?? 'Objective',
    difficulty: cartQuestion.difficulty,
    module: cartQuestion.module,
    sub_topic: cartQuestion.sub_topic,
    marks: cartQuestion.marks,
    tags: cartQuestion.tags
  };
}

/**
 * Utility function to convert Partial Question to CartQuestion
 * @param question The question to convert
 * @returns A CartQuestion object
 */
export function toCartQuestion(question: Partial<Question>): CartQuestion {
  return {
    id: question.id ?? 0,
    Question: question.text ?? '',
    Subject: question.subject ?? '',
    Topic: question.topic ?? '',
    QuestionType: question.questionType ?? 'Objective',
    FacultyApproved: false,
    quantity: 1,
    difficulty: question.difficulty,
    module: question.module,
    sub_topic: question.sub_topic,
    marks: question.marks,
    tags: question.tags
  };
}

/**
 * Adds a question to the cart
 * @param questionId The ID of the question to add to the cart
 * @param testId The ID of the test to add the question to
 * @param userId The ID of the user
 * @returns A promise with the added question's id
 */
export async function addQuestionToCart(
  questionId: number, 
  testId: string, 
  userId: number
): Promise<{ id: number }> {
  // Placeholder implementation
  return { id: Number(questionId) };
}

/**
 * Retrieves all questions currently in the cart for a specific test
 * @param testId The ID of the test to retrieve cart questions for
 * @param userId The ID of the user
 * @returns An array of questions in the cart
 */
export async function getCartQuestions(
  testId: string, 
  userId: number
): Promise<CartQuestion[]> {
  // Placeholder implementation
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

/**
 * Placeholder for database function
 * @param testId The ID of the test
 * @param userId The ID of the user
 * @returns An array of cart questions
 */
function dbGetCartQuestions(
  testId: string, 
  userId: number
): CartQuestion[] {
  // This is a mock implementation
  return [];
}

export default Question;
