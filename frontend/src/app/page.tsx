"use client";

import { useEffect, useState } from "react";

type DemoBacktest = {
  symbol: string;
  window: number;
  days: number;
  buy_and_hold_return_pct: number;
  sma_strategy_return_pct: number;
  num_points: number;
  prices: { date: string; close: number }[];
};

export default function Home() {
  const [symbol, setSymbol] = useState("DUMMY");
  const [window, setWindow] = useState(5);
  const [days, setDays] = useState(30);

  const [data, setData] = useState<DemoBacktest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchBacktest(params?: {
    symbol?: string;
    window?: number;
    days?: number;
  }) {
    const s = params?.symbol ?? symbol;
    const w = params?.window ?? window;
    const d = params?.days ?? days;

    const query = new URLSearchParams({
      symbol: s,
      window: String(w),
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
      setError(err.message ?? "Unknown error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  // Load default on first render
  useEffect(() => {
    fetchBacktest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchBacktest();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="w-full max-w-4xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold text-sky-400">
            Vantage Lite
          </h1>
          <p className="text-sm text-slate-300">
            Demo backtest powered by your FastAPI backend. Adjust the symbol and
            parameters below and run a new backtest using a dummy price series
            and a simple SMA crossover strategy.
          </p>
        </header>

        {/* Form */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Symbol
                </label>
                <input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                  placeholder="AAPL, SPY, etc."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  SMA window (days)
                </label>
                <input
                  type="number"
                  min={2}
                  max={100}
                  value={window}
                  onChange={(e) => setWindow(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Number of days
                </label>
                <input
                  type="number"
                  min={5}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Running…" : "Run demo backtest"}
            </button>
          </form>

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
                  Window: {data.window} day SMA
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Buy &amp; hold return
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
                  SMA strategy return
                </p>
                <p className="text-2xl font-semibold text-emerald-300">
                  {data.sma_strategy_return_pct}%
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Using {data.window}-day SMA crossover
                </p>
              </div>
            </section>

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
          · Frontend: Next.js client component fetching on the client.
        </footer>
      </div>
    </main>
  );
}