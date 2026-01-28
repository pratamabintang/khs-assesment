# 📋 Production Deployment Checklist

## 🔐 Security & Configuration

<!--
- [ ] Update `.env.production` with strong passwords
  - [ ] `DB_PASSWORD` - min 32 characters, mixed case, numbers, symbols
  - [ ] `MONGO_INITDB_ROOT_PASSWORD` - min 32 characters
  - [ ] `JWT_SECRET` - generated with `openssl rand -base64 32`
  - [ ] `MAIL_PASSWORD` - app-specific password, not account password
  - [ ] `CORS_ORIGIN` - exact domain(s) only -->

<!-- - [ ] SSL Certificates configured
  - [ ] Certificate file: `nginx/ssl/cert.pem`
  - [ ] Private key file: `nginx/ssl/key.pem`
  - [ ] Certificates are valid and not self-signed (for production)
  - [ ] Certificate renewal strategy in place (Let's Encrypt auto-renewal) -->

<!-- - [ ] Nginx configuration updated
  - [ ] `yourdomain.com` replaced with actual domain
  - [ ] SSL paths correct
  - [ ] Rate limiting enabled for login endpoints
  - [ ] Security headers configured -->

## 📦 Application Setup

- [ ] Dependencies installed
  - [ ] `cd angular && npm ci && cd ..`
  - [ ] `cd nestjs && npm ci && cd ..`

- [ ] Frontend build successful
  - [ ] `cd nestjs && npm run build && cd ..`
  - [ ] Built files in `dist/` directory

- [ ] Backend build configuration
  - [ ] `Dockerfile` exists and is correct
  - [ ] `main.ts` configured for production mode
  - [ ] Environment variables properly injected

## 🗄️ Database Preparation

- [ ] PostgreSQL database ready
  - [ ] Database name: `KHS`
  - [ ] User created with strong password
  - [ ] Connection string tested

- [ ] MongoDB database ready
  - [ ] Root user created with strong password
  - [ ] Connection URI correct in `.env.production`
  - [ ] Databases and collections ready

- [ ] Migrations tested locally
  - [ ] TypeORM migrations in `angular/migrations/`
  - [ ] MongoDB migrations in `migrations/`
  - [ ] Both run successfully in development

## 🐳 Docker & Containers

- [ ] Docker & Docker Compose installed
  - [ ] Version check: `docker --version`
  - [ ] Version check: `docker-compose --version`

- [ ] Docker images building
  - [ ] `docker-compose -f docker-compose.prod.yaml build`
  - [ ] No build errors

- [ ] Network configuration
  - [ ] `khs-network` bridge network for inter-container communication
  - [ ] All services on same network

## 🚀 Deployment Process

- [ ] Pre-deployment backup
  - [ ] Code backed up to git
  - [ ] Database backed up (if upgrading existing)

- [ ] Dry run completed
  - [ ] Run `docker-compose -f docker-compose.prod.yaml up`
  - [ ] Verify all containers healthy
  - [ ] Test API endpoints
  - [ ] Test frontend loading

- [ ] Production deployment
  - [ ] SSH access ready
  - [ ] Domain DNS configured
  - [ ] Firewall rules configured (80, 443, 22)

## ✅ Post-Deployment Verification

- [ ] All containers running

  ```bash
  docker-compose -f docker-compose.prod.yaml ps
  ```

- [ ] Backend responding

  ```bash
  curl http://localhost:3000/health
  ```

- [ ] Frontend accessible

  ```bash
  curl http://localhost/
  ```

- [ ] HTTPS working

  ```bash
  curl -k https://yourdomain.com/
  ```

- [ ] Database connections
  - [ ] PostgreSQL accessible
  - [ ] MongoDB accessible
  - [ ] Tables/Collections exist

- [ ] API endpoints tested
  - [ ] Authentication working
  - [ ] CORS headers correct
  - [ ] Rate limiting working

- [ ] Monitoring & Logs
  - [ ] Container logs accessible
  - [ ] No error stack traces visible to users
  - [ ] Security headers present (HSTS, CSP, etc.)

## 📊 Monitoring Setup

- [ ] Log rotation configured
  - [ ] Docker logging driver: `json-file`
  - [ ] Max file size: `10m`
  - [ ] Max files: `3`

- [ ] Health checks running
  - [ ] Backend health endpoint responding
  - [ ] Container health checks enabled

- [ ] Resource limits (optional but recommended)
  - [ ] Memory limits set
  - [ ] CPU limits set
  - [ ] Disk space monitored

## 🔄 Backup & Recovery

- [ ] Database backup strategy
  - [ ] Automated daily PostgreSQL backups
  - [ ] Automated daily MongoDB backups
  - [ ] Backups stored separately from VPS

- [ ] Restore process tested
  - [ ] Can restore from PostgreSQL backup
  - [ ] Can restore from MongoDB backup
  - [ ] Documented recovery procedure

## 🛡️ Security Hardening

- [ ] Firewall rules

  ```bash
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw enable
  ```

- [ ] SSH security
  - [ ] Password auth disabled
  - [ ] Key-based auth only
  - [ ] Non-standard port (optional)

- [ ] File permissions
  - [ ] Nginx SSL directory protected
  - [ ] `.env.production` not readable by public
  - [ ] Docker socket protected

- [ ] Application security
  - [ ] ValidationPipe enabled (input validation)
  - [ ] CORS properly configured
  - [ ] Rate limiting enabled
  - [ ] JWT tokens configured

## 📝 Documentation

- [ ] DEPLOYMENT.md reviewed
- [ ] Team trained on deployment process
- [ ] Rollback procedure documented
- [ ] Contact info for support updated

## 🎯 Final Checks

- [ ] Test user registration/login
- [ ] Test API response times
- [ ] Test file uploads
- [ ] Test email notifications
- [ ] Test PDF generation (if applicable)

---

## 🚨 Troubleshooting Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yaml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yaml logs -f backend

# Check running containers
docker-compose -f docker-compose.prod.yaml ps

# Restart service
docker-compose -f docker-compose.prod.yaml restart backend

# Access backend container
docker-compose -f docker-compose.prod.yaml exec backend /bin/sh

# View environment variables
docker-compose -f docker-compose.prod.yaml exec backend env

# Test database connection
docker-compose -f docker-compose.prod.yaml exec postgres psql -U admin -d KHS -c "SELECT 1;"
```

---

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Completed

Date Started: **\*\***\_\_\_**\*\***
Date Completed: **\*\***\_\_\_**\*\***
Deployed By: **\*\***\_\_\_**\*\***
