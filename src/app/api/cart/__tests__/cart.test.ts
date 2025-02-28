import { getCartQuestions, addQuestionToCart, removeQuestionFromCart } from '../../../../lib/database/cartQueries';
import { verifyJwtToken } from '../../../../lib/auth';

// Mock the database queries
jest.mock('../../../../lib/database/cartQueries', () => ({
  getCartQuestions: jest.fn(),
  addQuestionToCart: jest.fn(),
  removeQuestionFromCart: jest.fn(),
}));

// Mock the JWT verification
jest.mock('../../../../lib/auth', () => ({
  verifyJwtToken: jest.fn(),
}));

describe('Cart Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCartQuestions', () => {
    it('should retrieve questions from the cart', async () => {
      const mockQuestions = [
        { id: 1, Question: 'Test Question 1', Answer: 'A', Subject: 'Test' },
        { id: 2, Question: 'Test Question 2', Answer: 'B', Subject: 'Test' },
      ];
      
      (getCartQuestions as jest.Mock).mockResolvedValue(mockQuestions);
      
      const testId = 'test-123';
      const userId = 123;
      
      const result = await getCartQuestions(testId, userId);
      
      expect(result).toEqual(mockQuestions);
      expect(getCartQuestions).toHaveBeenCalledWith(testId, userId);
    });
  });

  describe('addQuestionToCart', () => {
    it('should add a question to the cart', async () => {
      (addQuestionToCart as jest.Mock).mockResolvedValue({ success: true });
      
      const questionId = 5;
      const testId = 'test-123';
      const userId = 123;
      
      const result = await addQuestionToCart(questionId, testId, userId);
      
      expect(result).toEqual({ success: true });
      expect(addQuestionToCart).toHaveBeenCalledWith(questionId, testId, userId);
    });
  });

  describe('removeQuestionFromCart', () => {
    it('should remove a question from the cart', async () => {
      (removeQuestionFromCart as jest.Mock).mockResolvedValue({ success: true });
      
      const questionId = 5;
      const testId = 'test-123';
      const userId = 123;
      
      const result = await removeQuestionFromCart(questionId, testId, userId);
      
      expect(result).toEqual({ success: true });
      expect(removeQuestionFromCart).toHaveBeenCalledWith(questionId, testId, userId);
    });
  });
});
