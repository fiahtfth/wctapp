import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

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

    // Create hardcoded admin user
    const adminUsername = 'superadmin';
    const adminEmail = 'admin@nextias.com';
    const adminPassword = 'Admin_2025!';

    // Hash the password
    const saltRounds = 10;
    const passwordHash = bcrypt.hashSync(adminPassword, saltRounds);

    // Prepare and execute admin user insert
    const insertAdminStmt = db.prepare(`
            INSERT INTO users 
            (username, email, password_hash, role, is_active) 
            VALUES (?, ?, ?, 'admin', 1)
        `);

    insertAdminStmt.run(adminUsername, adminEmail, passwordHash);

    console.log('Database initialized successfully');
    console.log('Hardcoded Admin Credentials:');
    console.log(`Username: ${adminUsername}`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);

    db.close();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Run initialization if this script is directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}
