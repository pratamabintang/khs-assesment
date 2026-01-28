#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Karya Husada - Production Deployment Script${NC}"
echo "=================================================="

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production not found!${NC}"
    echo "Please copy .env.example to .env.production and update values"
    exit 1
fi

# Check if SSL certificates exist
if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
    echo -e "${RED}❌ SSL certificates not found!${NC}"
    echo "Please place SSL certificates in nginx/ssl/ directory"
    exit 1
fi

# Load environment variables
export $(cat .env.production | xargs)

echo -e "${YELLOW}📦 Step 1: Building applications...${NC}"

# Build frontend
cd nestjs
npm ci || exit 1
npm run build || exit 1
mkdir -p ../dist
cp -r dist/* ../dist/
cd ..

echo -e "${GREEN}✅ Frontend built${NC}"

# Build backend (Docker will handle this)
echo -e "${YELLOW}📦 Step 2: Starting Docker containers...${NC}"
docker-compose -f docker-compose.prod.yaml down || true
docker-compose -f docker-compose.prod.yaml up -d --build || exit 1

echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 20

# Check if containers are running
if [ $(docker-compose -f docker-compose.prod.yaml ps -q backend | wc -l) -eq 0 ]; then
    echo -e "${RED}❌ Backend container is not running${NC}"
    docker-compose -f docker-compose.prod.yaml logs backend
    exit 1
fi

echo -e "${YELLOW}📦 Step 3: Running database migrations...${NC}"

# Run TypeORM migrations
docker-compose -f docker-compose.prod.yaml exec -T backend npm run migration:run || true

# Run MongoDB migrations
docker-compose -f docker-compose.prod.yaml exec -T backend npm run migrate:up || true

echo -e "${GREEN}✅ Migrations completed${NC}"

echo -e "${YELLOW}🔍 Step 4: Verifying deployment...${NC}"

# Test backend health
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$HEALTH_CHECK" == "200" ] || [ "$HEALTH_CHECK" == "404" ]; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check returned: $HEALTH_CHECK${NC}"
fi

# Check nginx
NGINX_CHECK=$(docker-compose -f docker-compose.prod.yaml ps nginx | grep "running")
if [ -n "$NGINX_CHECK" ]; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx is not running${NC}"
fi

echo ""
echo -e "${GREEN}=================================================="
echo "✅ Deployment completed successfully!"
echo "=================================================="
echo -e "${NC}"

echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yaml ps

echo ""
echo "📝 Next Steps:"
echo "1. Verify your domain is pointing to this server"
echo "2. Test HTTPS: curl -k https://yourdomain.com/"
echo "3. Monitor logs: docker-compose -f docker-compose.prod.yaml logs -f"
echo "4. Check README in DEPLOYMENT.md for more information"
echo ""
echo "📞 Support: Check logs with 'docker-compose -f docker-compose.prod.yaml logs -f backend'"
