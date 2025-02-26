#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# 1. Install dependencies if needed
echo "📦 Checking dependencies..."
npm install

# 2. Run linting
echo "🧹 Running linter..."
npm run lint

# 3. Build the application
echo "🏗️ Building the application..."
npm run build

# 4. Ensure database is initialized
echo "🗄️ Ensuring database is initialized..."
if [ ! -f "./wct.db" ]; then
  echo "Database not found, initializing..."
  npm run build:db
  node scripts/init-db.js
fi

# 5. Deploy to Vercel
echo "🚀 Deploying to Vercel..."
npx vercel --prod

echo "✅ Deployment process completed!"
