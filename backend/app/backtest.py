from datetime import date, timedelta
from typing import List, Dict

from fastapi import APIRouter

router = APIRouter()


def _generate_dummy_prices(num_days: int = 30) -> List[Dict]:
    """Generate a simple fake price series for demo purposes."""
    start = date.today() - timedelta(days=num_days)
    prices = []
    price = 100.0

    for i in range(num_days):
        # tiny random-ish drift: up 0.5% every 3rd day, down 0.3% every 5th, else flat-ish
        if i % 5 == 0:
            price *= 0.997
        elif i % 3 == 0:
            price *= 1.005
        else:
            price *= 1.001

        prices.append(
            {
                "date": (start + timedelta(days=i)).isoformat(),
                "close": round(price, 2),
            }
        )

    return prices


def _simple_buy_and_hold(prices: List[Dict]) -> float:
    """Return simple buy-and-hold total return %."""
    if not prices:
        return 0.0
    start = prices[0]["close"]
    end = prices[-1]["close"]
    return round((end - start) / start * 100, 2)


def _sma_equity_curve(prices: List[Dict], window: int = 5) -> List[Dict]:
    """
    Build an equity curve for a simple SMA crossover strategy.
    Returns a list of {step, equity} where equity starts at 1.0.
    """
    if len(prices) <= window:
        return []

    closes = [p["close"] for p in prices]
    equity = 1.0
    last_price = closes[window]

    curve: List[Dict] = []
    # starting point: no trades yet
    curve.append({"step": window, "equity": round(equity, 4)})

    for i in range(window + 1, len(closes)):
        window_closes = closes[i - window : i]
        sma = sum(window_closes) / window
        price = closes[i]

        position = 1 if price > sma else 0

        daily_return = (price - last_price) / last_price if last_price > 0 else 0.0
        equity *= 1 + position * daily_return
        last_price = price

        curve.append({"step": i, "equity": round(equity, 4)})

    return curve


def _simple_sma_crossover(prices: List[Dict], window: int = 5) -> float:
    """
    Simple SMA crossover total return %, derived from the equity curve.
    """
    curve = _sma_equity_curve(prices, window=window)
    if not curve:
        return 0.0
    end_equity = curve[-1]["equity"]
    return round((end_equity - 1.0) * 100, 2)


@router.get("/demo")
def demo_backtest(
    symbol: str = "DUMMY",
    window: int = 5,
    alt_window: int = 10,
    days: int = 30,
):
    """
    Demo backtest endpoint with simple parameters.

    Query params:
    - symbol: string label for the asset (default: DUMMY)
    - window: primary SMA window in days (default: 5)
    - alt_window: secondary SMA window in days (default: 10)
    - days: number of price points to generate (default: 30)
    """
    # basic safety guards
    window = max(1, min(window, 100))
    alt_window = max(1, min(alt_window, 100))
    days = max(5, min(days, 365))

    prices = _generate_dummy_prices(num_days=days)
    buy_hold_return = _simple_buy_and_hold(prices)
    sma_return = _simple_sma_crossover(prices, window=window)
    alt_sma_return = _simple_sma_crossover(prices, window=alt_window)

    equity_curve = _sma_equity_curve(prices, window=window)

    return {
        "symbol": symbol.upper(),
        "window": window,
        "alt_window": alt_window,
        "days": days,
        "buy_and_hold_return_pct": buy_hold_return,
        "sma_strategy_return_pct": sma_return,
        "alt_sma_strategy_return_pct": alt_sma_return,
        "num_points": len(prices),
        "prices": prices,
        "equity_curve": equity_curve,
    }