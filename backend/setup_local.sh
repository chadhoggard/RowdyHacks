#!/bin/bash
# Setup script to run TrustVault backend locally

# Set working directory to script location
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Find project root (parent of backend directory)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "✅ Loading environment variables from .env"
    set -a
    source .env
    set +a
else
    echo "⚠️  No .env file found. Using default configuration."
    echo "   (This is okay for local development)"
fi

# Set Python path dynamically
export PYTHONPATH="$SCRIPT_DIR"

# Unset DYNAMODB_ENDPOINT to use real AWS (or keep it for local DynamoDB)
# unset DYNAMODB_ENDPOINT

echo ""
echo "🚀 Starting TrustVault Backend..."
echo "📍 Running on: http://localhost:8080"
echo "📝 API Docs: http://localhost:8080/docs"
echo "📁 Project Root: $PROJECT_ROOT"
echo "📁 Backend Path: $SCRIPT_DIR"
echo ""

# Check if virtual environment exists
if [ -d "$PROJECT_ROOT/.venv" ]; then
    echo "✅ Using virtual environment: $PROJECT_ROOT/.venv"
    PYTHON_BIN="$PROJECT_ROOT/.venv/bin/python"
    UVICORN_BIN="$PROJECT_ROOT/.venv/bin/uvicorn"
elif [ -d "$SCRIPT_DIR/.venv" ]; then
    echo "✅ Using virtual environment: $SCRIPT_DIR/.venv"
    PYTHON_BIN="$SCRIPT_DIR/.venv/bin/python"
    UVICORN_BIN="$SCRIPT_DIR/.venv/bin/uvicorn"
else
    echo "⚠️  No virtual environment found, using system Python"
    PYTHON_BIN="python3"
    UVICORN_BIN="uvicorn"
fi

echo ""

# Start uvicorn
"$UVICORN_BIN" app.main:app --host 0.0.0.0 --port 8080 --reload
