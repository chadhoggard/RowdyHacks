"""
Alpaca Trading API Service
Provides mock trading functionality with real market data
"""
import os
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockLatestQuoteRequest, StockBarsRequest
from alpaca.data.timeframe import TimeFrame
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest, GetOrdersRequest
from alpaca.trading.enums import OrderSide, TimeInForce

# Curated stock lists by category
STOCK_LISTS = {
    "blue_chips": [
        {"symbol": "AAPL", "name": "Apple Inc."},
        {"symbol": "MSFT", "name": "Microsoft Corporation"},
        {"symbol": "GOOGL", "name": "Alphabet Inc."},
        {"symbol": "AMZN", "name": "Amazon.com Inc."},
        {"symbol": "JPM", "name": "JPMorgan Chase & Co."},
        {"symbol": "V", "name": "Visa Inc."},
        {"symbol": "JNJ", "name": "Johnson & Johnson"},
        {"symbol": "WMT", "name": "Walmart Inc."},
        {"symbol": "PG", "name": "Procter & Gamble"},
        {"symbol": "MA", "name": "Mastercard Inc."},
    ],
    "etfs": [
        {"symbol": "SPY", "name": "SPDR S&P 500 ETF"},
        {"symbol": "QQQ", "name": "Invesco QQQ Trust"},
        {"symbol": "IWM", "name": "iShares Russell 2000 ETF"},
        {"symbol": "VTI", "name": "Vanguard Total Stock Market ETF"},
        {"symbol": "VOO", "name": "Vanguard S&P 500 ETF"},
        {"symbol": "DIA", "name": "SPDR Dow Jones Industrial Average ETF"},
    ],
    "technology": [
        {"symbol": "NVDA", "name": "NVIDIA Corporation"},
        {"symbol": "META", "name": "Meta Platforms Inc."},
        {"symbol": "TSLA", "name": "Tesla Inc."},
    ],
    "healthcare": [
        {"symbol": "UNH", "name": "UnitedHealth Group Inc."},
        {"symbol": "PFE", "name": "Pfizer Inc."},
        {"symbol": "ABBV", "name": "AbbVie Inc."},
    ],
    "finance": [
        {"symbol": "BAC", "name": "Bank of America Corp."},
        {"symbol": "WFC", "name": "Wells Fargo & Company"},
        {"symbol": "GS", "name": "Goldman Sachs Group Inc."},
    ],
    "consumer": [
        {"symbol": "COST", "name": "Costco Wholesale Corporation"},
        {"symbol": "HD", "name": "Home Depot Inc."},
        {"symbol": "NKE", "name": "Nike Inc."},
    ],
    "energy": [
        {"symbol": "XOM", "name": "Exxon Mobil Corporation"},
        {"symbol": "CVX", "name": "Chevron Corporation"},
        {"symbol": "COP", "name": "ConocoPhillips"},
    ],
    "industrial": [
        {"symbol": "BA", "name": "Boeing Company"},
        {"symbol": "CAT", "name": "Caterpillar Inc."},
        {"symbol": "UPS", "name": "United Parcel Service Inc."},
    ],
}


class AlpacaService:
    def __init__(self):
        """Initialize Alpaca clients with API keys from environment"""
        # Use paper trading keys for mock trading
        self.api_key = os.getenv("ALPACA_API_KEY", "")
        self.secret_key = os.getenv("ALPACA_SECRET_KEY", "")
        
        if not self.api_key or not self.secret_key:
            print("⚠️ Warning: Alpaca API keys not found in environment")
            self.data_client = None
            self.trading_client = None
        else:
            # Data client for market data (free, no account needed)
            self.data_client = StockHistoricalDataClient(
                api_key=self.api_key,
                secret_key=self.secret_key
            )
            
            # Trading client for paper trading
            self.trading_client = TradingClient(
                api_key=self.api_key,
                secret_key=self.secret_key,
                paper=True  # Always use paper trading
            )

    def get_stock_lists(self) -> Dict[str, List[Dict]]:
        """Get all available stock lists organized by category"""
        return STOCK_LISTS

    def get_current_price(self, symbol: str) -> Optional[float]:
        """Get current price for a symbol"""
        if not self.data_client:
            # Return mock data if API not configured
            return 100.0
        
        try:
            request = StockLatestQuoteRequest(symbol_or_symbols=symbol)
            quotes = self.data_client.get_stock_latest_quote(request)
            
            if symbol in quotes:
                quote = quotes[symbol]
                # Use mid-point of bid/ask
                return float((quote.bid_price + quote.ask_price) / 2)
            return None
        except Exception as e:
            print(f"❌ Error fetching price for {symbol}: {e}")
            return None

    def get_multiple_prices(self, symbols: List[str]) -> Dict[str, float]:
        """Get current prices for multiple symbols at once"""
        if not self.data_client:
            # Return mock data if API not configured
            return {symbol: 100.0 for symbol in symbols}
        
        try:
            request = StockLatestQuoteRequest(symbol_or_symbols=symbols)
            quotes = self.data_client.get_stock_latest_quote(request)
            
            prices = {}
            for symbol in symbols:
                if symbol in quotes:
                    quote = quotes[symbol]
                    prices[symbol] = float((quote.bid_price + quote.ask_price) / 2)
            
            return prices
        except Exception as e:
            print(f"❌ Error fetching prices: {e}")
            return {}

    def get_stock_info(self, symbol: str) -> Optional[Dict]:
        """Get detailed stock information including current price and daily change"""
        if not self.data_client:
            return {
                "symbol": symbol,
                "price": 100.0,
                "change": 0.0,
                "change_percent": 0.0,
            }
        
        try:
            # Get current price
            price = self.get_current_price(symbol)
            if not price:
                return None
            
            # Get yesterday's close to calculate change
            end = datetime.now()
            start = end - timedelta(days=7)  # Look back a week to ensure we get data
            
            request = StockBarsRequest(
                symbol_or_symbols=symbol,
                timeframe=TimeFrame.Day,
                start=start,
                end=end,
            )
            
            bars = self.data_client.get_stock_bars(request)
            
            if symbol in bars and len(bars[symbol]) > 0:
                # Get the most recent bar before today
                sorted_bars = sorted(bars[symbol], key=lambda x: x.timestamp, reverse=True)
                prev_close = float(sorted_bars[0].close)
                
                change = price - prev_close
                change_percent = (change / prev_close) * 100
                
                return {
                    "symbol": symbol,
                    "price": price,
                    "change": change,
                    "change_percent": change_percent,
                }
            
            # If we can't get historical data, return current price only
            return {
                "symbol": symbol,
                "price": price,
                "change": 0.0,
                "change_percent": 0.0,
            }
            
        except Exception as e:
            print(f"❌ Error fetching stock info for {symbol}: {e}")
            return None

    def place_mock_order(
        self,
        symbol: str,
        quantity: float,
        side: str = "buy",
    ) -> Optional[Dict]:
        """
        Place a mock paper trading order
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL')
            quantity: Number of shares
            side: 'buy' or 'sell'
        
        Returns:
            Order details if successful, None otherwise
        """
        if not self.trading_client:
            # Return mock order if API not configured
            price = self.get_current_price(symbol)
            return {
                "order_id": "mock_" + str(datetime.now().timestamp()),
                "symbol": symbol,
                "quantity": quantity,
                "side": side,
                "price": price,
                "total": price * quantity,
                "status": "filled",
                "timestamp": datetime.now().isoformat(),
            }
        
        try:
            order_side = OrderSide.BUY if side.lower() == "buy" else OrderSide.SELL
            
            order_data = MarketOrderRequest(
                symbol=symbol,
                qty=quantity,
                side=order_side,
                time_in_force=TimeInForce.DAY,
            )
            
            order = self.trading_client.submit_order(order_data)
            
            return {
                "order_id": str(order.id),
                "symbol": order.symbol,
                "quantity": float(order.qty),
                "side": order.side.value,
                "price": float(order.filled_avg_price) if order.filled_avg_price else None,
                "total": float(order.filled_qty) * float(order.filled_avg_price) if order.filled_avg_price else None,
                "status": order.status.value,
                "timestamp": order.submitted_at.isoformat() if order.submitted_at else None,
            }
            
        except Exception as e:
            print(f"❌ Error placing order: {e}")
            return None


# Singleton instance
alpaca_service = AlpacaService()
