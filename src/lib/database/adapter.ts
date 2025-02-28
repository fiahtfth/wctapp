import { Database } from 'better-sqlite3';
import * as pg from './postgres';
import * as fs from 'fs';
import * as path from 'path';

// Database type from environment variable
const dbType = process.env.DB_TYPE || 'sqlite';

/**
 * Get the SQLite database path
 */
export function getSqliteDatabasePath() {
  // Function to check if we're in Render environment
  function isRenderEnvironment(): boolean {
    return process.env.RENDER === 'true' || !!process.env.RENDER;
  }

  // Function to check if we're in Vercel environment
  function isVercelEnvironment(): boolean {
    return process.env.VERCEL === '1' || !!process.env.VERCEL;
  }

  // For Render environment
  if (isRenderEnvironment()) {
    console.log('Running in Render environment');
    return process.env.DATABASE_PATH || '/opt/render/project/src/wct.db';
  }
  
  // For Vercel environment
  if (isVercelEnvironment()) {
    console.log('Running in Vercel environment');
    return process.env.DATABASE_PATH || '/tmp/wct.db';
  }
  
  // For local development
  console.log('Running in local environment');
  
  // Check if DATABASE_PATH is set in environment variables
  if (process.env.DATABASE_PATH) {
    console.log('Using DATABASE_PATH from environment:', process.env.DATABASE_PATH);
    return process.env.DATABASE_PATH;
  }
  
  // On macOS, /tmp is a symlink to /private/tmp
  const isMacOS = process.platform === 'darwin';
  const tmpPath = isMacOS ? '/private/tmp/wct.db' : '/tmp/wct.db';
  
  // Check if the database exists in the tmp directory
  if (fs.existsSync(tmpPath)) {
    console.log('Found database in tmp directory:', tmpPath);
    return tmpPath;
  }
  
  // Check if the database exists in the project root
  let dbPath = path.join(process.cwd(), 'wct.db');
  if (fs.existsSync(dbPath)) {
    console.log('Found database in project root:', dbPath);
    return dbPath;
  }
  
  // Check if the database exists in the src/lib/database directory
  dbPath = path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db');
  if (fs.existsSync(dbPath)) {
    console.log('Found database in src/lib/database:', dbPath);
    return dbPath;
  }
  
  // Default to the tmp path if no database is found
  console.log('No existing database found, defaulting to:', tmpPath);
  return tmpPath;
}

/**
 * Execute a query based on the database type
 * @param query SQL query text
 * @param params Query parameters
 * @returns Query result
 */
export async function executeQuery(query: string, params: any[] = []) {
  if (dbType === 'postgres') {
    // Convert SQLite-style parameter placeholders (?) to PostgreSQL-style ($1, $2, etc.)
    if (query.includes('?')) {
      let paramIndex = 1;
      query = query.replace(/\?/g, () => `$${paramIndex++}`);
    }
    return pg.query(query, params);
  } else {
    // SQLite implementation
    const sqlite3 = require('better-sqlite3');
    const dbPath = getSqliteDatabasePath();
    const db = new sqlite3(dbPath);
    
    try {
      // Determine if it's a SELECT query or a modification query
      const isSelect = query.trim().toLowerCase().startsWith('select');
      
      if (isSelect) {
        // For SELECT queries, use .all() to get all rows
        const stmt = db.prepare(query);
        return { rows: stmt.all(...params) };
      } else {
        // For INSERT, UPDATE, DELETE, use .run()
        const stmt = db.prepare(query);
        const result = stmt.run(...params);
        return { 
          rowCount: result.changes,
          lastInsertRowid: result.lastInsertRowid,
          rows: result.lastInsertRowid ? [{ id: result.lastInsertRowid }] : []
        };
      }
    } finally {
      db.close();
    }
  }
}

/**
 * Get a database client/connection
 * @returns Database client or connection
 */
export async function getConnection() {
  if (dbType === 'postgres') {
    return pg.getClient();
  } else {
    // SQLite implementation
    const sqlite3 = require('better-sqlite3');
    const dbPath = getSqliteDatabasePath();
    return new sqlite3(dbPath);
  }
}

/**
 * Execute a transaction with multiple queries
 * @param callback Function that executes queries within a transaction
 * @returns Result of the callback function
 */
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  if (dbType === 'postgres') {
    return pg.transaction(callback);
  } else {
    // SQLite implementation
    const sqlite3 = require('better-sqlite3');
    const dbPath = getSqliteDatabasePath();
    const db = new sqlite3(dbPath);
    
    try {
      db.prepare('BEGIN').run();
      const result = await callback(db);
      db.prepare('COMMIT').run();
      return result;
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Transaction error:', error);
      throw error;
    } finally {
      db.close();
    }
  }
}

/**
 * Close database connections
 */
export async function closeConnections() {
  if (dbType === 'postgres') {
    await pg.closePool();
  }
  // SQLite doesn't need explicit closing as we close connections after each query
}

export default {
  executeQuery,
  getConnection,
  transaction,
  closeConnections,
  getSqliteDatabasePath,
};
