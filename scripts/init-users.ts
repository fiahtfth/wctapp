import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db');

async function initializeUsers() {
  try {
    console.log('🚀 Starting User Database Initialization');
    
    // Create or open database
    const db = new Database(DB_PATH, { verbose: console.log });
    
    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
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

    // Prepare statements
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    const updateUser = db.prepare(`
      UPDATE users SET username = ?, password_hash = ?, role = ? WHERE email = ?
    `);

    const findUserByEmail = db.prepare(`
      SELECT id FROM users WHERE email = ?
    `);

    // Insert admin user
    insertUser.run(
      'admin',
      'admin@nextias.com',
      adminPasswordHash,
      'admin'
    );

    // Check if Navneet user exists
    const navneetUser = findUserByEmail.get('navneet@nextias.com');

    if (navneetUser) {
      // Update Navneet user if exists
      updateUser.run(
        'navneet',
        navneetPasswordHash,
        'user',
        'navneet@nextias.com'
      );
      console.log('✅ Navneet user updated successfully');
    } else {
      // Insert Navneet user if not exists
      insertUser.run(
        'navneet',
        'navneet@nextias.com',
        navneetPasswordHash,
        'user'
      );
      console.log('✅ Navneet user created successfully');
    }

    console.log('✅ Admin user created successfully');
    db.close();
  } catch (error) {
    console.error('❌ Failed to initialize users:', error);
    throw error;
  }
}

export default initializeUsers;

initializeUsers().catch(console.error);
