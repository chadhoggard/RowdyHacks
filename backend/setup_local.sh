#!/bin/bash
# Setup script to run TrustVault backend locally

# Set working directory
cd "$(dirname "$0")"

# Export AWS credentials (don't use DYNAMODB_ENDPOINT for real AWS)
export AWS_ACCESS_KEY_ID=your_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_here
export AWS_REGION=us-east-1
export PYTHONPATH=/home/cheeseburger/RowdyHacks/backend

# Unset DYNAMODB_ENDPOINT to use real AWS
unset DYNAMODB_ENDPOINT

echo "🚀 Starting TrustVault Backend..."
echo "📍 Running on: http://localhost:8080"
echo "📝 API Docs: http://localhost:8080/docs"
echo ""

# Start uvicorn
/home/cheeseburger/RowdyHacks/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
