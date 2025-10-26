# 🚀 Quick Start for Teammates

**Choose your path:**

## Option 1: Docker (RECOMMENDED) 🐳

**Works identically on Mac, Windows, and Linux. No Python/Node setup needed!**

### Mac / Linux
```bash
git clone https://github.com/chadhoggard/RowdyHacks.git
cd RowdyHacks
./start-docker.sh
```

### Windows
```powershell
git clone https://github.com/chadhoggard/RowdyHacks.git
cd RowdyHacks
start-docker.bat
```

**That's it!** The script will:
- Check if Docker is installed
- Build the containers
- Start everything
- Show you the QR code to scan with Expo Go

### First Time Setup
1. Install Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Get the `backend/.env` file from your team lead
3. Run the startup script above

**See `DOCKER_SETUP.md` for full details.**

---

## Option 2: Manual Setup (If you can't use Docker)

### Mac
See: `MAC_SETUP.md`

### Windows
See: `backend/WINDOWS_SETUP.md`

---

## What You Need

### For Docker (Recommended)
- ✅ Docker Desktop
- ✅ `backend/.env` file (get from team lead)
- ❌ No Python needed
- ❌ No Node.js needed
- ❌ No environment setup needed

### For Manual Setup
- Python 3.10+
- Node.js 18+
- AWS credentials
- Alpaca API keys (optional)
- Patience for debugging 😅

---

## Troubleshooting

### "Docker is not running"
→ Open Docker Desktop

### "Port already in use"
→ Stop any other servers running on ports 8080 or 8081

### "AWS credentials not configured"
→ Ask team lead for `backend/.env` file

### Frontend not connecting
→ Make sure backend is running on port 8080

---

## Using the App

1. **Install Expo Go on your phone**
   - iOS: App Store → "Expo Go"
   - Android: Play Store → "Expo Go"

2. **Scan the QR code** shown in terminal

3. **Start using the app!**
   - Create account
   - Create a ranch (investment group)
   - Invite team members
   - Make investments
   - Vote on proposals

---

## Quick Commands

```bash
# Docker
docker-compose up              # Start
docker-compose down            # Stop
docker-compose up --build      # Rebuild and start
docker-compose logs -f         # View logs

# Manual
cd backend && ./setup_local.sh    # Start backend
cd frontend && npx expo start     # Start frontend
```

---

## Need Help?

1. Check `DOCKER_SETUP.md` for Docker help
2. Check `MAC_SETUP.md` for Mac manual setup
3. Check `backend/WINDOWS_SETUP.md` for Windows manual setup
4. Ask your team lead
5. Check the logs: `docker-compose logs -f`

---

Made with 🤠 at RowdyHacks 2025
