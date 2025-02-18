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
    Explanation?: string | null;
    Subject: string;
    'Module Number': string;
    'Module Name': string;
    Topic: string;
    'Sub Topic'?: string | null;
    'Micro Topic'?: string | null;
    'Faculty Approved': boolean;
    'Difficulty Level'?: string | null;
    'Nature of Question'?: string | null;
    Objective?: string;
    Question_Type: string;
    [key: string]: string | number | boolean | null | undefined;
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
            'module': '"Module Name"',  // Use double quotes for column names with spaces
            'topic': 'Topic',
            'sub_topic': '"Sub Topic"',
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

        // Modify addCondition to be more flexible
        const addCondition = (column: string, value: string | string[] | undefined) => {
            if (value) {
                const dbColumn = columnMap[column] || column;
                
                // Normalize value to an array
                const values = Array.isArray(value) 
                    ? value.filter(v => v && v.trim() !== '') 
                    : (typeof value === 'string' && value.trim() !== '' 
                        ? [value] 
                        : []);

                if (values.length > 0) {
                    // Use LIKE for more flexible matching
                    const conditions = values.map(() => `${dbColumn} LIKE ?`).join(' OR ');
                    query += ` AND (${conditions})`;
                    countQuery += ` AND (${conditions})`;
                    
                    // Add wildcard % to each value for partial matching
                    params.push(...values.map(v => `%${v}%`));
                    countParams.push(...values.map(v => `%${v}%`));
                    
                    console.log(`Adding flexible filter for ${dbColumn}: LIKE (${values.join(', ')})`);
                }
            }
        };

        // Apply filters with precise column mapping
        if (filters.subject) addCondition('subject', filters.subject);
        if (filters.module) {
            console.log('Module Filters:', filters.module);
            addCondition('module', filters.module);
        }
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
            const questionTypeArray = Array.isArray(filters.question_type) 
                ? filters.question_type 
                : [filters.question_type];
            
            const questionTypeConditions = questionTypeArray
                .map(() => '"Question_Type" = ?')
                .join(' OR ');
            
            query += ` AND (${questionTypeConditions})`;
            countQuery += ` AND (${questionTypeConditions})`;
            
            params.push(...questionTypeArray);
            countParams.push(...questionTypeArray);
            
            console.log(`Adding question type filter: ${questionTypeArray}`);
        }

        // Add ORDER BY clause for consistent results
        query += ' ORDER BY Subject, "Module Name", Topic, "Sub Topic"';

        // Add pagination
        query += ' LIMIT ? OFFSET ?';
        params.push(pageSize, offset);

        console.log('Final Query:', query);
        console.log('Query Params:', params);

        // Execute count query to get total items
        const countResult = await db.prepare(countQuery).get(...countParams) as { total: number };
        const totalItems = countResult.total;
        const totalPages = Math.ceil(totalItems / pageSize);

        // Execute main query
        const questions = db.prepare(query).all(...params) as Question[];

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
            total: totalItems,
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

// Define the structure for our hierarchical data
interface SubTopic {
    name: string;
}

interface Topic {
    name: string;
    subTopics?: SubTopic[];
}

interface Module {
    name: string;
    topics: Topic[];
}

interface Subject {
    name: string;
    modules: Module[];
}

// Predefined hierarchical structure for subjects, modules, and topics
const hierarchicalData: Subject[] = [
    {
        name: 'Geography',
        modules: [
            {
                name: 'Physical Geography',
                topics: [
                    { name: 'Geomorphology' },
                    { name: 'Climatology' },
                    { name: 'Oceanography' },
                    { name: 'Biogeography' }
                ]
            },
            {
                name: 'Human Geography',
                topics: [
                    { name: 'Population' },
                    { name: 'Settlements' },
                    { name: 'Economic Activities' }
                ]
            }
        ]
    },
    {
        name: 'Ecology and Environment',
        modules: [
            {
                name: 'Ecosystems',
                topics: [
                    { name: 'Types of Ecosystems' },
                    { name: 'Biodiversity' },
                    { name: 'Conservation' }
                ]
            },
            {
                name: 'Environmental Issues',
                topics: [
                    { name: 'Climate Change' },
                    { name: 'Pollution' },
                    { name: 'Sustainable Development' }
                ]
            }
        ]
    },
    {
        name: 'Economics',
        modules: [
            {
                name: 'Microeconomics',
                topics: [
                    { name: 'Demand and Supply' },
                    { name: 'Market Structures' },
                    { name: 'Factor Markets' }
                ]
            },
            {
                name: 'Macroeconomics',
                topics: [
                    { name: 'National Income' },
                    { name: 'Money and Banking' },
                    { name: 'International Trade' }
                ]
            }
        ]
    },
    {
        name: 'History',
        modules: [
            {
                name: 'Ancient History',
                topics: [
                    { name: 'Indus Valley Civilization' },
                    { name: 'Vedic Period' },
                    { name: 'Mauryan Empire' }
                ]
            },
            {
                name: 'Medieval History',
                topics: [
                    { name: 'Delhi Sultanate' },
                    { name: 'Mughal Empire' },
                    { name: 'Vijayanagar Empire' }
                ]
            },
            {
                name: 'Modern History',
                topics: [
                    { name: 'British Rule' },
                    { name: 'Indian Independence Movement' },
                    { name: 'Post-Independence India' }
                ]
            }
        ]
    },
    {
        name: 'Polity and Governance',
        modules: [
            {
                name: 'Indian Constitution',
                topics: [
                    { name: 'Fundamental Rights' },
                    { name: 'Directive Principles' },
                    { name: 'Constitutional Bodies' }
                ]
            },
            {
                name: 'Government Structure',
                topics: [
                    { name: 'Executive' },
                    { name: 'Legislature' },
                    { name: 'Judiciary' }
                ]
            }
        ]
    },
    {
        name: 'Science and Technology',
        modules: [
            {
                name: 'Physics',
                topics: [
                    { name: 'Mechanics' },
                    { name: 'Electricity and Magnetism' },
                    { name: 'Modern Physics' }
                ]
            },
            {
                name: 'Chemistry',
                topics: [
                    { name: 'Organic Chemistry' },
                    { name: 'Inorganic Chemistry' },
                    { name: 'Physical Chemistry' }
                ]
            },
            {
                name: 'Biology',
                topics: [
                    { name: 'Cell Biology' },
                    { name: 'Genetics' },
                    { name: 'Evolution' }
                ]
            }
        ]
    }
];

// Predefined subjects
const predefinedSubjects = [
    'Economics', 
    'Polity and Governance', 
    'World Geography', 
    'Science and Technology'
];

type CascadingLevel = 'modules' | 'topics' | 'sub_topics' | 'question_types' | 'subjects';

// Predefined hierarchical structure for subjects, modules, and topics
const getSubjects = () => hierarchicalData.map(subject => subject.name);

const getModules = (subject?: string | string[]): string[] => {
    // Normalize subject to an array
    const subjects = Array.isArray(subject) ? subject : [subject].filter(Boolean);
    
    const allModules = subjects
        .flatMap(subjectName => {
            const subjectData = hierarchicalData.find(s => s.name === subjectName);
            return subjectData ? subjectData.modules.map(module => module.name) : [];
        });
    
    // Remove duplicates using Array.from and Set
    return Array.from(new Set(allModules));
};

const getTopics = (subject?: string | string[], module?: string | string[]): string[] => {
    if (!subject || !module) return [];
    
    // Normalize subject and module to arrays
    const subjects = Array.isArray(subject) ? subject : [subject].filter(Boolean);
    const modules = Array.isArray(module) ? module : [module].filter(Boolean);
    
    // Collect topics from all specified subject-module combinations
    const allTopics = subjects.flatMap(subjectName => 
        modules.flatMap(moduleName => {
            const subjectData = hierarchicalData.find(s => s.name === subjectName);
            if (!subjectData) return [];
            
            const moduleData = subjectData.modules.find(m => m.name === moduleName);
            return moduleData ? moduleData.topics.map(topic => topic.name) : [];
        })
    );
    
    // Remove duplicates using Array.from and Set
    return Array.from(new Set(allTopics));
};

export async function getCascadingOptions(
    level: CascadingLevel, 
    filters?: Record<string, string | string[]>
): Promise<string[]> {
    // Handle predefined hierarchical data
    if (level === 'subjects') {
        return predefinedSubjects;
    }

    if (level === 'modules' && filters?.subject) {
        const subjects = Array.isArray(filters.subject) 
            ? filters.subject 
            : [filters.subject];
        return getModules(subjects);
    }

    if (level === 'topics' && filters?.subject && filters?.module) {
        const subjects = Array.isArray(filters.subject) 
            ? filters.subject 
            : [filters.subject];
        const modules = Array.isArray(filters.module) 
            ? filters.module 
            : [filters.module];
        return getTopics(subjects, modules);
    }

    // For question_types and sub_topics, we'll still use the database
    const db = await openDatabase();

    try {
        // Mapping of levels to their corresponding database columns and parent columns
        const levelMap: { 
            [key: string]: { 
                column: string, 
                parentFilters?: string[] 
            } 
        } = {
            'subjects': { 
                column: 'Subject' 
            },
            'modules': { 
                column: 'Module Name', 
                parentFilters: ['Subject'] 
            },
            'topics': { 
                column: 'Topic', 
                parentFilters: ['Subject', 'Module Name'] 
            },
            'sub_topics': { 
                column: 'Sub Topic', 
                parentFilters: ['Subject', 'Module Name', 'Topic'] 
            },
            'question_types': { 
                column: 'Question_Type' 
            }
        };

        // Validate the level
        const levelConfig = levelMap[level];
        if (!levelConfig) {
            throw new Error(`Invalid cascading level: ${level}`);
        }

        // Prepare query components
        const whereConditions: string[] = [];
        const params: any[] = [];

        // Add parent filter conditions if applicable
        if (levelConfig.parentFilters && filters) {
            levelConfig.parentFilters.forEach(parentColumn => {
                const parentFilterValues = filters[parentColumn.toLowerCase().replace(' ', '_')];
                if (parentFilterValues) {
                    const normalizedValues = Array.isArray(parentFilterValues) 
                        ? parentFilterValues 
                        : [parentFilterValues];
                    
                    whereConditions.push(`'${parentColumn}' IN (${normalizedValues.map(() => '?').join(',')})`);
                    params.push(...normalizedValues);
                }
            });
        }

        // Add any additional filters passed
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                // Skip parent filters we've already handled
                if (levelConfig.parentFilters?.map(p => p.toLowerCase().replace(' ', '_')).includes(key)) {
                    return;
                }

                const normalizedValues = Array.isArray(value) 
                    ? value.filter(v => v && v.trim() !== '')
                    : (typeof value === 'string' 
                        ? value.split(',').filter(v => v.trim() !== '') 
                        : []);

                if (normalizedValues.length > 0) {
                    const placeholders = normalizedValues.map(() => '?').join(',');
                    whereConditions.push(`'${key}' IN (${placeholders})`);
                    params.push(...normalizedValues);
                }
            });
        }

        // Construct the full query
        const query = `
            SELECT DISTINCT '${levelConfig.column}' 
            FROM questions 
            WHERE '${levelConfig.column}' IS NOT NULL AND '${levelConfig.column}' != ''
            ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''} 
            ORDER BY '${levelConfig.column}'
        `;

        console.log('Cascading Options Query:', query);
        console.log('Query Params:', params);

        const stmt = db.prepare(query);
        const results = await stmt.all(params) as Array<Record<string, string>>;

        const options = results
            .map(result => result[levelConfig.column] as string)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));  // Alphabetical sorting

        console.log(`Options for ${level}:`, options);
        return options;
    } catch (error) {
        console.error(`Error fetching cascading options for ${level}:`, error);
        throw error;
    } finally {
        await db.close();
    }
}

export async function getDistinctValues(
    level: 'subject' | 'module' | 'topic' | 'sub_topic' | 'question_type'
): Promise<string[]> {
    const db = await openDatabase();

    try {
        let query = '';
        switch (level) {
            case 'subject':
                query = 'SELECT DISTINCT Subject FROM questions ORDER BY Subject';
                break;
            case 'module':
                query = 'SELECT DISTINCT "Module Name" FROM questions ORDER BY "Module Name"';
                break;
            case 'topic':
                query = 'SELECT DISTINCT Topic FROM questions ORDER BY Topic';
                break;
            case 'sub_topic':
                query = 'SELECT DISTINCT "Sub Topic" FROM questions WHERE "Sub Topic" IS NOT NULL ORDER BY "Sub Topic"';
                break;
            case 'question_type':
                query = 'SELECT DISTINCT "Question_Type" FROM questions ORDER BY "Question_Type"';
                break;
            default:
                throw new Error(`Unsupported level: ${level}`);
        }

        const results = db.prepare(query).all() as { [key: string]: string }[];
        
        // Extract the values, defaulting to an empty array if no results
        return results.map(result => 
            Object.values(result)[0]
        ).filter(value => value !== null && value !== undefined);
    } catch (error) {
        console.error(`Error getting distinct values for ${level}:`, error);
        return [];
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
        // Ensure cart table exists
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS cart (
                test_id TEXT,
                question_id INTEGER,
                PRIMARY KEY (test_id, question_id),
                FOREIGN KEY (question_id) REFERENCES questions(id)
            )
        `).run();

        // Check if question already exists in cart
        const existingEntry = await db.prepare(
            'SELECT * FROM cart WHERE test_id = ? AND question_id = ?'
        ).get(testId, questionId);

        if (existingEntry) {
            console.log(`Question ${questionId} already in cart for test ${testId}`);
            return false;
        }

        const stmt = await db.prepare('INSERT INTO cart (test_id, question_id) VALUES (?, ?)');
        await stmt.run(testId, questionId);
        return true;
    } catch (error) {
        console.error('Error adding question to cart:', error);
        return false;
    } finally {
        await db.close();
    }
}

export async function removeQuestionFromCart(questionId: number, testId: string): Promise<boolean> {
    const db = await openDatabase();

    try {
        const stmt = await db.prepare('DELETE FROM cart WHERE test_id = ? AND question_id = ?');
        const result = await stmt.run(testId, questionId);
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
        const query = `
            SELECT q.* FROM questions q
            JOIN cart c ON q.id = c.question_id
            WHERE c.test_id = ?
        `;
        const cartQuestions = await db.prepare(query).all(testId) as Question[];
        return cartQuestions;
    } catch (error) {
        console.error('Error fetching cart questions:', error);
        return [];
    } finally {
        await db.close();
    }
}

export async function debugDatabaseSchema() {
    const db = await openDatabase();

    try {
        console.log('Questions Table Schema:');
        const questionsSchema = await db.prepare("PRAGMA table_info(questions)").all();
        console.log(JSON.stringify(questionsSchema, null, 2));

        console.log('\nCart Table Schema:');
        const cartSchema = await db.prepare("PRAGMA table_info(cart)").all();
        console.log(JSON.stringify(cartSchema, null, 2));

        console.log('\nTables in Database:');
        const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        console.log(JSON.stringify(tables, null, 2));
    } catch (error) {
        console.error('Error debugging database schema:', error);
    } finally {
        await db.close();
    }
}

export async function updateQuestion(
    question: Question
): Promise<Question> {
    if (!question.id || typeof question.id !== 'number' || question.id <= 0) {
        throw new Error('Invalid question ID');
    }

    const db = await openDatabase();

    try {
        // Extract fields to update, excluding id and some system fields
        const updateFields: Partial<Question> = { ...question };
        delete updateFields.id;
        delete updateFields['Last Updated'];

        // Verify the question exists before updating
        const existingQuestion = db.prepare('SELECT id FROM questions WHERE id = ?').get(question.id);
        if (!existingQuestion) {
            throw new Error(`Question with ID ${question.id} not found`);
        }

        // Prepare the update clause dynamically
        const updateKeys = Object.keys(updateFields)
            .filter(key => 
                updateFields[key] !== undefined && 
                updateFields[key] !== null && 
                key !== 'id' && 
                key !== 'Last Updated'
            )
            .map(key => `"${key}" = ?`)
            .join(', ');

        const values = Object.keys(updateFields)
            .filter(key => 
                updateFields[key] !== undefined && 
                updateFields[key] !== null && 
                key !== 'id' && 
                key !== 'Last Updated'
            )
            .map(key => updateFields[key]);
        
        // Add question ID to the end of values for WHERE clause
        values.push(question.id);

        const query = `
            UPDATE questions 
            SET ${updateKeys}, "Last Updated" = CURRENT_TIMESTAMP
            WHERE id = ?
            RETURNING *;
        `;

        console.group('Question Update Process');
        console.log('Prepared SQL query:', query);
        console.log('Update Fields:', updateFields);
        console.log('Query values:', values);

        const stmt = await db.prepare(query);
        const result = await stmt.all(...values);

        console.log('Query result rows:', result);

        if (result.length === 0) {
            console.error('No rows updated. Question might not exist.');
            console.groupEnd();
            throw new Error('Question not found or no changes made');
        }

        // Type assertion to ensure the result is a Question
        const updatedQuestion = result[0] as Question;
        console.log('Successfully updated question:', updatedQuestion);
        console.groupEnd();

        return updatedQuestion;
    } catch (error) {
        console.error('Error in updateQuestion:', error);
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

// Debugging function to print out database contents
export async function debugQuestionsTable() {
    const db = await openDatabase();

    try {
        // Get distinct subjects
        const subjects = await db.prepare('SELECT DISTINCT Subject FROM questions').all();
        console.log('Distinct Subjects:', subjects);

        // Get distinct modules
        const modules = await db.prepare('SELECT DISTINCT "Module Name" FROM questions').all();
        console.log('Distinct Modules:', modules);

        // Get sample questions
        const sampleQuestions = await db.prepare('SELECT Subject, "Module Name", Topic, Question_Type FROM questions LIMIT 10').all();
        console.log('Sample Questions:', sampleQuestions);

        // Get total question count
        const totalQuestions = await db.prepare('SELECT COUNT(*) as total FROM questions').get();
        console.log('Total Questions:', totalQuestions);

        // Get Economics module questions
        const economicsQuestions = await db.prepare('SELECT * FROM questions WHERE Subject = ? LIMIT 10').all('Economics');
        console.log('First 10 Economics Questions:', economicsQuestions);
    } catch (error) {
        console.error('Error in debugQuestionsTable:', error);
    } finally {
        await db.close();
    }
}
