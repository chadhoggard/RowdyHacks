# 🤠 Frontier Fund - Democratic Group Investment Platform

**Built at RowdyHacks 2025**

Frontier Fund is a mobile app that enables groups to democratically manage shared investments through proposal-based voting. Create "ranches" (investment groups), propose transactions, vote as a group, and invest together!

## ⚡ Quick Start for Teammates

**Choose your setup method:**

### 🐳 Docker (RECOMMENDED - Works Everywhere!)
```bash
# Mac/Linux
git clone <your-repo-url>
cd RowdyHacks
./start-docker.sh

# Windows
git clone <your-repo-url>
cd RowdyHacks
start-docker.bat
```

**See:** [`QUICKSTART.md`](QUICKSTART.md) | [`DOCKER_SETUP.md`](DOCKER_SETUP.md)

### 📝 Manual Setup
- **Mac:** See [`MAC_SETUP.md`](MAC_SETUP.md)
- **Windows:** See [`backend/WINDOWS_SETUP.md`](backend/WINDOWS_SETUP.md)

## ✨ Features

- 🔐 User authentication & authorization
- 👥 Create and manage investment groups ("ranches")
- 💰 Democratic proposal system (deposits, withdrawals, investments)
- 🗳️ Group voting on all transactions
- 📈 Real-time stock trading with Alpaca API
- 💼 35+ stocks across 8 categories
- 📊 Portfolio tracking and ledger
- 📱 React Native mobile app with Expo

## 🏗️ Tech Stack

**Backend:**
- FastAPI (Python 3.10)
- AWS DynamoDB
- JWT Authentication
- Alpaca API for stock data

**Frontend:**
- React Native + Expo
- TypeScript
- File-based routing

## 📖 Documentation

- [`QUICKSTART.md`](QUICKSTART.md) - Get started in 2 minutes
- [`DOCKER_SETUP.md`](DOCKER_SETUP.md) - Complete Docker guide
- [`MAC_SETUP.md`](MAC_SETUP.md) - Mac manual setup
- [`backend/WINDOWS_SETUP.md`](backend/WINDOWS_SETUP.md) - Windows manual setup
- [`backend/FRONTEND_API_GUIDE.md`](backend/FRONTEND_API_GUIDE.md) - API documentation

## 🎯 How It Works

1. **Create Account** - Sign up with username, email, password
2. **Create Ranch** - Start an investment group
3. **Invite Members** - Add friends to your ranch
4. **Make Proposals** - Suggest deposits, withdrawals, or investments
5. **Vote Together** - Democratic approval process
6. **Execute Transactions** - Approved proposals become real transactions
7. **Track Everything** - View balance, investments, and transaction history

## 🔧 Development

```bash
# With Docker (easiest)
docker-compose up --build

# Manual - Backend
cd backend
source ../.venv/bin/activate
./setup_local.sh

# Manual - Frontend  
cd frontend
npx expo start
```

## 📱 Using the App

1. Install **Expo Go** on your phone (App Store / Play Store)
2. Start the app (Docker or manual)
3. Scan the QR code with Expo Go
4. Create your account and start investing!

## 🌟 Stock Trading

Frontier Fund integrates with Alpaca's paper trading API for real-time stock data:

- **35+ Stocks** in 8 categories
- **Real-time Prices** from Alpaca
- **No Real Money** - Paper trading only
- **Democratic Voting** on all trades

Categories include:
- 💎 Blue Chips (AAPL, MSFT, GOOGL, etc.)
- 📊 ETFs (SPY, QQQ, VOO, etc.)
- 💻 Technology (NVDA, META, TSLA, etc.)
- 🏥 Healthcare, 🏦 Finance, 🛒 Consumer, ⚡ Energy, 🏗️ Industrial

## 🐛 Troubleshooting

See the setup guides:
- Docker issues: [`DOCKER_SETUP.md`](DOCKER_SETUP.md)
- Mac issues: [`MAC_SETUP.md`](MAC_SETUP.md)
- Windows issues: [`backend/WINDOWS_SETUP.md`](backend/WINDOWS_SETUP.md)

Common fixes:
```bash
# Docker: Rebuild everything
docker-compose down -v
docker-compose up --build

# Manual: Clear caches
cd frontend && rm -rf .expo node_modules && npm install
cd backend && find . -name "__pycache__" -delete
```

## 📂 Project Structure

```
RowdyHacks/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── routes/      # API endpoints
│   │   ├── db/          # Database operations
│   │   └── services/    # External services (Alpaca)
│   ├── Dockerfile
│   └── .env             # Configuration (not in git)
│
├── frontend/            # React Native + Expo
│   ├── app/             # Screens (file-based routing)
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts (Auth)
│   └── Dockerfile
│
├── docker-compose.yml   # Docker orchestration
├── QUICKSTART.md        # Quick start guide
├── DOCKER_SETUP.md      # Docker documentation
└── MAC_SETUP.md         # Mac setup guide
```

## 🤝 Contributing

This is a hackathon project! If you're on the team:

1. Pull latest changes: `git pull`
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test locally (Docker recommended)
5. Push and create PR: `git push origin feature-name`

## 📜 License

MIT License - Built for RowdyHacks 2025

## 🙏 Acknowledgments

- **RowdyHacks 2025** for the hackathon
- **Alpaca Markets** for paper trading API
- **AWS** for DynamoDB
- **Expo** for mobile development platform

---

**Questions?** Check the docs or ask your team lead!

Made with 🤠 by the Frontier Fund team
