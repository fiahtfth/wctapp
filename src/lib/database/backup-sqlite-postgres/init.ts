import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve('./src/lib/database/questions.db');

export function initializeDatabase() {
    // Check if database already exists
    if (fs.existsSync(DB_PATH)) {
        console.log('Database already exists');
        return;
    }

    try {
        // Open the database
        const db = new Database(DB_PATH);

        // Read SQL schema
        const schemaPath = path.resolve('./src/lib/database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        db.exec(schema);

        console.log('Database initialized successfully');
        db.close();
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Run initialization if this script is directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
    initializeDatabase();
}
