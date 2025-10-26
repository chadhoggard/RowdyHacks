@echo off
REM TrustVault Docker Startup Script for Windows

echo.
echo 🐳 TrustVault Docker Setup
echo ==========================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed!
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running!
    echo.
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo ✅ Docker is installed and running
echo.

REM Check if .env file exists
if not exist "backend\.env" (
    echo ⚠️  backend\.env file not found!
    echo.
    echo Creating from template...
    copy backend\.env.example backend\.env
    echo.
    echo ⚠️  IMPORTANT: Edit backend\.env with your AWS credentials before continuing!
    echo.
    pause
)

echo ✅ Environment file found
echo.

REM Ask user if they want to rebuild
set /p rebuild="Do you want to rebuild the containers? (y/n): "
if /i "%rebuild%"=="y" (
    echo.
    echo 🔨 Building containers...
    docker-compose build --no-cache
    echo.
)

REM Start the services
echo 🚀 Starting TrustVault...
echo.
docker-compose up

REM If user stops the containers (Ctrl+C), show cleanup message
echo.
echo 👋 Stopped TrustVault
echo.
echo To restart: docker-compose up
echo To stop: docker-compose down
echo To rebuild: docker-compose up --build
echo.
pause
