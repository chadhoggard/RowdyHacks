@echo off
REM Setup script to run TrustVault backend locally on Windows

REM Set working directory to script location
cd /d "%~dp0"

REM Find project root (parent of backend directory)
set "PROJECT_ROOT=%~dp0.."
set "SCRIPT_DIR=%~dp0"

REM Load environment variables from .env file if it exists
if exist .env (
    echo ✅ Loading environment variables from .env
    for /f "usebackq tokens=*" %%a in (".env") do (
        set "%%a"
    )
) else (
    echo ⚠️  No .env file found. Using default configuration.
    echo    ^(This is okay for local development^)
)

REM Set Python path dynamically
set "PYTHONPATH=%SCRIPT_DIR%"

echo.
echo 🚀 Starting TrustVault Backend...
echo 📍 Running on: http://localhost:8080
echo 📝 API Docs: http://localhost:8080/docs
echo 📁 Project Root: %PROJECT_ROOT%
echo 📁 Backend Path: %SCRIPT_DIR%
echo.

REM Check if virtual environment exists
if exist "%PROJECT_ROOT%\.venv\Scripts\python.exe" (
    echo ✅ Using virtual environment: %PROJECT_ROOT%\.venv
    set "PYTHON_BIN=%PROJECT_ROOT%\.venv\Scripts\python.exe"
    set "UVICORN_BIN=%PROJECT_ROOT%\.venv\Scripts\uvicorn.exe"
) else if exist "%SCRIPT_DIR%\.venv\Scripts\python.exe" (
    echo ✅ Using virtual environment: %SCRIPT_DIR%\.venv
    set "PYTHON_BIN=%SCRIPT_DIR%\.venv\Scripts\python.exe"
    set "UVICORN_BIN=%SCRIPT_DIR%\.venv\Scripts\uvicorn.exe"
) else (
    echo ⚠️  No virtual environment found, using system Python
    set "PYTHON_BIN=python"
    set "UVICORN_BIN=uvicorn"
)

echo.

REM Start uvicorn
"%UVICORN_BIN%" app.main:app --host 0.0.0.0 --port 8080 --reload
