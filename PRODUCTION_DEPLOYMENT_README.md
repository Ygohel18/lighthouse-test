# Production Deployment - Complete Guide

## Overview

This guide covers deploying the Lighthouse application in production with **NO PORT CONFLICTS** on the host machine.

## Files Created

### Docker Compose Files
1. **`docker-compose.production.yml`** - All services in Docker (MongoDB, Redis, MinIO, Backend, Frontend)
2. **`docker-compose.production-host-services.yml`** - Uses host MinIO/Redis, only MongoDB/Backend/Frontend in Docker

### Dockerfiles
1. **`backend/Dockerfile.production`** - Optimized multi-stage build for backend
2. **`frontend/Dockerfile.production`** - Optimized multi-stage build for frontend with standalone output

### Configuration Files
1. **`.env.production.example`** - Environment variables template
2. **`nginx/nginx.conf`** - Nginx main configuration
3. **`nginx/conf.d/lighthouse.conf`** - Lighthouse app configuration
4. **`mongodb-init/01-init.js`** - MongoDB initialization script

### Scripts
1. **`deploy-production.sh`** - Automated deployment script

## Port Binding Strategy

All services bind to `127.0.0.1` (localhost) only:

```yaml
ports:
  - "127.0.0.1:3000:3000"   # Frontend - NO external access
  - "127.0.0.1:8080:8080"   # Backend - NO external access
  - "127.0.0.1:27017:27017" # MongoDB - NO external access
  - "127.0.0.1:6379:6379"   # Redis - NO external access
  - "127.0.0.1:9000:9000"   # MinIO API - NO external access
  - "127.0.0.1:9001:9001"   # MinIO Console - NO external access
```

**Benefits:**
- ✅ No conflicts with host services
- ✅ Services not exposed to internet
- ✅ Host Nginx proxies to containers
- ✅ Secure by default

## Deployment Options

### Option 1: All Services in Docker (Recommended for Clean Setup)

Use this if you want everything containerized.

**File:** `docker-compose.production.yml`

**Includes:**
- MongoDB (Docker)
- Redis (Docker)
- MinIO (Docker)
- Backend (Docker)
- Frontend (Docker)
- Nginx (Docker - optional)

### Option 2: Use Host Services (Recommended for Existing Infrastructure)

Use this if you already have MinIO/Redis on the host.

**File:** `docker-compose.production-host-services.yml`

**Includes:**
- MongoDB (Docker)
- Backend (Docker)
- Frontend (Docker)

**Uses from Host:**
- MinIO (existing)
- Redis (existing - optional)

## Quick Start

### Step 1: Prepare Environment

```bash
# Copy environment template
cp .env.production.example .env.production

# Edit with your values
nano .env.production

# Generate secure passwords
openssl rand -base64 32
```

### Step 2: Choose Deployment Method

#### Method A: Automated Script (Easiest)

```bash
# Make script executable
chmod +x deploy-production.sh

# Run deployment
./deploy-production.sh
```

#### Method B: Manual Deployment

**For all services in Docker:**
```bash
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

**For host services:**
```bash
docker-compose -f docker-compose.production-host-services.yml build
docker-compose -f docker-compose.production-host-services.yml up -d
```

### Step 3: Configure Host Nginx

Create `/etc/nginx/sites-available/lighthouse`:

```nginx
upstream lighthouse_frontend {
    server 127.0.0.1:3000;
}

upstream lighthouse_backend {
    server 127.0.0.1:8080;
}

server {
    listen 80;
    server_name your-domain.com;
    
    client_max_body_size 10M;
    
    location /api/ {
        proxy_pass http://lighthouse_backend/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    location / {
        proxy_pass http://lighthouse_frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/lighthouse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: Create MinIO Bucket

```bash
# If using Docker MinIO
docker exec lighthouse-minio mc alias set local http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD
docker exec lighthouse-minio mc mb local/lighthouse-screenshots
docker exec lighthouse-minio mc anonymous set download local/lighthouse-screenshots

# If using host MinIO
mc alias set myminio http://localhost:9000 YOUR_ACCESS_KEY YOUR_SECRET_KEY
mc mb myminio/lighthouse-screenshots
mc anonymous set download myminio/lighthouse-screenshots
```

### Step 5: Verify Deployment

```bash
# Check containers
docker ps

# Check logs
docker-compose -f docker-compose.production.yml logs -f

# Test services
curl http://localhost:8080/health  # Backend
curl http://localhost:3000         # Frontend
curl http://your-domain.com        # Through Nginx
```

## Environment Variables

### Required Variables

```bash
# MongoDB
MONGO_USERNAME=lighthouse_admin
MONGO_PASSWORD=your_secure_password
MONGODB_URI=mongodb://lighthouse_admin:your_secure_password@mongodb:27017/lighthouse?authSource=admin

# MinIO/S3
S3_ENDPOINT=http://minio:9000  # or http://YOUR_VPS_IP:9000 for host MinIO
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=lighthouse-screenshots
S3_REGION=us-east-1

# MinIO Root (if using Docker MinIO)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your_minio_password
```

### Optional Variables

```bash
# Redis
REDIS_HOST=redis  # or host.docker.internal for host Redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Application
LOG_LEVEL=info
NODE_ENV=production
```

## Service URLs

### Internal (Docker Network)
- Frontend: `http://frontend:3000`
- Backend: `http://backend:8080`
- MongoDB: `mongodb://mongodb:27017`
- Redis: `redis://redis:6379`
- MinIO: `http://minio:9000`

### External (Host)
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

### Public (Through Nginx)
- Application: `http://your-domain.com`
- API: `http://your-domain.com/api`

## Management Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend

# Last 100 lines
docker logs lighthouse-backend --tail 100
```

### Restart Services
```bash
# All services
docker-compose -f docker-compose.production.yml restart

# Specific service
docker-compose -f docker-compose.production.yml restart backend
```

### Stop Services
```bash
docker-compose -f docker-compose.production.yml down
```

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

### Clean Up
```bash
# Remove stopped containers
docker-compose -f docker-compose.production.yml down

# Remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.production.yml down -v

# Clean up unused images
docker system prune -a
```

## Monitoring

### Check Service Health
```bash
# Container status
docker ps

# Resource usage
docker stats

# Specific container health
docker inspect lighthouse-backend | grep -A 10 Health
```

### Check Logs
```bash
# Backend logs
docker logs lighthouse-backend -f

# Frontend logs
docker logs lighthouse-frontend -f

# MongoDB logs
docker logs lighthouse-mongodb -f

# Nginx logs (if using Docker nginx)
docker logs lighthouse-nginx -f
```

## Backup

### MongoDB Backup
```bash
# Create backup
docker exec lighthouse-mongodb mongodump --out /tmp/backup
docker cp lighthouse-mongodb:/tmp/backup ./mongodb-backup-$(date +%Y%m%d)

# Restore backup
docker cp ./mongodb-backup-20240101 lighthouse-mongodb:/tmp/restore
docker exec lighthouse-mongodb mongorestore /tmp/restore
```

### MinIO Backup
```bash
# Using MinIO client
mc mirror myminio/lighthouse-screenshots ./minio-backup-$(date +%Y%m%d)

# Restore
mc mirror ./minio-backup-20240101 myminio/lighthouse-screenshots
```

## Troubleshooting

### Port Conflicts
```bash
# Check what's using a port
sudo netstat -tlnp | grep :8080

# Change port in docker-compose file
ports:
  - "127.0.0.1:8081:8080"  # Use 8081 instead
```

### Container Won't Start
```bash
# Check logs
docker logs lighthouse-backend

# Check if dependencies are ready
docker exec lighthouse-backend ping mongodb
```

### Can't Connect to Host Services
```bash
# From container, test host service
docker exec lighthouse-backend curl http://host.docker.internal:9000

# Make sure extra_hosts is set in docker-compose
extra_hosts:
  - "host.docker.internal:host-gateway"
```

### High Memory Usage
```bash
# Add memory limits to docker-compose.yml
deploy:
  resources:
    limits:
      memory: 1G
```

## Security Checklist

- [ ] Strong passwords in `.env.production`
- [ ] `.env.production` not in git (check `.gitignore`)
- [ ] Services bound to 127.0.0.1 only
- [ ] Firewall allows only 80, 443, 22
- [ ] SSL/TLS enabled (Let's Encrypt)
- [ ] Regular backups configured
- [ ] Log rotation enabled
- [ ] Non-root users in containers
- [ ] Health checks configured
- [ ] Resource limits set

## Performance Optimization

### Enable Nginx Caching
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;
proxy_cache my_cache;
proxy_cache_valid 200 60m;
```

### Optimize MongoDB
```yaml
mongodb:
  command: --wiredTigerCacheSizeGB 1.0
```

### Enable Gzip
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## Support

For issues, check:
1. Container logs: `docker logs lighthouse-backend`
2. Service status: `docker ps`
3. Network connectivity: `docker exec lighthouse-backend ping mongodb`
4. Environment variables: `docker exec lighthouse-backend env`
5. Nginx configuration: `sudo nginx -t`

## Summary

✅ All services in Docker with no port conflicts
✅ Services bound to localhost only
✅ Host Nginx proxies to containers
✅ Secure by default
✅ Easy to manage and update
✅ Production-ready with health checks
✅ Optimized multi-stage builds
✅ Automated deployment script
✅ Comprehensive monitoring
✅ Backup and restore procedures
