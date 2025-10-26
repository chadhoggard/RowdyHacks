# 🤠 TrustVault Setup Guide (Mac)

Complete setup guide for running TrustVault locally on macOS.

## Prerequisites

- macOS (any recent version)
- Python 3.10+
- Node.js 18+
- Git

## Quick Start (5 minutes)

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/chadhoggard/RowdyHacks.git
cd RowdyHacks

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Environment

Edit `backend/.env` with your credentials:

```bash
# Required: AWS Credentials (for DynamoDB)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Required: Database Tables (should already exist in AWS)
USERS_TABLE=Users
GROUPS_TABLE=Groups
TRANSACTIONS_TABLE=Transactions

# Required: Security
JWT_SECRET=your-random-secret-here

# Optional: Alpaca API for Stock Trading (free at https://alpaca.markets)
ALPACA_API_KEY=your_paper_trading_key
ALPACA_SECRET_KEY=your_paper_trading_secret
```

### 3. Start Everything

**Terminal 1 - Backend:**
```bash
cd backend
source ../.venv/bin/activate
./setup_local.sh
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npx expo start
```

### 4. Access the App

- **Web**: Press `w` in the Expo terminal
- **iOS Simulator**: Press `i` (requires Xcode)
- **Android Emulator**: Press `a` (requires Android Studio)
- **Physical Device**: Scan QR code with Expo Go app

## Features

### Core Features (Ready to Use)
- ✅ User authentication (signup/login)
- ✅ Create investment groups ("ranches")
- ✅ Invite members to groups
- ✅ Democratic voting on proposals
- ✅ Deposit/withdraw funds
- ✅ Track group balance and investments
- ✅ Transaction ledger

### Stock Trading (Requires Alpaca API)
- 📈 Browse 35+ stocks across 8 categories
- 💰 Real-time stock prices
- 📊 Blue chips, ETFs, and sector stocks
- 🗳️ Group voting on trades
- 📜 Trade execution and tracking

## Getting Alpaca API Keys (Optional - 2 minutes)

Stock trading requires free Alpaca API keys:

1. Go to https://alpaca.markets
2. Sign up for free account
3. Navigate to "Paper Trading" section
4. Generate API keys
5. Add to `backend/.env`:
   ```
   ALPACA_API_KEY=your_key_here
   ALPACA_SECRET_KEY=your_secret_here
   ```
6. Restart backend

## Project Structure

```
RowdyHacks/
├── backend/              # FastAPI Python backend
│   ├── app/
│   │   ├── routes/      # API endpoints
│   │   ├── db/          # Database operations
│   │   └── services/    # External APIs (Alpaca)
│   └── .env             # Configuration (COPY FROM .env.example)
│
└── frontend/            # React Native (Expo) app
    ├── app/             # Screens and navigation
    ├── components/      # Reusable UI components
    └── contexts/        # Auth context
```

## Common Issues & Solutions

### Backend Issues

**Port Already in Use (8080)**
```bash
# Find and kill the process
lsof -ti:8080 | xargs kill -9

# Or use a different port
# Edit backend/app/main.py: uvicorn.run(app, host="0.0.0.0", port=8081)
```

**"No module named 'alpaca'"**
```bash
source .venv/bin/activate
pip install alpaca-py httpx
```

**AWS Credentials Error**
- Make sure AWS credentials in `.env` are correct
- Verify DynamoDB tables exist in AWS console
- Check AWS region matches your tables

### Frontend Issues

**"Cannot connect to backend"**
```bash
# Make sure backend is running on port 8080
curl http://localhost:8080/health

# Check API_BASE_URL in frontend code
# Should be: http://localhost:8080
```

**"Expo CLI not found"**
```bash
npm install -g expo-cli
# Or use npx: npx expo start
```

**Metro bundler issues**
```bash
# Clear cache
cd frontend
npx expo start -c
```

## API Endpoints

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `GET /users/me` - Get current user

### Groups (Ranches)
- `POST /groups` - Create group
- `GET /groups` - List user's groups
- `GET /groups/{id}` - Get group details
- `DELETE /groups/{id}` - Delete group

### Transactions
- `POST /transactions` - Create proposal
- `GET /transactions` - List transactions
- `POST /transactions/{id}/vote` - Vote on proposal
- `POST /transactions/{id}/execute` - Execute approved proposal

### Stock Trading (Alpaca Required)
- `GET /stocks/lists` - Get stock categories
- `GET /stocks/quote/{symbol}` - Get stock price
- `POST /stocks/trade` - Create trade proposal

### Invites
- `POST /invites` - Send invite
- `GET /invites/received` - List received invites
- `POST /invites/{id}/accept` - Accept invite
- `POST /invites/{id}/decline` - Decline invite

## Development Tips

### View API Documentation
```bash
# Start backend, then visit:
http://localhost:8080/docs
```

### Hot Reload
Both backend and frontend support hot reload:
- **Backend**: Auto-reloads on file changes
- **Frontend**: Shake device or press `r` to reload

### Debug Mode
```bash
# Backend verbose logging
cd backend
DEBUG=true ./setup_local.sh

# Frontend debug
cd frontend
npx expo start --dev-client
```

### Clear All Data
```bash
# Clear frontend cache
cd frontend
rm -rf .expo node_modules
npm install

# Clear backend cache
cd backend
find . -type d -name "__pycache__" -exec rm -r {} +
find . -name "*.pyc" -delete
```

## Testing the App

### Create Test Account
1. Open app
2. Click "Sign Up"
3. Enter: username, email, password
4. Click "Create Account"

### Create a Ranch (Group)
1. Login
2. Click "+" button
3. Enter ranch name (e.g., "Family Investment")
4. Ranch appears on home screen

### Invite Members
1. Open ranch
2. Click "Invite" button
3. Select user from list
4. They receive invite notification

### Make a Deposit
1. Open ranch
2. Click "Deposit"
3. Enter amount
4. Funds added immediately (no voting needed)

### Create Investment Proposal
1. Click "Invest" button
2. **Without Alpaca**: Enter amount and description
3. **With Alpaca**: Browse stocks, select, enter quantity
4. Creates proposal for group voting

### Vote on Proposals
1. View proposals in ranch
2. Click "Approve" or "Reject"
3. When majority approves, "Execute" button appears
4. Click "Execute" to finalize transaction

### View Ledger
- Scroll to bottom of ranch
- See all executed transactions
- Includes stock trades if Alpaca enabled

## Production Deployment

For production deployment, you'll need:
1. AWS account with DynamoDB tables
2. Production Alpaca API keys (if using stock trading)
3. Secure JWT_SECRET (use: `openssl rand -hex 32`)
4. Proper CORS configuration
5. HTTPS/SSL certificates
6. Environment variables (not .env files)

## Support

- **Issues**: https://github.com/chadhoggard/RowdyHacks/issues
- **API Docs**: http://localhost:8080/docs (when running)
- **Alpaca Docs**: https://alpaca.markets/docs

## License

MIT License - See LICENSE file for details

---

Made with 🤠 for RowdyHacks 2025
