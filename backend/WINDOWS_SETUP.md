# Windows Setup Guide for TrustVault Backend

## Quick Start (3 Easy Steps!)

### Step 1: Install Python
1. Download Python from https://www.python.org/downloads/
2. **IMPORTANT:** Check "Add Python to PATH" during installation
3. Verify installation by opening Command Prompt and typing:
   ```cmd
   python --version
   ```

### Step 2: Run Installation
1. Open Command Prompt
2. Navigate to the backend folder:
   ```cmd
   cd path\to\RowdyHacks\backend
   ```
3. Run the installation script:
   ```cmd
   install_windows.bat
   ```

### Step 3: Add AWS Credentials
1. Open `.env` file in Notepad (it's in the backend folder)
2. Replace `your_access_key_here` and `your_secret_key_here` with actual AWS credentials
3. Ask your team lead for the credentials!

### Step 4: Start the Server
Double-click `setup_local.bat` or run in Command Prompt:
```cmd
setup_local.bat
```

The server will start at: http://localhost:8080

## Scripts Available

### For Command Prompt (cmd):
- `install_windows.bat` - First time setup (creates virtual environment, installs dependencies)
- `setup_local.bat` - Start the server

### For PowerShell:
- `setup_local.ps1` - Start the server (more colorful output!)

## Troubleshooting

### "Python is not recognized"
- Python is not installed or not in PATH
- Reinstall Python and check "Add Python to PATH"

### "pip is not recognized"
- Run: `python -m pip install --upgrade pip`

### "Access Denied" or "Permission Error"
- Run Command Prompt as Administrator (right-click → Run as administrator)

### "AWS credentials not configured"
- Edit the `.env` file and add your AWS credentials
- Make sure there are no spaces around the `=` sign

### "Module not found"
- The virtual environment isn't activated or dependencies aren't installed
- Run `install_windows.bat` again

### Port 8080 already in use
- Another server is running on port 8080
- Close it or change the port in `setup_local.bat` (change 8080 to 8081)

## What Each Script Does

### `install_windows.bat`
1. Checks if Python is installed
2. Creates a `.venv` folder (virtual environment)
3. Installs all required packages from `requirements.txt`
4. Creates `.env` file from template

### `setup_local.bat`
1. Loads environment variables from `.env`
2. Finds the virtual environment
3. Starts the FastAPI server with auto-reload

## Next Steps After Setup

1. Test the API: http://localhost:8080/docs
2. Create a test account using the `/auth/signup` endpoint
3. Start the frontend (see frontend folder README)

## Need Help?

Common commands:
```cmd
REM Activate virtual environment manually
.venv\Scripts\activate.bat

REM Install a new package
pip install package-name

REM Initialize database tables
python -m app.init_tables

REM Run Python commands
python -m app.main
```

## File Structure

```
backend/
├── install_windows.bat    ← Run this FIRST
├── setup_local.bat        ← Run this to start server (CMD)
├── setup_local.ps1        ← Run this to start server (PowerShell)
├── setup_local.sh         ← For Linux/Mac users
├── .env                   ← Add your AWS credentials here
├── .env.example           ← Template for .env
├── requirements.txt       ← List of Python packages
├── .venv/                 ← Virtual environment (created by install)
└── app/                   ← Application code
```

## Pro Tips

- Use PowerShell for better colors: `.\setup_local.ps1`
- Keep Command Prompt open to see logs
- Press `Ctrl+C` to stop the server
- The server auto-reloads when you change code files
- Check http://localhost:8080/docs for interactive API documentation

Good luck! 🚀
