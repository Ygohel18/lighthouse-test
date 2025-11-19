# Deployment Guide: VPS with Existing Nginx & MinIO

## Overview
This guide covers deploying the Lighthouse application using Docker on a VPS that already has:
- ✅ Nginx installed and running (port 80/443)
- ✅ MinIO installed and running (port 9000/9001)
- ✅ MongoDB may or may not be installed

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VPS Server                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐                                            │
│  │ Host Nginx   │ :80, :443                                  │
│  │ (Reverse     │                                            │
│  │  Proxy)      │                                            │
│  └──────┬───────┘                                            │
│         │                                                     │
│         ├──────────────┬──────────────┬──────────────┐      │
│         │              │              │              │       │
│         ▼              ▼              ▼              ▼       │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐│
│  │ Frontend │   │ Backend  │   │ MongoDB  │   │  MinIO   ││
│  │ (Docker) │   │ (Docker) │   │ (Docker) │   │  (Host)  ││
│  │  :3000   │   │  :8080   │   │  :27017  │   │  :9000   ││
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### On Your VPS:
- Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- Nginx installed and running
- MinIO installed and running
- Domain name pointed to your VPS (optional but recommended)
- Root or sudo access

### Check Existing Services:
```bash
# Check Nginx
sudo systemctl status nginx
sudo netstat -tlnp | grep :80

# Check MinIO
sudo systemctl status minio
sudo netstat -tlnp | grep :9000

# Check available ports
sudo netstat -tlnp | grep -E ':(3000|8080|27017)'
```

## Step 1: Prepare the Application

### 1.1 Clone or Upload Your Code
```bash
# SSH into your VPS
ssh user@your-vps-ip

# Create application directory
sudo mkdir -p /opt/lighthouse-app
cd /opt/lighthouse-app

# Upload your code (use git, scp, or rsync)
# Option A: Git
git clone https://github.com/yourusername/lighthouse-app.git .

# Option B: SCP from local machine
# scp -r /path/to/lighthouse-app user@your-vps-ip:/opt/lighthouse-app/
```

### 1.2 Set Proper Permissions
```bash
sudo chown -R $USER:$USER /opt/lighthouse-app
chmod -R 755 /opt/lighthouse-app
```

## Step 2: Configure Docker Compose

### 2.1 Create Production Docker Compose File
Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # MongoDB (only if not installed on host)
  mongodb:
    image: mongo:7
    container_name: lighthouse-mongodb
    restart: unless-stopped
    ports:
      - "127.0.0.1:27017:27017"  # Bind to localhost only
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - lighthouse-network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: lighthouse-backend
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:8080"  # Bind to localhost only
    environment:
      NODE_ENV: production
      PORT: 8080
      MONGODB_URI: ${MONGODB_URI}
      S3_ENDPOINT: ${S3_ENDPOINT}
      S3_ACCESS_KEY_ID: ${S3_ACCESS_KEY_ID}
      S3_SECRET_ACCESS_KEY: ${S3_SECRET_ACCESS_KEY}
      S3_BUCKET_NAME: ${S3_BUCKET_NAME}
      S3_REGION: ${S3_REGION}
    depends_on:
      - mongodb
    networks:
      - lighthouse-network

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_BASE_URL: /api
    container_name: lighthouse-frontend
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"  # Bind to localhost only
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_BASE_URL: /api
    depends_on:
      - backend
    networks:
      - lighthouse-network

networks:
  lighthouse-network:
    driver: bridge

volumes:
  mongodb_data:
```

### 2.2 Create Environment File
Create `.env.production`:

```bash
# MongoDB Configuration
MONGO_USERNAME=lighthouse_user
MONGO_PASSWORD=your_secure_password_here
MONGODB_URI=mongodb://lighthouse_user:your_secure_password_here@mongodb:27017/lighthouse?authSource=admin

# MinIO/S3 Configuration (using host MinIO)
S3_ENDPOINT=http://YOUR_VPS_IP:9000
S3_ACCESS_KEY_ID=your_minio_access_key
S3_SECRET_ACCESS_KEY=your_minio_secret_key
S3_BUCKET_NAME=lighthouse-screenshots
S3_REGION=us-east-1

# Application
NODE_ENV=production
```

**Important Notes:**
- Replace `YOUR_VPS_IP` with your actual VPS IP address
- Use your existing MinIO credentials
- Generate strong passwords for MongoDB

## Step 3: Configure Host Nginx

### 3.1 Create Nginx Configuration
Create `/etc/nginx/sites-available/lighthouse`:

```nginx
# Upstream definitions
upstream lighthouse_frontend {
    server 127.0.0.1:3000;
}

upstream lighthouse_backend {
    server 127.0.0.1:8080;
}

# HTTP to HTTPS redirect (if using SSL)
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # For Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Main HTTPS server (or HTTP if no SSL)
server {
    listen 443 ssl http2;
    # listen 80;  # Use this instead if no SSL
    
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration (if using SSL)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logging
    access_log /var/log/nginx/lighthouse-access.log;
    error_log /var/log/nginx/lighthouse-error.log;
    
    # Client body size (for uploads)
    client_max_body_size 10M;
    
    # Backend API proxy
    location /api/ {
        proxy_pass http://lighthouse_backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # Frontend proxy
    location / {
        proxy_pass http://lighthouse_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Next.js specific
    location /_next/static {
        proxy_pass http://lighthouse_frontend;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3.2 Enable the Site
```bash
# Test nginx configuration
sudo nginx -t

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/lighthouse /etc/nginx/sites-enabled/

# Reload nginx
sudo systemctl reload nginx
```

## Step 4: Configure MinIO Bucket

### 4.1 Access MinIO Console
```bash
# Open in browser
http://YOUR_VPS_IP:9001

# Or use MinIO client
mc alias set myminio http://YOUR_VPS_IP:9000 YOUR_ACCESS_KEY YOUR_SECRET_KEY
```

### 4.2 Create Bucket
```bash
# Using MinIO client
mc mb myminio/lighthouse-screenshots

# Set public read policy (for signed URLs to work)
mc anonymous set download myminio/lighthouse-screenshots

# Or create via MinIO Console UI
```

## Step 5: Deploy with Docker

### 5.1 Build and Start Services
```bash
cd /opt/lighthouse-app

# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 5.2 Verify Services
```bash
# Check if containers are running
docker ps

# Test backend
curl http://localhost:8080/health

# Test frontend
curl http://localhost:3000

# Test through nginx
curl http://your-domain.com
```

## Step 6: SSL Certificate (Optional but Recommended)

### 6.1 Install Certbot
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2 Obtain Certificate
```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Start nginx
sudo systemctl start nginx

# Or use nginx plugin (without stopping)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 6.3 Auto-renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job
# Verify it exists
sudo systemctl status certbot.timer
```

## Step 7: Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if not already allowed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 8: Monitoring and Maintenance

### 8.1 View Logs
```bash
# Docker logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Nginx logs
sudo tail -f /var/log/nginx/lighthouse-access.log
sudo tail -f /var/log/nginx/lighthouse-error.log
```

### 8.2 Restart Services
```bash
# Restart all containers
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# Reload nginx
sudo systemctl reload nginx
```

### 8.3 Update Application
```bash
cd /opt/lighthouse-app

# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Port Conflicts
```bash
# Check what's using a port
sudo netstat -tlnp | grep :8080

# If port is in use, change it in docker-compose.prod.yml
# Example: "127.0.0.1:8081:8080" instead of "127.0.0.1:8080:8080"
```

### Container Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Check if MongoDB is accessible
docker exec -it lighthouse-backend ping mongodb

# Check environment variables
docker exec -it lighthouse-backend env
```

### Nginx 502 Bad Gateway
```bash
# Check if backend is running
curl http://localhost:8080

# Check nginx error log
sudo tail -f /var/log/nginx/lighthouse-error.log

# Verify upstream configuration
sudo nginx -t
```

### MinIO Connection Issues
```bash
# Test MinIO from backend container
docker exec -it lighthouse-backend curl http://YOUR_VPS_IP:9000

# Check MinIO is running
sudo systemctl status minio

# Verify S3 credentials in .env.production
```

## Security Best Practices

1. **Use Strong Passwords**
   - MongoDB passwords
   - MinIO access keys

2. **Firewall Rules**
   - Only expose ports 80, 443, and 22
   - Block direct access to 3000, 8080, 27017, 9000

3. **SSL/TLS**
   - Always use HTTPS in production
   - Keep certificates up to date

4. **Regular Updates**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Update Docker images
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Backup Strategy**
   ```bash
   # Backup MongoDB
   docker exec lighthouse-mongodb mongodump --out /backup
   
   # Backup MinIO data
   mc mirror myminio/lighthouse-screenshots /backup/minio/
   ```

## Performance Optimization

### 1. Enable Nginx Caching
Add to nginx config:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
proxy_cache my_cache;
```

### 2. Enable Gzip Compression
```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### 3. Docker Resource Limits
Add to docker-compose.prod.yml:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

## Maintenance Scripts

### Auto-restart Script
Create `/opt/lighthouse-app/restart.sh`:
```bash
#!/bin/bash
cd /opt/lighthouse-app
docker-compose -f docker-compose.prod.yml restart
sudo systemctl reload nginx
echo "Services restarted at $(date)" >> /var/log/lighthouse-restart.log
```

### Backup Script
Create `/opt/lighthouse-app/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/backup/lighthouse/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker exec lighthouse-mongodb mongodump --out /tmp/backup
docker cp lighthouse-mongodb:/tmp/backup $BACKUP_DIR/mongodb

# Backup application code
tar -czf $BACKUP_DIR/app-code.tar.gz /opt/lighthouse-app

echo "Backup completed at $(date)" >> /var/log/lighthouse-backup.log
```

Make executable:
```bash
chmod +x /opt/lighthouse-app/*.sh
```

## Support

For issues:
1. Check logs first
2. Verify all services are running
3. Test connectivity between services
4. Review nginx configuration
5. Check firewall rules

## Summary

✅ Docker containers run on localhost only (127.0.0.1)
✅ Host Nginx proxies requests to containers
✅ No port conflicts with existing services
✅ MinIO on host is accessible to Docker containers
✅ MongoDB runs in Docker (isolated)
✅ SSL/TLS support with Let's Encrypt
✅ Production-ready configuration
✅ Easy to maintain and update
