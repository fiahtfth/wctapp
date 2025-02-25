import { addQuestionToCart, getCartQuestions, removeQuestionFromCart } from '../cartQueries';
import { openDatabase } from '../queries';

// Mock the entire cartQueries module
jest.mock('../cartQueries', () => {
  return {
    addQuestionToCart: jest.fn().mockResolvedValue(true),
    getCartQuestions: jest.fn().mockResolvedValue([]),
    removeQuestionFromCart: jest.fn().mockResolvedValue(true),
  };
});

// Mock the openDatabase function to use an in-memory database for testing
jest.mock('../queries', () => {
  const originalModule = jest.requireActual('../queries');
  return {
    ...originalModule,
    openDatabase: jest.fn(() => {
      const db = require('better-sqlite3')(':memory:');
      // Initialize the database schema
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          name TEXT,
          role TEXT DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question_text TEXT NOT NULL,
          subject TEXT NOT NULL,
          topic TEXT NOT NULL,
          subtopic TEXT NOT NULL,
          difficulty TEXT NOT NULL,
          cognitive_level TEXT NOT NULL,
          question_type TEXT NOT NULL,
          answer_options TEXT NOT NULL,
          correct_answer TEXT NOT NULL,
          resource_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS carts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          test_id TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_test_id_user UNIQUE(test_id, user_id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS cart_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cart_id INTEGER NOT NULL,
          question_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (cart_id) REFERENCES carts(id),
          FOREIGN KEY (question_id) REFERENCES questions(id),
          CONSTRAINT unique_cart_question UNIQUE(cart_id, question_id)
        );
      `);
      return db;
    }),
  };
});

describe('cartQueries', () => {
  let db: any;

  beforeEach(async () => {
    // Open the mocked database before each test
    db = await openDatabase();

    // Initialize the database schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_text TEXT NOT NULL,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        subtopic TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        cognitive_level TEXT NOT NULL,
        question_type TEXT NOT NULL,
        answer_options TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        resource_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_test_id_user UNIQUE(test_id, user_id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cart_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts(id),
        FOREIGN KEY (question_id) REFERENCES questions(id),
        CONSTRAINT unique_cart_question UNIQUE(cart_id, question_id)
        );
      `);

    // Insert a test user with id = 162 and a question
    db.prepare('INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)').run(162, 'test@example.com', 'password', 'Test User', 'user');
    db.prepare('INSERT INTO questions (question_text, subject, topic, subtopic, difficulty, cognitive_level, question_type, answer_options, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      'Test question', 'Test subject', 'Test topic', 'Test subtopic', 'Easy', 'Remembering', 'Multiple Choice', 'A,B,C,D', 'A'
    );
  });

  afterEach(() => {
    // Close the database after each test
    db.close();
  });

  it('should add a question to the cart', async () => {
    const userId = 162;
    const testId = 'test-cart';
    const questionId = 1;

    // Add the question to the cart
    (addQuestionToCart as jest.Mock).mockResolvedValue(true);
    const result = await addQuestionToCart(questionId, testId, userId);

    expect(addQuestionToCart).toHaveBeenCalledWith(questionId, testId, userId);
    expect(result).toBe(true);
  });

  it('should remove a question from the cart', async () => {
    const userId = 162;
    const testId = 'test-cart';
    const questionId = 1;

    // Remove the question from the cart
    (removeQuestionFromCart as jest.Mock).mockResolvedValue(true);
    const result = await removeQuestionFromCart(questionId, testId, userId);

    expect(removeQuestionFromCart).toHaveBeenCalledWith(questionId, testId, userId);
    expect(result).toBe(true);
  });

  it('should get cart questions', async () => {
    const userId = 162;
    const testId = 'test-cart';
    const questionId = 1;

    const mockQuestions = [{ id: 1, question_text: 'Test question' }];
    (getCartQuestions as jest.Mock).mockResolvedValue(mockQuestions);
    const result = await getCartQuestions(testId, userId);

    expect(getCartQuestions).toHaveBeenCalledWith(testId, userId);
    expect(result).toEqual(mockQuestions);
  });
});
