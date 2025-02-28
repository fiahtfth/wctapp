import { Pool, PoolClient } from 'pg';

// PostgreSQL connection configuration
const pgConfig = {
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'wctdb',
  password: process.env.POSTGRES_PASSWORD || '',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection to become available
};

// Create a pool of PostgreSQL clients
const pool = new Pool(pgConfig);

// Log connection events
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

/**
 * Execute a query with parameters
 * @param text SQL query text
 * @param params Query parameters
 * @returns Query result
 */
export async function query(text: string, params: any[] = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * @returns A PostgreSQL client
 */
export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  const originalRelease = client.release;
  
  // Override the release method to log the release
  client.release = () => {
    client.release = originalRelease;
    return client.release();
  };
  
  return client;
}

/**
 * Execute a transaction with multiple queries
 * @param callback Function that executes queries within a transaction
 * @returns Result of the callback function
 */
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the database pool
 */
export async function closePool() {
  await pool.end();
  console.log('PostgreSQL pool has been closed');
}

export default {
  query,
  getClient,
  transaction,
  closePool,
};
