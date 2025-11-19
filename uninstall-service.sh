#!/bin/bash

# Lighthouse Service Uninstallation Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Lighthouse Service Uninstaller ===${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: Please run as root (use sudo)${NC}"
    exit 1
fi

# Stop service
echo "Stopping Lighthouse service..."
systemctl stop lighthouse.service 2>/dev/null || true
echo -e "${GREEN}✓ Service stopped${NC}"

# Disable service
echo "Disabling service..."
systemctl disable lighthouse.service 2>/dev/null || true
echo -e "${GREEN}✓ Service disabled${NC}"

# Remove service file
echo "Removing service file..."
rm -f /etc/systemd/system/lighthouse.service
echo -e "${GREEN}✓ Service file removed${NC}"

# Reload systemd
systemctl daemon-reload
echo -e "${GREEN}✓ Systemd reloaded${NC}"
echo ""

# Ask about Docker containers
read -p "Stop and remove Docker containers? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd /opt/lighthouse-test 2>/dev/null || cd .
    docker-compose down -v
    echo -e "${GREEN}✓ Containers removed${NC}"
fi

# Ask about installation directory
read -p "Remove installation directory /opt/lighthouse-test? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf /opt/lighthouse-test
    echo -e "${GREEN}✓ Installation directory removed${NC}"
fi

echo ""
echo -e "${GREEN}=== Uninstallation Complete! ===${NC}"
