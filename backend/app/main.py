from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.backtest import router as backtest_router

app = FastAPI()

# Allow requests from your Next.js dev server
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "message": "Vantage Lite backend is live",
        "status": "ok",
        "source": "FastAPI",
    }


@app.get("/health")
def health():
    """
    Simple health check endpoint for the backend.
    """
    return {
        "status": "ok",
        "service": "vantage-lite-backend",
        "version": "0.1.0",
    }


# All backtest-related endpoints will live under /backtest
app.include_router(backtest_router, prefix="/backtest", tags=["backtest"])