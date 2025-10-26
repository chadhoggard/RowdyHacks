#!/bin/bash

# TrustVault Docker Startup Script
# Works on Mac, Windows (Git Bash), and Linux

echo "🐳 TrustVault Docker Setup"
echo "=========================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo ""
    echo "Please install Docker Desktop from:"
    echo "https://www.docker.com/products/docker-desktop/"
    echo ""
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running!"
    echo ""
    echo "Please start Docker Desktop and try again."
    echo ""
    exit 1
fi

echo "✅ Docker is installed and running"
echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env file not found!"
    echo ""
    echo "Creating from template..."
    cp backend/.env.example backend/.env
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env with your AWS credentials before continuing!"
    echo ""
    read -p "Press ENTER when you've configured backend/.env..."
fi

echo "✅ Environment file found"
echo ""

# Ask user if they want to rebuild
echo "Do you want to rebuild the containers? (recommended on first run or after updates)"
read -p "Rebuild? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔨 Building containers..."
    docker-compose build --no-cache
    echo ""
fi

# Start the services
echo "🚀 Starting TrustVault..."
echo ""
docker-compose up

# If user stops the containers (Ctrl+C), show cleanup message
echo ""
echo "👋 Stopped TrustVault"
echo ""
echo "To restart: docker-compose up"
echo "To stop: docker-compose down"
echo "To rebuild: docker-compose up --build"
