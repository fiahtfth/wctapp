import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export const DB_PATH = path.join(process.cwd(), 'src', 'lib', 'database', 'questions.db');
const SCHEMA_PATH = path.join(process.cwd(), 'src', 'lib', 'database', 'schema.sql');

export function createQuestionsTable(db?: Database.Database) {
    let database: Database.Database | null = null;
    
    try {
        // Use provided database or create a new connection
        database = db || new Database(DB_PATH);
        
        console.log('🔨 Creating or verifying questions table');

        // Comprehensive table creation with detailed logging
        const createTableSQL = `
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
                CONSTRAINT unique_question UNIQUE(Question)
            )
        `;

        try {
            // Prepare and run table creation statement
            const stmt = database.prepare(createTableSQL);
            stmt.run();
            console.log('✅ Questions table created or already exists');
        } catch (tableCreationError) {
            console.error('❌ Error creating questions table:', tableCreationError);
            throw new Error(`Failed to create questions table: ${tableCreationError instanceof Error ? tableCreationError.message : String(tableCreationError)}`);
        }

        // Optional: Add indexes for performance
        const indexStatements = [
            `CREATE INDEX IF NOT EXISTS idx_subject ON questions(Subject)`,
            `CREATE INDEX IF NOT EXISTS idx_module ON questions("Module Name")`,
            `CREATE INDEX IF NOT EXISTS idx_topic ON questions(Topic)`,
            `CREATE INDEX IF NOT EXISTS idx_difficulty ON questions("Difficulty Level")`,
            `CREATE INDEX IF NOT EXISTS idx_question_type ON questions(Question_Type)`
        ];

        indexStatements.forEach(indexSQL => {
            try {
                if (database) {
                    database.prepare(indexSQL).run();
                    console.log(`✨ Index created: ${indexSQL}`);
                } else {
                    console.warn('Database connection is null');
                }
            } catch (indexError) {
                console.warn(`⚠️ Could not create index: ${indexSQL}`, indexError);
            }
        });

        // Verify table structure
        try {
            if (database) {
                const tableInfo = database.prepare("PRAGMA table_info(questions)").all() as Array<{
                    cid: number;
                    name: string;
                    type: string;
                    notnull: number;
                    dflt_value: string | null;
                    pk: number;
                }>;
                console.log('📋 Questions table structure:', tableInfo);
            } else {
                console.warn('Database connection is null');
            }
        } catch (infoError) {
            console.warn('❌ Could not retrieve table info:', infoError);
        }

    } catch (error) {
        console.error('❌ Comprehensive Questions Table Creation Error:', {
            message: error instanceof Error ? error.message : String(error),
            fullError: error
        });
        throw error;
    } finally {
        // Close the database if we created a new connection
        if (db === undefined && database) {
            try {
                database.close();
                console.log('🔒 Temporary database connection closed');
            } catch (closeError) {
                console.error('❌ Error closing database:', closeError);
            }
        }
    }
}

export async function initializeDatabase() {
    try {
        console.log('🚀 Starting Database Initialization');
        console.log('Database Path:', DB_PATH);
        console.log('Current Working Directory:', process.cwd());

        // Ensure directory exists with detailed logging
        const dbDirectory = path.dirname(DB_PATH);
        if (!fs.existsSync(dbDirectory)) {
            console.log('📂 Database directory does not exist, creating...');
            try {
                fs.mkdirSync(dbDirectory, { recursive: true });
                console.log('📁 Database directory created successfully');
            } catch (dirError) {
                console.error('❌ Failed to create database directory:', dirError);
                throw new Error(`Failed to create database directory: ${dirError instanceof Error ? dirError.message : String(dirError)}`);
            }
        }

        // Create or open database with verbose logging
        let db: Database.Database;
        try {
            db = new Database(DB_PATH, { 
                verbose: console.log,  // Log all database operations
                fileMustExist: false 
            });
            console.log('💾 Database file opened/created successfully');
        } catch (dbOpenError) {
            console.error('❌ Failed to open/create database:', dbOpenError);
            throw new Error(`Failed to open database: ${dbOpenError instanceof Error ? dbOpenError.message : String(dbOpenError)}`);
        }

        // Create tables with error handling
        try {
            createQuestionsTable(db);
            console.log('✅ Questions table created or verified');
        } catch (tableError) {
            console.error('❌ Failed to create questions table:', tableError);
            throw new Error(`Failed to create questions table: ${tableError instanceof Error ? tableError.message : String(tableError)}`);
        }

        // Insert initial data if needed
        try {
            const countResult = db.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number };
            const questionsCount = countResult.count;
            console.log(`📊 Total questions in database: ${questionsCount}`);

            if (questionsCount === 0) {
                console.warn('⚠️ No questions found. Consider adding initial data.');
                
                // Optional: Add sample questions
                const sampleQuestions = [
                    {
                        Question: 'What is the capital of France?',
                        Answer: 'Paris',
                        Explanation: 'Paris is the capital and largest city of France',
                        Subject: 'Geography',
                        'Module Name': 'European Capitals',
                        Topic: 'France',
                        'Question_Type': 'Objective',
                        'Difficulty Level': 'Easy'
                    },
                    {
                        Question: 'What is the derivative of x^2?',
                        Answer: '2x',
                        Explanation: 'The derivative of x^2 is 2x using the power rule of differentiation',
                        Subject: 'Mathematics',
                        'Module Name': 'Calculus',
                        Topic: 'Differentiation',
                        'Question_Type': 'Objective',
                        'Difficulty Level': 'Medium'
                    }
                ];

                const insertQuestionStmt = db.prepare(`
                    INSERT INTO questions 
                    (Question, Answer, Explanation, Subject, "Module Name", Topic, "Question_Type", "Difficulty Level") 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `);

                const insertMany = db.transaction((questions) => {
                    for (const q of questions) {
                        insertQuestionStmt.run(
                            q.Question, 
                            q.Answer, 
                            q.Explanation, 
                            q.Subject, 
                            q['Module Name'], 
                            q.Topic, 
                            q['Question_Type'], 
                            q['Difficulty Level']
                        );
                    }
                });

                insertMany(sampleQuestions);
                console.log('✨ Sample questions added successfully');
            }
        } catch (dataError) {
            console.error('❌ Failed to handle initial data:', dataError);
            throw new Error(`Failed to handle initial data: ${dataError instanceof Error ? dataError.message : String(dataError)}`);
        }

        // Close the database connection
        try {
            db.close();
            console.log('🔒 Database connection closed');
        } catch (closeError) {
            console.error('❌ Failed to close database connection:', closeError);
        }

        console.log('✅ Database initialization complete');
        return db;
    } catch (error) {
        console.error('❌ Database Initialization Failed:', error);
        throw error;
    }
}
