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


# All backtest-related endpoints will live under /backtest
app.include_router(backtest_router, prefix="/backtest", tags=["backtest"])
