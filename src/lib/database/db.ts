import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Ensure these environment variables are set in your .env file
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });

// Optional: Add a function to close the database connection
export async function closeDbConnection() {
  await pool.end();
}
