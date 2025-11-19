#!/bin/bash

# Lighthouse Service Installation Script
# Works on Ubuntu, Debian, AlmaLinux, Rocky Linux, CentOS, RHEL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Lighthouse Service Installer ===${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: Please run as root (use sudo)${NC}"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
else
    echo -e "${RED}Error: Cannot detect OS${NC}"
    exit 1
fi

echo -e "${YELLOW}Detected OS: $OS $VERSION${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker first:"
    echo "  Ubuntu/Debian: https://docs.docker.com/engine/install/ubuntu/"
    echo "  AlmaLinux/RHEL: https://docs.docker.com/engine/install/centos/"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed${NC}"
    echo "Installing docker-compose..."
    
    # Install docker-compose
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    echo -e "${GREEN}✓ docker-compose installed${NC}"
fi

# Get current directory
CURRENT_DIR=$(pwd)
INSTALL_DIR="/opt/lighthouse-test"

echo -e "${YELLOW}Installation directory: $INSTALL_DIR${NC}"
echo ""

# Create installation directory if it doesn't exist
if [ "$CURRENT_DIR" != "$INSTALL_DIR" ]; then
    echo "Copying files to $INSTALL_DIR..."
    mkdir -p $INSTALL_DIR
    cp -r . $INSTALL_DIR/
    cd $INSTALL_DIR
    echo -e "${GREEN}✓ Files copied${NC}"
else
    echo "Already in installation directory"
fi

# Ensure .env file exists
if [ ! -f "$INSTALL_DIR/.env" ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating default...${NC}"
    cat > $INSTALL_DIR/.env << 'EOF'
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=lighthouse-reports
S3_REGION=us-east-1
S3_SIGNED_URL_EXPIRES_SECONDS=3600
LIGHTHOUSE_NAVIGATION_TIMEOUT=60000
LIGHTHOUSE_THROTTLING_METHOD=simulate
EOF
    echo -e "${GREEN}✓ Default .env created${NC}"
fi

# Copy systemd service file
echo "Installing systemd service..."
cp lighthouse.service /etc/systemd/system/lighthouse.service

# Update WorkingDirectory in service file
sed -i "s|WorkingDirectory=.*|WorkingDirectory=$INSTALL_DIR|g" /etc/systemd/system/lighthouse.service

# Reload systemd
systemctl daemon-reload

echo -e "${GREEN}✓ Service installed${NC}"
echo ""

# Enable service
echo "Enabling service to start on boot..."
systemctl enable lighthouse.service
echo -e "${GREEN}✓ Service enabled${NC}"
echo ""

# Start service
echo "Starting Lighthouse service..."
systemctl start lighthouse.service
echo -e "${GREEN}✓ Service started${NC}"
echo ""

# Wait a moment for containers to start
sleep 5

# Check status
echo "Checking service status..."
systemctl status lighthouse.service --no-pager
echo ""

# Show running containers
echo -e "${YELLOW}Running containers:${NC}"
docker ps --filter "name=lighthouse" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo -e "${GREEN}=== Installation Complete! ===${NC}"
echo ""
echo "Access your application:"
echo "  Frontend:      http://localhost"
echo "  Backend API:   http://localhost:8080"
echo "  MinIO Console: http://localhost:9001"
echo ""
echo "Service commands:"
echo "  Start:   sudo systemctl start lighthouse"
echo "  Stop:    sudo systemctl stop lighthouse"
echo "  Restart: sudo systemctl restart lighthouse"
echo "  Status:  sudo systemctl status lighthouse"
echo "  Logs:    sudo journalctl -u lighthouse -f"
echo ""
