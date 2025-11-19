#!/bin/bash

# Production Deployment Script for Lighthouse Application
# This script deploys all services using Docker with no port conflicts

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_warning "Please do not run as root. Run as a regular user with docker permissions."
    exit 1
fi

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Prerequisites check passed"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    print_error ".env.production file not found!"
    print_info "Creating from example..."
    
    if [ -f .env.production.example ]; then
        cp .env.production.example .env.production
        print_warning "Please edit .env.production with your actual values before continuing"
        print_info "Run: nano .env.production"
        exit 1
    else
        print_error ".env.production.example not found either!"
        exit 1
    fi
fi

# Load environment variables
set -a
source .env.production
set +a

print_success "Environment variables loaded"

# Check for port conflicts
print_info "Checking for port conflicts..."

check_port() {
    local port=$1
    local service=$2
    
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        print_warning "Port $port is already in use (needed for $service)"
        print_info "This is OK if it's bound to 127.0.0.1 only"
    fi
}

check_port 3000 "Frontend"
check_port 8080 "Backend"
check_port 27017 "MongoDB"
check_port 6379 "Redis"
check_port 9000 "MinIO"

# Create necessary directories
print_info "Creating necessary directories..."
mkdir -p backend/logs
mkdir -p nginx/conf.d
mkdir -p mongodb-init

print_success "Directories created"

# Pull latest images
print_info "Pulling latest Docker images..."
docker-compose -f docker-compose.production.yml pull

# Build custom images
print_info "Building application images..."
docker-compose -f docker-compose.production.yml build --no-cache

print_success "Images built successfully"

# Stop existing containers
print_info "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down

# Start services
print_info "Starting services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
print_info "Waiting for services to be healthy..."
sleep 10

# Check service status
print_info "Checking service status..."
docker-compose -f docker-compose.production.yml ps

# Test services
print_info "Testing services..."

# Test MongoDB
if docker exec lighthouse-mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
    print_success "MongoDB is healthy"
else
    print_error "MongoDB is not responding"
fi

# Test Redis
if docker exec lighthouse-redis redis-cli ping &> /dev/null; then
    print_success "Redis is healthy"
else
    print_error "Redis is not responding"
fi

# Test Backend
sleep 5
if curl -f http://localhost:8080/health &> /dev/null; then
    print_success "Backend is healthy"
else
    print_warning "Backend is not responding yet (may still be starting)"
fi

# Test Frontend
if curl -f http://localhost:3000 &> /dev/null; then
    print_success "Frontend is healthy"
else
    print_warning "Frontend is not responding yet (may still be starting)"
fi

# Show logs
print_info "Recent logs:"
docker-compose -f docker-compose.production.yml logs --tail=20

# Final instructions
echo ""
print_success "Deployment completed!"
echo ""
print_info "Services are running on localhost:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend: http://localhost:8080"
echo "  - MongoDB: localhost:27017"
echo "  - Redis: localhost:6379"
echo "  - MinIO: http://localhost:9000 (API), http://localhost:9001 (Console)"
echo ""
print_info "To view logs:"
echo "  docker-compose -f docker-compose.production.yml logs -f"
echo ""
print_info "To stop services:"
echo "  docker-compose -f docker-compose.production.yml down"
echo ""
print_info "To restart services:"
echo "  docker-compose -f docker-compose.production.yml restart"
echo ""
print_warning "Remember to configure your host Nginx to proxy to these services!"
echo "See DEPLOYMENT_VPS_EXISTING_SERVICES.md for details"
