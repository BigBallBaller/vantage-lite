# Vantage Lite

Vantage Lite is a lightweight, educational trading backtester inspired by your original Vantage Trades project. The goal is to have a clean, modern stack where you can quickly prototype and show simple trading strategies.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend:** FastAPI (Python 3.11)
- **Dev tooling:** `pyenv`, `npm`, `uvicorn`
- **Infrastructure:** Single repo with `frontend/` + `backend/` + `docs/`

## Current Features

- ✅ Project structure with separate `frontend` and `backend` folders
- ✅ Python virtual environment managed with `pyenv` + `venv`
- ✅ FastAPI backend with CORS configured for the Next.js dev server
- ✅ Demo backtest endpoint at `/backtest/demo` with:
  - Dummy price series generator
  - Simple buy & hold return
  - Simple SMA crossover strategy return
  - Symbol, SMA window, and days as query params
- ✅ Next.js frontend that:
  - Calls the backend
  - Displays symbol, SMA window, and basic performance metrics
  - Shows a scrollable table of the price series
  - Has a form to change symbol, SMA window, and days

## Roadmap (MVP)

These are future steps to make Vantage Lite feel like a real product.

- [ ] Add a simple `/health` or `/status` endpoint on the backend and surface it on the UI
- [ ] Add a second strategy (e.g., different SMA window or “only-long vs always-in”) and compare them side by side
- [ ] Add very basic input validation + nicer error messages on the frontend
- [ ] Add a minimal equity curve chart on the frontend (using a simple chart library)
- [ ] Abstract backtest logic into a clearer module so you can plug in real data later
- [ ] Swap dummy prices for real historical data from a market data API (e.g., Alpha Vantage, Polygon, etc.)
- [ ] Allow saving a few “favorite” backtest configs locally (e.g., localStorage)

## How to Run (local dev)

### Backend

```bash
cd backend
source ../.venv/bin/activate  # or from project root: source .venv/bin/activate
uvicorn app.main:app --reload