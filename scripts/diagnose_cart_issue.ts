import { getDatabasePath } from '../src/app/api/cart/question/route';
import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

async function diagnoseCartIssue() {
  try {
    console.log('🔍 Diagnosing Cart and Database Initialization');

    // Check database path
    const dbPath = getDatabasePath();
    console.log('📂 Database Path:', dbPath);

    // Check if database file exists
    const dbExists = fs.existsSync(dbPath);
    console.log('💾 Database File Exists:', dbExists);

    if (!dbExists) {
      console.log('❌ Database file not found');
      return;
    }

    // Use better-sqlite3 directly
    const db = new Database(dbPath, { readonly: true });

    // Check total number of questions
    const questionCountQuery = db.prepare('SELECT COUNT(*) as count FROM questions');
    const questionCount = questionCountQuery.get() as { count: number };
    console.log('📊 Total Questions:', questionCount.count);

    // Close the database connection
    db.close();

    console.log('✅ Diagnosis Complete');
  } catch (error) {
    console.error('❌ Diagnosis Error:', error);
  }
}

diagnoseCartIssue();
