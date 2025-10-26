#!/bin/bash
# Install script for setting up the backend environment

echo "🔧 Setting up TrustVault Backend Environment..."
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Find project root
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Found Python: $(python3 --version)"
echo ""

# Create virtual environment in project root
if [ ! -d "$PROJECT_ROOT/.venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv "$PROJECT_ROOT/.venv"
    echo "✅ Virtual environment created at: $PROJECT_ROOT/.venv"
else
    echo "✅ Virtual environment already exists"
fi

echo ""
echo "📥 Installing dependencies..."

# Activate virtual environment and install dependencies
source "$PROJECT_ROOT/.venv/bin/activate"

# Upgrade pip
pip install --upgrade pip

# Install requirements
if [ -f "$SCRIPT_DIR/requirements.txt" ]; then
    pip install -r "$SCRIPT_DIR/requirements.txt"
    echo "✅ Dependencies installed successfully!"
elif [ -f "$SCRIPT_DIR/app/requirements.txt" ]; then
    pip install -r "$SCRIPT_DIR/app/requirements.txt"
    echo "✅ Dependencies installed successfully!"
else
    echo "⚠️  No requirements.txt found. Installing common dependencies..."
    pip install fastapi uvicorn python-jose[cryptography] passlib[bcrypt] boto3
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the backend, run:"
echo "  cd backend"
echo "  bash setup_local.sh"
echo ""
echo "Or manually activate the virtual environment:"
echo "  source $PROJECT_ROOT/.venv/bin/activate"
