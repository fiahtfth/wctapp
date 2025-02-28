#!/bin/bash

# Set environment variables
export DB_TYPE=postgres
export POSTGRES_USER=academicdirector
export POSTGRES_HOST=localhost
export POSTGRES_DB=wctdb
export POSTGRES_PASSWORD=
export POSTGRES_PORT=5432

# Run the application
npm run dev
