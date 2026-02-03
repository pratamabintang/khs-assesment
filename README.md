### 1. update .env

```bash
DB_PASSWORD=STRONG_PASSWORD_HERE
MONGO_INITDB_ROOT_PASSWORD=STRONG_PASSWORD_HERE
JWT_SECRET=GENERATE_NEW_SECRET_KEY
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
MAIL_HOST, MAIL_USER, MAIL_PASSWORD - configured
```

### 2. add ssl

pasang ssl dari sistem kedalam prod.conf

```bash
ssl_certificate     /etc/letsencrypt/live/karyahusadasejahtera.web.id/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/karyahusadasejahtera.web.id/privkey.pem;
```

### 3. crosscheck konfig

- update domain di `nginx/prod.conf`
- pastikan konfigurasi db `DB_HOST=postgres`, `MONGO_URI` sudah benar
- sesuaikan ulang cors_origin dengan domain

---

## langkah langkah deploy

### persiapan

```bash
ssh user@your_vps_ip

git clone your-repo.git
cd your-repo

cp .env.example .env
nano .env
```

### build app

```bash
cd nestjs && npm ci && cd ..
cd angular && npm ci && cd ..

cd nestjs
npm run build
mkdir -p ../dist
cp -r dist/* ../dist/
cd ..

cd angular
npm run build
cd ..
```

### Database Verification

```bash
# PostgreSQL
docker-compose exec postgres psql -U admin -d KHS -c "SELECT * FROM information_schema.tables;"

# MongoDB
docker-compose exec mongo mongosh -u admin -p your_password admin --eval "db.adminCommand('ping')"
```

---

## Monitoring & Maintenance

### View Logs

```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f backend
docker-compose logs -f nginx
```

### Database Backup

```bash
# PostgreSQL Backup
docker-compose exec postgres pg_dump -U admin KHS > backup_$(date +%Y%m%d).sql

# PostgreSQL Restore
docker-compose exec -T postgres psql -U admin KHS < backup_20260128.sql

# MongoDB Backup
docker-compose exec mongo mongodump --username admin --password your_password --authenticationDatabase admin --out /backup

# MongoDB Restore
docker-compose exec mongo mongorestore --username admin --password your_password --authenticationDatabase admin /backup
```

## Support & Documentation

- NestJS: https://docs.nestjs.com/
- Angular: https://angular.io/docs
- Docker: https://docs.docker.com/
- Nginx: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/docs/

---

# 🚀 Runbook Deploy & Reproduce Docker (KHS Assessment)

Dokumen ini berisi **urutan lengkap & reproducible** untuk menjalankan stack:
**Postgres + Mongo + Migration + NestJS Backend + Nginx**, termasuk **perintah migration**, **verifikasi**, dan **cek log saat error**.

> Lokasi contoh:
> `/opt/projects/khs-assesment`  
> (folder berisi `docker-compose.yaml` dan `Dockerfile`)

---

## 0️⃣ Pre-check (WAJIB, sekali saja)

### 0.1 Pastikan `.env` valid

Hal paling sering bikin error:

- ❌ `DB_HOST=localhost`
- ❌ `MONGO_URI=localhost`
- ✅ antar container harus pakai **nama service**

Cek cepat:

```bash
cat .env | egrep "DB_|MONGO_URI|JWT_SECRET|CORS_ORIGIN|API_BASE_URL|FE_URL"
```

Contoh **MONGO_URI yang benar**:

```env
MONGO_URI=mongodb://<user>:<pass>@mongo:27017/admin?authSource=admin
```

---

## 1️⃣ (Opsional) Reset total untuk reproduce dari nol

⚠️ **HATI-HATI: ini hapus semua data DB**

```bash
docker compose down
docker volume rm khs-assesment_postgres_prod_data khs-assesment_mongo_prod_data 2>/dev/null || true
```

Pastikan tidak ada container nyangkut:

```bash
docker ps -a | egrep "khs-|khs_"
```

---

## 2️⃣ Build Docker Images

Agar konsisten dengan source terbaru:

```bash
docker compose build migrate backend
```

Atau build bersih:

```bash
docker compose build --no-cache migrate backend
```

---

## 3️⃣ Jalankan Database (Postgres + Mongo)

```bash
docker compose up -d postgres mongo
docker compose ps
```

Tunggu sampai **healthy**.

### 3.1 Cek health

```bash
docker inspect khs-postgres-prod --format='{{.State.Health.Status}}'
docker inspect khs-mongo-prod --format='{{.State.Health.Status}}'
```

### 3.2 Cek log DB jika tidak healthy

```bash
docker logs --tail=200 khs-postgres-prod
docker logs --tail=200 khs-mongo-prod
```

---

## 4️⃣ Jalankan Migration (WAJIB)

⚠️ **JANGAN jalankan backend sebelum ini sukses**

```bash
docker compose run --rm migrate
```

Untuk debug manual:

```bash
docker compose run --rm migrate sh
cd /app/nestjs
npm run migration:run
npm run migrate:up
```

---

## 5️⃣ Verifikasi Migration

### 5.1 Postgres – cek tabel

```bash
docker exec -it khs-postgres-prod psql -U ${DB_USER} -d ${DB_DATABASE} -c "\dt public.*"
```

Tabel penting harus ada:

```bash
docker exec -it khs-postgres-prod psql -U ${DB_USER} -d ${DB_DATABASE} -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('user','employees','forget_password','survey','survey_question','survey_question_detail','survey_submissions');"
```

### 5.2 Cek riwayat migration

```bash
docker exec -it khs-postgres-prod psql -U ${DB_USER} -d ${DB_DATABASE} -c "SELECT * FROM public.migrations ORDER BY id;"
```

### 5.3 Mongo – test koneksi

```bash
docker exec -it khs-mongo-prod mongosh admin   -u ${MONGO_INITDB_ROOT_USERNAME}   -p ${MONGO_INITDB_ROOT_PASSWORD}   --eval "db.runCommand({ping:1})"
```

---

## 6️⃣ Jalankan Backend

```bash
docker compose up -d backend
docker compose ps
```

### 6.1 Cek log backend (PALING PENTING)

```bash
docker logs -f khs-backend-prod
```

### 6.2 Healthcheck backend

```bash
docker inspect khs-backend-prod --format='{{.State.Health.Status}}'
```

### 6.3 Tes backend langsung (tanpa nginx)

```bash
curl -i http://127.0.0.1:3000/api/auth/profile
```

---

## 7️⃣ Jalankan Nginx

```bash
docker compose up -d nginx
docker compose ps
```

### 7.1 Cek log nginx

```bash
docker logs -f khs-nginx-prod
```

### 7.2 Tes endpoint via domain

```bash
curl -i https://karyahusadasejahtera.web.id/api/auth/login
```

---

## 8️⃣ Test Auth Flow

### 8.1 Register

```bash
curl -i -X POST https://karyahusadasejahtera.web.id/api/auth/register   -H "Content-Type: application/json"   -d '{
    "name": "Admin KHS",
    "email": "admin@test.com",
    "phoneNumber": "+6281234567890",
    "password": "Admin123!",
    "province": "Jawa Tengah",
    "regency": "Semarang",
    "district": "Tembalang",
    "village": "Bulusan",
    "fullAddress": "Jl. Bulusan Raya No. 123"
  }'
```

### 8.2 Login

```bash
curl -i -X POST https://karyahusadasejahtera.web.id/api/auth/login   -H "Content-Type: application/json"   -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }'
```

---

## 9️⃣ Troubleshooting Cepat (500 Internal Server Error)

### 9.1 Backend

```bash
docker logs khs-backend-prod --tail=200
```

### 9.2 Nginx

```bash
docker logs khs-nginx-prod --tail=200
```

### 9.3 DB

```bash
docker exec -it khs-postgres-prod psql -U ${DB_USER} -d ${DB_DATABASE} -c "\dt"
```

---

## 🔟 One-liner Reproduce (tanpa reset volume)

```bash
docker compose build migrate backend && docker compose up -d postgres mongo && docker compose run --rm migrate && docker compose up -d backend nginx && docker compose ps
```

---

## ✅ Best Practice (Opsional)

Agar backend **tidak start sebelum migration sukses**, aktifkan di `docker-compose.yaml`:

```yaml
backend:
  depends_on:
    migrate:
      condition: service_completed_successfully
```

---

## 🎯 Ringkasan

1. DB up & healthy
2. Migration sukses
3. Verifikasi tabel
4. Backend up tanpa error
5. Nginx up
6. Auth register & login berjalan
