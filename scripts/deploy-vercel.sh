#!/bin/bash
# Vercel Deployment Script for WCT App

set -e # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Vercel deployment process for WCT App...${NC}"

# 1. Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found. Make sure you're in the project root directory.${NC}"
  exit 1
fi

# 2. Check for vercel.json
if [ ! -f "vercel.json" ]; then
  echo -e "${RED}Error: vercel.json not found. Please create it first.${NC}"
  exit 1
fi

# 3. Initialize the database
echo -e "${GREEN}Initializing production database...${NC}"
NODE_ENV=production node scripts/init-production-db.js

# 4. Login to Vercel if needed
echo -e "${YELLOW}Checking Vercel login status...${NC}"
vercel whoami > /dev/null 2>&1 || {
  echo -e "${YELLOW}Please login to Vercel:${NC}"
  vercel login
}

# 5. Deploy to Vercel
echo -e "${GREEN}Deploying to Vercel...${NC}"
echo -e "${YELLOW}Do you want to deploy to production? (y/n)${NC}"
read answer
if [ "$answer" = "y" ]; then
  vercel --prod
else
  vercel
fi

echo -e "${GREEN}Deployment process completed!${NC}"
echo -e "${YELLOW}Don't forget to:${NC}"
echo -e "  1. Verify the application is running correctly"
echo -e "  2. Check logs for any errors"
echo -e "  3. Test authentication functionality"
echo -e "  4. Set up any additional environment variables in the Vercel dashboard"

exit 0 