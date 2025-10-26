"""
Stock Trading Routes
Handles stock listing, quotes, and trade execution
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from app.routes.user_routes import get_current_user
from app.services.alpaca_service import alpaca_service
from app.db import transactions as txn_db

router = APIRouter(prefix="/stocks", tags=["stocks"])


class StockQuoteResponse(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float


class StockListResponse(BaseModel):
    category: str
    stocks: List[Dict[str, str]]


class TradeRequest(BaseModel):
    symbol: str
    quantity: float = Field(gt=0)
    group_id: str
    description: Optional[str] = None


class TradeResponse(BaseModel):
    success: bool
    message: str
    transaction_id: Optional[str] = None
    order_details: Optional[Dict] = None


@router.get("/lists", response_model=Dict[str, List[Dict[str, str]]])
async def get_stock_lists(current_user: dict = Depends(get_current_user)):
    """Get all available stock lists organized by category"""
    return alpaca_service.get_stock_lists()


@router.get("/quote/{symbol}")
async def get_stock_quote(
    symbol: str,
    current_user: dict = Depends(get_current_user)
) -> StockQuoteResponse:
    """Get current quote for a stock symbol"""
    
    # Get stock info
    stock_info = alpaca_service.get_stock_info(symbol)
    
    if not stock_info:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")
    
    # Find stock name from our lists
    all_stocks = alpaca_service.get_stock_lists()
    stock_name = symbol
    
    for category, stocks in all_stocks.items():
        for stock in stocks:
            if stock["symbol"] == symbol:
                stock_name = stock["name"]
                break
    
    return StockQuoteResponse(
        symbol=symbol,
        name=stock_name,
        price=stock_info["price"],
        change=stock_info["change"],
        change_percent=stock_info["change_percent"],
    )


@router.post("/quotes")
async def get_multiple_quotes(
    symbols: List[str],
    current_user: dict = Depends(get_current_user)
) -> List[StockQuoteResponse]:
    """Get quotes for multiple symbols at once"""
    
    all_stocks = alpaca_service.get_stock_lists()
    stock_names = {}
    
    # Build name lookup
    for category, stocks in all_stocks.items():
        for stock in stocks:
            stock_names[stock["symbol"]] = stock["name"]
    
    # Get prices
    prices = alpaca_service.get_multiple_prices(symbols)
    
    results = []
    for symbol in symbols:
        if symbol in prices:
            stock_info = alpaca_service.get_stock_info(symbol)
            if stock_info:
                results.append(
                    StockQuoteResponse(
                        symbol=symbol,
                        name=stock_names.get(symbol, symbol),
                        price=stock_info["price"],
                        change=stock_info["change"],
                        change_percent=stock_info["change_percent"],
                    )
                )
    
    return results


@router.post("/trade", response_model=TradeResponse)
async def create_trade_proposal(
    trade: TradeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a trade proposal (investment transaction)
    This will create a pending transaction that needs group approval
    """
    
    # Get current stock price
    price = alpaca_service.get_current_price(trade.symbol)
    
    if not price:
        raise HTTPException(
            status_code=404,
            detail=f"Could not get price for {trade.symbol}"
        )
    
    # Calculate total cost
    total_cost = price * trade.quantity
    
    # Find stock name
    all_stocks = alpaca_service.get_stock_lists()
    stock_name = trade.symbol
    
    for category, stocks in all_stocks.items():
        for stock in stocks:
            if stock["symbol"] == trade.symbol:
                stock_name = stock["name"]
                break
    
    # Create description
    description = trade.description or f"Buy {trade.quantity} shares of {stock_name} ({trade.symbol}) @ ${price:.2f}"
    
    # Convert floats to Decimal for DynamoDB
    # DynamoDB requires Decimal type for numbers
    transaction = txn_db.create_transaction(
        group_id=trade.group_id,
        user_id=current_user["userId"],
        amount=float(total_cost),  # amount is converted to Decimal in create_transaction
        description=description,
        transaction_type="investment",
        metadata={
            "stock_symbol": trade.symbol,
            "stock_name": stock_name,
            "quantity": str(trade.quantity),  # Convert to string to avoid Decimal issues
            "price_per_share": str(round(price, 2)),  # Convert to string
            "total_cost": str(round(total_cost, 2)),  # Convert to string
            "order_type": "market",
            "side": "buy",
        }
    )
    
    if not transaction:
        raise HTTPException(
            status_code=500,
            detail="Failed to create trade proposal"
        )
    
    return TradeResponse(
        success=True,
        message=f"Trade proposal created: {description}",
        transaction_id=transaction["transactionID"],
        order_details={
            "symbol": trade.symbol,
            "name": stock_name,
            "quantity": trade.quantity,
            "price": price,
            "total": total_cost,
        }
    )
