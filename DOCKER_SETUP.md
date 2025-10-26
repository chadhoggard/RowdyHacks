# 🐳 Docker Setup - Run TrustVault Anywhere!

**This Docker setup captures the exact working environment and makes it run identically on any machine (Mac, Windows, Linux).**

## Why Docker?

✅ **No Python/Node version issues**  
✅ **No "works on my machine" problems**  
✅ **Same environment for everyone**  
✅ **One command to start everything**

## Prerequisites

Only need Docker installed:

### Mac
```bash
# Install Docker Desktop from:
https://www.docker.com/products/docker-desktop/

# Or with Homebrew:
brew install --cask docker
```

### Windows
```powershell
# Install Docker Desktop from:
https://www.docker.com/products/docker-desktop/

# Make sure WSL2 is enabled (Docker will prompt if needed)
```

### Linux
```bash
# Ubuntu/Debian:
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Start Docker:
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, to avoid sudo):
sudo usermod -aG docker $USER
# Then log out and back in
```

## Quick Start (3 Steps!)

### 1. Clone Repository
```bash
git clone https://github.com/chadhoggard/RowdyHacks.git
cd RowdyHacks
```

### 2. Configure Environment
```bash
# Copy the example env file
cp backend/.env.example backend/.env

# Edit backend/.env with your AWS credentials
# (Ask your team lead for these!)
```

### 3. Start Everything
```bash
# Build and start all services
docker-compose up --build

# Or run in background:
docker-compose up -d --build
```

That's it! 🎉

## What Gets Started

When you run `docker-compose up`, it starts:

- **Backend** (FastAPI): http://localhost:8080
- **Frontend** (Expo): http://localhost:8081
- **API Docs**: http://localhost:8080/docs

## Using the App

### Option 1: Expo Go (Easiest - Recommended)

1. Install Expo Go app on your phone:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. Look at the terminal output for a QR code

3. Scan the QR code with:
   - iOS: Camera app
   - Android: Expo Go app

4. App loads on your phone! 📱

### Option 2: Emulator

**iOS (Mac only):**
```bash
# In the Expo terminal, press 'i'
```

**Android:**
```bash
# In the Expo terminal, press 'a'
```

## Common Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build

# View logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View frontend logs only
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Stop and remove everything (including volumes)
docker-compose down -v
```

## Making Code Changes

The Docker setup uses **volumes**, so changes to your code are immediately reflected:

1. Edit any file in `backend/` or `frontend/`
2. Backend auto-reloads (FastAPI --reload)
3. Frontend requires reload (shake device or press 'r' in Expo)
4. No need to rebuild Docker containers!

## Troubleshooting

### "Port already in use"

Someone is already running something on port 8080 or 8081:

```bash
# Stop everything:
docker-compose down

# Find what's using the port (Mac/Linux):
lsof -i :8080
lsof -i :8081

# Kill the process:
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### "Cannot connect to Docker daemon"

Docker isn't running:

```bash
# Mac/Windows: Open Docker Desktop

# Linux:
sudo systemctl start docker
```

### Frontend doesn't start

```bash
# Rebuild the frontend:
docker-compose build frontend
docker-compose up frontend
```

### "AWS credentials not configured"

You need to add AWS credentials to `backend/.env`:

```bash
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
AWS_REGION=us-east-1
```

### Clear everything and start fresh

```bash
# Stop and remove all containers, networks, volumes
docker-compose down -v

# Remove all images (forces full rebuild)
docker-compose build --no-cache

# Start fresh
docker-compose up
```

### Check if services are running

```bash
docker-compose ps
```

You should see:
- `trustvault-backend` - Up
- `trustvault-frontend` - Up

## For Teammates

**Send them this:**

1. Install Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Clone repo: `git clone <repo-url>`
3. Get `.env` file from team lead (put in `backend/.env`)
4. Run: `docker-compose up --build`
5. Scan QR code with Expo Go app

**That's literally it. No Python, no Node, no environment setup needed!**

## Sharing Your Environment

To share your exact working setup with teammates:

```bash
# Push your code to GitHub
git add .
git commit -m "Added Docker setup"
git push

# Share these files specifically:
# - docker-compose.yml
# - backend/Dockerfile
# - frontend/Dockerfile
# - backend/.env.example (NOT .env with real credentials!)
# - This README
```

## Production Deployment

For production, you'd want to:

1. Use production `.env` values (not development)
2. Remove `--reload` from backend Dockerfile
3. Build production images
4. Use a proper hosting service (AWS ECS, Google Cloud Run, etc.)

## What's Different from Local Setup?

| Local Setup | Docker Setup |
|-------------|--------------|
| Install Python 3.10 | ✅ Included |
| Install Node.js 20 | ✅ Included |
| Create virtual env | ✅ Handled automatically |
| Install pip packages | ✅ Handled automatically |
| Install npm packages | ✅ Handled automatically |
| Deal with PATH issues | ✅ No issues |
| "Works on my machine" | ✅ Works everywhere |

## Support

- **Docker Docs**: https://docs.docker.com/
- **Expo with Docker**: https://docs.expo.dev/guides/using-docker/
- **Issues**: https://github.com/chadhoggard/RowdyHacks/issues

---

Made with 🐳 for RowdyHacks 2025
