@echo off
REM Installation script for TrustVault backend on Windows

echo ========================================
echo   TrustVault Backend Setup (Windows)
echo ========================================
echo.

REM Set working directory to script location
cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo    Please install Python from https://www.python.org/downloads/
    echo    Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo ✅ Python is installed
python --version
echo.

REM Check if .env file exists
if not exist .env (
    echo ⚠️  No .env file found!
    echo    Creating .env from .env.example...
    if exist .env.example (
        copy .env.example .env
        echo ✅ Created .env file
        echo.
        echo ⚠️  IMPORTANT: Edit the .env file and add your AWS credentials!
        echo    AWS_ACCESS_KEY_ID=your_access_key_here
        echo    AWS_SECRET_ACCESS_KEY=your_secret_key_here
        echo.
    ) else (
        echo ❌ .env.example file not found
        echo    Please create a .env file manually with your AWS credentials
        pause
        exit /b 1
    )
)

REM Create virtual environment
if not exist .venv (
    echo 📦 Creating virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment already exists
)
echo.

REM Activate virtual environment and install dependencies
echo 📦 Installing dependencies...
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✅ Installation complete!
echo.
echo 🎯 Next steps:
echo    1. Edit .env file and add your AWS credentials
echo    2. Run: setup_local.bat
echo.
pause
