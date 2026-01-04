// frontend/src/app/config.ts

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export const api = {
  backtestDemo: `${API_BASE}/backtest/demo`,
  health: `${API_BASE}/health`,
};