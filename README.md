# Lighthouse Performance Testing Platform

Automated web performance testing with Lighthouse, featuring a Next.js frontend and Node.js backend.

## Quick Start

### Option 1: Docker Compose (Manual)

```bash
# Start everything
docker-compose up -d --build

# Stop everything
docker-compose down
```

### Option 2: System Service (Ubuntu/AlmaLinux)

```bash
# Install as system service
sudo bash install-service.sh

# Service will start automatically on boot
```

**Service Commands:**
```bash
sudo systemctl start lighthouse    # Start
sudo systemctl stop lighthouse     # Stop
sudo systemctl restart lighthouse  # Restart
sudo systemctl status lighthouse   # Status
sudo journalctl -u lighthouse -f   # View logs
```

**Uninstall:**
```bash
sudo bash uninstall-service.sh
```

### Access
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8080
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## Usage

1. Open http://localhost
2. Enter a URL to test
3. Click "Run Test"
4. View results when complete

## Development

### Run Frontend Locally
```bash
cd frontend
npm install
npm run dev
# Access at http://localhost:3000
```

### Run Backend Locally
```bash
cd backend
npm install
npm run build
npm run start:api
# API at http://localhost:3000
```

### View Logs
```bash
docker-compose logs -f
```

### Restart Services
```bash
docker-compose restart backend-api backend-worker
```

### Stop Everything
```bash
docker-compose down
```

## Architecture

```
Browser → Nginx (port 80) → Next.js Frontend
                          ↓
                    /api/* → Backend Nginx (port 8080) → Node.js API
                                                              ↓
                                                    MongoDB, Redis, MinIO
```

## Environment Variables

Create `.env` in project root:
```env
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=lighthouse-reports
S3_REGION=us-east-1
S3_SIGNED_URL_EXPIRES_SECONDS=3600
LIGHTHOUSE_NAVIGATION_TIMEOUT=60000
LIGHTHOUSE_THROTTLING_METHOD=simulate
```

## System Service (Production)

The systemd service provides:
- ✅ Auto-start on system boot
- ✅ Auto-restart on failure
- ✅ Centralized logging
- ✅ Easy management with systemctl

**Installation:**
```bash
# Install service
sudo bash install-service.sh

# The script will:
# 1. Copy files to /opt/lighthouse-test
# 2. Install systemd service
# 3. Enable auto-start on boot
# 4. Start the service
```

**Management:**
```bash
# Start/Stop/Restart
sudo systemctl start lighthouse
sudo systemctl stop lighthouse
sudo systemctl restart lighthouse

# Check status
sudo systemctl status lighthouse

# View logs
sudo journalctl -u lighthouse -f

# Enable/Disable auto-start
sudo systemctl enable lighthouse
sudo systemctl disable lighthouse
```

**Uninstall:**
```bash
sudo bash uninstall-service.sh
```

## Troubleshooting

### Port Conflicts
```bash
# Windows
netstat -ano | findstr :80
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :80
kill -9 <PID>
```

### Clean Rebuild
```bash
docker-compose down -v
docker-compose up -d --build
```

### Check Container Status
```bash
docker ps
docker logs lighthouse_backend_api
docker logs lighthouse_frontend_app
```

### Service Issues
```bash
# Check service status
sudo systemctl status lighthouse

# View service logs
sudo journalctl -u lighthouse -n 50

# Restart service
sudo systemctl restart lighthouse

# Reload systemd after editing service file
sudo systemctl daemon-reload
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, TanStack Query, Recharts, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Bull (Redis queue)
- **Testing**: Lighthouse, Puppeteer
- **Storage**: MongoDB, Redis, MinIO (S3-compatible)
- **Proxy**: Nginx

## Project Structure

```
.
├── backend/              # Node.js API and worker
│   ├── src/
│   │   ├── api/         # Express API
│   │   ├── worker/      # Lighthouse worker
│   │   └── config/      # Configuration
│   └── Dockerfile
├── frontend/            # Next.js app
│   ├── app/            # App router pages
│   ├── components/     # React components
│   ├── lib/           # API client
│   └── Dockerfile
├── nginx/              # Nginx configs
│   ├── backend.conf
│   ├── frontend.conf
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
└── docker-compose.yml  # Orchestration
```

## License

MIT
