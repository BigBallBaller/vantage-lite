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


def _simple_sma_crossover(prices: List[Dict], window: int = 5) -> float:
    """
    Very naive SMA strategy:
    - Stay out of market until there are 'window' days
    - If today's close > SMA(window), be 'in' (1)
    - Else be 'out' (0)
    - Return total % return based on position each day
    """
    if len(prices) <= window:
        return 0.0

    closes = [p["close"] for p in prices]
    position = 0  # 0 = flat, 1 = long
    equity = 1.0  # start at 1.0 and grow
    last_price = closes[window]

    for i in range(window + 1, len(closes)):
        window_closes = closes[i - window : i]
        sma = sum(window_closes) / window
        price = closes[i]

        # Decide position for today
        position = 1 if price > sma else 0

        # Apply daily return
        daily_return = (price - last_price) / last_price if last_price > 0 else 0.0
        equity *= 1 + position * daily_return
        last_price = price

    return round((equity - 1.0) * 100, 2)


@router.get("/demo")
def demo_backtest():
    """
    Demo backtest endpoint.
    Returns:
    - dummy price series
    - buy & hold return
    - simple SMA strategy return
    """
    prices = _generate_dummy_prices()
    buy_hold_return = _simple_buy_and_hold(prices)
    sma_return = _simple_sma_crossover(prices, window=5)

    return {
        "symbol": "DUMMY",
        "window": 5,
        "buy_and_hold_return_pct": buy_hold_return,
        "sma_strategy_return_pct": sma_return,
        "num_points": len(prices),
        "prices": prices,
    }
