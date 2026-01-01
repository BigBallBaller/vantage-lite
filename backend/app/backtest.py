from __future__ import annotations

from datetime import date, timedelta
from typing import List, Dict, Tuple
import math


def generate_dummy_prices(days: int, start_price: float = 100.0) -> List[Dict[str, float | str]]:
    """
    Generate a simple synthetic price series with a gentle upward drift.
    """
    prices: List[Dict[str, float | str]] = []
    current_price = start_price

    today = date.today()
    start_day = today - timedelta(days=days - 1)

    for i in range(days):
        # Very simple drift + small deterministic wiggle
        drift = 0.0008  # ~0.08% per day
        wiggle = ((i % 5) - 2) * 0.02  # -0.04, -0.02, 0, 0.02, 0.04 pattern

        current_price = current_price * (1 + drift) + wiggle
        current_price = round(current_price, 2)

        prices.append(
            {
                "date": (start_day + timedelta(days=i)).isoformat(),
                "close": current_price,
            }
        )

    return prices


def run_sma_strategy(closes: List[float], window: int) -> Tuple[List[float], float]:
    """
    Very simple long-only SMA strategy:
    - When price > SMA(window): fully invested
    - When price <= SMA(window): in cash
    - Equity starts at 1.0
    Returns (equity_curve, total_return_pct).
    """
    if len(closes) < 2:
        return [1.0], 0.0

    equity = 1.0
    equity_curve: List[float] = [equity]
    position = 0.0  # 0 = cash, 1 = fully long

    for i in range(1, len(closes)):
        price = closes[i]
        prev_price = closes[i - 1]

        # Update position once we have enough data for SMA
        if i >= window:
            sma = sum(closes[i - window + 1 : i + 1]) / window
            position = 1.0 if price > sma else 0.0

        # Daily return only applied when in the market
        daily_ret = (price / prev_price - 1.0) * position
        equity *= 1.0 + daily_ret
        equity_curve.append(equity)

    total_return_pct = (equity_curve[-1] / equity_curve[0] - 1.0) * 100.0
    return equity_curve, round(total_return_pct, 2)


def compute_risk_metrics(equity_curve: List[float]) -> Dict[str, float]:
    """
    Compute:
    - max_drawdown_pct: worst peak-to-trough drop, in percent (positive number)
    - volatility_pct: std dev of daily returns, in percent
    - sharpe_like: mean(daily_return) / std(daily_return), not annualized
    """
    if len(equity_curve) < 2:
        return {
            "max_drawdown_pct": 0.0,
            "volatility_pct": 0.0,
            "sharpe_like": 0.0,
        }

    # Max drawdown
    peak = equity_curve[0]
    max_drawdown = 0.0  # this will be negative or zero

    for eq in equity_curve:
        peak = max(peak, eq)
        drawdown = eq / peak - 1.0
        max_drawdown = min(max_drawdown, drawdown)

    max_drawdown_pct = abs(max_drawdown) * 100.0

    # Daily returns
    daily_returns: List[float] = []
    for i in range(1, len(equity_curve)):
        r = equity_curve[i] / equity_curve[i - 1] - 1.0
        daily_returns.append(r)

    if not daily_returns:
        return {
            "max_drawdown_pct": round(max_drawdown_pct, 2),
            "volatility_pct": 0.0,
            "sharpe_like": 0.0,
        }

    mean_ret = sum(daily_returns) / len(daily_returns)
    var = sum((r - mean_ret) ** 2 for r in daily_returns) / len(daily_returns)
    vol = math.sqrt(var)
    vol_pct = vol * 100.0

    sharpe_like = (mean_ret / vol) if vol > 0 else 0.0

    return {
        "max_drawdown_pct": round(max_drawdown_pct, 2),
        "volatility_pct": round(vol_pct, 2),
        "sharpe_like": round(sharpe_like, 2),
    }


def run_dummy_backtest(
    symbol: str, window: int, alt_window: int, days: int
) -> Dict[str, object]:
    """
    Top-level helper called by the FastAPI route.
    Returns a dict that matches the DemoBacktestResponse model.
    """
    prices = generate_dummy_prices(days)
    closes = [p["close"] for p in prices]

    # Buy & hold
    if len(closes) >= 2:
        buy_and_hold_return_pct = (closes[-1] / closes[0] - 1.0) * 100.0
    else:
        buy_and_hold_return_pct = 0.0

    buy_and_hold_return_pct = round(buy_and_hold_return_pct, 2)

    # SMA strategies
    equity_curve_main, sma_return_pct = run_sma_strategy(closes, window)
    _, alt_sma_return_pct = run_sma_strategy(closes, alt_window)

    # Risk metrics based on main SMA equity curve
    risk = compute_risk_metrics(equity_curve_main)

    equity_curve = [
        {"step": i + 1, "equity": round(eq, 4)}
        for i, eq in enumerate(equity_curve_main)
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