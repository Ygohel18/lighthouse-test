# Troubleshooting Guide - Docker Deployment

## Quick Diagnostics

Run this script to check everything:
```bash
#!/bin/bash
echo "=== System Check ==="
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker-compose --version)"
echo ""

echo "=== Service Status ==="
echo "Nginx: $(systemctl is-active nginx)"
echo "MinIO: $(systemctl is-active minio)"
echo ""

echo "=== Port Usage ==="
netstat -tlnp | grep -E ':(80|443|3000|8080|9000|27017)'
echo ""

echo "=== Docker Containers ==="
docker ps -a
echo ""

echo "=== Recent Logs ==="
docker-compose -f docker-compose.prod.yml logs --tail=20
```

## Common Issues

### 1. Port Conflicts

**Symptom:** Container fails to start with "port already in use"

**Check:**
```bash
sudo netstat -tlnp | grep :8080
```

**Solution:**
```yaml
# In docker-compose.prod.yml, change:
ports:
  - "127.0.0.1:8081:8080"  # Use 8081 instead of 8080

# Then update nginx upstream:
upstream lighthouse_backend {
    server 127.0.0.1:8081;  # Match the new port
}
```

### 2. Nginx 502 Bad Gateway

**Symptom:** Browser shows "502 Bad Gateway"

**Check:**
```bash
# Is backend running?
curl http://localhost:8080

# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Check container logs
docker logs lighthouse-backend
```

**Solutions:**

**A. Backend not responding:**
```bash
# Restart backend
docker-compose -f docker-compose.prod.yml restart backend

# Check if it's listening
docker exec lighthouse-backend netstat -tlnp | grep :8080
```

**B. Wrong upstream configuration:**
```bash
# Test nginx config
sudo nginx -t

# Check upstream in /etc/nginx/sites-available/lighthouse
# Should be: server 127.0.0.1:8080;
```

**C. SELinux blocking (CentOS/RHEL):**
```bash
# Check SELinux status
getenforce

# Allow nginx to connect
sudo setsebool -P httpd_can_network_connect 1
```

### 3. MongoDB Connection Failed

**Symptom:** Backend logs show "MongoServerError: Authentication failed"

**Check:**
```bash
# Test MongoDB connection
docker exec -it lighthouse-mongodb mongosh -u lighthouse_user -p

# Check environment variables
docker exec lighthouse-backend env | grep MONGO
```

**Solutions:**

**A. Wrong credentials:**
```bash
# Verify .env.production has matching credentials
cat .env.production | grep MONGO

# Recreate MongoDB with correct credentials
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d mongodb
```

**B. MongoDB not ready:**
```bash
# Add healthcheck to docker-compose.prod.yml
mongodb:
  healthcheck:
    test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
    interval: 10s
    timeout: 5s
    retries: 5

backend:
  depends_on:
    mongodb:
      condition: service_healthy
```

### 4. MinIO Connection Issues

**Symptom:** Backend logs show "S3 connection error" or "Access Denied"

**Check:**
```bash
# Test MinIO from host
curl http://localhost:9000

# Test from backend container
docker exec lighthouse-backend curl http://YOUR_VPS_IP:9000

# Check MinIO logs
sudo journalctl -u minio -f
```

**Solutions:**

**A. Wrong endpoint:**
```bash
# In .env.production, use VPS IP not localhost
S3_ENDPOINT=http://YOUR_VPS_IP:9000  # ✅ Correct
S3_ENDPOINT=http://localhost:9000     # ❌ Wrong (from container perspective)
```

**B. Bucket doesn't exist:**
```bash
# Create bucket
mc alias set myminio http://localhost:9000 ACCESS_KEY SECRET_KEY
mc mb myminio/lighthouse-screenshots
mc anonymous set download myminio/lighthouse-screenshots
```

**C. Wrong credentials:**
```bash
# Test credentials
mc alias set test http://localhost:9000 YOUR_ACCESS_KEY YOUR_SECRET_KEY
mc ls test/

# Update .env.production with correct credentials
```

### 5. Frontend Not Loading

**Symptom:** Blank page or "Application error"

**Check:**
```bash
# Check frontend logs
docker logs lighthouse-frontend

# Test frontend directly
curl http://localhost:3000

# Check browser console for errors
```

**Solutions:**

**A. API endpoint misconfigured:**
```bash
# In frontend Dockerfile, ensure:
ARG NEXT_PUBLIC_API_BASE_URL=/api
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Rebuild frontend
docker-compose -f docker-compose.prod.yml build frontend
docker-compose -f docker-compose.prod.yml up -d frontend
```

**B. Build failed:**
```bash
# Check build logs
docker-compose -f docker-compose.prod.yml build frontend

# If out of memory, add swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 6. SSL Certificate Issues

**Symptom:** "Your connection is not private" or certificate errors

**Check:**
```bash
# Check certificate
sudo certbot certificates

# Test SSL
openssl s_client -connect your-domain.com:443
```

**Solutions:**

**A. Certificate expired:**
```bash
# Renew certificate
sudo certbot renew

# Reload nginx
sudo systemctl reload nginx
```

**B. Wrong domain in certificate:**
```bash
# Get new certificate for correct domain
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 7. High Memory Usage

**Symptom:** Server becomes slow or unresponsive

**Check:**
```bash
# Check memory usage
free -h

# Check container memory
docker stats

# Check which container is using most memory
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"
```

**Solutions:**

**A. Add memory limits:**
```yaml
# In docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
```

**B. Add swap space:**
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 8. Disk Space Full

**Symptom:** "No space left on device"

**Check:**
```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Find large files
du -sh /var/lib/docker/*
```

**Solutions:**

**A. Clean up Docker:**
```bash
# Remove unused containers, images, networks
docker system prune -a

# Remove unused volumes
docker volume prune
```

**B. Clean up logs:**
```bash
# Limit Docker log size in /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Restart Docker
sudo systemctl restart docker
```

### 9. Slow Performance

**Symptom:** Application is slow to respond

**Check:**
```bash
# Check CPU usage
top

# Check container resources
docker stats

# Check network latency
ping your-domain.com
```

**Solutions:**

**A. Enable nginx caching:**
```nginx
# Add to nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;

location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 60m;
}
```

**B. Optimize MongoDB:**
```bash
# Add indexes (in backend code)
# Create indexes for frequently queried fields

# Increase MongoDB cache
# In docker-compose.prod.yml
mongodb:
  command: --wiredTigerCacheSizeGB 0.5
```

**C. Enable gzip:**
```nginx
# Add to nginx config
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### 10. Container Keeps Restarting

**Symptom:** Container status shows "Restarting"

**Check:**
```bash
# Check container logs
docker logs lighthouse-backend

# Check exit code
docker inspect lighthouse-backend | grep -A 5 State
```

**Solutions:**

**A. Application crash:**
```bash
# Check logs for error
docker logs lighthouse-backend --tail 100

# Common issues:
# - Missing environment variables
# - Can't connect to MongoDB
# - Port already in use
```

**B. Health check failing:**
```bash
# Remove or fix healthcheck in docker-compose.prod.yml
# Or check what the healthcheck is testing
```

## Debugging Commands

### View All Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker logs lighthouse-backend --tail 100

# Follow logs
docker logs -f lighthouse-backend
```

### Inspect Container
```bash
# Get container details
docker inspect lighthouse-backend

# Check environment variables
docker exec lighthouse-backend env

# Check network
docker exec lighthouse-backend ping mongodb
docker exec lighthouse-backend curl http://YOUR_VPS_IP:9000
```

### Test Connectivity
```bash
# From host to container
curl http://localhost:8080

# From container to host
docker exec lighthouse-backend curl http://YOUR_VPS_IP:9000

# From container to container
docker exec lighthouse-backend ping mongodb
```

### Check Nginx
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Check error log
sudo tail -f /var/log/nginx/error.log

# Check access log
sudo tail -f /var/log/nginx/access.log
```

## Emergency Recovery

### Complete Reset
```bash
# Stop everything
docker-compose -f docker-compose.prod.yml down -v

# Remove all containers and images
docker system prune -a

# Rebuild from scratch
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Backup Before Reset
```bash
# Backup MongoDB
docker exec lighthouse-mongodb mongodump --out /tmp/backup
docker cp lighthouse-mongodb:/tmp/backup ./mongodb-backup

# Backup environment
cp .env.production .env.production.backup

# Backup nginx config
sudo cp /etc/nginx/sites-available/lighthouse /tmp/lighthouse.nginx.backup
```

### Restore After Reset
```bash
# Restore MongoDB
docker cp ./mongodb-backup lighthouse-mongodb:/tmp/backup
docker exec lighthouse-mongodb mongorestore /tmp/backup
```

## Getting Help

If you're still stuck:

1. **Collect Information:**
   ```bash
   # System info
   uname -a
   docker --version
   docker-compose --version
   
   # Service status
   systemctl status nginx
   systemctl status minio
   docker ps -a
   
   # Logs
   docker-compose -f docker-compose.prod.yml logs > logs.txt
   sudo cat /var/log/nginx/error.log > nginx-error.txt
   ```

2. **Check Documentation:**
   - `DEPLOYMENT_VPS_EXISTING_SERVICES.md`
   - `QUICK_DEPLOY_GUIDE.md`

3. **Common Patterns:**
   - 502 = Backend not responding
   - 404 = Wrong nginx configuration
   - 500 = Application error (check logs)
   - Connection refused = Service not running
   - Authentication failed = Wrong credentials

4. **Test Step by Step:**
   - Can you curl localhost:8080? (Backend)
   - Can you curl localhost:3000? (Frontend)
   - Can you curl your-domain.com? (Nginx)
   - Are all containers running? (docker ps)
   - Any errors in logs? (docker logs)
