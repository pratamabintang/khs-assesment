#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🏗️  Starting Production Build...${NC}"

# Build Frontend
echo -e "${YELLOW}📦 Building Frontend (Angular)...${NC}"
cd nestjs
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Copy built files to dist for nginx
mkdir -p ../dist
cp -r dist/* ../dist/
cd ..

echo -e "${YELLOW}📦 Building Backend (NestJS)...${NC}"
cd angular
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi
cd ..

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo -e "${YELLOW}📁 Frontend files: ./dist${NC}"
echo -e "${YELLOW}📁 Backend files: ./angular/dist${NC}"
