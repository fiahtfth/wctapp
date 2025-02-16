'use server';

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src', 'lib', 'database', 'questions.db');

// Define type for database query results
type TotalResult = { total: number };
type QuestionResult = Question & { [key: string]: string | number };

export interface Question {
    id?: number;  
    Question: string;
    Answer: string;
    Explanation: string;
    Subject: string;
    'Module Number': string;
    'Module Name': string;
    Topic: string;
    'Sub Topic': string;
    'Micro Topic': string;
    'Faculty Approved': string;
    'Difficulty Level': string;
    'Nature of Question': string;
    Objective: string;
    Question_Type: string;
}

function isQuestionResult(q: unknown): q is QuestionResult {
    return q !== null && typeof q === 'object' && 
        'Question' in q && 
        'Answer' in q && 
        'Explanation' in q;
}

export async function getQuestions(filters: {
    page?: number;
    pageSize?: number;
    subject?: string | string[];
    module?: string | string[];
    topic?: string | string[];
    sub_topic?: string | string[];
    question_type?: string | string[];
    search?: string;
}) {
    const db = await openDatabase();

    try {
        // Precise mapping of frontend parameter names to actual database column names
        const columnMap: { [key: string]: string } = {
            'subject': 'Subject',
            'module': 'Module Name',
            'topic': 'Topic',
            'sub_topic': 'Sub Topic',
            'question_type': 'Question_Type'
        };

        // Default pagination values
        const page = filters.page || 1;
        const pageSize = filters.pageSize || 10;
        const offset = (page - 1) * pageSize;

        // Base query to count total items
        let countQuery = 'SELECT COUNT(*) as total FROM questions WHERE 1=1';
        let query = 'SELECT * FROM questions WHERE 1=1';
        const params: any[] = [];
        const countParams: any[] = [];

        // Debugging log for input filters
        console.log('Input Filters:', JSON.stringify(filters, null, 2));

        // Add filtering conditions dynamically
        const addCondition = (column: string, value: string | string[] | undefined) => {
            if (value) {
                const dbColumn = columnMap[column] || column;
                
                // Normalize value to an array
                const values = Array.isArray(value) 
                    ? value 
                    : (typeof value === 'string' 
                        ? [value] 
                        : []);

                if (values.length > 0) {
                    if (values.length === 1) {
                        // Single value condition
                        query += ` AND "${dbColumn}" = ?`;
                        countQuery += ` AND "${dbColumn}" = ?`;
                        params.push(values[0]);
                        countParams.push(values[0]);
                        console.log(`Adding single value filter: ${dbColumn} = ${values[0]}`);
                    } else {
                        // Multiple values condition
                        const placeholders = values.map(() => '?').join(',');
                        query += ` AND "${dbColumn}" IN (${placeholders})`;
                        countQuery += ` AND "${dbColumn}" IN (${placeholders})`;
                        params.push(...values);
                        countParams.push(...values);
                        console.log(`Adding multi-value filter: ${dbColumn} IN (${values.join(', ')})`);
                    }
                }
            }
        };

        // Apply filters with precise column mapping
        if (filters.subject) addCondition('subject', filters.subject);
        if (filters.module) addCondition('module', filters.module);
        if (filters.topic) addCondition('topic', filters.topic);
        if (filters.sub_topic) addCondition('sub_topic', filters.sub_topic);
        if (filters.question_type) addCondition('question_type', filters.question_type);

        // Add search condition if provided
        if (filters.search) {
            const searchTerm = `%${filters.search}%`;
            query += ` AND (
                Question LIKE ? OR 
                Subject LIKE ? OR 
                "Module Name" LIKE ? OR 
                Topic LIKE ? OR 
                "Sub Topic" LIKE ? OR
                Answer LIKE ? OR
                Explanation LIKE ?
            )`;
            countQuery += ` AND (
                Question LIKE ? OR 
                Subject LIKE ? OR 
                "Module Name" LIKE ? OR 
                Topic LIKE ? OR 
                "Sub Topic" LIKE ? OR
                Answer LIKE ? OR
                Explanation LIKE ?
            )`;
            
            // Add search term multiple times for each column
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
            
            console.log(`Adding search filter: ${searchTerm}`);
        }

        // Add question type filter
        if (filters.question_type && filters.question_type.length > 0) {
            const questionTypeConditions = (Array.isArray(filters.question_type) ? filters.question_type : [filters.question_type])
                .map(() => '"Question_Type" = ?')
                .join(' OR ');
            
            query += ` AND (${questionTypeConditions})`;
            countQuery += ` AND (${questionTypeConditions})`;
            
            const questionTypeParams = Array.isArray(filters.question_type) ? filters.question_type : [filters.question_type];
            params.push(...questionTypeParams);
            countParams.push(...questionTypeParams);
            
            console.log(`Adding question type filter: ${questionTypeParams}`);
        }

        // Add ORDER BY clause for consistent results
        query += ' ORDER BY Subject, "Module Name", Topic, "Sub Topic"';

        // Add pagination
        query += ' LIMIT ? OFFSET ?';
        params.push(pageSize, offset);

        // Log final queries
        console.log('Count Query:', countQuery);
        console.log('Count Params:', countParams);
        console.log('Main Query:', query);
        console.log('Main Query Params:', params);

        // Execute count query to get total items
        const totalResult = await db.prepare(countQuery).get(countParams) as TotalResult;
        const total = totalResult?.total || 0;

        console.log('Total questions found:', total);

        // Execute main query if total > 0
        const questions = total > 0 
            ? await db.prepare(query).all(params)
            : [];

        console.log('Questions fetched:', questions.length);

        // Map the results to match the Question interface
        const mappedQuestions = questions
            .filter(isQuestionResult)
            .map((q: QuestionResult) => ({
                id: q.id || undefined,
                Question: q.Question,
                Answer: q.Answer,
                Explanation: q.Explanation,
                Subject: q.Subject,
                'Module Number': q['Module Number'],
                'Module Name': q['Module Name'],
                Topic: q.Topic,
                'Sub Topic': q['Sub Topic'],
                'Micro Topic': q['Micro Topic'],
                'Faculty Approved': q['Faculty Approved'],
                'Difficulty Level': q['Difficulty Level'],
                'Nature of Question': q['Nature of Question'],
                Objective: q.Objective,
                Question_Type: q.Question_Type
            }));

        return {
            questions: mappedQuestions,
            total: total,
            page: page,
            pageSize: pageSize
        };
    } catch (error) {
        console.error('Error in getQuestions:', error);
        throw error;
    } finally {
        await db.close();
    }
}

export async function getCascadingOptions(
    level: 'modules' | 'topics' | 'sub_topics' | 'question_types',
    filters?: Record<string, string | string[] | undefined>
): Promise<string[]> {
    const db = await openDatabase();

    try {
        // Mapping of frontend levels to database column names
        const columnMap: { [key: string]: string } = {
            'modules': 'Module Name',
            'topics': 'Topic',
            'sub_topics': 'Sub Topic',
            'question_types': 'Objective'
        };

        // Mapping of filter keys to database column names
        const filterColumnMap: { [key: string]: string } = {
            'subject': 'Subject',
            'module': 'Module Name',
            'topic': 'Topic',
            'sub_topic': 'Sub Topic'
        };

        // Get the target column name from the level
        const targetColumn = columnMap[level];
        if (!targetColumn) {
            throw new Error(`Invalid level: ${level}`)
        }

        // Prepare query components
        const whereConditions: string[] = [];
        const params: any[] = [];

        // Add filter conditions if provided
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                // Map the filter key to the correct database column
                const dbColumn = filterColumnMap[key] || key;
                
                // Normalize value to an array
                const normalizedValues = Array.isArray(value) 
                    ? value 
                    : (typeof value === 'string' 
                        ? value.split(',').filter(v => v.trim() !== '') 
                        : []);

                if (normalizedValues.length > 0) {
                    // If multiple values, use IN clause
                    const placeholders = normalizedValues.map(() => '?').join(',');
                    whereConditions.push(`"${dbColumn}" IN (${placeholders})`);
                    params.push(...normalizedValues);
                }
            });
        }

        // Construct the full query
        const query = `
            SELECT DISTINCT "${targetColumn}" 
            FROM questions 
            ${whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''} 
            ORDER BY "${targetColumn}"
        `;

        console.log('Cascading Options Query:', query);
        console.log('Query Params:', params);

        const stmt = db.prepare(query);
        const results = stmt.all(params) as Array<Record<string, string>>;

        const options = results.map(result => result[Object.keys(result)[0]] as string).filter(Boolean);
        return options;
    } catch (error) {
        console.error(`Error fetching cascading options for ${level}:`, error);
        throw error;
    } finally {
        await db.close();
    }
}

export async function migrateQuestionsTable() {
    const db = await openDatabase();

    try {
        // Ensure Question_Type column exists
        const tableInfo = db.prepare("PRAGMA table_info(questions)").all();
        const hasQuestionTypeColumn = tableInfo.some((col: any) => col.name === 'question_type');

        if (!hasQuestionTypeColumn) {
            // Add Question_Type column if it doesn't exist
            db.prepare(`
                ALTER TABLE questions 
                ADD COLUMN question_type TEXT
            `).run();
        }

        // Update Question_Type based on Nature_of_Question
        db.prepare(`
            UPDATE questions 
            SET question_type = 
                CASE 
                    WHEN nature_of_question = 'Analytical' THEN 'Analytical'
                    WHEN nature_of_question = 'Factual' THEN 'Factual'
                    ELSE 'Other'
                END
        `).run();

        console.log('Questions table migration completed successfully');
    } catch (error) {
        console.error('Error migrating questions table:', error);
        throw error;
    } finally {
        await db.close();
    }
}

export async function createQuestionsTable() {
    const db = await openDatabase();

    try {
        // Alter table to add Question Type column and drop Objective
        db.prepare(`
            BEGIN TRANSACTION;
            
            -- Create a new table with the desired schema
            CREATE TABLE questions_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_text TEXT,
                answer TEXT,
                explanation TEXT,
                subject TEXT,
                module_number TEXT,
                module_name TEXT,
                topic TEXT,
                sub_topic TEXT,
                difficulty_level TEXT,
                nature_of_question TEXT,
                question_type TEXT
            );

            -- Copy data from old table to new table
            INSERT INTO questions_new (
                question_text, answer, explanation, subject, 
                module_number, module_name, topic, sub_topic, 
                difficulty_level, nature_of_question, question_type
            ) 
            SELECT 
                question_text, answer, explanation, subject, 
                module_number, module_name, topic, sub_topic, 
                difficulty_level, nature_of_question, Objective
            FROM questions;

            -- Drop the old table
            DROP TABLE questions;

            -- Rename the new table
            ALTER TABLE questions_new RENAME TO questions;

            COMMIT;
        `).run();

    } catch (error) {
        console.error('Error migrating questions table:', error);
        throw error;
    } finally {
        await db.close();
    }
}

export async function addQuestionToCart(questionId: number, testId: string): Promise<boolean> {
    const db = await openDatabase();

    try {
        const stmt = db.prepare('INSERT INTO cart (test_id, question_id) VALUES (?, ?)');
        stmt.run(testId, questionId);
        return true;
    } finally {
        await db.close();
    }
}

export async function removeQuestionFromCart(questionId: number, testId: string): Promise<boolean> {
    const db = await openDatabase();

    try {
        const stmt = db.prepare('DELETE FROM cart WHERE test_id = ? AND question_id = ?');
        const result = stmt.run(testId, questionId);
        return result.changes > 0;
    } finally {
        await db.close();
    }
}

export async function getCartQuestions(testId: string): Promise<Question[]> {
    if (!testId) {
        console.error('getCartQuestions called with empty testId');
        return [];
    }

    const db = await openDatabase();

    try {
        console.log(`Fetching cart questions for test ID: ${testId}`);

        // Ensure tables exist with correct schema
        db.prepare(`
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY,
                question_text TEXT,
                answer TEXT,
                explanation TEXT,
                subject TEXT,
                module_name TEXT,
                module_number TEXT,
                topic TEXT,
                sub_topic TEXT,
                difficulty_level TEXT,
                nature_of_question TEXT,
                question_type TEXT
            )
        `).run();

        db.prepare(`
            CREATE TABLE IF NOT EXISTS cart (
                test_id TEXT,
                question_id INTEGER,
                PRIMARY KEY (test_id, question_id),
                FOREIGN KEY (question_id) REFERENCES questions(id)
            )
        `).run();

        // First, check if there are any cart entries for this test ID
        const cartEntriesCount = db.prepare(`
            SELECT COUNT(*) as count 
            FROM cart 
            WHERE test_id = ?
        `).get(testId) as { count: number };

        console.log(`Number of cart entries for test ID ${testId}: ${cartEntriesCount.count}`);

        // If no cart entries, return empty array
        if (cartEntriesCount.count === 0) {
            console.log(`No questions in cart for test ID ${testId}`);
            return [];
        }

        // Flexible query to handle potential schema variations
        const query = `
            SELECT 
                c.question_id as id, 
                q.question_text, 
                q.answer, 
                q.explanation, 
                q.subject, 
                q.module_name, 
                q.module_number, 
                q.topic, 
                q.sub_topic, 
                q.difficulty_level, 
                q.nature_of_question,
                q.question_type
            FROM cart c
            LEFT JOIN questions q ON c.question_id = q.id
            WHERE c.test_id = ?
        `;
        const stmt = db.prepare(query);
        const cartQuestions = stmt.all(testId) as Question[];

        console.log(`Found ${cartQuestions.length} cart questions`);
        console.log('Cart questions:', cartQuestions);

        return cartQuestions;
    } catch (error) {
        console.error('Full error details in getCartQuestions:', {
            error,
            testId,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : 'No stack trace'
        });

        // If the error is specifically about missing columns, return an empty array
        if (error instanceof Error && error.message.includes('no such column')) {
            console.warn('Column missing, returning empty cart');
            return [];
        }

        // Rethrow other types of errors
        throw new Error(`Failed to retrieve cart questions for test ID ${testId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        try {
            await db.close();
        } catch (closeError) {
            console.error('Error closing database:', closeError);
        }
    }
}

export async function debugDatabaseSchema() {
    const db = await openDatabase();

    try {
        console.log('Questions Table Schema:');
        const questionsSchema = db.prepare("PRAGMA table_info(questions)").all();
        console.log(JSON.stringify(questionsSchema, null, 2));

        console.log('\nCart Table Schema:');
        const cartSchema = db.prepare("PRAGMA table_info(cart)").all();
        console.log(JSON.stringify(cartSchema, null, 2));

        console.log('\nTables in Database:');
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        console.log(JSON.stringify(tables, null, 2));
    } catch (error) {
        console.error('Error debugging database schema:', error);
    } finally {
        await db.close();
    }
}

export async function getDistinctValues(
    level: 'subject' | 'module' | 'topic' | 'sub_topic' | 'question_type'
): Promise<string[]> {
    const db = new Database(DB_PATH, { fileMustExist: true });

    try {
        // Map the level to the correct column name
        const columnMap = {
            'subject': 'Subject',
            'module': '"Module Name"',
            'topic': 'Topic',
            'sub_topic': '"Sub Topic"',
            'question_type': '"Question_Type"'
        };

        const targetColumn = columnMap[level];
        const query = `SELECT DISTINCT ${targetColumn} FROM questions 
                       WHERE ${targetColumn} IS NOT NULL AND ${targetColumn} != '' 
                       ORDER BY ${targetColumn}`;

        const stmt = db.prepare(query);
        const results = stmt.all() as Array<Record<string, string>>;

        const options = results.map(result => result[Object.keys(result)[0]] as string).filter(Boolean);
        return options;
    } catch (error) {
        console.error(`Error fetching distinct values for ${level}:`, error);
        return [];
    } finally {
        db.close();
    }
}

export async function updateQuestion(question: Question) {
    const db = await openDatabase();

    try {
        const query = `
            UPDATE questions 
            SET 
                "Question" = ?, 
                "Answer" = ?, 
                "Explanation" = ?, 
                "Subject" = ?, 
                "Module Number" = ?, 
                "Module Name" = ?, 
                "Topic" = ?, 
                "Sub Topic" = ?, 
                "Micro Topic" = ?, 
                "Faculty Approved" = ?, 
                "Difficulty Level" = ?, 
                "Nature of Question" = ?, 
                "Objective" = ?, 
                "Question_Type" = ?, 
                "Last Updated" = CURRENT_TIMESTAMP
            WHERE id = ?
            RETURNING *;
        `;

        const values = [
            question.Question, 
            question.Answer, 
            question.Explanation, 
            question.Subject, 
            question["Module Number"] || null, 
            question["Module Name"] || null, 
            question.Topic || null, 
            question["Sub Topic"] || null, 
            question["Micro Topic"] || null,
            question['Faculty Approved'] || null,
            question['Difficulty Level'] || null,
            question['Nature of Question'] || null,
            question.Objective || null,
            question.Question_Type || null,
            question.id
        ];

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            throw new Error('Question not found or no changes made');
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error updating question:', error);
        throw error;
    } finally {
        await db.close();
    }
}

// Call this function to debug schema issues
// debugDatabaseSchema();

async function openDatabase() {
    return new Database(DB_PATH);
}
