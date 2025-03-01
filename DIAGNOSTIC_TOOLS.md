# Diagnostic Tools Guide

This guide provides an overview of all the diagnostic tools available in the WCT application to help troubleshoot database and cart functionality issues.

## Table of Contents

1. [Diagnostic Tools Hub](#diagnostic-tools-hub)
2. [Database Test & Fix Tool](#database-test--fix-tool)
3. [Cart Debug Tool](#cart-debug-tool)
4. [Cart Test Suite](#cart-test-suite)
5. [Run Migrations Tool](#run-migrations-tool)
6. [Database Setup Tool](#database-setup-tool)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Diagnostic Tools Hub

**URL: `/diagnostic-tools`**

The Diagnostic Tools Hub is a central page that provides access to all diagnostic tools. It includes:

- Links to all available diagnostic tools
- Brief descriptions of each tool's purpose
- Icons for easy identification

Use this page as your starting point when troubleshooting database or cart issues.

## Database Test & Fix Tool

**URL: `/database-test`**

This tool performs a comprehensive check of your database setup and can automatically fix common issues:

- Tests database connection
- Checks for required tables (`carts`, `cart_items`, `questions`)
- Creates missing tables if needed
- Verifies cart functionality by creating and retrieving a test cart

**When to use:**
- When you're experiencing general database issues
- After setting up a new database
- When you're not sure if your database is configured correctly

## Cart Debug Tool

**URL: `/cart-debug`**

This tool helps diagnose issues with specific carts by their test ID:

- Checks if required tables exist
- Retrieves cart details by test ID
- Fetches associated cart items
- Verifies that questions linked to cart items exist

**When to use:**
- When a specific cart is causing issues
- When cart items aren't loading correctly
- When you need to inspect the contents of a cart

## Cart Test Suite

**URL: `/cart-test`**

This tool runs a comprehensive suite of tests on the cart functionality:

- Creates a test cart
- Adds items to the cart
- Retrieves the cart by test ID
- Updates the cart
- Replaces cart items
- Deletes the cart

**When to use:**
- To verify that all cart operations work correctly
- After making changes to the cart functionality
- When troubleshooting complex cart issues

## Run Migrations Tool

**URL: `/run-migrations`**

This tool executes all SQL migration files in the `supabase/migrations` directory:

- Runs each SQL file in alphabetical order
- Creates necessary database tables and functions
- Reports on the success or failure of each migration

**When to use:**
- When setting up a new database
- After adding new migration files
- When you need to ensure all database objects are created

## Database Setup Tool

**URL: `/setup-database`**

This simple tool creates the required database tables for cart functionality:

- Creates `carts`, `cart_items`, and `questions` tables if they don't exist
- Adds necessary indexes for performance
- Provides feedback on setup success or failure

**When to use:**
- When you need a quick way to set up the database
- When you're encountering "table does not exist" errors
- As a first step in troubleshooting database issues

## Troubleshooting Common Issues

### "Failed to save draft cart due to a database error"

**Possible causes:**
1. Missing database tables
2. Database connection issues
3. Permission problems

**Solution:**
1. Use the Database Test & Fix Tool to check and fix your database setup
2. If that doesn't work, try the Run Migrations Tool
3. Check the browser console for specific error messages

### "No cart items found for cart ID X"

**Possible causes:**
1. The cart exists but has no items
2. The cart items were not saved correctly
3. The questions referenced by cart items don't exist

**Solution:**
1. Use the Cart Debug Tool with the specific test ID
2. Check if cart items exist and have valid question IDs
3. Verify that the questions table contains the referenced question IDs

### "Error loading draft cart"

**Possible causes:**
1. The cart doesn't exist with the given test ID
2. Database connection issues
3. Table structure problems

**Solution:**
1. Use the Cart Debug Tool to check if the cart exists
2. Run the Cart Test Suite to verify cart functionality
3. Check the browser console for specific error messages

## Recommended Troubleshooting Workflow

If you're experiencing issues with the cart functionality, follow these steps:

1. Start with the **Database Test & Fix Tool** to ensure your database is set up correctly
2. If issues persist, use the **Run Migrations Tool** to apply all migrations
3. For specific cart issues, use the **Cart Debug Tool** with the relevant test ID
4. To verify overall cart functionality, run the **Cart Test Suite**
5. If all else fails, check the browser console for specific error messages and refer to the [Database Setup Guide](DATABASE_SETUP.md) 