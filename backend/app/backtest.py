from __future__ import annotations

from typing import List, TypedDict, Dict, Tuple
import datetime as dt

import yfinance as yf

import pandas as pd

# ---------- Types ----------


class PricePointDict(TypedDict):
    date: str
    close: float


class EquityPointDict(TypedDict):
    step: int
    equity: float


class BacktestResult(TypedDict):
    symbol: str
    window: int
    alt_window: int
    days: int
    buy_and_hold_return_pct: float
    sma_strategy_return_pct: float
    alt_sma_strategy_return_pct: float
    num_points: int
    prices: List[PricePointDict]
    equity_curve: List[EquityPointDict]
    max_drawdown_pct: float
    volatility_pct: float
    sharpe_like: float


# ---------- Dummy price generator ----------


def generate_dummy_prices(symbol: str, days: int) -> List[PricePointDict]:
    """
    Simple deterministic dummy series so the app works even without real data.
    Just a gentle uptrend with tiny “noise” baked in.
    """
    if days < 5:
        raise ValueError("days must be at least 5 for a useful backtest")

    start_date = dt.date.today() - dt.timedelta(days=days - 1)
    price = 100.0
    prices: List[PricePointDict] = []

    for i in range(days):
        current_date = start_date + dt.timedelta(days=i)

        drift = 0.001  # ~0.1% per step
        noise = ((i % 5) - 2) * 0.0005  # small cycle noise
        price *= (1.0 + drift + noise)

        prices.append(
            {
                "date": current_date.strftime("%Y-%m-%d"),
                "close": round(price, 2),
            }
        )

    return prices


# ---------- Real price fetch (yfinance) ----------


def fetch_real_prices_yfinance(symbol: str, days: int) -> List[PricePointDict]:
    """
    Fetch up to `days` daily closes via yfinance. We ask for extra history and
    then trim to the most recent `days` valid closes.

    This version is careful to:
    - handle both simple and MultiIndex / multi-ticker DataFrames
    - avoid calling float() on a whole Series
    """
    if days < 5 or days > 365:
        raise ValueError("days must be between 5 and 365 for real-data backtests")

    # Pull more history than we strictly need, in case of holidays / missing days.
    period = f"{days * 2}d"

    df = yf.download(
        symbol,
        period=period,
        interval="1d",
        progress=False,
    )

    if df.empty:
        raise ValueError(f"No price data returned for symbol {symbol!r}.")

    # Try to get a "Close" series in a robust way
    close_obj = None

    # 1) Simple column case
    if "Close" in df.columns:
        close_obj = df["Close"]
    # 2) Sometimes only 'Adj Close' exists
    elif "Adj Close" in df.columns:
        close_obj = df["Adj Close"]
    else:
        # 3) MultiIndex columns (like ('Close', 'AAPL'))
        try:
            close_obj = df.xs("Close", axis=1, level=0)
        except Exception:
            raise ValueError(
                f"No 'Close' or 'Adj Close' column found for symbol {symbol!r}."
            )

    # If close_obj is a DataFrame (multi-ticker or multiindex), pick the first column
    if isinstance(close_obj, pd.DataFrame):
        if close_obj.shape[1] == 0:
            raise ValueError("No close data columns found.")
        close_series = close_obj.iloc[:, 0]
    else:
        close_series = close_obj

    # Clean up the series
    close_series = close_series.dropna()

    if close_series.empty:
        raise ValueError(f"No valid close prices for symbol {symbol!r}.")

    # Keep only the most recent `days` closes
    close_series = close_series.tail(days)

    prices: List[PricePointDict] = []
    for idx, close in close_series.items():
        # Index might be Timestamp, numpy datetime, or already a string.
        date_str = str(idx)[:10]

        prices.append(
            {
                "date": date_str,
                "close": float(close),  # now guaranteed to be a scalar
            }
        )

    if len(prices) < 5:
        raise ValueError(
            f"Not enough data points ({len(prices)}) for symbol {symbol!r}."
        )

    return prices


# ---------- Core math helpers ----------


def compute_buy_and_hold_return(prices: List[PricePointDict]) -> float:
    first = prices[0]["close"]
    last = prices[-1]["close"]
    if first <= 0:
        return 0.0
    return round((last / first - 1.0) * 100.0, 2)


def run_sma_strategy(
    prices: List[PricePointDict],
    window: int,
) -> Tuple[List[float], float]:
    """
    Simple SMA strategy:
    - Long (1x) when price > SMA(window), flat otherwise.
    - Equity starts at 1.0 and compounds when in position.
    """
    if window < 1:
        raise ValueError("SMA window must be at least 1")

    closes = [p["close"] for p in prices]
    n = len(closes)

    if n < window + 1:
        raise ValueError(
            f"Not enough points ({n}) for SMA window {window}. Need at least window+1."
        )

    equity_curve: List[float] = []
    equity = 1.0
    position = 0.0  # 0 = flat, 1 = long

    for i in range(n):
        price = closes[i]

        # Decide new position based on SMA
        if i >= window - 1:
            window_slice = closes[i - window + 1 : i + 1]
            sma = sum(window_slice) / window
            new_position = 1.0 if price > sma else 0.0
        else:
            new_position = position

        # Apply return from prior step based on prior position
        if i > 0:
            prev_price = closes[i - 1]
            if prev_price > 0:
                step_return = (price / prev_price) - 1.0
                equity *= 1.0 + position * step_return

        position = new_position
        equity_curve.append(equity)

    total_return_pct = round((equity_curve[-1] - 1.0) * 100.0, 2)
    return equity_curve, total_return_pct


def compute_risk_metrics(equity_curve: List[float]) -> Dict[str, float]:
    """
    Compute:
    - max_drawdown_pct: worst peak-to-trough drawdown
    - volatility_pct: std dev of daily equity returns
    - sharpe_like: mean daily return / std dev (not annualized)
    """
    if len(equity_curve) < 2:
        return {
            "max_drawdown_pct": 0.0,
            "volatility_pct": 0.0,
            "sharpe_like": 0.0,
        }

    # Max drawdown
    peak = equity_curve[0]
    max_drawdown = 0.0
    for eq in equity_curve:
        if eq > peak:
            peak = eq
        drawdown = (eq / peak) - 1.0
        if drawdown < max_drawdown:
            max_drawdown = drawdown
    max_drawdown_pct = round(max_drawdown * 100.0, 2)

    # Daily returns from equity curve
    returns: List[float] = []
    for i in range(1, len(equity_curve)):
        prev = equity_curve[i - 1]
        cur = equity_curve[i]
        if prev > 0:
            returns.append(cur / prev - 1.0)

    if not returns:
        return {
            "max_drawdown_pct": max_drawdown_pct,
            "volatility_pct": 0.0,
            "sharpe_like": 0.0,
        }

    mean_ret = sum(returns) / len(returns)
    var = sum((r - mean_ret) ** 2 for r in returns) / len(returns)
    vol = var**0.5
    volatility_pct = round(vol * 100.0, 2)
    sharpe_like = round(mean_ret / vol, 2) if vol > 0 else 0.0

    return {
        "max_drawdown_pct": max_drawdown_pct,
        "volatility_pct": volatility_pct,
        "sharpe_like": sharpe_like,
    }


# ---------- Public entrypoint used by FastAPI ----------


def run_dummy_backtest(
    symbol: str,
    window: int,
    alt_window: int,
    days: int,
    use_real: bool = False,
) -> BacktestResult:
    """
    Main function called by the API layer.
    If `use_real=True`, fetch prices from yfinance.
    Otherwise, use a deterministic dummy series.
    """
    if days < 5 or days > 365:
        raise ValueError("days must be between 5 and 365")

    if window < 1 or alt_window < 1:
        raise ValueError("SMA windows must be at least 1")

    # Choose price source
    if use_real:
        prices = fetch_real_prices_yfinance(symbol=symbol, days=days)
    else:
        prices = generate_dummy_prices(symbol=symbol, days=days)

    buy_and_hold_return_pct = compute_buy_and_hold_return(prices)

    # SMA strategies
    equity_curve_main, sma_return_pct = run_sma_strategy(prices, window)
    _, alt_sma_return_pct = run_sma_strategy(prices, alt_window)

    # Risk metrics based on main SMA equity curve
    risk = compute_risk_metrics(equity_curve_main)

    equity_curve: List[EquityPointDict] = [
        {"step": i + 1, "equity": round(eq, 4)} for i, eq in enumerate(equity_curve_main)
    ]

    return {
        "symbol": symbol.upper(),
        "window": window,
        "alt_window": alt_window,
        "days": days,
        "buy_and_hold_return_pct": buy_and_hold_return_pct,
        "sma_strategy_return_pct": sma_return_pct,
        "alt_sma_strategy_return_pct": alt_sma_return_pct,
        "num_points": len(prices),
        "prices": prices,
        "equity_curve": equity_curve,
        "max_drawdown_pct": risk["max_drawdown_pct"],
        "volatility_pct": risk["volatility_pct"],
        "sharpe_like": risk["sharpe_like"],
    }