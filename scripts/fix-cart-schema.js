const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Get the database path
const dbPath = path.resolve(__dirname, '../src/lib/database/wct.db');
console.log('Database path:', dbPath);

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.error('Database file does not exist:', dbPath);
  process.exit(1);
}

// Open the database
const db = new Database(dbPath);

try {
  // Begin transaction
  db.prepare('BEGIN TRANSACTION').run();
  
  console.log('Backing up current carts and cart_items tables...');
  
  // Create backup tables
  db.prepare(`
    CREATE TABLE IF NOT EXISTS carts_backup AS 
    SELECT * FROM carts
  `).run();
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS cart_items_backup AS 
    SELECT * FROM cart_items
  `).run();
  
  console.log('Dropping cart_items table (due to foreign key constraint)...');
  // Drop cart_items table first (due to foreign key constraint)
  db.prepare('DROP TABLE IF EXISTS cart_items').run();
  
  console.log('Dropping carts table...');
  // Drop carts table
  db.prepare('DROP TABLE IF EXISTS carts').run();
  
  console.log('Creating new carts table with nullable user_id...');
  // Create new carts table with nullable user_id
  db.prepare(`
    CREATE TABLE carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id TEXT NOT NULL,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_test_id_user UNIQUE(test_id, user_id)
    )
  `).run();
  
  console.log('Creating new cart_items table...');
  // Create new cart_items table
  db.prepare(`
    CREATE TABLE cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cart_id) REFERENCES carts(id),
      FOREIGN KEY (question_id) REFERENCES questions(id),
      CONSTRAINT unique_cart_question UNIQUE(cart_id, question_id)
    )
  `).run();
  
  console.log('Restoring data from backup tables...');
  // Restore data from backup tables
  db.prepare(`
    INSERT INTO carts (id, test_id, user_id, created_at)
    SELECT id, test_id, user_id, created_at FROM carts_backup
  `).run();
  
  db.prepare(`
    INSERT INTO cart_items (id, cart_id, question_id, created_at)
    SELECT id, cart_id, question_id, created_at FROM cart_items_backup
  `).run();
  
  console.log('Dropping backup tables...');
  // Drop backup tables
  db.prepare('DROP TABLE IF EXISTS cart_items_backup').run();
  db.prepare('DROP TABLE IF EXISTS carts_backup').run();
  
  // Commit transaction
  db.prepare('COMMIT').run();
  
  console.log('Database schema updated successfully!');
} catch (error) {
  // Rollback on error
  db.prepare('ROLLBACK').run();
  console.error('Error updating database schema:', error);
} finally {
  // Close database connection
  db.close();
}
