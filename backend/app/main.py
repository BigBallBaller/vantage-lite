from __future__ import annotations

from typing import List

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .backtest import run_dummy_backtest


class PricePoint(BaseModel):
    date: str
    close: float


class EquityPoint(BaseModel):
    step: int
    equity: float


class DemoBacktestResponse(BaseModel):
    symbol: str
    window: int
    alt_window: int
    days: int
    buy_and_hold_return_pct: float
    sma_strategy_return_pct: float
    alt_sma_strategy_return_pct: float
    num_points: int
    prices: List[PricePoint]
    equity_curve: List[EquityPoint]
    max_drawdown_pct: float = Field(
        ..., description="Max drawdown of the SMA equity curve, in percent."
    )
    volatility_pct: float = Field(
        ..., description="Volatility of SMA daily returns (std dev), in percent."
    )
    sharpe_like: float = Field(
        ..., description="Mean daily return / std dev of daily returns (not annualized)."
    )


app = FastAPI(title="Vantage Lite Backend")

# Allow the Next.js dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/backtest/demo", response_model=DemoBacktestResponse)
def backtest_demo(
    symbol: str = Query("DUMMY", min_length=1, max_length=10),
    window: int = Query(5, ge=1, le=100),
    alt_window: int = Query(10, ge=1, le=100),
    days: int = Query(30, ge=5, le=365),
):
    """
    Run a dummy backtest with a synthetic price series and simple SMA strategies.
    """
    result = run_dummy_backtest(
        symbol=symbol,
        window=window,
        alt_window=alt_window,
        days=days,
    )
    return result