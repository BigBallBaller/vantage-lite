# Vantage Lite

Vantage Lite is a small full-stack trading playground that shows how a React/Next.js frontend can talk to a FastAPI backend to run simple backtests.

It uses a deterministic dummy price series (instead of live market data) to keep the logic easy to reason about while still exercising the full request → backtest → visualization flow.

---

## Tech stack

- **Frontend**
  - Next.js (App Router, TypeScript)
  - React + client components
  - Tailwind CSS
  - Recharts (equity curve chart)

- **Backend**
  - FastAPI
  - Uvicorn
  - Pydantic

- **Tooling**
  - Python 3.11 (managed with `pyenv` + `venv`)
  - Node.js / npm
  - Git + GitHub

---

## Features

- 🔁 **Dummy backtest endpoint**  
  FastAPI backend exposes `/backtest/demo` which:
  - generates a synthetic price series
  - computes:
    - buy & hold return
    - SMA strategy return (window 1–100 days)
    - alternate SMA strategy return (window 1–100 days)
  - returns an equity curve for the main SMA strategy

- 📊 **Interactive frontend controls**
  - Symbol input (uppercased, with a `DUMMY` fallback)
  - SMA window and alt window (with client-side clamping)
  - Number of days (5–365, clamped)

- ⚡ **Quick presets & reset**
  - One-click presets for **AAPL**, **SPY**, **QQQ**
  - “Reset” button to jump back to `DUMMY`, 5d / 10d SMAs, 30 days

- 📈 **Visualizations**
  - Equity curve chart (strategy equity starting from 1.0)
  - Price series table with dates and closes

- ✅ **Health & validation**
  - Backend health check badge (`/health`)
  - Disabled run button + inline hint when backend is offline
  - Friendly error messages if the backend cannot be reached
  - Client-side clamping on all numeric inputs

---

## Project structure

```text
vantage-lite/
  backend/
    app/
      main.py         # FastAPI app + routing
      backtest.py     # dummy price generator + SMA logic
    requirements.txt  # backend Python deps

  frontend/
    package.json      # Next.js app (App Router, TS, Tailwind)
    src/
      app/
        page.tsx      # main UI: form, chart, table

  docs/
    notes.md          # scratch notes / ideas

  .python-version     # pyenv version pin
  .gitignore
  README.md           # (this file)