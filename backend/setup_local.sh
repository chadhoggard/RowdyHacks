#!/bin/bash
# Setup script to run TrustVault backend locally

# Set working directory
cd "$(dirname "$0")"

# Load environment variables from .env file
export $(grep -v '^#' .env | grep -v '^$' | xargs)

# Set Python path
export PYTHONPATH=/home/cheeseburger/RowdyHacks/backend

# Unset DYNAMODB_ENDPOINT to use real AWS (or keep it for local DynamoDB)
# unset DYNAMODB_ENDPOINT

echo "🚀 Starting TrustVault Backend..."
echo "📍 Running on: http://localhost:8080"
echo "📝 API Docs: http://localhost:8080/docs"
echo ""

# Start uvicorn
/home/cheeseburger/RowdyHacks/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
