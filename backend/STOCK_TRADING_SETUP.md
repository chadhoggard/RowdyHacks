# Stock Trading with Alpaca API

This feature integrates real-time stock data and mock paper trading using the Alpaca API.

## Setup Instructions

### 1. Get Alpaca API Keys (Free)

1. Go to [https://alpaca.markets/](https://alpaca.markets/)
2. Sign up for a free account
3. Navigate to "Paper Trading" section
4. Generate your Paper Trading API keys

### 2. Configure Backend

Add your Alpaca API keys to `/backend/.env`:

```env
ALPACA_API_KEY=your_paper_trading_api_key_here
ALPACA_SECRET_KEY=your_paper_trading_secret_key_here
```

### 3. Install Dependencies

```bash
cd backend
source ../.venv/bin/activate  # or .venv/bin/activate
pip install -r requirements.txt
```

### 4. Restart Backend

```bash
cd backend
./setup_local.sh  # or setup_local.bat on Windows
```

## Features

### Curated Stock Lists

The system provides organized stock lists:

- **💎 Blue Chip Stocks**: AAPL, MSFT, GOOGL, AMZN, JPM, V, JNJ, WMT, PG, MA
- **📊 ETFs**: SPY, QQQ, IWM, VTI, VOO, DIA
- **💻 Technology**: NVDA, META, TSLA
- **🏥 Healthcare**: UNH, PFE, ABBV
- **🏦 Finance**: BAC, WFC, GS
- **🛍️ Consumer**: COST, HD, NKE
- **⚡ Energy**: XOM, CVX, COP
- **🏭 Industrial**: BA, CAT, UPS

### API Endpoints

#### Get Stock Lists
```
GET /stocks/lists
```
Returns all available stocks organized by category.

#### Get Stock Quote
```
GET /stocks/quote/{symbol}
```
Returns current price, daily change, and change percentage.

#### Create Trade Proposal
```
POST /stocks/trade
{
  "symbol": "AAPL",
  "quantity": 10,
  "group_id": "group-uuid",
  "description": "Optional custom description"
}
```
Creates a pending transaction proposal for the group to vote on.

## How It Works

1. **Browse Stocks**: User clicks "Invest" button in ranch and opens stock trading modal
2. **Select Stock**: Choose from categorized lists (Blue Chips, ETFs, sectors)
3. **Get Real Price**: System fetches live market data from Alpaca
4. **Enter Quantity**: Specify number of shares to buy
5. **Create Proposal**: Generates a transaction proposal with:
   - Stock symbol and name
   - Current price per share
   - Total cost calculation
   - Metadata (for future trade execution)
6. **Group Voting**: Ranch members vote on the proposal
7. **Execute Trade**: When approved and executed, the system:
   - Deducts funds from ranch balance
   - Records trade in ledger
   - Stores stock position data

## Mock vs Real Trading

- **Paper Trading**: All trades use Alpaca's paper trading environment
- **No Real Money**: Completely safe for testing and learning
- **Real Data**: Prices and market data are live and accurate
- **Future Enhancement**: Can be switched to live trading with proper regulations/licensing

## Frontend Usage

Import and use the StockTradingModal component:

```tsx
import { StockTradingModal } from "@/components/StockTradingModal";

// In your ranch component:
const [stockModalVisible, setStockModalVisible] = useState(false);

// Replace or update the existing Invest modal
<StockTradingModal
  visible={stockModalVisible}
  onClose={() => setStockModalVisible(false)}
  onTradeSubmit={handleStockTrade}
  groupId={id}
  authToken={authToken}
/>

// Handler function:
const handleStockTrade = async (
  symbol: string,
  quantity: number,
  stockName: string,
  price: number
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/trade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        symbol,
        quantity,
        group_id: id,
      }),
    });

    if (response.ok) {
      Alert.alert("Success", "Trade proposal created!");
      await fetchProposals(); // Refresh proposals list
    } else {
      const error = await response.json();
      Alert.alert("Error", error.detail || "Failed to create trade proposal");
    }
  } catch (error) {
    Alert.alert("Error", "Network error occurred");
  }
};
```

## Security Notes

- API keys should NEVER be committed to git
- Use environment variables for all sensitive data
- Paper trading keys are safe for development/testing
- Live trading would require additional security measures

## Troubleshooting

### "No module named 'alpaca'" Error
```bash
cd /home/cheeseburger/RowdyHacks
source .venv/bin/activate
pip install alpaca-py httpx
```

### "API keys not found" Warning
- Check that `.env` file has `ALPACA_API_KEY` and `ALPACA_SECRET_KEY`
- Restart the backend server after adding keys

### Stock prices not loading
- Verify Alpaca API keys are correct
- Check internet connection
- Market might be closed (system will use last known prices)

## Future Enhancements

- [ ] Portfolio tracking per ranch
- [ ] Historical performance charts
- [ ] Dividend tracking
- [ ] Rebalancing proposals
- [ ] Stop-loss/take-profit orders
- [ ] Options trading
- [ ] Crypto support
