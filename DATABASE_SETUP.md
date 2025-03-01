# Database Setup and Troubleshooting Guide

This guide provides instructions for setting up and troubleshooting the database for the WCT application.

## Table of Contents

1. [Database Requirements](#database-requirements)
2. [Automatic Setup](#automatic-setup)
3. [Manual Setup](#manual-setup)
4. [Diagnostic Tools](#diagnostic-tools)
5. [Common Issues](#common-issues)
6. [Troubleshooting Steps](#troubleshooting-steps)

## Database Requirements

The application requires the following database tables:

- `carts`: Stores cart metadata and user information
- `cart_items`: Stores items in each cart
- `questions`: Stores question data that can be added to carts

## Automatic Setup

The easiest way to set up your database is to use our built-in diagnostic tools:

1. Navigate to `/diagnostic-tools` in your application
2. Click on "Run Migrations" to set up all required tables
3. Click on "Database Test & Fix" to verify your setup

If you encounter any issues with saving or loading draft carts, the application will display an alert with options to fix the database setup automatically.

## Manual Setup

If you prefer to set up the database manually, you can run the following SQL commands:

```sql
-- Create carts table
CREATE TABLE IF NOT EXISTS carts (
  id SERIAL PRIMARY KEY,
  test_id TEXT,
  user_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on test_id for faster lookups
CREATE INDEX IF NOT EXISTS carts_test_id_idx ON carts(test_id);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE,
  question_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on cart_id for faster lookups
CREATE INDEX IF NOT EXISTS cart_items_cart_id_idx ON cart_items(cart_id);

-- Create questions table if needed for testing
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY,
  text TEXT,
  subject TEXT,
  topic TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test questions if needed
INSERT INTO questions (id, text, subject, topic)
VALUES 
  (1001, 'Test question 1', 'Math', 'Algebra'),
  (1002, 'Test question 2', 'Science', 'Physics')
ON CONFLICT (id) DO NOTHING;
```

## Diagnostic Tools

The application includes several diagnostic tools to help you troubleshoot database issues:

### Database Test & Fix (`/database-test`)
- Tests your database connection
- Checks for required tables
- Creates missing tables if needed
- Verifies cart functionality

### Cart Debug Tool (`/cart-debug`)
- Debugs issues with specific carts
- Checks if a cart exists by test ID
- Verifies cart items and questions
- Provides detailed error information

### Cart Test Suite (`/cart-test`)
- Runs comprehensive tests on cart functionality
- Creates test carts and adds items
- Retrieves, updates, and deletes carts
- Verifies that all operations work correctly

### Run Migrations (`/run-migrations`)
- Executes all SQL migration files
- Creates necessary database tables
- Reports on migration success or failure

### Database Setup (`/setup-database`)
- Simple interface to set up database tables
- Creates required tables if they don't exist
- Provides feedback on setup success or failure

## Common Issues

### "Failed to save draft cart due to a database error"

This error typically occurs when:
1. The `carts` or `cart_items` tables don't exist
2. There are permission issues with the database
3. The database connection is not configured correctly

### "No cart items found for cart ID X"

This error can occur when:
1. The cart exists but has no items
2. The cart items were not saved correctly
3. The questions referenced by cart items don't exist

## Troubleshooting Steps

If you encounter database issues, follow these steps:

1. **Check Database Connection**
   - Verify that your Supabase URL and key are correct
   - Ensure your database is running and accessible

2. **Verify Table Existence**
   - Use the Database Test & Fix tool to check if required tables exist
   - Run migrations if tables are missing

3. **Test Cart Functionality**
   - Use the Cart Test Suite to verify all cart operations
   - Check for specific errors in the test results

4. **Debug Specific Carts**
   - If a particular cart is causing issues, use the Cart Debug tool
   - Provide the test ID of the problematic cart

5. **Manual Inspection**
   - If all else fails, inspect your database directly
   - Check table structures and data integrity

For additional help, contact support or refer to the application documentation. 