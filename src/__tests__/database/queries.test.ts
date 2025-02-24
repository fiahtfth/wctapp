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
  const TEST_DB_PATH = path.resolve(process.cwd(), 'wctapp.db');

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

  beforeEach(async () => {
    await testDb.exec(`DELETE FROM questions`);
    await testDb.exec(`
      INSERT INTO questions 
        (Question, Answer, Subject, "Difficulty Level", "Module Name", Topic, "Sub Topic", Question_Type, Explanation)
      VALUES 
        ('What is the derivative of x^2?', '2x', 'Mathematics', 'Medium', 'Calculus', 'Differentiation', NULL, 'Objective', NULL),
        ('What is the capital of France?', 'Paris', 'Geography', 'Easy', 'World Capitals', 'European Capitals', NULL, 'Objective', NULL),
        ('Explain quantum entanglement', 'Spooky action', 'Physics', 'Difficult', 'Quantum Mechanics', 'Entanglement', NULL, 'Essay', NULL);
    `);
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
    // First verify the test data
    const allQuestions = await testDb.prepare('SELECT "Difficulty Level", Question FROM questions').all();
    console.log('🔍 All questions and their difficulty levels:', allQuestions);

    // Try direct SQL query
    const directQuery = await testDb.prepare(`
      SELECT * FROM questions 
      WHERE "Difficulty Level" = ?
      ORDER BY id ASC LIMIT ? OFFSET ?
    `).all('Difficult', '1', '0');
    console.log('🔍 Direct query results:', directQuery);

    // Now run the actual test
    const result = await getQuestions({ 
      page: 1, 
      pageSize: 1,
      difficulty: 'Difficult'
    });
    console.log('🎯 Filter results:', result);
    
    expect(result.questions.length).toBe(1); // Should get one question due to pagination
    expect(result.totalQuestions).toBe(1); // Should have one difficult question in total
  });

  test('should filter questions by question type', async () => {
    const result = await getQuestions({ 
      page: 1, 
      pageSize: 10,
      question_type: 'Essay' 
    });

    expect(result.questions.length).toBe(1);
    expect(result.questions[0].Question).toBe('Explain quantum entanglement');
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
      search: 'entanglement' 
    });

    expect(result.questions.length).toBe(1);
    expect(result.questions[0].Question).toBe('Explain quantum entanglement');
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
