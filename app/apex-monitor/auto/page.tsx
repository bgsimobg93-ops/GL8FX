"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  LogOut,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
  XCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AutoAccount {
  id: string;
  balance: number;
  startingBalance: number;
  dailyPnL: number;
  isDrawdown: boolean;
}

interface AutoPair {
  id: string;
  position: number;
  acc1: AutoAccount;
  acc2: AutoAccount;
  combinedBalance: number;
  balanceDiff: number;
  combinedPnL: number;
}

// ─── Data Generation ──────────────────────────────────────────────────────────

function prng(seed: number) {
  let s = seed;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateAccounts(): AutoAccount[] {
  return Array.from({ length: 100 }, (_, idx) => {
    const i = idx + 1;
    const rand = prng(i * 7919);

    const isDrawdown = rand() < 0.16; // ~16 accounts hit daily drawdown
    let dailyPnL: number;

    if (isDrawdown) {
      dailyPnL = -(1000 + Math.round(rand() * 900)); // -$1,000 to -$1,900
    } else {
      dailyPnL = Math.round((rand() - 0.38) * 2200); // mostly positive
      dailyPnL = Math.max(-999, dailyPnL); // cap at -$999
    }

    return {
      id: `ATF-${String(i).padStart(5, "0")}`,
      balance: 50000 + dailyPnL,
      startingBalance: 50000,
      dailyPnL,
      isDrawdown,
    };
  });
}

function buildPairs(accounts: AutoAccount[]): {
  pairs: AutoPair[];
  solo: AutoAccount | null;
} {
  // Sort by balance descending — pair consecutive (closest in balance)
  const available = [...accounts]
    .filter((a) => !a.isDrawdown)
    .sort((a, b) => b.balance - a.balance);

  const pairs: AutoPair[] = [];
  for (let i = 0; i + 1 < available.length; i += 2) {
    const acc1 = available[i];
    const acc2 = available[i + 1];
    pairs.push({
      id: `pair-${Math.floor(i / 2) + 1}`,
      position: Math.floor(i / 2) + 1,
      acc1,
      acc2,
      combinedBalance: acc1.balance + acc2.balance,
      balanceDiff: Math.abs(acc1.balance - acc2.balance),
      combinedPnL: acc1.dailyPnL + acc2.dailyPnL,
    });
  }

  const solo =
    available.length % 2 === 1 ? available[available.length - 1] : null;
  return { pairs, solo };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

const QUEUE_KEY = "apex-auto-queue-v2";

// ─── Components ───────────────────────────────────────────────────────────────

function PairRow({
  pair,
  highlight,
  dim,
}: {
  pair: AutoPair;
  highlight?: boolean;
  dim?: boolean;
}) {
  const pos = pair.combinedPnL >= 0;
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
        highlight
          ? "border border-emerald-300 bg-emerald-50"
          : dim
          ? "border border-slate-100 bg-slate-50 opacity-60"
          : "border border-slate-200 bg-white"
      }`}
    >
      <span className="w-8 text-center text-xs font-mono text-slate-400">
        #{pair.position}
      </span>
      <div className="flex flex-1 flex-wrap gap-1.5">
        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold">
          {pair.acc1.id}
        </span>
        <span className="text-slate-300">+</span>
        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold">
          {pair.acc2.id}
        </span>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs text-slate-400">
          {fmt(pair.acc1.balance)} / {fmt(pair.acc2.balance)}
        </div>
        <div
          className={`text-xs font-semibold ${
            pos ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {pos ? "+" : ""}
          {fmt(pair.combinedPnL)}
        </div>
      </div>
      <div className="text-right shrink-0 w-16">
        <div className="text-xs text-slate-400">разлика</div>
        <div className="text-xs font-mono">{fmt(pair.balanceDiff)}</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutoPage() {
  const accounts = useMemo(() => generateAccounts(), []);
  const { pairs, solo } = useMemo(() => buildPairs(accounts), [accounts]);
  const drawdownAccounts = useMemo(
    () => accounts.filter((a) => a.isDrawdown),
    [accounts]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [showFullQueue, setShowFullQueue] = useState(false);
  const [showFullDrawdown, setShowFullDrawdown] = useState(false);

  // Persist queue position
  useEffect(() => {
    const saved = localStorage.getItem(QUEUE_KEY);
    if (saved) {
      const idx = parseInt(saved, 10);
      if (!isNaN(idx)) setActiveIndex(Math.min(idx, pairs.length - 1));
    }
  }, [pairs.length]);

  const advancePair = () => {
    const next = Math.min(activeIndex + 1, pairs.length - 1);
    setActiveIndex(next);
    localStorage.setItem(QUEUE_KEY, String(next));
  };

  const resetQueue = () => {
    setActiveIndex(0);
    localStorage.setItem(QUEUE_KEY, "0");
  };

  const activePair = pairs[activeIndex];
  const signalPairs = pairs.slice(activeIndex + 1, activeIndex + 4); // next 3
  const remainingQueue = pairs.slice(activeIndex + 1);
  const completedCount = activeIndex;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-6 py-3.5 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/apex-monitor"
              className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Монитор
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
                <Zap className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <div className="font-bold leading-none">Автоматизация</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  100 акаунта · $50K старт · Auto-grouping
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetQueue}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Рестарт опашка
            </button>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* ── Stats ── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Общо акаунти",
              value: "100",
              sub: "$50,000 начален баланс",
              icon: <Users className="h-5 w-5 text-slate-600" />,
              bg: "bg-slate-100",
              card: "border-slate-200 bg-white",
            },
            {
              label: "Активни двойки",
              value: String(pairs.length),
              sub: `${completedCount} завършени · ${remainingQueue.length} чакат`,
              icon: <Activity className="h-5 w-5 text-blue-600" />,
              bg: "bg-blue-50",
              card: "border-slate-200 bg-white",
            },
            {
              label: "Следваща в опашка",
              value: `#${activeIndex + 1}`,
              sub: activePair
                ? `${activePair.acc1.id} + ${activePair.acc2.id}`
                : "—",
              icon: <Zap className="h-5 w-5 text-emerald-600" />,
              bg: "bg-emerald-50",
              card: "border-emerald-200 bg-emerald-50/30",
            },
            {
              label: "Daily Drawdown",
              value: String(drawdownAccounts.length),
              sub: "Загуба ≥ $1,000 — изключени",
              icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
              bg: "bg-red-100",
              card: "border-red-200 bg-red-50",
            },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-[20px] border p-5 shadow-sm ${s.card}`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                  {s.icon}
                </div>
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
              <div className="mt-3 text-2xl font-bold">{s.value}</div>
              <div className="mt-1 text-xs text-slate-500">{s.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Active Signal ── */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <h2 className="text-lg font-bold">Активни сигнали</h2>
            <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              На живо
            </span>
          </div>

          {activePair ? (
            <div className="rounded-[24px] border-2 border-emerald-400 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-2xl">
              {/* Current pair */}
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="rounded-full bg-emerald-400/20 border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      Търгувайте сега · Двойка #{activePair.position}
                    </span>
                  </div>

                  {/* Account pair */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {[activePair.acc1, activePair.acc2].map((acc, i) => (
                      <div key={acc.id}>
                        {i === 1 && (
                          <span className="mr-4 text-2xl font-light text-slate-500">+</span>
                        )}
                        <div className="inline-block rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                          <div className="font-mono text-sm text-slate-400">{acc.id}</div>
                          <div className="mt-1 text-2xl font-bold">{fmt(acc.balance)}</div>
                          <div
                            className={`mt-1 text-sm font-semibold ${
                              acc.dailyPnL >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {acc.dailyPnL >= 0 ? "+" : ""}
                            {fmt(acc.dailyPnL)} днес
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Combined stats */}
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
                    <span>
                      Комбиниран:{" "}
                      <strong className="text-white">
                        {fmt(activePair.combinedBalance)}
                      </strong>
                    </span>
                    <span>
                      Разлика в баланса:{" "}
                      <strong className="text-white">
                        {fmt(activePair.balanceDiff)}
                      </strong>
                    </span>
                    <span>
                      P&L днес:{" "}
                      <strong
                        className={
                          activePair.combinedPnL >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {activePair.combinedPnL >= 0 ? "+" : ""}
                        {fmt(activePair.combinedPnL)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Advance button */}
                <div className="flex flex-col gap-3 md:items-end shrink-0">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">
                      {remainingQueue.length} двойки чакат
                    </div>
                    <button
                      onClick={advancePair}
                      disabled={activeIndex >= pairs.length - 1}
                      className="flex items-center gap-2 rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Следваща двойка →
                    </button>
                  </div>
                </div>
              </div>

              {/* Upcoming pairs */}
              {signalPairs.length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-5">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Следващи в опашката
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {signalPairs.map((p, i) => (
                      <div
                        key={p.id}
                        className="rounded-xl border border-white/10 bg-white/5 p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500">
                            {i === 0 ? "→ Следваща" : i === 1 ? "→ След нея" : "→ Трета"}
                          </span>
                          <span className="font-mono text-xs text-slate-500">
                            #{p.position}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-sm font-semibold text-white">
                            {p.acc1.id}
                          </span>
                          <span className="font-mono text-sm font-semibold text-white">
                            {p.acc2.id}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          {fmt(p.acc1.balance)} / {fmt(p.acc2.balance)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeIndex >= pairs.length - 1 && (
                <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20 px-4 py-3">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">
                    Всички двойки са изтъргувани!
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
              Няма налични двойки
            </div>
          )}
        </section>

        {/* ── Full Queue ── */}
        <section>
          <button
            onClick={() => setShowFullQueue(!showFullQueue)}
            className="flex w-full items-center justify-between rounded-[20px] border border-slate-200 bg-white px-6 py-4 text-left shadow-sm transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">Пълна опашка</div>
                <div className="text-sm text-slate-400">
                  {remainingQueue.length} двойки чакат ·{" "}
                  {completedCount} завършени
                </div>
              </div>
            </div>
            {showFullQueue ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {showFullQueue && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                  {/* Header row */}
                  <div className="flex items-center gap-3 px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <span className="w-8 text-center">#</span>
                    <span className="flex-1">Двойка</span>
                    <span className="text-right shrink-0 w-40">Баланси</span>
                    <span className="text-right shrink-0 w-16">Разлика</span>
                  </div>

                  {/* Active */}
                  {activePair && (
                    <PairRow pair={activePair} highlight />
                  )}

                  {/* Queued */}
                  {remainingQueue.map((p) => (
                    <PairRow key={p.id} pair={p} />
                  ))}

                  {/* Completed */}
                  {completedCount > 0 && (
                    <>
                      <div className="pt-2 pb-1 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-t border-slate-100">
                        Завършени ({completedCount})
                      </div>
                      {pairs.slice(0, activeIndex).map((p) => (
                        <PairRow key={p.id} pair={p} dim />
                      ))}
                    </>
                  )}

                  {/* Solo account */}
                  {solo && (
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                      <span className="text-yellow-700">
                        <strong>{solo.id}</strong> — нечифтен акаунт (нечетен брой налични){" "}
                        · Баланс: {fmt(solo.balance)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── Daily Drawdown ── */}
        <section>
          <button
            onClick={() => setShowFullDrawdown(!showFullDrawdown)}
            className="flex w-full items-center justify-between rounded-[20px] border border-red-200 bg-red-50 px-6 py-4 text-left shadow-sm transition hover:bg-red-100/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <div className="font-semibold text-red-700">
                  Daily Drawdown — {drawdownAccounts.length} акаунта
                </div>
                <div className="text-sm text-red-500">
                  Загуба ≥ $1,000 от $50,000 — изключени от групиране
                </div>
              </div>
            </div>
            {showFullDrawdown ? (
              <ChevronUp className="h-5 w-5 text-red-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-red-400" />
            )}
          </button>

          <AnimatePresence>
            {showFullDrawdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 rounded-[20px] border border-red-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Тези акаунти са достигнали дневния лимит за загуба ($1,000) и не участват в групирането до следващата търговска сесия.
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {drawdownAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/50 px-4 py-3"
                      >
                        <div>
                          <div className="font-mono text-sm font-semibold text-slate-700">
                            {acc.id}
                          </div>
                          <div className="mt-0.5 text-xs font-semibold text-red-600">
                            Daily Drawdown
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-700">
                            {fmt(acc.balance)}
                          </div>
                          <div className="text-xs font-semibold text-red-500">
                            {fmt(acc.dailyPnL)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
