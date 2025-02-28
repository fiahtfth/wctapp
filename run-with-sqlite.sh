#!/bin/bash

# Set environment variables
export DB_TYPE=sqlite
unset POSTGRES_USER
unset POSTGRES_HOST
unset POSTGRES_DB
unset POSTGRES_PASSWORD
unset POSTGRES_PORT

# Run the application
npm run dev
