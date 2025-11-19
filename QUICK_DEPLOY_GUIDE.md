# Quick Deploy Guide - VPS with Existing Services

## TL;DR - Fast Deployment

### Prerequisites Check
```bash
# Verify existing services
systemctl status nginx    # Should be running
systemctl status minio    # Should be running
docker --version          # Should be installed
```

### 1. Upload Code
```bash
ssh user@your-vps
sudo mkdir -p /opt/lighthouse-app
cd /opt/lighthouse-app
# Upload your code here (git clone, scp, etc.)
```

### 2. Create Environment File
```bash
cat > .env.production << 'EOF'
MONGO_USERNAME=lighthouse_user
MONGO_PASSWORD=CHANGE_THIS_PASSWORD
MONGODB_URI=mongodb://lighthouse_user:CHANGE_THIS_PASSWORD@mongodb:27017/lighthouse?authSource=admin

S3_ENDPOINT=http://YOUR_VPS_IP:9000
S3_ACCESS_KEY_ID=your_minio_key
S3_SECRET_ACCESS_KEY=your_minio_secret
S3_BUCKET_NAME=lighthouse-screenshots
S3_REGION=us-east-1

NODE_ENV=production
EOF
```

### 3. Create Docker Compose File
```bash
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'
services:
  mongodb:
    image: mongo:7
    container_name: lighthouse-mongodb
    restart: unless-stopped
    ports:
      - "127.0.0.1:27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - lighthouse-network

  backend:
    build: ./backend
    container_name: lighthouse-backend
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:8080"
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

  frontend:
    build:
      context: ./frontend
      args:
        NEXT_PUBLIC_API_BASE_URL: /api
    container_name: lighthouse-frontend
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
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
EOF
```

### 4. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/lighthouse
```

Paste this configuration:
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

Enable and test:
```bash
sudo ln -s /etc/nginx/sites-available/lighthouse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Create MinIO Bucket
```bash
# Using MinIO client (if installed)
mc alias set myminio http://localhost:9000 YOUR_ACCESS_KEY YOUR_SECRET_KEY
mc mb myminio/lighthouse-screenshots
mc anonymous set download myminio/lighthouse-screenshots

# Or use MinIO Console at http://YOUR_VPS_IP:9001
```

### 6. Deploy
```bash
cd /opt/lighthouse-app

# Build and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

### 7. Test
```bash
# Test backend
curl http://localhost:8080/health

# Test frontend
curl http://localhost:3000

# Test through nginx
curl http://your-domain.com
```

## Common Issues & Fixes

### Issue: Port already in use
```bash
# Check what's using the port
sudo netstat -tlnp | grep :8080

# Change port in docker-compose.prod.yml
# "127.0.0.1:8081:8080" instead of "127.0.0.1:8080:8080"
```

### Issue: Can't connect to MinIO
```bash
# Test from backend container
docker exec -it lighthouse-backend curl http://YOUR_VPS_IP:9000

# Make sure S3_ENDPOINT in .env.production uses VPS IP, not localhost
```

### Issue: 502 Bad Gateway
```bash
# Check if containers are running
docker ps

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart services
docker-compose -f docker-compose.prod.yml restart
sudo systemctl reload nginx
```

### Issue: MongoDB connection failed
```bash
# Check MongoDB is running
docker exec -it lighthouse-mongodb mongosh

# Verify MONGODB_URI in .env.production
# Should be: mongodb://user:pass@mongodb:27017/lighthouse?authSource=admin
```

## Useful Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Update and redeploy
git pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Clean up old images
docker system prune -a
```

## SSL Setup (Optional)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# Enable
sudo ufw enable
```

## That's It!

Your application should now be running at:
- Frontend: http://your-domain.com
- Backend API: http://your-domain.com/api

## Need Help?

1. Check logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Verify services: `docker ps`
3. Test connectivity: `curl http://localhost:8080`
4. Check nginx: `sudo nginx -t`
5. Review full guide: `DEPLOYMENT_VPS_EXISTING_SERVICES.md`
