// frontend/src/app/page.tsx
async function getBackendMessage() {
  const res = await fetch("http://localhost:8000/", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch from backend");
  }

  return res.json() as Promise<{ message: string; status: string; source: string }>;
}

export default async function Home() {
  const data = await getBackendMessage();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
      <div className="rounded-xl border border-slate-800 bg-slate-900 px-8 py-6 shadow-lg max-w-xl w-full space-y-4">
        <h1 className="text-2xl font-semibold text-sky-400">
          Vantage Lite
        </h1>
        <p className="text-sm text-slate-300">
          Simple full-stack test. The message below is coming from your FastAPI backend
          at <code className="px-1 py-0.5 rounded bg-slate-800">http://localhost:8000/</code>.
        </p>

        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">
            Backend response
          </div>
          <pre className="text-sm text-sky-300">
{`message: ${data.message}
status:  ${data.status}
source:  ${data.source}`}
          </pre>
        </div>
      </div>
    </main>
  );
}