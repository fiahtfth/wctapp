import { Database } from 'better-sqlite3';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// SQLite database path
const SQLITE_DB_PATH = process.env.DATABASE_PATH || '/private/tmp/wct.db';

// PostgreSQL connection details
const pgConfig = {
  user: process.env.POSTGRES_USER || 'academicdirector',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'wctdb',
  password: process.env.POSTGRES_PASSWORD || '',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
};

// Create PostgreSQL tables
const createPostgresTables = async (pool: Pool) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        "Question" TEXT NOT NULL,
        "Answer" TEXT NOT NULL,
        "Explanation" TEXT,
        "Subject" TEXT NOT NULL,
        "Module Name" TEXT,
        "Topic" TEXT NOT NULL,
        "Sub Topic" TEXT,
        "Difficulty Level" TEXT,
        "Question_Type" TEXT,
        "Nature of Question" TEXT
      )
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT,
        email TEXT,
        password_hash TEXT,
        role TEXT,
        is_active BOOLEAN,
        last_login TIMESTAMP,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);

    // Create carts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        test_id TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create cart_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INTEGER NOT NULL REFERENCES carts(id),
        question_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('PostgreSQL tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating PostgreSQL tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Migrate data from SQLite to PostgreSQL
const migrateData = async (sqliteDb: any, pgPool: Pool) => {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // Migrate questions
    console.log('Migrating questions...');
    const questions = sqliteDb.prepare('SELECT * FROM questions').all();
    for (const question of questions) {
      await client.query(
        `INSERT INTO questions (
          id, "Question", "Answer", "Explanation", "Subject", "Module Name", 
          "Topic", "Sub Topic", "Difficulty Level", "Question_Type", "Nature of Question"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          question.id,
          question.Question,
          question.Answer,
          question.Explanation,
          question.Subject,
          question['Module Name'],
          question.Topic,
          question['Sub Topic'],
          question['Difficulty Level'],
          question.Question_Type,
          question['Nature of Question']
        ]
      );
    }
    console.log(`Migrated ${questions.length} questions`);

    // Migrate users
    console.log('Migrating users...');
    const users = sqliteDb.prepare('SELECT * FROM users').all();
    for (const user of users) {
      await client.query(
        `INSERT INTO users (
          id, username, email, password_hash, role, is_active, last_login, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          user.id,
          user.username,
          user.email,
          user.password_hash,
          user.role,
          user.is_active,
          user.last_login,
          user.created_at,
          user.updated_at
        ]
      );
    }
    console.log(`Migrated ${users.length} users`);

    // Migrate carts
    console.log('Migrating carts...');
    const carts = sqliteDb.prepare('SELECT * FROM carts').all();
    for (const cart of carts) {
      await client.query(
        `INSERT INTO carts (id, test_id, user_id, created_at) 
         VALUES ($1, $2, $3, $4)`,
        [cart.id, cart.test_id, cart.user_id, cart.created_at]
      );
    }
    console.log(`Migrated ${carts.length} carts`);

    // Migrate cart_items
    console.log('Migrating cart items...');
    const cartItems = sqliteDb.prepare('SELECT * FROM cart_items').all();
    for (const item of cartItems) {
      await client.query(
        `INSERT INTO cart_items (id, cart_id, question_id, created_at) 
         VALUES ($1, $2, $3, $4)`,
        [item.id, item.cart_id, item.question_id, item.created_at]
      );
    }
    console.log(`Migrated ${cartItems.length} cart items`);

    // Set sequence values for SERIAL columns
    await client.query(`SELECT setval('questions_id_seq', (SELECT MAX(id) FROM questions))`);
    await client.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
    await client.query(`SELECT setval('carts_id_seq', (SELECT MAX(id) FROM carts))`);
    await client.query(`SELECT setval('cart_items_id_seq', (SELECT MAX(id) FROM cart_items))`);

    await client.query('COMMIT');
    console.log('Data migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error migrating data:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Main migration function
const migrateToPostgres = async () => {
  console.log('Starting migration from SQLite to PostgreSQL...');
  console.log(`SQLite DB Path: ${SQLITE_DB_PATH}`);
  console.log(`PostgreSQL Config: ${JSON.stringify(pgConfig)}`);

  // Check if SQLite database exists
  if (!fs.existsSync(SQLITE_DB_PATH)) {
    console.error(`SQLite database not found at ${SQLITE_DB_PATH}`);
    process.exit(1);
  }

  // Initialize SQLite database connection
  const sqlite3 = require('better-sqlite3');
  const sqliteDb = new sqlite3(SQLITE_DB_PATH);

  // Initialize PostgreSQL connection
  const pgPool = new Pool(pgConfig);

  try {
    // Create PostgreSQL tables
    await createPostgresTables(pgPool);

    // Migrate data
    await migrateData(sqliteDb, pgPool);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connections
    sqliteDb.close();
    await pgPool.end();
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateToPostgres().catch(console.error);
}

export { migrateToPostgres };
