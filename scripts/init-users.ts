import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db');

async function initializeUsers() {
  try {
    console.log('🚀 Starting User Database Initialization');
    
    // Ensure the database directory exists
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Create or open database
    const db = new Database(DB_PATH, { verbose: console.log });
    
    // Completely disable foreign key constraints
    db.pragma('foreign_keys = OFF');
    
    // Drop existing users table if it exists
    db.exec('DROP TABLE IF EXISTS users');
    
    // Create users table with exact schema from the memory
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const navneetPasswordHash = await bcrypt.hash('welcomenavneet', 10);

    // Use a transaction to ensure data consistency
    db.exec('BEGIN TRANSACTION;');
    
    try {
      // Insert admin user
      const insertAdmin = db.prepare(`
        INSERT INTO users (username, email, password_hash, role, is_active, last_login)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      insertAdmin.run(
        'admin', 
        'admin@nextias.com', 
        adminPasswordHash, 
        'admin', 
        1, 
        new Date().toISOString()
      );
      console.log('✅ Admin user created successfully');

      // Insert Navneet user
      const insertNavneet = db.prepare(`
        INSERT INTO users (username, email, password_hash, role, is_active, last_login)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      insertNavneet.run(
        'navneet', 
        'navneet@nextias.com', 
        navneetPasswordHash, 
        'user', 
        1, 
        new Date().toISOString()
      );
      console.log('✅ Navneet user created successfully');
      
      // Commit transaction
      db.exec('COMMIT;');
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK;');
      throw error;
    } finally {
      // Re-enable foreign keys
      db.pragma('foreign_keys = ON');
    }
    
    db.close();
    console.log('✅ User database initialization complete');
  } catch (error) {
    console.error('❌ Failed to initialize users:', error);
    throw error;
  }
}

export default initializeUsers;

initializeUsers().catch(console.error);
