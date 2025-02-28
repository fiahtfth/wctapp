/**
 * Test script for cart functionality with PostgreSQL
 * 
 * This script tests adding a question to a cart using the PostgreSQL database.
 * It verifies that the cart operations work correctly with the database adapter.
 */

import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// PostgreSQL configuration
const pgConfig = {
  user: process.env.POSTGRES_USER || 'academicdirector',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'wctdb',
  password: process.env.POSTGRES_PASSWORD || '',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
};

async function testCartFunctionality() {
  console.log('Testing cart functionality with PostgreSQL...');
  console.log('PostgreSQL config:', {
    user: pgConfig.user,
    host: pgConfig.host,
    database: pgConfig.database,
    port: pgConfig.port
  });

  const client = new Client(pgConfig);
  
  try {
    // Connect to PostgreSQL
    await client.connect();
    console.log('Connected to PostgreSQL');

    // 1. Verify that the database has the necessary tables
    console.log('\n1. Checking database tables...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const tablesResult = await client.query(tablesQuery);
    
    console.log('Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    // 2. Check if we have any users
    console.log('\n2. Checking users...');
    const usersQuery = 'SELECT id, username, email FROM users LIMIT 5';
    const usersResult = await client.query(usersQuery);
    
    if (usersResult.rows.length === 0) {
      console.log('No users found. Creating a test user...');
      
      // Create a test user
      const createUserQuery = `
        INSERT INTO users (username, email, role, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      const createUserResult = await client.query(createUserQuery, [
        'test_user',
        'test@example.com',
        'user',
        true
      ]);
      
      console.log('Created test user with ID:', createUserResult.rows[0].id);
    } else {
      console.log('Found users:');
      usersResult.rows.forEach(user => {
        console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
      });
    }

    // 3. Check if we have any questions
    console.log('\n3. Checking questions...');
    const questionsQuery = 'SELECT id, "Question", "Subject" FROM questions LIMIT 5';
    const questionsResult = await client.query(questionsQuery);
    
    if (questionsResult.rows.length === 0) {
      console.error('No questions found in the database. Please run the migration script first.');
      return;
    } else {
      console.log('Found questions:');
      questionsResult.rows.forEach(question => {
        console.log(`- ID: ${question.id}, Subject: ${question.Subject}`);
        console.log(`  Question: ${question.Question.substring(0, 50)}...`);
      });
    }

    // 4. Create a test cart
    console.log('\n4. Creating a test cart...');
    const testId = uuidv4();
    const userId = usersResult.rows.length > 0 
      ? usersResult.rows[0].id 
      : (await client.query('SELECT id FROM users LIMIT 1')).rows[0].id;
    
    const createCartQuery = `
      INSERT INTO carts (test_id, user_id)
      VALUES ($1, $2)
      RETURNING id
    `;
    const createCartResult = await client.query(createCartQuery, [testId, userId]);
    const cartId = createCartResult.rows[0].id;
    
    console.log(`Created test cart with ID: ${cartId}, Test ID: ${testId}, User ID: ${userId}`);

    // 5. Add a question to the cart
    console.log('\n5. Adding a question to the cart...');
    const questionId = questionsResult.rows[0].id;
    
    const addToCartQuery = `
      INSERT INTO cart_items (cart_id, question_id)
      VALUES ($1, $2)
      RETURNING id
    `;
    const addToCartResult = await client.query(addToCartQuery, [cartId, questionId]);
    
    console.log(`Added question ID ${questionId} to cart ID ${cartId} with cart_item ID: ${addToCartResult.rows[0].id}`);

    // 6. Verify the question was added to the cart
    console.log('\n6. Verifying cart contents...');
    const verifyCartQuery = `
      SELECT ci.id, ci.question_id, q."Question"
      FROM cart_items ci
      JOIN questions q ON ci.question_id = q.id
      WHERE ci.cart_id = $1
    `;
    const verifyCartResult = await client.query(verifyCartQuery, [cartId]);
    
    console.log(`Cart ${cartId} contains ${verifyCartResult.rows.length} items:`);
    verifyCartResult.rows.forEach(item => {
      console.log(`- Item ID: ${item.id}, Question ID: ${item.question_id}`);
      console.log(`  Question: ${item.Question.substring(0, 50)}...`);
    });

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Close the PostgreSQL connection
    await client.end();
    console.log('Disconnected from PostgreSQL');
  }
}

// Run the test
testCartFunctionality();
