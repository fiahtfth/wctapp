'use server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Question as ImportedQuestion, isQuestion } from '@/types/question';
import { initializeDatabase } from './init';
import { APP_CONFIG } from '@/config';
import { AppError, asyncErrorHandler } from '@/lib/errorHandler';

// Use configuration for database path
const DB_PATH = process.env.NODE_ENV === 'test' 
  ? path.join(process.cwd(), 'wctapp.db')
  : APP_CONFIG.DATABASE.PATH;

console.log('📂 Database Configuration:', {
  DB_PATH,
  NODE_ENV: process.env.NODE_ENV,
  CWD: process.cwd(),
  exists: fs.existsSync(DB_PATH)
});

export const openDatabase = async (): Promise<Database.Database> => {
  try {
    console.log('📂 Opening database at:', DB_PATH);
    
    // Ensure database directory exists
    const dbDirectory = path.dirname(APP_CONFIG.DATABASE.PATH);
    if (!fs.existsSync(dbDirectory)) {
      console.log('📝 Creating database directory:', dbDirectory);
      fs.mkdirSync(dbDirectory, { recursive: true });
    }

    // Create or open database
    const db = new Database(DB_PATH, { 
      // Add additional options for more robust database handling
      readonly: false,
      fileMustExist: false,
    });

    // Ensure tables are created if they don't exist
    createQuestionsTable(db);

    // Create cart tables
    db.prepare(`
      CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_test_id UNIQUE(test_id)
      )
    `).run();

    db.prepare(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cart_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts(id),
        FOREIGN KEY (question_id) REFERENCES questions(id),
        CONSTRAINT unique_cart_question UNIQUE(cart_id, question_id)
      )
    `).run();

    console.log('✅ Database tables created successfully');
    return db;
  } catch (error) {
    console.error('Critical error opening database:', error);
    throw new AppError('Failed to open or create database', 500, error);
  }
};

const createQuestionsTable = (db: Database.Database) => {
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Question TEXT NOT NULL,
        Answer TEXT NOT NULL,
        Explanation TEXT,
        Subject TEXT NOT NULL,
        "Module Name" TEXT NOT NULL,
        Topic TEXT NOT NULL,
        "Sub Topic" TEXT,
        "Difficulty Level" TEXT NOT NULL,
        Question_Type TEXT NOT NULL,
        "Nature of Question" TEXT,
        CONSTRAINT unique_question UNIQUE(Question)
      )
    `).run();

    // Create performance indexes
    const indexStatements = [
      `CREATE INDEX IF NOT EXISTS idx_subject ON questions(Subject)`,
      `CREATE INDEX IF NOT EXISTS idx_module ON questions("Module Name")`,
      `CREATE INDEX IF NOT EXISTS idx_topic ON questions(Topic)`,
      `CREATE INDEX IF NOT EXISTS idx_difficulty ON questions("Difficulty Level")`,
      `CREATE INDEX IF NOT EXISTS idx_question_type ON questions(Question_Type)`
    ];

    indexStatements.forEach(indexSQL => {
      try {
        db.prepare(indexSQL).run();
      } catch (indexError) {
        console.warn(`Could not create index: ${indexSQL}`, indexError);
      }
    });
  } catch (tableError) {
    console.error('Error creating questions table:', tableError);
    throw new AppError('Failed to create questions table', 500, tableError);
  }
};

export type Question = ImportedQuestion;

export interface QuestionsResult {
  questions: Question[];
  total: number;
  totalQuestions: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: null | Error;
}

export const getQuestions = asyncErrorHandler(async (filters: {
  page?: number | string;
  pageSize?: number | string;
  subject?: string | string[];
  module?: string | string[];
  topic?: string | string[];
  sub_topic?: string | string[];
  question_type?: string | string[];
  search?: string;
  difficulty?: string;
}) => {
  console.log('🔍 Fetching Questions with Params:', JSON.stringify(filters, null, 2));
  console.log('📂 Database Path:', DB_PATH);
  console.log('🗃️ Database Exists:', fs.existsSync(DB_PATH));

  // Validate input parameters
  if (!filters) {
    throw new Error('No parameters provided for question retrieval');
  }

  const db = await openDatabase();

  try {
    // Sanitize and validate parameters
    const page = Math.max(1, Number(filters.page || 1));
    const pageSize = Math.min(Math.max(1, Number(filters.pageSize || 10)), 50); // Limit to 50 per page
    const offset = (page - 1) * pageSize;

    console.log('📄 Query pagination:', { page, pageSize, offset });

    console.log('📄 Pagination Details:', { page, pageSize, offset });

    // Prepare base query
    let query = `
      SELECT * FROM questions
    `;
    let hasFilters = false;
    const params: any[] = [];

    console.log('📊 Query Parameters Before Applying Filters:', params);

    console.log('🔍 Applying Filters:');

    // Helper function to add filter conditions
    const addFilter = (column: string, filterValue?: string | string[]) => {
      if (!filterValue) return;

      const values = Array.isArray(filterValue) ? filterValue : [filterValue];
      const placeholders = values.map(() => '?').join(',');

      console.log(`🧩 Adding Filter: ${column} IN (${values.join(', ')})`);
      if (!hasFilters) {
        query += ` WHERE ${column} IN (${placeholders})`;
        hasFilters = true;
      } else {
        query += ` AND ${column} IN (${placeholders})`;
      }
      params.push(...values);
    };

    // Handle difficulty filter
    if (filters.difficulty) {
      addFilter('"Difficulty Level"', filters.difficulty);
    }

    if (filters.subject) {
      addFilter('Subject', filters.subject);
    }

    if (filters.module) {
      addFilter('"Module Name"', filters.module);
    }

    if (filters.topic) {
      addFilter('Topic', filters.topic);
    }

    if (filters.sub_topic) {
      addFilter('"Sub Topic"', filters.sub_topic);
    }

    if (filters.question_type) {
      addFilter('Question_Type', filters.question_type);
    }

    // Search filter (if applicable)
    if (filters.search) {
      console.log(`🔍 Search Term: ${filters.search}`);
      if (!hasFilters) {
        query += ` WHERE (
        Question LIKE ? OR 
        Answer LIKE ? OR 
        Explanation LIKE ? OR 
        Subject LIKE ? OR 
        Topic LIKE ?
      )`;
      } else {
        query += ` AND (
        Question LIKE ? OR 
        Answer LIKE ? OR 
        Explanation LIKE ? OR 
        Subject LIKE ? OR 
        Topic LIKE ?
      )`;
      }
      const searchTerm = `%${filters.search}%`;
      params.push(
        searchTerm, searchTerm, searchTerm, 
        searchTerm, searchTerm
      );
      console.log('🔧 Query After Search Filter:', query);
    }

    // Add sorting
    query += ` ORDER BY id ASC`;

    // Get total count before pagination
    let countQuery = 'SELECT COUNT(*) as total FROM questions';
    let countParams: any[] = [];

    if (hasFilters) {
      const whereClauseStart = query.indexOf('WHERE');
      const orderByStart = query.indexOf('ORDER BY');
      let filterQuery = orderByStart > -1 
        ? query.substring(whereClauseStart, orderByStart).trim()
        : query.substring(whereClauseStart).trim();
      countQuery += ` ${filterQuery}`;
      countParams = [...params];
    }

    let totalCount = 0;
    try {
      const countResult = await db.prepare(countQuery).get(...countParams) as { total: number };
      totalCount = countResult.total;
      console.log('📊 Total Count:', totalCount);
    } catch (countError) {
      console.error('❌ Count Query Error:', countError);
      throw new Error(`Failed to get total count: ${countError instanceof Error ? countError.message : String(countError)}`);
    }

    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    params.push(pageSize.toString(), offset.toString());

    console.log('🔧 Final Query:', {
      query,
      params: params,
      pagination: { page, pageSize, offset }
    });

    console.log('🔢 Final Query Parameters:', params);

    console.log('🔧 SQL Query:', query);
    console.log('🔢 Query Parameters:', params);

    let rawQuestions: Question[];
    try {
      rawQuestions = await db.prepare(query).all(...params) as Question[];
      console.log('📝 Fetched Questions:', {
        count: rawQuestions.length,
        difficulties: rawQuestions.map(q => q['Difficulty Level'])
      });
    } catch (queryError) {
      console.error('❌ Query Execution Error:', queryError);
      throw new Error(`Failed to fetch questions: ${queryError instanceof Error ? queryError.message : String(queryError)}`);
    }

    console.log('📝 Raw Questions Fetched:', rawQuestions.length);

    // Map raw questions to Question type
    const questions: Question[] = rawQuestions.map((q: any) => {
      console.log('🔍 Processing Question:', q.id);
      return {
        id: q.id,
        Question: q.Question,
        Answer: q.Answer,
        Explanation: q.Explanation,
        Subject: q.Subject,
        ModuleName: q['Module Name'],
        Topic: q.Topic,
        SubTopic: q['Sub Topic'],
        DifficultyLevel: q['Difficulty Level'],
        QuestionType: q.Question_Type || 'Objective',
        FacultyApproved: false, // Default value
        Objective: '', // Default value
        ModuleNumber: '', // Default value
        NatureOfQuestion: null, // Default value
        MicroTopic: null, // Default value,
      };
    });

    // Calculate pagination with bounds checking
    const totalPages = Math.ceil(totalCount / pageSize);
    const safePage = Math.min(page, totalPages);

    console.log('✅ Questions Retrieval Successful', {
      totalQuestions: totalCount,
      returnedQuestions: questions.length,
      page: safePage,
      pageSize,
      totalPages
    });

    return {
      questions,
      total: totalCount,
      totalQuestions: totalCount,
      page: safePage,
      pageSize,
      totalPages,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected Error in getQuestions:', error);
    throw error; // Re-throw to be handled by the caller
  } finally {
    db.close();
  }
});

export async function sanitizeFilterValue(value?: string | string[]): Promise<string | string[] | null> {
  // If value is undefined or null, return null
  if (value === undefined || value === null) return null;

  // If value is an array, sanitize each element
  if (Array.isArray(value)) {
    const sanitizedArray = value
      .filter(v => v !== undefined && v !== null && v.trim() !== '')
      .map(v => v.trim());
    
    return sanitizedArray.length > 0 ? sanitizedArray : null;
  }

  // If value is a string, sanitize it
  const sanitizedValue = value.trim();
  return sanitizedValue !== '' ? sanitizedValue : null;
}

export const addQuestion = asyncErrorHandler(async (questionData: Question) => {
  const db = await openDatabase();

  try {
    // Validate question data
    if (!isQuestion(questionData)) {
      throw new AppError('Invalid question data', 400);
    }

    const insertQuery = db.prepare(`
      INSERT INTO questions 
      (Question, Answer, Explanation, Subject, "Module Name", Topic, "Sub Topic", "Difficulty Level", Question_Type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertQuery.run(
      questionData.Question,
      questionData.Answer,
      questionData.Explanation || null,
      questionData.Subject,
      questionData.ModuleName || '',
      questionData.Topic,
      questionData.SubTopic || null,
      questionData.DifficultyLevel || null,
      questionData.QuestionType
    );

    return {
      ...questionData
    };
  } finally {
    db.close();
  }
});

export const saveDraftCart = async (
  userId: number | string, 
  testName: string, 
  batch: string, 
  date: string, 
  questionIds: number[]
) => {
  console.log('Saving draft cart:', { 
    userId: String(userId), 
    testName, 
    batch, 
    date, 
    questionIds 
  });
  
  // Placeholder implementation, replace with actual cart saving logic
  return `draft_${userId}_${testName}_${Date.now()}`;
};
