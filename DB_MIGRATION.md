# Database Migration: SQLite to PostgreSQL

This document outlines the steps to migrate the application database from SQLite to PostgreSQL.

## Prerequisites

1. PostgreSQL installed and running
2. Node.js and npm installed
3. ts-node installed globally (`npm install -g ts-node typescript`)

## Migration Steps

### 1. Create PostgreSQL Database

```bash
createdb wctdb
```

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```
# Database Type
DB_TYPE=postgres

# PostgreSQL Configuration
POSTGRES_USER=academicdirector  # Replace with your PostgreSQL username
POSTGRES_HOST=localhost
POSTGRES_DB=wctdb
POSTGRES_PASSWORD=              # Add your password if required
POSTGRES_PORT=5432
```

### 3. Run Migration Script

```bash
# Using npm script
npm run migrate:postgres

# Or directly
ts-node src/lib/database/migrations/run-migration.ts
```

This script will:
- Create the necessary tables in PostgreSQL
- Transfer all data from SQLite to PostgreSQL
- Set up sequences for auto-incrementing IDs

### 4. Run the Application with PostgreSQL

```bash
# Using the convenience script
npm run start:postgres

# Or directly
./run-with-postgres.sh
```

## Switching Between Databases

The application now supports both SQLite and PostgreSQL. You can switch between them using the following commands:

### Run with PostgreSQL

```bash
npm run start:postgres
```

### Run with SQLite

```bash
npm run start:sqlite
```

## Database Adapter

The application uses a database adapter that automatically handles the differences between SQLite and PostgreSQL. The adapter:

1. Detects the database type from the `DB_TYPE` environment variable
2. Converts query parameters between SQLite and PostgreSQL formats
3. Normalizes the result format to be consistent across both databases
4. Handles transactions appropriately for each database type

## Troubleshooting

### Connection Issues

If you encounter connection issues, check:
- PostgreSQL is running (`pg_isready`)
- Database exists (`psql -l`)
- User has appropriate permissions
- Environment variables are correctly set

### Data Migration Issues

If data migration fails:
- Check the PostgreSQL logs (`tail -f /usr/local/var/log/postgres.log`)
- Ensure SQLite database is not corrupted
- Verify table schemas match between SQLite and PostgreSQL

### Foreign Key Constraint Errors

If you see foreign key constraint errors:
- Verify that the user IDs in the PostgreSQL database match those referenced in other tables
- Check if the migration script completed successfully
- You may need to manually fix references in the database

### User ID Issues

The application is designed to handle user ID differences between SQLite and PostgreSQL. If you encounter issues:
- Check the actual user IDs in your PostgreSQL database: `SELECT id, username FROM users;`
- Verify that the code is using valid user IDs when creating carts

## Reverting to SQLite

To revert to SQLite, simply set:

```
DB_TYPE=sqlite
```

Or remove the `DB_TYPE` environment variable entirely, as SQLite is the default.
