import Database from 'better-sqlite3';
import path from 'path';

// Define the Question type
interface Question {
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
}

// Database path
const DB_PATH = path.resolve(process.cwd(), 'src/lib/database/wctecm.db');

// Function to create questions table
function createQuestionsTable(db: Database) {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            "Question" TEXT NOT NULL,
            "Answer" TEXT NOT NULL,
            "Explanation" TEXT,
            "Subject" TEXT NOT NULL,
            "Module Number" TEXT,
            "Module Name" TEXT,
            "Topic" TEXT,
            "Sub Topic" TEXT,
            "Micro Topic" TEXT,
            "Faculty Approved" INTEGER DEFAULT 0,
            "Difficulty Level" TEXT,
            "Nature of Question" TEXT,
            "Objective" TEXT,
            "Question_Type" TEXT NOT NULL,
            "Last Updated" DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;
    db.prepare(createTableQuery).run();
}

// Function to add a question
function addQuestion(question: Question): { id: number } {
    const db = new Database(DB_PATH);

    try {
        // Ensure table exists
        createQuestionsTable(db);

        // Validate required fields
        if (!question.Question || !question.Answer || !question.Subject || !question.Question_Type) {
            throw new Error('Missing required fields for question');
        }

        // Convert boolean to number for SQLite compatibility
        const processedQuestion = {
            ...question,
            'Faculty Approved': question['Faculty Approved'] ? 1 : 0
        };

        // Prepare the SQL insert statement dynamically
        const columns = Object.keys(processedQuestion)
            .filter(key => processedQuestion[key] !== undefined && processedQuestion[key] !== null)
            .map(key => `"${key}"`);
        
        const placeholders = columns.map(() => '?').join(', ');
        
        const values = columns.map(col => processedQuestion[col.replace(/"/g, '')]);

        const query = `
            INSERT INTO questions (${columns.join(', ')}, "Last Updated")
            VALUES (${placeholders}, CURRENT_TIMESTAMP)
            RETURNING id;
        `;

        console.group('Question Insertion Process');
        console.log('Prepared SQL query:', query);
        console.log('Columns:', columns);
        console.log('Values:', values);

        const stmt = db.prepare(query);
        const result = stmt.get(...values);

        if (!result || !result.id) {
            console.error('No ID returned from question insertion');
            throw new Error('Failed to insert question');
        }

        console.log('Successfully inserted question with ID:', result.id);
        console.groupEnd();

        return { id: result.id };
    } catch (error) {
        console.error('Error in addQuestion:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Function to update a question
function updateQuestion(question: Question): Question {
    const db = new Database(DB_PATH);

    try {
        // Validate question ID
        if (!question.id || typeof question.id !== 'number' || question.id <= 0) {
            throw new Error('Invalid question ID');
        }

        // Verify the question exists before updating
        const existingQuestion = db.prepare('SELECT id FROM questions WHERE id = ?').get(question.id);
        if (!existingQuestion) {
            throw new Error(`Question with ID ${question.id} not found`);
        }

        // Extract fields to update, excluding id and some system fields
        const updateFields: Partial<Question> = { ...question };
        delete updateFields.id;
        delete updateFields['Last Updated'];

        // Convert boolean to number for SQLite compatibility
        if (updateFields['Faculty Approved'] !== undefined) {
            updateFields['Faculty Approved'] = updateFields['Faculty Approved'] ? 1 : 0;
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

        const stmt = db.prepare(query);
        const result = stmt.all(...values);

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
        db.close();
    }
}

function testQuestionUpdate() {
    console.log('🧪 Starting Question Update Test 🧪');

    try {
        // First, create a base question
        const baseQuestion: Question = {
            Question: 'What is the capital of France?',
            Answer: 'Paris',
            Subject: 'Geography',
            'Module Name': 'World Capitals',
            Topic: 'European Capitals',
            Question_Type: 'Multiple Choice',
            'Module Number': '1',
            'Faculty Approved': false,
            'Difficulty Level': 'Easy'
        };

        // Insert the base question
        const insertResult = addQuestion(baseQuestion);
        console.log('Base Question Inserted with ID:', insertResult.id);

        // Test case 1: Update multiple fields
        const updatedQuestion: Question = {
            ...baseQuestion,
            id: insertResult.id,
            Question: 'What is the capital city of France?',
            'Faculty Approved': true,
            'Difficulty Level': 'Medium',
            Explanation: 'Paris is the capital and largest city of France.'
        };

        console.log('Attempting to update question...');
        const updateResult = updateQuestion(updatedQuestion);
        console.log('✅ Question Updated Successfully!');
        console.log('Updated Question Details:', updateResult);

        // Test case 2: Partial update
        const partialUpdateQuestion: Partial<Question> = {
            id: insertResult.id,
            Topic: 'French Geography'
        };

        console.log('Attempting partial update...');
        // @ts-ignore - intentionally passing partial question
        const partialUpdateResult = updateQuestion(partialUpdateQuestion);
        console.log('✅ Partial Question Update Successful!');
        console.log('Partially Updated Question:', partialUpdateResult);

        // Test case 3: Update with non-existent ID
        try {
            const nonExistentUpdate: Question = {
                ...baseQuestion,
                id: 99999,
                Question: 'This should fail'
            };

            console.log('Attempting update with non-existent ID...');
            updateQuestion(nonExistentUpdate);
            console.error('❌ Error: Non-existent ID update should not succeed');
        } catch (error) {
            console.log('✅ Correctly prevented update of non-existent question');
            console.log('Error:', (error as Error).message);
        }

        console.log('🎉 All Question Update Tests Completed Successfully! 🎉');
    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

// Run the test
testQuestionUpdate();
