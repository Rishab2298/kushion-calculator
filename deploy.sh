#!/bin/bash

# Full deployment script for Cushion Calculator
# Usage: ./deploy.sh "commit message"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting full deployment...${NC}"

# Step 1: Git operations
COMMIT_MSG="${1:-Auto deploy}"

echo -e "\n${GREEN}[1/5] Git add...${NC}"
git add .

echo -e "${GREEN}[2/5] Git commit...${NC}"
git commit -m "$COMMIT_MSG" || echo -e "${YELLOW}Nothing to commit, continuing...${NC}"

echo -e "${GREEN}[3/5] Git push...${NC}"
git push origin main

# Step 2: Shopify app deploy
echo -e "\n${GREEN}[4/5] Shopify app deploy...${NC}"
shopify app deploy --force

# Step 3: Railway deploy
echo -e "\n${GREEN}[5/5] Railway deploy...${NC}"
railway up

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
