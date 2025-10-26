# 📧 Email This to Your Team

---

**Subject: TrustVault Setup - Works on Mac, Windows, and Linux!**

Hey team! 👋

I've set up Docker containers so TrustVault runs **identically** on everyone's machine - no more "works on my machine" issues!

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Docker Desktop
- **Mac/Windows:** https://www.docker.com/products/docker-desktop/
- **Linux:** `sudo apt-get install docker.io docker-compose`

### Step 2: Clone & Configure
```bash
git clone https://github.com/chadhoggard/RowdyHacks.git
cd RowdyHacks
```

**IMPORTANT:** Get the `backend/.env` file from me (contains AWS credentials)
Place it in `backend/.env`

### Step 3: Start Everything

**Mac/Linux:**
```bash
./start-docker.sh
```

**Windows:**
```bash
start-docker.bat
```

That's it! The app will build and start automatically.

### Step 4: Use the App

1. Install **Expo Go** on your phone (App Store / Play Store)
2. Scan the QR code shown in the terminal
3. App loads on your phone! 🎉

## 📚 Documentation

- **Quick Start:** `QUICKSTART.md` ← Start here!
- **Docker Guide:** `DOCKER_SETUP.md`
- **Mac Manual Setup:** `MAC_SETUP.md`
- **Windows Manual Setup:** `backend/WINDOWS_SETUP.md`

## 🐳 Why Docker?

✅ No Python version issues  
✅ No Node.js version issues  
✅ No environment setup needed  
✅ Works identically everywhere  
✅ One command to start everything  

## ❓ Common Issues

**"Docker is not running"**
→ Open Docker Desktop

**"Port already in use"**
→ Close any other servers on ports 8080/8081

**"Cannot connect to backend"**
→ Make sure you have `backend/.env` file

**Still having issues?**
→ Check `DOCKER_SETUP.md` or ask me!

## 🎯 What You Can Do

Once running, you can:
- ✅ Create an account
- ✅ Create investment groups ("ranches")
- ✅ Invite other users
- ✅ Make deposits
- ✅ Propose investments (including stock trading!)
- ✅ Vote on proposals
- ✅ Execute approved transactions
- ✅ View transaction ledger

## 🔑 Files You Need From Me

- `backend/.env` - AWS credentials and config
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY  
  - Alpaca API keys (for stock trading)
  - JWT secret

**I'll send this separately - DO NOT commit it to git!**

## 🎨 For Development

```bash
# Start
docker-compose up

# Stop
docker-compose down

# Rebuild after pulling code
docker-compose up --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

Code changes auto-reload! Just edit files and save.

## 🆘 Need Help?

1. Check the docs in the repo
2. Make sure Docker Desktop is running
3. Make sure you have the `.env` file
4. Ask me!

Let me know once you get it running! 🚀

---

**P.S.** If Docker doesn't work for you, there are manual setup guides for Mac and Windows, but Docker is way easier!

