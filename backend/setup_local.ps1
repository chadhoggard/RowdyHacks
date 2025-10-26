# Setup script to run TrustVault backend locally on Windows (PowerShell)

# Set working directory to script location
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Find project root (parent of backend directory)
$ProjectRoot = Split-Path -Parent $ScriptDir

# Load environment variables from .env file if it exists
if (Test-Path .env) {
    Write-Host "✅ Loading environment variables from .env" -ForegroundColor Green
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "⚠️  No .env file found. Using default configuration." -ForegroundColor Yellow
    Write-Host "   (This is okay for local development)" -ForegroundColor Yellow
}

# Set Python path dynamically
$env:PYTHONPATH = $ScriptDir

Write-Host ""
Write-Host "🚀 Starting TrustVault Backend..." -ForegroundColor Cyan
Write-Host "📍 Running on: http://localhost:8080" -ForegroundColor Cyan
Write-Host "📝 API Docs: http://localhost:8080/docs" -ForegroundColor Cyan
Write-Host "📁 Project Root: $ProjectRoot" -ForegroundColor Gray
Write-Host "📁 Backend Path: $ScriptDir" -ForegroundColor Gray
Write-Host ""

# Check if virtual environment exists
if (Test-Path "$ProjectRoot\.venv\Scripts\python.exe") {
    Write-Host "✅ Using virtual environment: $ProjectRoot\.venv" -ForegroundColor Green
    $PythonBin = "$ProjectRoot\.venv\Scripts\python.exe"
    $UvicornBin = "$ProjectRoot\.venv\Scripts\uvicorn.exe"
} elseif (Test-Path "$ScriptDir\.venv\Scripts\python.exe") {
    Write-Host "✅ Using virtual environment: $ScriptDir\.venv" -ForegroundColor Green
    $PythonBin = "$ScriptDir\.venv\Scripts\python.exe"
    $UvicornBin = "$ScriptDir\.venv\Scripts\uvicorn.exe"
} else {
    Write-Host "⚠️  No virtual environment found, using system Python" -ForegroundColor Yellow
    $PythonBin = "python"
    $UvicornBin = "uvicorn"
}

Write-Host ""

# Start uvicorn
& $UvicornBin app.main:app --host 0.0.0.0 --port 8080 --reload
