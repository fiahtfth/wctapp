import { getQuestions } from '../queries';
import { AppError } from '@/lib/errorHandler';

// Mock Supabase client
jest.mock('../supabaseClient', () => {
  const mockSelect = jest.fn();
  const mockRange = jest.fn();
  const mockOrder = jest.fn();
  const mockIn = jest.fn();
  const mockEq = jest.fn();
  const mockOr = jest.fn();

  return {
    __esModule: true,
    default: {
      from: jest.fn(() => ({
        select: mockSelect.mockReturnThis(),
        range: mockRange.mockReturnThis(),
        order: mockOrder.mockReturnThis(),
        in: mockIn.mockReturnThis(),
        eq: mockEq.mockReturnThis(),
        or: mockOr.mockReturnThis()
      }))
    }
  };
});

// Import the mocked client
import supabase from '../supabaseClient';

describe('getQuestions Database Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch questions with default parameters', async () => {
    // Setup mock response
    const mockData = [
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

    // Mock the Supabase response
    (supabase.from as jest.Mock).mockImplementation(() => {
      const mockOrderFn = jest.fn().mockReturnValue({
        data: mockData,
        count: 1,
        error: null
      });
      
      const mockRangeFn = jest.fn().mockReturnValue({
        order: mockOrderFn
      });
      
      const mockSelectFn = jest.fn().mockReturnValue({
        range: mockRangeFn
      });
      
      return {
        select: mockSelectFn
      };
    });

    // Call the function
    const result = await getQuestions({});

    // Verify the result
    expect(result.questions.length).toBe(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(1);
    expect(result.error).toBeNull();

    // Verify the mapped question
    const question = result.questions[0];
    expect(question.id).toBe(1);
    expect(question.text).toBe('Test question?');
    expect(question.answer).toBe('Test answer');
    expect(question.explanation).toBe('Test explanation');
    expect(question.subject).toBe('Test Subject');
    expect(question.moduleName).toBe('Test Module');
    expect(question.topic).toBe('Test Topic');
    expect(question.subTopic).toBe('Test Sub Topic');
    expect(question.difficultyLevel).toBe('Easy');
    expect(question.questionType).toBe('MCQ');
    expect(question.natureOfQuestion).toBe('Conceptual');
  });

  it('should handle search queries', async () => {
    // Setup mock response
    const mockData = [
      {
        id: 1,
        Question: 'Test question with search term?',
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

    // Mock the Supabase response
    (supabase.from as jest.Mock).mockImplementation(() => {
      const mockOrderFn = jest.fn().mockReturnValue({
        data: mockData,
        count: 1,
        error: null
      });
      
      const mockRangeFn = jest.fn().mockReturnValue({
        order: mockOrderFn
      });
      
      const mockOrFn = jest.fn().mockReturnValue({
        range: mockRangeFn
      });
      
      const mockSelectFn = jest.fn().mockReturnValue({
        or: mockOrFn
      });
      
      return {
        select: mockSelectFn
      };
    });

    // Call the function with search parameter
    const result = await getQuestions({ search: 'search term' });

    // Verify the result
    expect(result.questions.length).toBe(1);
    expect(result.total).toBe(1);
    expect(supabase.from).toHaveBeenCalledWith('questions');
  });

  it('should handle errors', async () => {
    // Mock the Supabase response to throw an error
    (supabase.from as jest.Mock).mockImplementation(() => {
      const mockOrderFn = jest.fn().mockReturnValue({
        data: null,
        count: null,
        error: new Error('Database error')
      });
      
      const mockRangeFn = jest.fn().mockReturnValue({
        order: mockOrderFn
      });
      
      const mockSelectFn = jest.fn().mockReturnValue({
        range: mockRangeFn
      });
      
      return {
        select: mockSelectFn
      };
    });

    // Call the function and expect it to throw
    await expect(getQuestions({})).rejects.toThrow(AppError);
  });
});
