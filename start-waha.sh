#!/bin/bash

# WAHA Quick Start Script
# This script helps you quickly start WAHA (WhatsApp HTTP API) server

echo "🚀 Starting WAHA (WhatsApp HTTP API)..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker is installed"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running!"
    echo "Please start Docker and try again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if WAHA container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^waha$"; then
    echo "📦 WAHA container already exists"
    
    # Check if it's running
    if docker ps --format '{{.Names}}' | grep -q "^waha$"; then
        echo "✅ WAHA is already running!"
        echo ""
        echo "Access WAHA at: http://localhost:3000"
        echo "View logs: docker logs -f waha"
        exit 0
    else
        echo "🔄 Starting existing WAHA container..."
        docker start waha
        echo "✅ WAHA started!"
        echo ""
        echo "Access WAHA at: http://localhost:3000"
        echo "View logs: docker logs -f waha"
        exit 0
    fi
fi

echo "📥 Pulling WAHA image..."
docker pull devlikeapro/waha

echo ""
echo "🚀 Starting WAHA container..."

# Start WAHA with docker-compose if available
if [ -f "docker-compose.waha.yml" ]; then
    echo "Using docker-compose..."
    docker-compose -f docker-compose.waha.yml up -d
else
    echo "Using docker run..."
    docker run -d \
        --name waha \
        -p 3000:3000 \
        -v waha_sessions:/app/.sessions \
        --restart unless-stopped \
        devlikeapro/waha
fi

echo ""
echo "⏳ Waiting for WAHA to be ready..."
sleep 5

# Check if WAHA is responding
if curl -s http://localhost:3000/health > /dev/null; then
    echo ""
    echo "✅ WAHA is running successfully!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📱 WAHA WhatsApp HTTP API"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🌐 Swagger UI:  http://localhost:3000"
    echo "🏥 Health Check: http://localhost:3000/health"
    echo ""
    echo "📋 Useful Commands:"
    echo "   View logs:    docker logs -f waha"
    echo "   Stop WAHA:    docker stop waha"
    echo "   Restart:      docker restart waha"
    echo "   Remove:       docker rm -f waha"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Open API VRO Dashboard"
    echo "   2. Go to Devices page"
    echo "   3. Click 'Add Device'"
    echo "   4. Connect your WhatsApp!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo ""
    echo "⚠️  WAHA started but not responding yet"
    echo "This is normal, it may take a few more seconds"
    echo ""
    echo "Check status: curl http://localhost:3000/health"
    echo "View logs: docker logs -f waha"
fi
