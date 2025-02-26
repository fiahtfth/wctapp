import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import initializeUsers from '../../../scripts/init-users';

export const DB_PATH = path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db');
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

        console.log('Logging questions after table creation');
        if (database) {
            const questions = database.prepare('SELECT * FROM questions').all();
            console.log('Questions in database after table creation:', questions);
            fs.appendFileSync('/Users/academicdirector/Desktop/WCTECM/wctapp/database_init.log', JSON.stringify(questions, null, 2));
        } else {
            console.warn('Database connection is null');
        }

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

export function createCartTables(db?: Database.Database) {
    let database: Database.Database | null = null;
    
    try {
        // Use provided database or create a new connection
        database = db || new Database(DB_PATH);
        
        // Enable foreign keys
        database.pragma('foreign_keys = ON');
        
        console.log('🔨 Creating or verifying cart tables');

        // Create carts table with DEFERRABLE constraints
        const createCartsTableSQL = `
            CREATE TABLE IF NOT EXISTS carts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                test_id TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_test_id_user UNIQUE(test_id, user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
            )
        `;

        // Create cart items table with DEFERRABLE constraints
        const createCartItemsTableSQL = `
            CREATE TABLE IF NOT EXISTS cart_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cart_id INTEGER NOT NULL,
                question_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
                FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
                CONSTRAINT unique_cart_question UNIQUE(cart_id, question_id)
            )
        `;

        try {
            // Create tables
            database.prepare(createCartsTableSQL).run();
            database.prepare(createCartItemsTableSQL).run();
            console.log('✅ Cart tables created or already exist');
        } catch (tableCreationError) {
            console.error('❌ Error creating cart tables:', tableCreationError);
            throw new Error(`Failed to create cart tables: ${tableCreationError instanceof Error ? tableCreationError.message : String(tableCreationError)}`);
        }

    } catch (error) {
        console.error('❌ Comprehensive Cart Tables Creation Error:', {
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

export function createUsersTable(db?: Database.Database) {
    let database: Database.Database | null = null;
    
    try {
        // Use provided database or create a new connection
        database = db || new Database(DB_PATH);
        
        console.log('🔨 Creating or verifying users table');

        // Create users table
        const createUsersTableSQL = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
                is_active INTEGER NOT NULL DEFAULT 1,
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_email UNIQUE(email),
                CONSTRAINT unique_username UNIQUE(username)
            )
        `;

        try {
            // Create table
            database.prepare(createUsersTableSQL).run();
            console.log('✅ Users table created or already exists');

            // Add admin user if not exists
            const adminUser = database.prepare('SELECT id FROM users WHERE email = ?').get('admin@nextias.com');
            if (!adminUser) {
                const saltRounds = 10;
                const passwordHash = bcrypt.hashSync('admin123', saltRounds);
                database.prepare(
                    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
                ).run('admin', 'admin@nextias.com', passwordHash, 'admin');
                console.log('✅ Admin user created');
            }
        }  catch (tableCreationError) {
            console.error('❌ Error creating users table:', tableCreationError);
            throw new Error(`Failed to create users table: ${tableCreationError instanceof Error ? tableCreationError.message : String(tableCreationError)}`);
        }

    } catch (error) {
        console.error('❌ Comprehensive Users Table Creation Error:', {
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
    let db: Database.Database | null = null;
    
    try {
        console.log('🚀 Starting database initialization');
        
        // Check if database file exists
        const dbExists = fs.existsSync(DB_PATH);
        
        // Create the database directory if it doesn't exist
        const dbDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
            console.log(`📁 Created database directory: ${dbDir}`);
        }
        
        // Open the database
        db = new Database(DB_PATH);
        
        // Enable foreign keys
        db.pragma('foreign_keys = ON');
        console.log('🔑 Foreign keys enabled');
        
        // If database exists but tables need to be recreated due to schema changes
        // This is a temporary fix for the foreign key constraint issues
        const recreateTables = process.env.RECREATE_TABLES === 'true';
        if (recreateTables && dbExists) {
            console.log('🔄 Recreating tables due to schema changes...');
            
            // Drop tables in reverse order of dependencies
            try {
                db.prepare('DROP TABLE IF EXISTS cart_items').run();
                console.log('✅ Dropped cart_items table');
                
                db.prepare('DROP TABLE IF EXISTS carts').run();
                console.log('✅ Dropped carts table');
            } catch (dropError) {
                console.error('❌ Error dropping tables:', dropError);
            }
        }
        
        // Create tables
        createQuestionsTable(db);
        createUsersTable(db);
        createCartTables(db);
        
        // Initialize users if needed
        if (!dbExists || recreateTables) {
            console.log('👤 Initializing users');
            await initializeUsers();
        }
        
        console.log('✅ Database initialization complete');
        return true;
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw new Error(`Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        if (db) {
            try {
                db.close();
                console.log('🔒 Database connection closed');
            } catch (closeError) {
                console.error('❌ Error closing database:', closeError);
            }
        }
    }
}
