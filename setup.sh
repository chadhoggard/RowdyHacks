#!/bin/bash

# TrustVault Quick Setup Script for Mac
# This script automates the initial setup process

set -e  # Exit on error

echo "🤠 TrustVault Quick Setup for Mac"
echo "=================================="
echo ""

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.10 or higher."
    exit 1
fi
echo "✅ Python found: $(python3 --version)"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18 or higher."
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm."
    exit 1
fi
echo "✅ npm found: $(npm --version)"

echo ""
echo "📦 Setting up project..."
echo ""

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Install backend dependencies
echo ""
echo "📥 Installing backend dependencies..."
cd backend
pip install -q -r requirements.txt
echo "✅ Backend dependencies installed"

# Check for .env file
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env with your AWS credentials!"
    echo "   Required fields:"
    echo "   - AWS_ACCESS_KEY_ID"
    echo "   - AWS_SECRET_ACCESS_KEY"
    echo "   - JWT_SECRET (generate with: openssl rand -hex 32)"
    echo ""
    echo "   Optional (for stock trading):"
    echo "   - ALPACA_API_KEY"
    echo "   - ALPACA_SECRET_KEY"
    echo ""
    read -p "Press ENTER when you've configured .env..."
else
    echo "✅ .env file found"
fi

cd ..

# Install frontend dependencies
echo ""
echo "📥 Installing frontend dependencies..."
cd frontend
npm install --silent
echo "✅ Frontend dependencies installed"
cd ..

# Done
echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the app:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   cd backend && source ../.venv/bin/activate && ./setup_local.sh"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   cd frontend && npx expo start"
echo ""
echo "📖 For more details, see MAC_SETUP.md"
echo ""
