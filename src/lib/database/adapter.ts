import { Database } from 'better-sqlite3';
import * as pg from './postgres';
import * as fs from 'fs';
import * as path from 'path';

// Enum for database types
enum DatabaseType {
  SQLITE = 'sqlite',
  POSTGRES = 'postgres'
}

// Database type from environment variable
const dbType = (process.env.DB_TYPE as DatabaseType) || DatabaseType.SQLITE;

// Logging utility
function logDatabaseInfo(message: string) {
  if (process.env.DEBUG === 'true') {
    console.log(`[Database Adapter] ${message}`);
  }
}

/**
 * Get the SQLite database path
 */
export function getSqliteDatabasePath() {
  const isMacOS = process.platform === 'darwin';
  const tmpPath = isMacOS ? '/private/tmp/wct.db' : '/tmp/wct.db';

  const possiblePaths = [
    process.env.DATABASE_PATH,
    tmpPath,
    path.join(process.cwd(), 'wct.db'),
    path.join(process.cwd(), 'src', 'lib', 'database', 'wct.db')
  ];

  for (const dbPath of possiblePaths) {
    if (dbPath && fs.existsSync(dbPath)) {
      logDatabaseInfo(`Found database at: ${dbPath}`);
      return dbPath;
    }
  }

  logDatabaseInfo(`No database found, defaulting to: ${tmpPath}`);
  return tmpPath;
}

/**
 * Execute a query based on the database type
 * @param query SQL query text
 * @param params Query parameters
 * @returns Query result
 */
export async function executeQuery(query: string, params: any[] = []) {
  try {
    logDatabaseInfo(`Executing query: ${query} with params: ${JSON.stringify(params)}`);

    switch (dbType) {
      case DatabaseType.POSTGRES:
        // Convert SQLite-style parameter placeholders (?) to PostgreSQL-style ($1, $2, etc.)
        let pgQuery = query;
        if (pgQuery.includes('?')) {
          let paramIndex = 1;
          pgQuery = pgQuery.replace(/\?/g, () => `$${paramIndex++}`);
        }
        return pg.query(pgQuery, params);

      case DatabaseType.SQLITE:
      default:
        const sqlite3 = require('better-sqlite3');
        const dbPath = getSqliteDatabasePath();
        const db = new sqlite3(dbPath);
        
        const isSelect = query.trim().toLowerCase().startsWith('select');
        
        if (isSelect) {
          const stmt = db.prepare(query);
          const result = { rows: stmt.all(...params) };
          db.close();
          return result;
        } else {
          const stmt = db.prepare(query);
          const result = stmt.run(...params);
          db.close();
          return result;
        }
    }
  } catch (error) {
    logDatabaseInfo(`Query execution error: ${error instanceof Error ? error.message : error}`);
    throw error;
  }
}

/**
 * Get a database client/connection
 * @returns Database client or connection
 */
export async function getConnection() {
  if (dbType === DatabaseType.POSTGRES) {
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
  if (dbType === DatabaseType.POSTGRES) {
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
      logDatabaseInfo(`Transaction error: ${error instanceof Error ? error.message : error}`);
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
  if (dbType === DatabaseType.POSTGRES) {
    await pg.closePool();
  }
  // SQLite doesn't need explicit closing as we close connections after each query
}

// Expose database type for external use
export const currentDatabaseType = dbType;

export default {
  executeQuery,
  getConnection,
  transaction,
  closeConnections,
  getSqliteDatabasePath,
};
