// frontend/src/config.ts

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const api = {
  baseUrl: API_BASE_URL,
  health: `${API_BASE_URL}/health`,
  backtestDemo: `${API_BASE_URL}/backtest/demo`,
};