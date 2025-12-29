// frontend/src/app/page.tsx

type DemoBacktest = {
  symbol: string;
  window: number;
  buy_and_hold_return_pct: number;
  sma_strategy_return_pct: number;
  num_points: number;
  prices: { date: string; close: number }[];
};

async function getDemoBacktest(): Promise<DemoBacktest> {
  const res = await fetch("http://localhost:8000/backtest/demo", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch demo backtest");
  }

  return res.json();
}

export default async function Home() {
  const data = await getDemoBacktest();

  const {
    symbol,
    window,
    buy_and_hold_return_pct,
    sma_strategy_return_pct,
    num_points,
  } = data;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="w-full max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold text-sky-400">
            Vantage Lite
          </h1>
          <p className="text-sm text-slate-300">
            Demo backtest powered by your FastAPI backend. Results below are
            generated from a dummy price series and a simple SMA crossover
            strategy.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
              Symbol
            </p>
            <p className="text-lg font-semibold text-sky-300">{symbol}</p>
            <p className="text-xs text-slate-400 mt-1">
              Window: {window} day SMA
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
              Buy &amp; hold return
            </p>
            <p className="text-2xl font-semibold text-emerald-400">
              {buy_and_hold_return_pct}%
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
              {sma_strategy_return_pct}%
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Using {window} day SMA crossover
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Price series
            </p>
            <p className="text-xs text-slate-400">
              {num_points} points returned from backend
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

        <footer className="text-[11px] text-slate-500">
          Backend:{" "}
          <code className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800">
            http://localhost:8000/backtest/demo
          </code>{" "}
          · Frontend: Next.js App Router (server component) fetching on the
          server.
        </footer>
      </div>
    </main>
  );
}