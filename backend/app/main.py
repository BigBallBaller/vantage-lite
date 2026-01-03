from __future__ import annotations

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .backtest import run_dummy_backtest

# This is the FastAPI app uvicorn expects as "app"
app = FastAPI(title="Vantage Lite Backend")

# Allow the Next.js dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        #  add deployed frontend origin here, e.g.:
        # "https://vantage-lite.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/backtest/demo")
def backtest_demo(
    symbol: str = Query("DUMMY"),
    window: int = Query(5, ge=1, le=100),
    alt_window: int = Query(10, ge=1, le=100),
    days: int = Query(30, ge=5, le=365),
    use_real: bool = Query(
        False,
        description="If true, fetch real prices via yfinance instead of dummy data.",
    ),
):
    """
    Run a backtest using either dummy or real price data.
    """
    try:
        return run_dummy_backtest(
            symbol=symbol,
            window=window,
            alt_window=alt_window,
            days=days,
            use_real=use_real,
        )
    except ValueError as e:
        # Validation / data issues from the backtest layer
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # TEMP: show internal error text so we can debug
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")