from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class BotCreate(BaseModel):
    handle: str = Field(..., pattern=r"^[A-Za-z0-9_]+$", min_length=2, max_length=32)
    name: str = Field(..., min_length=1, max_length=64)
    model: str = "gemma3:27b"
    llm_provider: str = "ollama"          # "ollama" | "anthropic"
    symbol: str = "BTC"
    timeframes: list[str] = ["30m", "4h", "1d"]
    system_prompt: Optional[str] = None
    risk_mode: str = "moderate"           # "conservative" | "moderate" | "aggressive"
    max_position_usd: float = 100.0
    mode: str = "server"                  # "server" | "client"
    hl_wallet_address: Optional[str] = None
    hl_private_key: Optional[str] = None  # stored encrypted in production


class BotUpdate(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None
    llm_provider: Optional[str] = None
    symbol: Optional[str] = None
    timeframes: Optional[list[str]] = None
    system_prompt: Optional[str] = None
    risk_mode: Optional[str] = None
    max_position_usd: Optional[float] = None
    hl_wallet_address: Optional[str] = None
    hl_private_key: Optional[str] = None


class BotResponse(BaseModel):
    id: str
    user_id: str
    handle: str
    name: str
    model: str
    symbol: str
    timeframes: list[str]
    risk_mode: str
    max_position_usd: float
    mode: str
    status: str
    equity_usd: Optional[float]
    initial_equity_usd: Optional[float]
    total_trades: int
    total_prompts: int
    created_at: datetime
    updated_at: datetime


class DecisionResponse(BaseModel):
    id: str
    bot_id: str
    symbol: str
    decision: str
    crv_score: int
    reasoning: str
    model: Optional[str]
    price_at_decision: Optional[float]
    prompt_tokens: Optional[int]
    created_at: datetime


class TradeResponse(BaseModel):
    id: str
    bot_id: str
    symbol: str
    side: str
    size_usd: float
    entry_price: float
    exit_price: Optional[float]
    pnl_usd: Optional[float]
    status: str
    opened_at: datetime
    closed_at: Optional[datetime]
