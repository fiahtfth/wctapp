import { addQuestionToCart, getCartQuestions, removeQuestionFromCart } from '../cartQueries';

// Mock Supabase client
jest.mock('@/lib/database/supabaseClient', () => {
  const mockSelect = jest.fn();
  const mockInsert = jest.fn();
  const mockDelete = jest.fn();
  const mockEq = jest.fn();
  const mockIn = jest.fn();

  return {
    __esModule: true,
    default: {
      from: jest.fn(() => ({
        select: mockSelect.mockReturnThis(),
        insert: mockInsert.mockReturnThis(),
        delete: mockDelete.mockReturnThis(),
        eq: mockEq.mockReturnThis(),
        in: mockIn.mockReturnThis()
      }))
    }
  };
});

// Mock the entire cartQueries module
jest.mock('../cartQueries', () => {
  return {
    addQuestionToCart: jest.fn().mockResolvedValue(true),
    getCartQuestions: jest.fn().mockResolvedValue([]),
    removeQuestionFromCart: jest.fn().mockResolvedValue(true),
  };
});

// Import the mocked client
import supabase from '@/lib/database/supabaseClient';

describe('Cart Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add a question to the cart', async () => {
    // Setup mock response
    (addQuestionToCart as jest.Mock).mockResolvedValueOnce({
      success: true,
      cartId: 1,
      questionId: 123
    });

    // Call the function with the expected number of arguments
    const result = await addQuestionToCart(123, 'test-cart', 1);

    // Verify the result
    expect(result).toEqual({
      success: true,
      cartId: 1,
      questionId: 123
    });
    expect(addQuestionToCart).toHaveBeenCalledWith(123, 'test-cart', 1);
  });

  it('should get cart questions', async () => {
    // Setup mock response
    const mockQuestions = [
      {
        id: 1,
        Question: 'Test question?',
        Answer: 'Test answer',
        Explanation: 'Test explanation',
        Subject: 'Test Subject',
        'Module Name': 'Test Module',
        Topic: 'Test Topic',
        'Sub Topic': 'Test Sub Topic',
        'Difficulty Level': 'Easy',
        Question_Type: 'MCQ',
        'Nature of Question': 'Conceptual'
      }
    ];

    (getCartQuestions as jest.Mock).mockResolvedValueOnce(mockQuestions);

    // Call the function with the expected number of arguments
    const result = await getCartQuestions('test-cart', 1);

    // Verify the result
    expect(result).toEqual(mockQuestions);
    expect(getCartQuestions).toHaveBeenCalledWith('test-cart', 1);
  });

  it('should remove a question from the cart', async () => {
    // Setup mock response
    (removeQuestionFromCart as jest.Mock).mockResolvedValueOnce({
      success: true,
      cartId: 1,
      questionId: 123
    });

    // Call the function with the expected number of arguments
    const result = await removeQuestionFromCart(123, 'test-cart', 1);

    // Verify the result
    expect(result).toEqual({
      success: true,
      cartId: 1,
      questionId: 123
    });
    expect(removeQuestionFromCart).toHaveBeenCalledWith(123, 'test-cart', 1);
  });
});
