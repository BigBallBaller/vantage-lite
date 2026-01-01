"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type DemoBacktest = {
  symbol: string;
  window: number;
  alt_window: number;
  days: number;
  buy_and_hold_return_pct: number;
  sma_strategy_return_pct: number;
  alt_sma_strategy_return_pct: number;
  num_points: number;
  prices: { date: string; close: number }[];
  equity_curve: { step: number; equity: number }[];
};

type HealthStatus = "checking" | "online" | "offline";

// Frontend validation limits (match or tighten backend guards)
const MIN_WINDOW = 1;
const MAX_WINDOW = 100;
const MIN_DAYS = 5;
const MAX_DAYS = 365;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getBestPerformer(data: DemoBacktest) {
  const candidates = [
    { label: "Buy & hold", value: data.buy_and_hold_return_pct },
    { label: `SMA ${data.window}d`, value: data.sma_strategy_return_pct },
    { label: `SMA ${data.alt_window}d`, value: data.alt_sma_strategy_return_pct },
  ];

  return candidates.reduce((best, current) =>
    current.value > best.value ? current : best
  );
}

export default function Home() {
  const [symbol, setSymbol] = useState("DUMMY");
  const [window, setWindow] = useState(5);
  const [altWindow, setAltWindow] = useState(10);
  const [days, setDays] = useState(30);

  const [data, setData] = useState<DemoBacktest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [health, setHealth] = useState<HealthStatus>("checking");

  const best = data ? getBestPerformer(data) : null;

  async function checkHealth() {
    try {
      const res = await fetch("http://localhost:8000/health");
      if (res.ok) {
        setHealth("online");
      } else {
        setHealth("offline");
      }
    } catch {
      setHealth("offline");
    }
  }

  async function fetchBacktest(params?: {
    symbol?: string;
    window?: number;
    altWindow?: number;
    days?: number;
  }) {
    const rawSymbol = params?.symbol ?? symbol;
    const s = rawSymbol.trim() === "" ? "DUMMY" : rawSymbol.trim().toUpperCase();

    const rawWindow = params?.window ?? window;
    const rawAltWindow = params?.altWindow ?? altWindow;
    const rawDays = params?.days ?? days;

    const w = clamp(rawWindow, MIN_WINDOW, MAX_WINDOW);
    const aw = clamp(rawAltWindow, MIN_WINDOW, MAX_WINDOW);
    const d = clamp(rawDays, MIN_DAYS, MAX_DAYS);

    // keep local state in sync with clamped values
    setWindow(w);
    setAltWindow(aw);
    setDays(d);
    setSymbol(s);

    const query = new URLSearchParams({
      symbol: s,
      window: String(w),
      alt_window: String(aw),
      days: String(d),
    });

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `http://localhost:8000/backtest/demo?${query.toString()}`
      );

      if (!res.ok) {
        throw new Error(`Backend returned ${res.status}`);
      }

      const json = (await res.json()) as DemoBacktest;
      setData(json);
    } catch (err: any) {
      let message = "Unknown error";

      const rawMessage = err?.message ?? "";
      if (
        rawMessage.includes("Failed to fetch") ||
        rawMessage.includes("NetworkError")
      ) {
        message =
          "Could not reach backend at http://localhost:8000. Please make sure it is running.";
      } else if (rawMessage) {
        message = rawMessage;
      }

      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  // On first render: check backend health and load default backtest
  useEffect(() => {
    checkHealth();
    fetchBacktest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchBacktest();
  }

  function renderHealthBadge() {
    let text = "Checking…";
    let circleClass = "bg-yellow-400";

    if (health === "online") {
      text = "Backend: Online";
      circleClass = "bg-emerald-400";
    } else if (health === "offline") {
      text = "Backend: Offline";
      circleClass = "bg-red-400";
    }

    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-[11px] text-slate-300">
        <span className={`h-2 w-2 rounded-full ${circleClass}`} />
        <span>{text}</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="w-full max-w-4xl space-y-6">
        <header className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-3xl font-semibold text-sky-400">
                Vantage Lite
              </h1>
              <p className="text-sm text-slate-300">
                Demo backtest powered by your FastAPI backend. Adjust the symbol
                and parameters below and run a new backtest using a dummy price
                series and simple SMA crossover strategies.
              </p>
            </div>
            {renderHealthBadge()}
          </div>
        </header>

        {/* Form */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Symbol
                </label>
                <input
                  value={symbol}
                  onChange={(e) =>
                    setSymbol(e.target.value.toUpperCase().slice(0, 10))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                  placeholder="AAPL, SPY, etc."
                />
                <p className="text-[11px] text-slate-500">
                  Leave blank to use DUMMY.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  SMA window (days)
                </label>
                <input
                  type="number"
                  min={MIN_WINDOW}
                  max={MAX_WINDOW}
                  value={window}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (Number.isNaN(value)) return;
                    setWindow(clamp(value, MIN_WINDOW, MAX_WINDOW));
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500">
                  {MIN_WINDOW}-{MAX_WINDOW} days.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Alt SMA window (days)
                </label>
                <input
                  type="number"
                  min={MIN_WINDOW}
                  max={MAX_WINDOW}
                  value={altWindow}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (Number.isNaN(value)) return;
                    setAltWindow(clamp(value, MIN_WINDOW, MAX_WINDOW));
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500">
                  {MIN_WINDOW}-{MAX_WINDOW} days.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Number of days
                </label>
                <input
                  type="number"
                  min={MIN_DAYS}
                  max={MAX_DAYS}
                  value={days}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (Number.isNaN(value)) return;
                    setDays(clamp(value, MIN_DAYS, MAX_DAYS));
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500">
                  {MIN_DAYS}-{MAX_DAYS} days.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || health === "offline"}
            >
              {loading ? "Running…" : "Run demo backtest"}
            </button>
          </form>

          {health === "offline" && (
            <p className="mt-1 text-[11px] text-amber-400">
              Backend appears offline. Start it in the{" "}
              <code className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800">
                backend
              </code>{" "}
              folder with{" "}
              <code className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800">
                uvicorn app.main:app --reload
              </code>
              .
            </p>
          )}

          {error && (
            <p className="mt-2 text-xs text-red-400">
              Error fetching backtest: {error}
            </p>
          )}
        </section>

        {/* Results */}
        {data && (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Symbol
                </p>
                <p className="text-lg font-semibold text-sky-300">
                  {data.symbol}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Days: {data.days}, points: {data.num_points}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Buy and hold return
                </p>
                <p className="text-2xl font-semibold text-emerald-400">
                  {data.buy_and_hold_return_pct}%
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  From first close to last close
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  SMA strategies
                </p>
                <p className="text-sm text-slate-200">
                  SMA {data.window}d:{" "}
                  <span className="font-semibold text-emerald-300">
                    {data.sma_strategy_return_pct}%
                  </span>
                </p>
                <p className="text-sm text-slate-200">
                  SMA {data.alt_window}d:{" "}
                  <span className="font-semibold text-emerald-200">
                    {data.alt_sma_strategy_return_pct}%
                  </span>
                </p>

                {best && (
                  <p className="text-xs text-slate-300 mt-1">
                    Best performer:{" "}
                    <span className="font-semibold text-emerald-300">
                      {best.label} ({best.value}%)
                    </span>
                  </p>
                )}

                <p className="text-xs text-slate-400 mt-1">
                  Both based on simple crossover logic.
                </p>
              </div>
            </section>

            {/* Equity curve chart */}
            {data.equity_curve && data.equity_curve.length > 0 && (
              <section className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Equity curve (SMA {data.window}d)
                  </p>
                  <p className="text-xs text-slate-400">
                    Starting equity 1.0, strategy only
                  </p>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.equity_curve}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis
                        dataKey="step"
                        tick={{ fontSize: 10, fill: "#cbd5f5" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#cbd5f5" }}
                        tickLine={false}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        formatter={(value: any) =>
                          typeof value === "number"
                            ? value.toFixed(3)
                            : value
                        }
                        labelFormatter={(label: any) => `Step ${label}`}
                        contentStyle={{
                          backgroundColor: "#020617",
                          borderColor: "#1e293b",
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="equity"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            <section className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Price series
                </p>
                <p className="text-xs text-slate-400">
                  {data.num_points} points returned from backend
                </p>
              </div>

              <div className="max-h-64 overflow-auto rounded-lg border border-slate-800 bg-slate-950">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                        Date
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-300">
                        Close
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.prices.map((p) => (
                      <tr
                        key={p.date}
                        className="border-t border-slate-800 hover:bg-slate-900/70"
                      >
                        <td className="px-3 py-1.5 text-xs text-slate-200">
                          {p.date}
                        </td>
                        <td className="px-3 py-1.5 text-xs text-slate-200 text-right">
                          {p.close.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {!data && !loading && !error && (
          <p className="text-xs text-slate-500">
            No data yet. Try running a demo backtest.
          </p>
        )}

        <footer className="text-[11px] text-slate-500">
          Backend:{" "}
          <code className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800">
            http://localhost:8000/backtest/demo
          </code>{" "}
          · Health:{" "}
          <code className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800">
            http://localhost:8000/health
          </code>{" "}
          · Frontend: Next.js client component fetching on the client.
        </footer>
      </div>
    </main>
  );
}