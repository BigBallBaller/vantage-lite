# Vantage Lite

Vantage Lite is a small full-stack trading playground that shows how a React/Next.js frontend can talk to a FastAPI backend to run simple backtests on **real market data**.

It uses:

- A synthetic **dummy price series** for quick, deterministic demos
- Live **historical prices from Yahoo Finance** (via `yfinance`) when you enter real tickers like `AAPL`, `SPY`, or `QQQ`

The goal is to keep the math and code easy to follow while still looking and feeling like a real tool that you could put in a portfolio.

It started as a lightweight clone of my older “Vantage Trades” idea, but rebuilt with a modern, clean stack and a tighter scope:  
one page, a few strategies, real prices, and clear performance / risk metrics.

---

## Overview

The app lets you:

- Pick a **ticker** (e.g. AAPL, SPY, QQQ, or a custom symbol)
- Choose **SMA windows** and a **lookback period**
- Run a backtest that:
  - pulls real daily prices (via `yfinance`) for non-`DUMMY` symbols
  - or uses a deterministic dummy series for the special `DUMMY` symbol
- See:
  - Buy & hold performance
  - Two SMA strategy returns
  - Equity curve
  - Basic risk metrics (drawdown, volatility, Sharpe-like)

All of this is wired end-to-end: frontend → FastAPI → backtest logic → JSON → charts & tables.

---

## Tech stack

**Frontend**

- [Next.js](https://nextjs.org/) (App Router, TypeScript)
- React client components
- Tailwind CSS
- [Recharts](https://recharts.org/) for the equity curve chart
- LocalStorage for user-saved presets

**Backend**

- FastAPI
- Uvicorn
- Pydantic
- `yfinance` for real daily OHLCV data

**Tooling**

- Python 3.11 (`pyenv` + `venv`)
- Node.js + npm
- Git + GitHub

---

## Features

### 1. Backtest endpoint

The backend exposes a single main endpoint:

`GET /backtest/demo`

Query parameters:

- `symbol`: ticker symbol (e.g. `AAPL`, `SPY`, `QQQ`, or `DUMMY`)
- `window`: main SMA window (1–100)
- `alt_window`: alternate SMA window (1–100)
- `days`: lookback window (5–365 days)
- `use_real`: boolean; if `true` and symbol ≠ `DUMMY`, fetch real prices via `yfinance`

The endpoint returns a JSON payload with:

- `symbol`
- `window`, `alt_window`, `days`
- `buy_and_hold_return_pct`
- `sma_strategy_return_pct`
- `alt_sma_strategy_return_pct`
- `num_points`
- `prices`: array of `{ date, close }`
- `equity_curve`: array of `{ step, equity }`
- `max_drawdown_pct`
- `volatility_pct`
- `sharpe_like`

### 2. Strategies & risk metrics

The backtester currently supports:

- **Buy & hold**  
  - Return from first close to last close

- **Main SMA strategy**  
  - Simple SMA crossover / regime logic using the `window` parameter  
  - Full equity curve is returned

- **Alternate SMA strategy**  
  - Same idea, with `alt_window`  
  - Only final return is reported

**Risk metrics** are computed from the main SMA equity curve:

- **Max drawdown** (`max_drawdown_pct`)  
  Worst peak-to-trough drop, in percent.

- **Volatility** (`volatility_pct`)  
  Standard deviation of daily returns (SMA equity), in percent.

- **Sharpe-like** (`sharpe_like`)  
  Mean daily return / std dev of daily returns (not annualized).  
  It’s intentionally labeled “Sharpe-like” because it’s a simple ratio, not a fully risk-free-adjusted Sharpe.

### 3. Frontend experience

The main page (`frontend/src/app/page.tsx`) includes:

- Inputs for:
  - Symbol
  - SMA window
  - Alt SMA window
  - Number of days
- **Built-in presets**: AAPL, SPY, QQQ
- **Custom presets**:
  - Save up to 4 custom presets (stored in `localStorage`)
  - Each preset remembers symbol + windows + days
  - Inline delete (“×”) to remove a preset
- **Reset button**:
  - Resets inputs back to `DUMMY`, 5d / 10d SMAs, 30 days

- **Health badge**:
  - Calls `/health`
  - Shows “Backend: Online / Offline”
  - Disables the run button when backend is offline

- **Results section**:
  - Summary cards:
    - Symbol / days / points
    - Buy & hold return
    - SMA returns (main & alt) + “Best performer” label
    - Risk & stats (max drawdown, volatility, Sharpe-like)
  - Equity curve chart (Recharts)
  - Recent backtests table (local history, last 10 runs)
  - Price series table with date / close

---

## Project structure

```text
vantage-lite/
  backend/
    app/
      main.py         # FastAPI app, routing, /backtest/demo and /health
      backtest.py     # dummy prices, yfinance fetch, SMA logic, risk metrics
    requirements.txt  # backend Python deps

  frontend/
    package.json      # Next.js app (App Router, TS, Tailwind)
    src/
      app/
        config.ts     # API base + endpoints
        page.tsx      # main UI: form, presets, history, chart, tables

  docs/
    notes.md          # scratch notes / ideas

  .python-version     # pyenv version pin
  .gitignore
  README.md           # this file

  ---

## Getting started (local dev)

### Prerequisites

- Python 3.11 (via `pyenv` or a system install)
- Node.js + npm
- Git

### 1. Clone the repo

```bash
git clone https://github.com/BigBallBaller/vantage-lite.git
cd vantage-lite