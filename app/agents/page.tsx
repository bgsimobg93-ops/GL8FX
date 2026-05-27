"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ANALYSTS = [
  { id: "market",       label: "Market",       desc: "Price & technical patterns" },
  { id: "social",       label: "Social",       desc: "Reddit & sentiment signals" },
  { id: "news",         label: "News",         desc: "Macro & ticker news" },
  { id: "fundamentals", label: "Fundamentals", desc: "Earnings & financials" },
];

const PROVIDERS = [
  { id: "openai",    label: "OpenAI",    models: ["gpt-4o", "gpt-4o-mini"] },
  { id: "anthropic", label: "Anthropic", models: ["claude-opus-4-5", "claude-sonnet-4-5"] },
  { id: "google",    label: "Gemini",    models: ["gemini-2.0-flash", "gemini-2.5-pro"] },
];

type Job = {
  job_id: string;
  status: "pending" | "running" | "done" | "error";
  ticker: string;
  date: string;
  decision?: Record<string, unknown>;
  error?: string;
  started_at?: string;
  finished_at?: string;
};

function StatusDot({ status }: { status: Job["status"] }) {
  const colors: Record<Job["status"], string> = {
    pending: "bg-yellow-400",
    running: "bg-blue-400 animate-pulse",
    done:    "bg-emerald-400",
    error:   "bg-red-400",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />;
}

const SKIP_KEYS = new Set(["action","decision","raw","reasoning","rationale","analysis","reason","summary","confidence","risk","entry_price","entry","buy_price","sell_price","target_price","stop_loss","stop","take_profit","target"]);

function parseAction(decision: Record<string, unknown>): "BUY" | "SELL" | "RANGE" {
  const raw = String(decision.action ?? decision.decision ?? decision.raw ?? "").toUpperCase();
  if (raw.includes("BUY") || raw.includes("LONG"))   return "BUY";
  if (raw.includes("SELL") || raw.includes("SHORT")) return "SELL";
  return "RANGE";
}

function ActionBadge({ action }: { action: "BUY" | "SELL" | "RANGE" }) {
  const styles = {
    BUY:   "border-emerald-500/60 bg-emerald-950/30 text-emerald-300 shadow-emerald-900/40",
    SELL:  "border-red-500/60 bg-red-950/30 text-red-300 shadow-red-900/40",
    RANGE: "border-blue-500/40 bg-blue-950/30 text-blue-300 shadow-blue-900/40",
  };
  const icons = { BUY: "▲", SELL: "▼", RANGE: "◆" };
  return (
    <div className={`border p-6 text-center shadow-lg ${styles[action]}`}>
      <p className="text-[9px] tracking-[0.45em] uppercase opacity-50 mb-2">// Signal</p>
      <p className="text-5xl font-black tracking-wider mb-1">{icons[action]} {action}</p>
      {action === "RANGE" && (
        <p className="text-[10px] tracking-widest uppercase opacity-40 mt-1">Consolidation / No Clear Edge</p>
      )}
    </div>
  );
}

function DecisionCard({ decision, ticker }: { decision: Record<string, unknown>; ticker: string }) {
  const action = parseAction(decision);

  const reasoning = String(
    decision.reasoning ?? decision.rationale ?? decision.analysis ??
    decision.reason ?? decision.summary ?? ""
  ).trim();

  const confidence = decision.confidence ? String(decision.confidence) : null;
  const risk       = decision.risk       ? String(decision.risk)       : null;

  const entry   = decision.entry_price  ?? decision.entry  ?? decision.buy_price  ?? decision.sell_price  ?? null;
  const stop    = decision.stop_loss    ?? decision.stop   ?? null;
  const target  = decision.take_profit  ?? decision.target ?? decision.target_price ?? null;

  const extras = Object.entries(decision).filter(([k]) => !SKIP_KEYS.has(k));

  return (
    <div className="space-y-4">
      {/* Signal */}
      <ActionBadge action={action} />

      {/* Meta row */}
      {(confidence || risk) && (
        <div className="grid grid-cols-2 gap-3">
          {confidence && (
            <div className="border border-blue-900/35 bg-blue-950/15 p-4 text-center">
              <p className="text-[9px] tracking-[0.35em] uppercase text-blue-400/50 mb-1">Confidence</p>
              <p className="text-lg font-bold text-white">{confidence}</p>
            </div>
          )}
          {risk && (
            <div className="border border-blue-900/35 bg-blue-950/15 p-4 text-center">
              <p className="text-[9px] tracking-[0.35em] uppercase text-blue-400/50 mb-1">Risk</p>
              <p className="text-lg font-bold text-white">{risk}</p>
            </div>
          )}
        </div>
      )}

      {/* Entry / Stop / Target */}
      {(entry || stop || target) && (
        <div className="border border-blue-900/35 bg-blue-950/15 p-5">
          <p className="text-[9px] tracking-[0.35em] uppercase text-blue-400/55 mb-4">// Entry Points</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {entry && (
              <div>
                <p className="text-[9px] tracking-widest uppercase text-emerald-400/50 mb-1">Entry</p>
                <p className="text-sm font-bold text-emerald-300">{String(entry)}</p>
              </div>
            )}
            {stop && (
              <div>
                <p className="text-[9px] tracking-widest uppercase text-red-400/50 mb-1">Stop Loss</p>
                <p className="text-sm font-bold text-red-300">{String(stop)}</p>
              </div>
            )}
            {target && (
              <div>
                <p className="text-[9px] tracking-widest uppercase text-blue-400/50 mb-1">Target</p>
                <p className="text-sm font-bold text-blue-300">{String(target)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reasoning */}
      {reasoning && (
        <div className="border border-blue-900/35 bg-blue-950/15 p-5">
          <p className="text-[9px] tracking-[0.35em] uppercase text-blue-400/55 mb-3">// Analysis & Reasoning</p>
          <div className="space-y-2">
            {reasoning.split(/\n+/).map((para, i) => (
              <p key={i} className="text-sm text-blue-100/75 leading-relaxed">{para}</p>
            ))}
          </div>
        </div>
      )}

      {/* Extra fields */}
      {extras.map(([k, v]) => (
        <div key={k} className="border border-blue-900/25 bg-blue-950/10 p-4">
          <p className="text-[9px] tracking-[0.3em] uppercase text-blue-400/45 mb-1">
            {k.replace(/_/g, " ")}
          </p>
          <p className="text-sm text-blue-100/65 leading-relaxed whitespace-pre-wrap">
            {typeof v === "object" ? JSON.stringify(v, null, 2) : String(v)}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function AgentsPage() {
  const [ticker,    setTicker]    = useState("NVDA");
  const [date,      setDate]      = useState(new Date().toISOString().slice(0, 10));
  const [analysts,  setAnalysts]  = useState(["market", "fundamentals", "news"]);
  const [provider,  setProvider]  = useState(PROVIDERS[0]);
  const [deepModel, setDeepModel] = useState(PROVIDERS[0].models[0]);
  const [fastModel, setFastModel] = useState(PROVIDERS[0].models[1]);
  const [loading,   setLoading]   = useState(false);
  const [job,       setJob]       = useState<Job | null>(null);
  const [history,   setHistory]   = useState<Job[]>([]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const toggleAnalyst = (id: string) =>
    setAnalysts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );

  const switchProvider = (p: typeof PROVIDERS[0]) => {
    setProvider(p);
    setDeepModel(p.models[0]);
    setFastModel(p.models[1]);
  };

  const poll = async (jobId: string) => {
    try {
      const res = await fetch(`/agents/api?job_id=${jobId}`);
      const data: Job = await res.json();
      setJob(data);
      if (data.status === "done" || data.status === "error") {
        clearInterval(pollRef.current!);
        setLoading(false);
        setHistory(h => [data, ...h.filter(j => j.job_id !== jobId)]);
      }
    } catch {
      clearInterval(pollRef.current!);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!ticker || !date || analysts.length === 0) return;
    setLoading(true);
    setJob(null);

    try {
      const res = await fetch("/agents/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker:          ticker.toUpperCase(),
          date,
          analysts,
          llm_provider:    provider.id,
          deep_think_llm:  deepModel,
          quick_think_llm: fastModel,
        }),
      });
      const newJob: Job = await res.json();
      setJob(newJob);
      pollRef.current = setInterval(() => poll(newJob.job_id), 2000);
    } catch (err) {
      setLoading(false);
      setJob({ job_id: "", status: "error", ticker, date, error: String(err) });
    }
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  return (
    <div
      className="min-h-screen bg-[#000008] text-white"
      style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden px-8 py-14 md:px-16"
        style={{
          background:
            "radial-gradient(ellipse at 70% 20%, rgba(30,58,138,0.32) 0%, transparent 55%), linear-gradient(135deg,#000,#020215,#04042e)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(96,165,250,1) 1px,transparent 1px),linear-gradient(90deg,rgba(96,165,250,1) 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <motion.div
          className="relative max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[10px] tracking-[0.45em] text-blue-400 uppercase mb-4">
            // GL8FX · Multi-Agent Trading System
          </p>
          <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight mb-4">
            Trading<span className="text-blue-400">Agents</span>
          </h1>
          <p className="text-blue-200/60 max-w-xl text-sm leading-relaxed">
            AI analyst team — Market, Fundamental, News &amp; Social agents debate in real-time
            and produce a structured trading decision for any ticker.
          </p>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["Analysts", "4 Specialized"],
              ["Framework", "LangGraph"],
              ["Data", "yFinance + News"],
              ["LLMs", "OpenAI / Claude / Gemini"],
            ].map(([k, v]) => (
              <div key={k} className="border border-blue-900/35 bg-blue-950/20 px-4 py-3">
                <p className="text-[9px] tracking-[0.28em] uppercase text-blue-400/50">{k}</p>
                <p className="text-sm font-bold text-white mt-1">{v}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── MAIN ── */}
      <div className="max-w-5xl mx-auto px-8 md:px-16 py-12 grid md:grid-cols-[1fr,1.4fr] gap-8">

        {/* LEFT — CONFIG ── */}
        <div className="space-y-6">
          {/* Ticker + Date */}
          <div className="border border-blue-900/35 bg-blue-950/15 p-6">
            <p className="text-[9px] tracking-[0.35em] uppercase text-blue-400/55 mb-4">// Target</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-blue-300/60 block mb-1">Ticker Symbol</label>
                <input
                  value={ticker}
                  onChange={e => setTicker(e.target.value.toUpperCase())}
                  placeholder="NVDA"
                  className="w-full bg-[#000014] border border-blue-900/40 text-white px-4 py-2.5 text-sm font-bold font-mono tracking-wider focus:outline-none focus:border-blue-500/60"
                />
              </div>
              <div>
                <label className="text-xs text-blue-300/60 block mb-1">Analysis Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-[#000014] border border-blue-900/40 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/60"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>
          </div>

          {/* Analysts */}
          <div className="border border-blue-900/35 bg-blue-950/15 p-6">
            <p className="text-[9px] tracking-[0.35em] uppercase text-blue-400/55 mb-4">// Analyst Team</p>
            <div className="space-y-2">
              {ANALYSTS.map(a => (
                <button
                  key={a.id}
                  onClick={() => toggleAnalyst(a.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 border text-left transition-all ${
                    analysts.includes(a.id)
                      ? "border-blue-500/50 bg-blue-950/40 text-white"
                      : "border-blue-900/25 bg-transparent text-blue-300/40 hover:border-blue-800/40"
                  }`}
                >
                  <div>
                    <span className="text-sm font-semibold">{a.label}</span>
                    <span className="text-xs text-blue-400/40 ml-2">{a.desc}</span>
                  </div>
                  {analysts.includes(a.id) && (
                    <span className="text-blue-400 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* LLM Provider */}
          <div className="border border-blue-900/35 bg-blue-950/15 p-6">
            <p className="text-[9px] tracking-[0.35em] uppercase text-blue-400/55 mb-4">// LLM Provider</p>
            <div className="flex gap-2 mb-4">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => switchProvider(p)}
                  className={`flex-1 py-2 text-xs font-bold border transition-all ${
                    provider.id === p.id
                      ? "border-blue-500/50 bg-blue-950/50 text-white"
                      : "border-blue-900/25 text-blue-400/40 hover:border-blue-800/40"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-blue-400/45 block mb-1 tracking-widest uppercase">Deep Think Model</label>
                <select
                  value={deepModel}
                  onChange={e => setDeepModel(e.target.value)}
                  className="w-full bg-[#000014] border border-blue-900/40 text-white px-3 py-2 text-xs focus:outline-none"
                >
                  {provider.models.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-blue-400/45 block mb-1 tracking-widest uppercase">Quick Think Model</label>
                <select
                  value={fastModel}
                  onChange={e => setFastModel(e.target.value)}
                  className="w-full bg-[#000014] border border-blue-900/40 text-white px-3 py-2 text-xs focus:outline-none"
                >
                  {provider.models.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || analysts.length === 0}
            className="w-full py-4 font-bold text-sm tracking-[0.15em] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{
              background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              border: "1px solid rgba(96,165,250,0.35)",
              boxShadow: "0 0 28px rgba(59,130,246,0.28)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Agents Running…
              </span>
            ) : "Run Analysis →"}
          </button>
        </div>

        {/* RIGHT — OUTPUT ── */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {!job && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border border-blue-900/20 bg-blue-950/10 p-10 text-center h-64 flex flex-col items-center justify-center"
              >
                <div className="text-5xl font-black text-blue-900/30 mb-3">AI</div>
                <p className="text-blue-400/35 text-sm">Configure the team and run an analysis</p>
              </motion.div>
            )}

            {job && (
              <motion.div
                key={job.job_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Status header */}
                <div className="border border-blue-900/35 bg-blue-950/15 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <StatusDot status={job.status} />
                      <span className="text-xs font-bold tracking-wider uppercase text-blue-200">
                        {job.ticker} · {job.date}
                      </span>
                    </div>
                    <span className="text-[9px] tracking-[0.25em] uppercase text-blue-400/40">
                      {job.status}
                    </span>
                  </div>

                  {job.status === "running" && (
                    <div className="space-y-2">
                      {analysts.map((a, i) => (
                        <div key={a} className="flex items-center gap-3">
                          <div className="text-[9px] uppercase tracking-widest text-blue-400/50 w-24">{a}</div>
                          <div className="flex-1 bg-blue-950/40 h-1">
                            <motion.div
                              className="h-1 bg-gradient-to-r from-blue-600 to-blue-400"
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 8, delay: i * 2, ease: "linear" }}
                            />
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-blue-400/40 mt-3">
                        Agents are debating — this typically takes 2–5 minutes…
                      </p>
                    </div>
                  )}

                  {job.status === "pending" && (
                    <p className="text-xs text-blue-400/40">Initializing agent team…</p>
                  )}
                </div>

                {/* Decision */}
                {job.status === "done" && job.decision && (
                  <DecisionCard decision={job.decision} ticker={job.ticker} />
                )}

                {/* Error */}
                {job.status === "error" && (
                  <div className="border border-red-900/40 bg-red-950/15 p-5">
                    <p className="text-[9px] tracking-[0.3em] uppercase text-red-400/60 mb-2">// Error</p>
                    <p className="text-sm text-red-300/70 leading-relaxed font-mono">{job.error}</p>
                    <p className="text-xs text-red-400/40 mt-3">Check that your API keys are set in the .env file and the Python backend is running.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* History */}
          {history.length > 0 && (
            <div className="border border-blue-900/25 bg-blue-950/10 p-5">
              <p className="text-[9px] tracking-[0.35em] uppercase text-blue-400/45 mb-4">// Previous Analyses</p>
              <div className="space-y-2">
                {history.map(h => {
                  const act = h.decision ? parseAction(h.decision) : null;
                  const actColor = act === "BUY" ? "text-emerald-400" : act === "SELL" ? "text-red-400" : "text-blue-400";
                  return (
                    <button
                      key={h.job_id}
                      onClick={() => setJob(h)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-blue-900/20 bg-transparent hover:border-blue-700/35 text-left transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <StatusDot status={h.status} />
                        <span className="text-sm font-bold">{h.ticker}</span>
                        <span className="text-xs text-blue-400/40">{h.date}</span>
                      </div>
                      {act
                        ? <span className={`text-xs font-bold tracking-widest ${actColor}`}>{act}</span>
                        : <span className="text-[9px] tracking-widest uppercase text-blue-400/35">{h.status}</span>
                      }
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* API Keys reminder */}
          <div className="border border-yellow-900/30 bg-yellow-950/10 p-4">
            <p className="text-[9px] tracking-[0.3em] uppercase text-yellow-400/55 mb-2">// Setup Required</p>
            <p className="text-xs text-yellow-200/50 leading-relaxed">
              Set your API keys in <code className="text-yellow-300/60">.env</code> before running the Python backend.
              See <code className="text-yellow-300/60">.env.example</code> for all required keys.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
