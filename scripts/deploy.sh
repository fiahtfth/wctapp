#!/bin/bash
# Production Deployment Script for WCT App
# This script prepares and deploys the application to production

set -e # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment process for WCT App...${NC}"

# 1. Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found. Make sure you're in the project root directory.${NC}"
  exit 1
fi

# 2. Check for required environment variables
echo -e "${YELLOW}Checking environment variables...${NC}"
if [ ! -f ".env.production" ]; then
  echo -e "${YELLOW}Warning: .env.production file not found. Creating from .env...${NC}"
  cp .env .env.production
  echo -e "${YELLOW}Please edit .env.production with your production values before continuing.${NC}"
  echo -e "${YELLOW}Press Enter to continue or Ctrl+C to abort...${NC}"
  read
fi

# 3. Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm ci

# 4. Run database initialization script
echo -e "${GREEN}Initializing production database...${NC}"
NODE_ENV=production node scripts/init-production-db.js

# 5. Build the application
echo -e "${GREEN}Building the application...${NC}"
npm run build

# 6. Run tests
echo -e "${GREEN}Running tests...${NC}"
npm test || {
  echo -e "${YELLOW}Warning: Tests failed. Do you want to continue with deployment? (y/n)${NC}"
  read answer
  if [ "$answer" != "y" ]; then
    echo -e "${RED}Deployment aborted.${NC}"
    exit 1
  fi
}

# 7. Deploy to production (adjust this based on your hosting provider)
echo -e "${GREEN}Deploying to production...${NC}"

# Uncomment the appropriate deployment method:

# For Vercel:
# vercel --prod

# For Netlify:
# netlify deploy --prod

# For custom server:
# rsync -avz --exclude 'node_modules' --exclude '.git' ./ user@your-server:/path/to/deployment/

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Don't forget to:${NC}"
echo -e "  1. Verify the application is running correctly"
echo -e "  2. Check logs for any errors"
echo -e "  3. Test critical functionality"

exit 0 