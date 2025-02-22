import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { getQuestions, Question } from '@/lib/database/queries';
import { createQuestionsTable } from '@/lib/database/init';
import { AppError } from '@/lib/errorHandler';

// Mock configuration and error handler
jest.mock('@/config', () => ({
  APP_CONFIG: {
    DATABASE: {
      PATH: 'test-questions.db'
    },
    LOGGING: {
      ENABLE_CONSOLE: false
    }
  }
}));

describe('getQuestions Database Queries', () => {
  let testDb: Database.Database;
  const TEST_DB_PATH = path.resolve(__dirname, '..', '..', '..', 'test-questions.db');

  beforeAll(() => {
    // Ensure test database directory exists
    const dbDirectory = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dbDirectory)) {
      fs.mkdirSync(dbDirectory, { recursive: true });
    }

    // Remove existing test database if it exists
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Create and setup test database
    testDb = new Database(TEST_DB_PATH);
    createQuestionsTable(testDb);
  });

  afterAll(() => {
    // Close database and remove test database file
    testDb.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  beforeEach(() => {
    // Clear and populate test data before each test
    testDb.prepare('DELETE FROM questions').run();
    
    const insertQuestion = testDb.prepare(`
      INSERT INTO questions 
      (Question, Answer, Subject, "Module Name", Topic, "Difficulty Level", Question_Type) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = testDb.transaction((questions) => {
      for (const q of questions) {
        insertQuestion.run(
          q.Question, 
          q.Answer, 
          q.Subject, 
          q['Module Name'], 
          q.Topic, 
          q['Difficulty Level'], 
          q['Question_Type']
        );
      }
    });

    insertMany([
      {
        Question: 'What is the capital of France?',
        Answer: 'Paris',
        Subject: 'Geography',
        'Module Name': 'European Capitals',
        Topic: 'France',
        'Difficulty Level': 'Easy',
        'Question_Type': 'Objective'
      },
      {
        Question: 'What is the derivative of x^2?',
        Answer: '2x',
        Subject: 'Mathematics',
        'Module Name': 'Calculus',
        Topic: 'Differentiation',
        'Difficulty Level': 'Medium',
        'Question_Type': 'Objective'
      },
      {
        Question: 'What is photosynthesis?',
        Answer: 'Process by which plants make food using sunlight',
        Subject: 'Science',
        'Module Name': 'Biology',
        Topic: 'Plant Biology',
        'Difficulty Level': 'Hard',
        'Question_Type': 'Subjective'
      }
    ]);
  });

  test('should retrieve questions with default pagination', async () => {
    const result = await getQuestions({ 
      page: 1, 
      pageSize: 10 
    });

    expect(result).toHaveProperty('questions');
    expect(result).toHaveProperty('total');
    expect(result.questions.length).toBe(3);
    expect(result.total).toBe(3);
  });

  test('should filter questions by subject', async () => {
    const result = await getQuestions({ 
      page: 1, 
      pageSize: 10,
      subject: 'Geography' 
    });

    expect(result.questions.length).toBe(1);
    expect(result.questions[0].Question).toBe('What is the capital of France?');
  });

  test('should filter questions by difficulty level', async () => {
    const result = await getQuestions({ 
      page: 1, 
      pageSize: 10,
      'Difficulty Level': 'Medium' 
    });

    console.log('Difficulty Level Filter Result:', JSON.stringify(result, null, 2));
    console.log('Difficulty Level Questions:', result.questions.map(q => ({
      question: q.Question,
      difficulty: q['Difficulty Level']
    })));

    expect(result.questions.length).toBe(1);
    expect(result.questions[0].Question).toBe('What is the derivative of x^2?');
  });

  test('should filter questions by question type', async () => {
    const result = await getQuestions({ 
      page: 1, 
      pageSize: 10,
      question_type: 'Subjective' 
    });

    expect(result.questions.length).toBe(1);
    expect(result.questions[0].Question).toBe('What is photosynthesis?');
  });

  test('should handle pagination correctly', async () => {
    const result1 = await getQuestions({ 
      page: 1, 
      pageSize: 2 
    });

    expect(result1.questions.length).toBe(2);
    expect(result1.total).toBe(3);
    expect(result1.page).toBe(1);
    expect(result1.totalPages).toBe(2);

    const result2 = await getQuestions({ 
      page: 2, 
      pageSize: 2 
    });

    expect(result2.questions.length).toBe(1);
    expect(result2.page).toBe(2);
  });

  test('should handle search query', async () => {
    const result = await getQuestions({ 
      page: 1, 
      pageSize: 10,
      search: 'photosynthesis' 
    });

    expect(result.questions.length).toBe(1);
    expect(result.questions[0].Question).toBe('What is photosynthesis?');
  });

  test('should return empty result for non-matching filters', async () => {
    const result = await getQuestions({ 
      page: 1, 
      pageSize: 10,
      subject: 'History' 
    });

    expect(result.questions.length).toBe(0);
    expect(result.total).toBe(0);
  });

  test('should handle invalid pagination', async () => {
    const result = await getQuestions({ 
      page: 100, 
      pageSize: 10 
    });

    expect(result.questions.length).toBe(0);
    expect(result.total).toBe(3);
  });
});
