#!/bin/bash

# Deploy to Render script
# This script helps prepare and deploy the application to Render

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== WCT App Render Deployment Helper ===${NC}"
echo "This script will help you prepare your application for deployment to Render."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed. Please install git and try again.${NC}"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo -e "${RED}Error: Not in a git repository. Please run this script from within your git repository.${NC}"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}Warning: You have uncommitted changes.${NC}"
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment preparation cancelled."
        exit 1
    fi
fi

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo -e "${RED}Error: render.yaml not found. Make sure you're in the correct directory.${NC}"
    exit 1
fi

echo -e "\n${GREEN}Step 1: Checking for required files${NC}"
required_files=("render.yaml" "render-build.js" "src/lib/database/migrations/migrate-to-postgres.ts")
missing_files=0

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}Missing required file: $file${NC}"
        missing_files=$((missing_files+1))
    else
        echo -e "${GREEN}✓ Found $file${NC}"
    fi
done

if [ $missing_files -gt 0 ]; then
    echo -e "${RED}Error: $missing_files required files are missing. Please check the errors above.${NC}"
    exit 1
fi

echo -e "\n${GREEN}Step 2: Verifying database migration script${NC}"
if grep -q "runPostgresqlMigration" render-build.js; then
    echo -e "${GREEN}✓ PostgreSQL migration function found in render-build.js${NC}"
else
    echo -e "${RED}Error: PostgreSQL migration function not found in render-build.js${NC}"
    echo "Please make sure the render-build.js file includes the PostgreSQL migration function."
    exit 1
fi

echo -e "\n${GREEN}Step 3: Checking environment variables in render.yaml${NC}"
required_env_vars=("DB_TYPE" "POSTGRES_USER" "POSTGRES_PASSWORD" "POSTGRES_HOST" "POSTGRES_DB")
missing_env_vars=0

for env_var in "${required_env_vars[@]}"; do
    if ! grep -q "$env_var" render.yaml; then
        echo -e "${RED}Missing environment variable in render.yaml: $env_var${NC}"
        missing_env_vars=$((missing_env_vars+1))
    else
        echo -e "${GREEN}✓ Found environment variable: $env_var${NC}"
    fi
done

if [ $missing_env_vars -gt 0 ]; then
    echo -e "${RED}Error: $missing_env_vars required environment variables are missing in render.yaml${NC}"
    exit 1
fi

echo -e "\n${GREEN}Step 4: Checking PostgreSQL service in render.yaml${NC}"
if grep -q "type: postgres" render.yaml; then
    echo -e "${GREEN}✓ PostgreSQL service found in render.yaml${NC}"
else
    echo -e "${RED}Error: PostgreSQL service not found in render.yaml${NC}"
    echo "Please make sure the render.yaml file includes a PostgreSQL service."
    exit 1
fi

echo -e "\n${GREEN}All checks passed! Your application is ready for deployment to Render.${NC}"
echo -e "\n${YELLOW}Deployment Instructions:${NC}"
echo "1. Commit and push your changes to your git repository"
echo "2. Go to the Render Dashboard (https://dashboard.render.com)"
echo "3. Click 'New' > 'Blueprint'"
echo "4. Connect your repository"
echo "5. Render will automatically detect the render.yaml file and set up the services"
echo "6. Click 'Apply' to start the deployment"

echo -e "\n${YELLOW}Would you like to commit and push your changes now?${NC}"
read -p "Commit and push? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${GREEN}Committing changes...${NC}"
    git add .
    git commit -m "Prepare for Render deployment with PostgreSQL"
    
    echo -e "\n${GREEN}Pushing changes...${NC}"
    git push
    
    echo -e "\n${GREEN}Changes pushed successfully!${NC}"
    echo "Now go to the Render Dashboard to deploy your application."
else
    echo -e "\n${YELLOW}Skipping commit and push. Remember to do this manually before deploying.${NC}"
fi

echo -e "\n${GREEN}Done!${NC}"
