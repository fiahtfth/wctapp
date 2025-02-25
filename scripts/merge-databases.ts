import Database from 'better-sqlite3';
import path from 'path';

const OLD_DB_PATH = path.join(process.cwd(), 'src', 'lib', 'database', 'questions.db');
const NEW_DB_PATH = path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db');

async function mergeDatabases() {
    console.log('Starting database merge...');
    
    // Open both databases
    const oldDb = new Database(OLD_DB_PATH);
    const newDb = new Database(NEW_DB_PATH);
    
    try {
        // Begin transaction in new database
        newDb.prepare('BEGIN').run();
        
        // Create questions table in new database
        newDb.prepare(`
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
        
        // Create indexes
        const indexStatements = [
            `CREATE INDEX IF NOT EXISTS idx_subject ON questions(Subject)`,
            `CREATE INDEX IF NOT EXISTS idx_module ON questions("Module Name")`,
            `CREATE INDEX IF NOT EXISTS idx_topic ON questions(Topic)`,
            `CREATE INDEX IF NOT EXISTS idx_difficulty ON questions("Difficulty Level")`,
            `CREATE INDEX IF NOT EXISTS idx_question_type ON questions(Question_Type)`
        ];
        
        indexStatements.forEach(indexSQL => {
            try {
                newDb.prepare(indexSQL).run();
            } catch (indexError) {
                console.warn(`Could not create index: ${indexSQL}`, indexError);
            }
        });
        
        // Copy questions from old to new database
        const questions = oldDb.prepare('SELECT * FROM questions').all();
        console.log(`Found ${questions.length} questions to copy`);
        
        const insertStmt = newDb.prepare(`
            INSERT OR REPLACE INTO questions (
                id, Question, Answer, Explanation, Subject,
                "Module Name", Topic, "Sub Topic",
                "Difficulty Level", Question_Type, "Nature of Question"
            ) VALUES (
                @id, @Question, @Answer, @Explanation, @Subject,
                @ModuleName, @Topic, @SubTopic,
                @DifficultyLevel, @QuestionType, @NatureOfQuestion
            )
        `);
        
        questions.forEach((q: any) => {
            const params = {
                id: q.id,
                Question: q.Question,
                Answer: q.Answer,
                Explanation: q.Explanation,
                Subject: q.Subject,
                ModuleName: q['Module Name'],
                Topic: q.Topic,
                SubTopic: q['Sub Topic'],
                DifficultyLevel: q['Difficulty Level'],
                QuestionType: q.Question_Type,
                NatureOfQuestion: q['Nature of Question']
            };
            console.log('Inserting question:', params);
            insertStmt.run(params);
        });
        
        // Commit transaction
        newDb.prepare('COMMIT').run();
        console.log('Database merge completed successfully');
        
    } catch (error) {
        console.error('Error during merge:', error);
        newDb.prepare('ROLLBACK').run();
        throw error;
    } finally {
        // Close both databases
        oldDb.close();
        newDb.close();
    }
}

mergeDatabases().catch(console.error);
