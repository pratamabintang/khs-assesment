# 🚀 Production Deployment Guide - Karya Husada

## Prerequisites

- Docker & Docker Compose installed on VPS
- Domain name configured and pointing to VPS IP
- SSL certificates (Let's Encrypt atau sertifikat lain)
- PostgreSQL & MongoDB knowledge
- Nginx familiarity

## Pre-Deployment Checklist

### 1. Environment Setup ✅

- [ ] Update `.env.production` dengan nilai yang benar:
  ```bash
  DB_PASSWORD=STRONG_PASSWORD_HERE
  MONGO_INITDB_ROOT_PASSWORD=STRONG_PASSWORD_HERE
  JWT_SECRET=GENERATE_NEW_SECRET_KEY
  CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
  MAIL_HOST, MAIL_USER, MAIL_PASSWORD - configured
  ```

### 2. SSL Certificates ✅

- [ ] Tempatkan SSL certificates di `nginx/ssl/`:

  ```bash
  nginx/ssl/
  ├── cert.pem      # Public certificate
  └── key.pem       # Private key
  ```

  **Generate with Let's Encrypt (recommended):**

  ```bash
  sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

  # Copy to nginx/ssl/
  sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
  sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
  sudo chmod 644 nginx/ssl/*
  ```

### 3. Update Configuration ✅

- [ ] Update `nginx/prod.conf` - replace `yourdomain.com` dengan domain Anda
- [ ] Verify `DB_HOST=postgres`, `MONGO_URI` sudah benar (using docker hostname)
- [ ] Check `CORS_ORIGIN` matches frontend domain

---

## Deployment Steps

### Step 1: Clone & Prepare

```bash
# SSH ke VPS
ssh user@your_vps_ip

# Clone repository
git clone your-repo.git
cd your-repo

# Create .env.production
cp .env.example .env.production
# Edit dengan production values:
nano .env.production
```

### Step 2: Setup SSL

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Option A: Using Let's Encrypt (Recommended)
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
sudo chmod 644 nginx/ssl/*

# Option B: Self-signed (Development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem
```

### Step 3: Update Nginx Config

```bash
# Edit nginx config to match your domain
sed -i 's/yourdomain.com/your-actual-domain.com/g' nginx/prod.conf
```

### Step 4: Build Applications

```bash
# Install Node dependencies
cd nestjs && npm ci && cd ..
cd angular && npm ci && cd ..

# Build frontend
cd nestjs
npm run build
mkdir -p ../dist
cp -r dist/* ../dist/
cd ..

# Build backend (will be done by Docker)
cd angular
npm run build
cd ..
```

### Step 5: Start Docker Containers

```bash
# Load environment variables
export $(cat .env.production | xargs)

# Build and start containers
docker-compose -f docker-compose.prod.yaml up -d

# Verify containers are running
docker-compose -f docker-compose.prod.yaml ps

# Check logs
docker-compose -f docker-compose.prod.yaml logs -f backend
```

### Step 6: Run Database Migrations

```bash
# Wait for PostgreSQL to be healthy (10-15 seconds)
sleep 15

# Run TypeORM migrations
docker-compose -f docker-compose.prod.yaml exec backend npm run migration:run

# Run MongoDB migrations
docker-compose -f docker-compose.prod.yaml exec backend npm run migrate:up
```

### Step 7: Setup Auto-Renewal for SSL (Let's Encrypt)

```bash
# Test renewal
sudo certbot renew --dry-run

# Add cron job for auto-renewal
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /path/to/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /path/to/nginx/ssl/key.pem && docker-compose -f /path/to/docker-compose.prod.yaml exec -T nginx nginx -s reload
```

---

## Verification & Testing

### Health Checks

```bash
# Check all containers
docker-compose -f docker-compose.prod.yaml ps

# Check backend health
curl http://localhost:3000/health

# Check nginx
curl http://localhost -H "Host: yourdomain.com"

# Check HTTPS
curl -k https://yourdomain.com/
```

### Database Verification

```bash
# PostgreSQL
docker-compose -f docker-compose.prod.yaml exec postgres \
  psql -U admin -d KHS -c "SELECT * FROM information_schema.tables;"

# MongoDB
docker-compose -f docker-compose.prod.yaml exec mongo \
  mongosh -u admin -p your_password admin --eval "db.adminCommand('ping')"
```

---

## Monitoring & Maintenance

### View Logs

```bash
# All containers
docker-compose -f docker-compose.prod.yaml logs -f

# Specific container
docker-compose -f docker-compose.prod.yaml logs -f backend
docker-compose -f docker-compose.prod.yaml logs -f nginx
```

### Database Backup

```bash
# PostgreSQL Backup
docker-compose -f docker-compose.prod.yaml exec postgres \
  pg_dump -U admin KHS > backup_$(date +%Y%m%d).sql

# PostgreSQL Restore
docker-compose -f docker-compose.prod.yaml exec -T postgres \
  psql -U admin KHS < backup_20260128.sql

# MongoDB Backup
docker-compose -f docker-compose.prod.yaml exec mongo \
  mongodump --username admin --password your_password --authenticationDatabase admin --out /backup

# MongoDB Restore
docker-compose -f docker-compose.prod.yaml exec mongo \
  mongorestore --username admin --password your_password --authenticationDatabase admin /backup
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.prod.yaml restart

# Restart specific service
docker-compose -f docker-compose.prod.yaml restart backend
docker-compose -f docker-compose.prod.yaml restart nginx
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yaml down
docker-compose -f docker-compose.prod.yaml up -d --build

# Run migrations if needed
docker-compose -f docker-compose.prod.yaml exec backend npm run migration:run
```

---

## Security Considerations

### ✅ Already Implemented

- [x] Non-root user in Docker
- [x] SSL/TLS encryption
- [x] Security headers (HSTS, CSP, X-Frame-Options)
- [x] Rate limiting (API & Login endpoints)
- [x] CORS configuration
- [x] Health checks
- [x] Gzip compression
- [x] Input validation (Nest ValidationPipe)

### ⚠️ Additional Recommendations

1. **Firewall Rules**: Only allow ports 80, 443, 22 (SSH)

   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **SSH Security**: Disable password authentication

   ```bash
   # Edit /etc/ssh/sshd_config
   PasswordAuthentication no
   PubkeyAuthentication yes

   sudo systemctl restart ssh
   ```

3. **Database Security**:
   - Use strong passwords (40+ characters)
   - Change default credentials in .env.production
   - Regular backups to separate secure location
   - Monitor failed authentication attempts

4. **Application Secrets**:
   - Generate new JWT_SECRET with: `openssl rand -base64 32`
   - Store secrets in `.env.production` (not in git)
   - Rotate secrets regularly

5. **Monitoring**:
   - Setup log aggregation (e.g., ELK Stack)
   - Monitor resource usage
   - Setup alerts for errors
   - Regular security audits

6. **Backup Strategy**:
   - Daily automated database backups
   - Store backups in separate location
   - Test restore procedures
   - Keep application files in git

---

## Troubleshooting

### Docker won't start

```bash
# Check docker daemon
sudo systemctl status docker

# Check docker logs
sudo journalctl -u docker -f
```

### Backend container keeps restarting

```bash
# Check logs
docker-compose -f docker-compose.prod.yaml logs -f backend

# Check if ports are in use
sudo lsof -i :3000

# Verify environment variables
docker-compose -f docker-compose.prod.yaml exec backend env | grep -i db
```

### Database connection fails

```bash
# Check if postgres is healthy
docker-compose -f docker-compose.prod.yaml ps postgres

# Test connection
docker-compose -f docker-compose.prod.yaml exec postgres \
  psql -U admin -d KHS -c "SELECT 1;"
```

### SSL certificate issues

```bash
# Verify certificate
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Check if port 443 is listening
sudo netstat -tulpn | grep 443
```

---

## Support & Documentation

- NestJS: https://docs.nestjs.com/
- Angular: https://angular.io/docs
- Docker: https://docs.docker.com/
- Nginx: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/docs/

---

**Last Updated**: January 28, 2026
**Version**: 1.0.0
