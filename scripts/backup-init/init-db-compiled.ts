import { initializeDatabase } from '../src/lib/database/init';

async function run() {
  try {
    await initializeDatabase();
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

run();
