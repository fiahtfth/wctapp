import { getQuestions } from '@/lib/database/queries';
import { AppError } from '@/lib/errorHandler';

// Mock Supabase client
jest.mock('@/lib/database/supabaseClient', () => {
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
import supabase from '@/lib/database/supabaseClient';

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

  it('should handle pagination', async () => {
    // Setup mock response
    const mockData = Array(5).fill(null).map((_, i) => ({
      id: i + 1,
      Question: `Test question ${i + 1}?`,
      Answer: `Test answer ${i + 1}`,
      Explanation: `Test explanation ${i + 1}`,
      Subject: 'Test Subject',
      'Module Name': 'Test Module',
      Topic: 'Test Topic',
      'Sub Topic': 'Test Sub Topic',
      'Difficulty Level': 'Easy',
      Question_Type: 'MCQ',
      'Nature of Question': 'Conceptual'
    }));

    // Mock the Supabase response
    (supabase.from as jest.Mock).mockImplementation(() => {
      const mockOrderFn = jest.fn().mockReturnValue({
        data: mockData,
        count: 15, // Total of 15 questions
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

    // Call the function with pagination parameters
    const result = await getQuestions({ page: 2, pageSize: 5 });

    // Verify the result
    expect(result.questions.length).toBe(5);
    expect(result.total).toBe(15);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(5);
    expect(result.totalPages).toBe(3);
  });

  it('should return empty results for non-matching filters', async () => {
    // Mock the Supabase response for empty results
    (supabase.from as jest.Mock).mockImplementation(() => {
      const mockOrderFn = jest.fn().mockReturnValue({
        data: [],
        count: 0,
        error: null
      });
      
      const mockRangeFn = jest.fn().mockReturnValue({
        order: mockOrderFn
      });
      
      const mockInFn = jest.fn().mockReturnValue({
        range: mockRangeFn
      });
      
      const mockSelectFn = jest.fn().mockReturnValue({
        in: mockInFn
      });
      
      return {
        select: mockSelectFn
      };
    });

    // Call the function with filters that won't match any questions
    const result = await getQuestions({ subject: ['NonExistentSubject'] });

    // Verify the result
    expect(result.questions.length).toBe(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('should handle difficulty filter', async () => {
    // Setup mock response
    const mockData = [
      {
        id: 1,
        Question: 'Difficult question?',
        Answer: 'Test answer',
        Explanation: 'Test explanation',
        Subject: 'Test Subject',
        'Module Name': 'Test Module',
        Topic: 'Test Topic',
        'Sub Topic': 'Test Sub Topic',
        'Difficulty Level': 'Hard',
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
      
      const mockEqFn = jest.fn().mockReturnValue({
        range: mockRangeFn
      });
      
      const mockSelectFn = jest.fn().mockReturnValue({
        eq: mockEqFn
      });
      
      return {
        select: mockSelectFn
      };
    });

    // Call the function with difficulty filter
    const result = await getQuestions({ difficulty: 'Hard' });

    // Verify the result
    expect(result.questions.length).toBe(1);
    expect(result.total).toBe(1);
    expect(result.questions[0].difficultyLevel).toBe('Hard');
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
