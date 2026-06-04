"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  Bell,
  Calendar,
  CheckCircle,
  Eye,
  EyeOff,
  Layers,
  Plus,
  RefreshCw,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BalancePoint {
  date: string;
  balance: number;
}

interface Account {
  id: string;
  traderName: string;
  accountSize: number;
  balance: number;
  startingBalance: number;
  dailyPnL: number;
  dailyLossLimit: number;
  maxTrailingDrawdown: number;
  status: "active" | "passed" | "failed" | "pending";
  lastUpdated: string;
  balanceHistory: BalancePoint[];
}

interface Pairing {
  id: string;
  name: string;
  accountIds: string[];
  phase: 1 | 2;
  phase1Target: number;
  phase2Target: number;
  phase2DayLimit: number;
  // balances recorded at pairing creation (uses account.startingBalance)
  phase1StartBalances: Record<string, number>;
  // balances recorded when Phase 1 was completed
  phase2StartBalances: Record<string, number> | null;
  // ISO date strings of logged trading days in Phase 2
  phase2TradingDays: string[];
  status: "active" | "phase1_done" | "complete" | "failed";
  createdAt: string;
}

interface Alert {
  accountId: string;
  type: "drawdown_warning" | "daily_loss_warning" | "account_failed";
  message: string;
  severity: "medium" | "high";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function deriveAlerts(accounts: Account[]): Alert[] {
  const alerts: Alert[] = [];
  for (const acc of accounts) {
    if (acc.status === "failed") {
      alerts.push({
        accountId: acc.id,
        type: "account_failed",
        message: `${acc.traderName} — акаунтът не е преминал оценката (${acc.id})`,
        severity: "high",
      });
      continue;
    }
    if (acc.dailyLossLimit < 0 && acc.dailyPnL < 0) {
      const used = acc.dailyPnL / acc.dailyLossLimit;
      if (used > 0.8) {
        alerts.push({
          accountId: acc.id,
          type: "daily_loss_warning",
          message: `${acc.traderName} — ${Math.round(used * 100)}% от дневния лимит за загуба (${acc.id})`,
          severity: used > 0.95 ? "high" : "medium",
        });
      }
    }
    const buffer = acc.balance - acc.maxTrailingDrawdown;
    if (buffer < acc.accountSize * 0.1) {
      alerts.push({
        accountId: acc.id,
        type: "drawdown_warning",
        message: `${acc.traderName} — само ${fmt(buffer)} буфер преди drawdown (${acc.id})`,
        severity: buffer < acc.accountSize * 0.05 ? "high" : "medium",
      });
    }
  }
  return alerts;
}

// ─── Pairing helpers ──────────────────────────────────────────────────────────

function pairingProfit(pairing: Pairing, accounts: Account[]): number {
  const startBals =
    pairing.phase === 2 && pairing.phase2StartBalances
      ? pairing.phase2StartBalances
      : pairing.phase1StartBalances;
  return pairing.accountIds.reduce((sum, id) => {
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return sum;
    return sum + (acc.balance - (startBals[id] ?? acc.startingBalance));
  }, 0);
}

function pairingTarget(pairing: Pairing): number {
  return pairing.phase === 1 ? pairing.phase1Target : pairing.phase2Target;
}

function pairingTotalSize(pairing: Pairing, accounts: Account[]): number {
  return pairing.accountIds.reduce((sum, id) => {
    const acc = accounts.find((a) => a.id === id);
    return sum + (acc?.accountSize ?? 0);
  }, 0);
}

function pairingDailyPnL(pairing: Pairing, accounts: Account[]): number {
  return pairing.accountIds.reduce((sum, id) => {
    const acc = accounts.find((a) => a.id === id);
    return sum + (acc?.dailyPnL ?? 0);
  }, 0);
}

const PAIRING_STORAGE_KEY = "apex-pairings-v1";

function loadPairings(): Pairing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PAIRING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePairings(pairings: Pairing[]): void {
  localStorage.setItem(PAIRING_STORAGE_KEY, JSON.stringify(pairings));
}

// ─── Chart components ─────────────────────────────────────────────────────────

function MiniChart({
  history,
  id,
  positive,
}: {
  history: BalancePoint[];
  id: string;
  positive: boolean;
}) {
  if (history.length < 2) return null;
  const W = 100, H = 36;
  const vals = history.map((h) => h.balance);
  const min = Math.min(...vals), max = Math.max(...vals);
  const rng = max - min || 1;
  const pts = history.map((h, i) => ({
    x: (i / (history.length - 1)) * W,
    y: H - ((h.balance - min) / rng) * H * 0.88 - H * 0.06,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  const color = positive ? "#10b981" : "#ef4444";
  const gid = `mg-${id}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-9 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FullChart({
  history,
  startingBalance,
  id,
}: {
  history: BalancePoint[];
  startingBalance: number;
  id: string;
}) {
  if (history.length < 2) return null;
  const W = 560, H = 190, PX = 48, PY = 16;
  const cW = W - PX, cH = H - PY * 2;
  const vals = history.map((h) => h.balance);
  const min = Math.min(...vals, startingBalance * 0.95);
  const max = Math.max(...vals, startingBalance * 1.005);
  const rng = max - min || 1;
  const toY = (v: number) => PY + cH - ((v - min) / rng) * cH;
  const pts = history.map((h, i) => ({
    x: PX / 2 + (i / (history.length - 1)) * cW,
    y: toY(h.balance),
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${H - PY} L ${pts[0].x.toFixed(1)} ${H - PY} Z`;
  const positive = vals[vals.length - 1] >= vals[0];
  const color = positive ? "#10b981" : "#ef4444";
  const gid = `fg-${id}`;
  const refY = toY(startingBalance);
  const yTicks = [min, min + rng * 0.25, min + rng * 0.5, min + rng * 0.75, max];
  const xIndices = [0, Math.floor(history.length * 0.25), Math.floor(history.length * 0.5), Math.floor(history.length * 0.75), history.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((v, i) => {
        const y = toY(v);
        return (
          <g key={i}>
            <line x1={PX / 2} y1={y} x2={W - PX / 2} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PX / 2 - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
              {v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toFixed(0)}`}
            </text>
          </g>
        );
      })}
      <line x1={PX / 2} y1={refY} x2={W - PX / 2} y2={refY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3" />
      <text x={W - PX / 2 + 2} y={refY + 3} fontSize="8" fill="#94a3b8">Start</text>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {xIndices.map((idx) => idx < history.length && (
        <text key={idx} x={pts[idx].x} y={H - 2} textAnchor="middle" fontSize="9" fill="#94a3b8">
          {history[idx].date.slice(5)}
        </text>
      ))}
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.5" fill={color} stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Account["status"] }) {
  const map: Record<Account["status"], { label: string; cls: string }> = {
    active: { label: "Active", cls: "border-blue-200 bg-blue-50 text-blue-700" },
    passed: { label: "Passed", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    failed: { label: "Failed", cls: "border-red-200 bg-red-50 text-red-600" },
    pending: { label: "Pending", cls: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  };
  const { label, cls } = map[status];
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

// ─── Account Card ─────────────────────────────────────────────────────────────

function AccountCard({
  account,
  index,
  onClick,
}: {
  account: Account;
  index: number;
  onClick: () => void;
}) {
  const positive = account.dailyPnL >= 0;
  const pct = ((account.balance - account.startingBalance) / account.startingBalance) * 100;
  const ddBuffer = account.balance - account.maxTrailingDrawdown;
  const ddTotal = account.startingBalance - account.maxTrailingDrawdown;
  const ddPct = ddTotal > 0 ? Math.max(0, Math.min(100, (ddBuffer / ddTotal) * 100)) : 100;
  const dlUsed = account.dailyLossLimit < 0 && account.dailyPnL < 0
    ? Math.min(100, (account.dailyPnL / account.dailyLossLimit) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={onClick}
      className={`cursor-pointer rounded-[20px] border bg-white p-5 shadow-sm transition hover:shadow-md ${
        account.status === "failed" ? "border-red-200 opacity-70" :
        account.status === "passed" ? "border-emerald-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-xs text-slate-400">{account.id}</div>
          <div className="mt-0.5 font-semibold leading-tight">{account.traderName}</div>
        </div>
        <StatusBadge status={account.status} />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-xs text-slate-400">Баланс</div>
          <div className="text-2xl font-bold leading-none">{fmt(account.balance)}</div>
        </div>
        <div className={`text-right text-sm font-semibold ${positive ? "text-emerald-600" : "text-red-500"}`}>
          <div>{positive ? "+" : ""}{fmt(account.dailyPnL)}</div>
          <div className="text-xs font-normal text-slate-400">днес</div>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Drawdown буфер</span>
          <span className={`font-medium ${ddPct < 30 ? "text-red-500" : ddPct < 60 ? "text-yellow-600" : "text-emerald-600"}`}>
            {fmt(ddBuffer)} остава
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full transition-all ${ddPct < 30 ? "bg-red-500" : ddPct < 60 ? "bg-yellow-400" : "bg-emerald-500"}`}
            style={{ width: `${ddPct}%` }} />
        </div>
      </div>
      {dlUsed > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Дневна загуба</span>
            <span className={`font-medium ${dlUsed > 80 ? "text-red-500" : "text-yellow-600"}`}>{Math.round(dlUsed)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full transition-all ${dlUsed > 80 ? "bg-red-500" : "bg-yellow-400"}`}
              style={{ width: `${Math.min(100, dlUsed)}%` }} />
          </div>
        </div>
      )}
      <div className="mt-3 border-t border-slate-100 pt-3">
        <MiniChart history={account.balanceHistory} id={account.id} positive={positive} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>Размер: {fmt(account.accountSize)}</span>
        <span className={pct >= 0 ? "text-emerald-600" : "text-red-500"}>{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%</span>
      </div>
    </motion.div>
  );
}

// ─── Pairing Card ─────────────────────────────────────────────────────────────

function PairingCard({
  pairing,
  accounts,
  index,
  onCompletePhase1,
  onLogTradingDay,
  onMarkComplete,
  onDelete,
}: {
  pairing: Pairing;
  accounts: Account[];
  index: number;
  onCompletePhase1: () => void;
  onLogTradingDay: () => void;
  onMarkComplete: () => void;
  onDelete: () => void;
}) {
  const profit = pairingProfit(pairing, accounts);
  const target = pairingTarget(pairing);
  const progress = Math.max(0, Math.min(100, (profit / target) * 100));
  const dailyPnL = pairingDailyPnL(pairing, accounts);
  const totalSize = pairingTotalSize(pairing, accounts);
  const tradingDays = pairing.phase2TradingDays.length;
  const todayLogged = pairing.phase2TradingDays.includes(today());
  const pairingAccounts = accounts.filter((a) => pairing.accountIds.includes(a.id));

  const phaseBadge = pairing.phase === 1
    ? "border-blue-200 bg-blue-50 text-blue-700"
    : "border-purple-200 bg-purple-50 text-purple-700";

  const statusColors: Record<Pairing["status"], string> = {
    active: "border-slate-200 bg-white",
    phase1_done: "border-blue-200 bg-blue-50/30",
    complete: "border-emerald-200 bg-emerald-50/30",
    failed: "border-red-200 bg-red-50/30 opacity-70",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`rounded-[20px] border p-5 shadow-sm ${statusColors[pairing.status]}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold">{pairing.name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {pairingAccounts.map((a) => (
              <span key={a.id} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
                {a.id}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${phaseBadge}`}>
            Фаза {pairing.phase}
          </span>
          <button onClick={onDelete} className="rounded-lg p-1 text-slate-300 hover:text-red-400 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Combined info */}
      <div className="mt-3 flex items-center gap-4 text-sm">
        <div>
          <span className="text-slate-400">Комбиниран размер: </span>
          <span className="font-semibold">{fmt(totalSize)}</span>
        </div>
        <div className={`font-semibold ${dailyPnL >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {dailyPnL >= 0 ? "+" : ""}{fmt(dailyPnL)} днес
        </div>
      </div>

      {/* Phase 1 progress */}
      {pairing.phase === 1 && pairing.status === "active" && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-600">
              Фаза 1 — Цел: {fmt(pairing.phase1Target)}
            </span>
            <span className={`font-semibold ${profit >= pairing.phase1Target ? "text-emerald-600" : profit < 0 ? "text-red-500" : "text-slate-700"}`}>
              {profit >= 0 ? "+" : ""}{fmt(profit)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${progress >= 100 ? "bg-emerald-500" : progress > 60 ? "bg-blue-500" : "bg-blue-400"}`}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
            <span>{Math.round(progress)}% изпълнено</span>
            <span>остава {fmt(Math.max(0, pairing.phase1Target - profit))}</span>
          </div>
        </div>
      )}

      {/* Phase 2 progress */}
      {pairing.phase === 2 && (pairing.status === "active" || pairing.status === "phase1_done") && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-600">
              Фаза 2 — Цел: {fmt(pairing.phase2Target)}
            </span>
            <span className={`font-semibold ${profit >= pairing.phase2Target ? "text-emerald-600" : profit < 0 ? "text-red-500" : "text-slate-700"}`}>
              {profit >= 0 ? "+" : ""}{fmt(profit)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${progress >= 100 ? "bg-emerald-500" : "bg-purple-500"}`}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
            <span>{Math.round(progress)}% изпълнено</span>
            <span>остава {fmt(Math.max(0, pairing.phase2Target - profit))}</span>
          </div>

          {/* Trading days */}
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">
                Търговски дни: {tradingDays}/{pairing.phase2DayLimit}
              </span>
              <span className={tradingDays >= pairing.phase2DayLimit ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                {tradingDays >= pairing.phase2DayLimit ? "Изпълнено!" : `${pairing.phase2DayLimit - tradingDays} остават`}
              </span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: pairing.phase2DayLimit }).map((_, i) => (
                <div
                  key={i}
                  className={`flex h-7 flex-1 items-center justify-center rounded-lg text-xs font-bold transition ${
                    i < tradingDays
                      ? "bg-purple-500 text-white"
                      : "bg-slate-100 text-slate-300"
                  }`}
                >
                  {i < tradingDays ? "✓" : i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Complete badge */}
      {pairing.status === "complete" && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">Комбинацията е завършена успешно!</span>
        </div>
      )}

      {/* Action buttons */}
      {pairing.status === "active" && (
        <div className="mt-4 flex gap-2">
          {pairing.phase === 1 && profit >= pairing.phase1Target && (
            <button
              onClick={onCompletePhase1}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Target className="h-3.5 w-3.5" />
              Завърши Фаза 1 → Рестарт
            </button>
          )}
          {pairing.phase === 2 && !todayLogged && tradingDays < pairing.phase2DayLimit && (
            <button
              onClick={onLogTradingDay}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Calendar className="h-3.5 w-3.5" />
              Запиши ден {tradingDays + 1}
            </button>
          )}
          {pairing.phase === 2 && todayLogged && (
            <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2.5 text-sm text-purple-600">
              <CheckCircle className="h-3.5 w-3.5" />
              Ден {tradingDays} записан
            </div>
          )}
          {pairing.phase === 2 && profit >= pairing.phase2Target && tradingDays >= pairing.phase2DayLimit && (
            <button
              onClick={onMarkComplete}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Маркирай като завършено
            </button>
          )}
        </div>
      )}

      {pairing.status === "phase1_done" && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Target className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-700">Фаза 1 завършена. Акаунтът е рестартиран за Фаза 2.</span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Create Pairing Modal ─────────────────────────────────────────────────────

function CreatePairingModal({
  accounts,
  onCreate,
  onClose,
}: {
  accounts: Account[];
  onCreate: (pairing: Pairing) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [phase1Target, setPhase1Target] = useState(3000);
  const [phase2Target, setPhase2Target] = useState(2600);
  const [phase2Days, setPhase2Days] = useState(5);

  const toggleAccount = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!name.trim() || selectedIds.length < 2) return;
    const startBals: Record<string, number> = {};
    for (const id of selectedIds) {
      const acc = accounts.find((a) => a.id === id);
      if (acc) startBals[id] = acc.startingBalance;
    }
    const pairing: Pairing = {
      id: `pair-${Date.now()}`,
      name: name.trim(),
      accountIds: selectedIds,
      phase: 1,
      phase1Target,
      phase2Target,
      phase2DayLimit: phase2Days,
      phase1StartBalances: startBals,
      phase2StartBalances: null,
      phase2TradingDays: [],
      status: "active",
      createdAt: new Date().toISOString(),
    };
    onCreate(pairing);
  };

  const selectedSize = selectedIds.reduce((sum, id) => {
    const acc = accounts.find((a) => a.id === id);
    return sum + (acc?.accountSize ?? 0);
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold">Нова комбинация</h3>
            <p className="text-sm text-slate-400">Изберете акаунти и задайте целите</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Име на комбинацията</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="напр. Комбо 50K+50K"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          {/* Account selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Изберете акаунти{" "}
              {selectedIds.length >= 2 && (
                <span className="text-slate-400 font-normal">
                  — {fmt(selectedSize)} комбиниран размер
                </span>
              )}
            </label>
            <div className="space-y-2">
              {accounts.filter((a) => a.status !== "failed").map((acc) => {
                const selected = selectedIds.includes(acc.id);
                const profit = acc.balance - acc.startingBalance;
                return (
                  <button
                    key={acc.id}
                    onClick={() => toggleAccount(acc.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      selected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                      selected ? "border-white bg-white" : "border-slate-300"
                    }`}>
                      {selected && <div className="h-2.5 w-2.5 rounded-sm bg-slate-900" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs opacity-70">{acc.id}</span>
                        <span className="font-semibold text-sm">{acc.traderName}</span>
                      </div>
                      <div className="text-xs opacity-70 mt-0.5">
                        {fmt(acc.accountSize)} · Баланс: {fmt(acc.balance)}
                        {" · "}
                        <span className={profit >= 0 ? (selected ? "text-emerald-300" : "text-emerald-600") : (selected ? "text-red-300" : "text-red-500")}>
                          {profit >= 0 ? "+" : ""}{fmt(profit)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedIds.length < 2 && (
              <p className="mt-1.5 text-xs text-slate-400">Изберете поне 2 акаунта</p>
            )}
          </div>

          {/* Targets */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
            <div className="text-sm font-semibold text-slate-700">Цели за профит</div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Фаза 1 — Цел ($)
                </label>
                <input
                  type="number"
                  value={phase1Target}
                  onChange={(e) => setPhase1Target(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
                <p className="mt-0.5 text-xs text-slate-400">Препоръчително: $3,000</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Фаза 2 — Цел ($)
                </label>
                <input
                  type="number"
                  value={phase2Target}
                  onChange={(e) => setPhase2Target(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
                <p className="mt-0.5 text-xs text-slate-400">Препоръчително: $2,600</p>
              </div>
            </div>

            <div className="w-1/2">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Фаза 2 — Търговски дни
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={phase2Days}
                onChange={(e) => setPhase2Days(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
              <p className="mt-0.5 text-xs text-slate-400">Препоръчително: 5 дни</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selectedIds.length < 2}
            className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            Създай комбинация
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition"
          >
            Откажи
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Account Detail Modal ─────────────────────────────────────────────────────

function AccountModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const positive = account.dailyPnL >= 0;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.18 }}
        className="w-full max-w-xl overflow-hidden rounded-[24px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="font-mono text-sm text-slate-400">{account.id}</div>
            <h3 className="mt-0.5 text-xl font-bold">{account.traderName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={account.status} />
            <button onClick={onClose} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <div className="text-xs text-slate-400">Баланс</div>
              <div className="mt-1 font-bold">{fmt(account.balance)}</div>
            </div>
            <div className={`rounded-xl p-3 text-center ${positive ? "bg-emerald-50" : "bg-red-50"}`}>
              <div className="text-xs text-slate-400">Днес P&L</div>
              <div className={`mt-1 font-bold ${positive ? "text-emerald-700" : "text-red-600"}`}>
                {positive ? "+" : ""}{fmt(account.dailyPnL)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <div className="text-xs text-slate-400">Размер</div>
              <div className="mt-1 font-bold">{fmt(account.accountSize)}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-xs text-slate-400">Max Trailing Drawdown</div>
              <div className="mt-1 font-semibold text-red-600">{fmt(account.maxTrailingDrawdown)}</div>
              <div className="mt-0.5 text-xs text-slate-500">Буфер: {fmt(account.balance - account.maxTrailingDrawdown)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-xs text-slate-400">Дневен лимит загуба</div>
              <div className="mt-1 font-semibold text-red-600">{fmt(account.dailyLossLimit)}</div>
              <div className="mt-0.5 text-xs text-slate-500">Днес: {fmt(account.dailyPnL)}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold">История на баланса (21 дни)</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-3">
              <FullChart history={account.balanceHistory} startingBalance={account.startingBalance} id={account.id} />
            </div>
          </div>
          <div className="mt-3 text-center text-xs text-slate-400">
            Последна актуализация: {new Date(account.lastUpdated).toLocaleString()}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────

function SettingsModal({
  apiKey, setApiKey, apiBaseUrl, setApiBaseUrl,
  refreshInterval, setRefreshInterval, autoRefresh, setAutoRefresh,
  onSave, onClose,
}: {
  apiKey: string; setApiKey: (v: string) => void;
  apiBaseUrl: string; setApiBaseUrl: (v: string) => void;
  refreshInterval: number; setRefreshInterval: (v: number) => void;
  autoRefresh: boolean; setAutoRefresh: (v: boolean) => void;
  onSave: () => void; onClose: () => void;
}) {
  const [showKey, setShowKey] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.18 }}
        className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">API Настройки</h3>
          <button onClick={onClose} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">API Ключ</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Apex API ключ (или 'demo')"
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button onClick={() => setShowKey(!showKey)} type="button">
                {showKey ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Използвайте <code className="rounded bg-slate-100 px-1 text-slate-600">demo</code> за тестови данни
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">API Base URL</label>
            <input type="text" value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Интервал за опресняване (сек)</label>
            <input type="number" min={10} max={3600} value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <div className="text-sm font-medium">Автоматично опресняване</div>
              <div className="text-xs text-slate-400">Актуализиране на {refreshInterval}s</div>
            </div>
            <button type="button" onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoRefresh ? "bg-slate-900" : "bg-slate-200"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoRefresh ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onSave} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
            Запази и Опресни
          </button>
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition">
            Откажи
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApexMonitor() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"accounts" | "combinations">("accounts");

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreatePairing, setShowCreatePairing] = useState(false);

  const [pairings, setPairings] = useState<Pairing[]>([]);

  const [apiKey, setApiKey] = useState("demo");
  const [apiBaseUrl, setApiBaseUrl] = useState("https://api.apextraderfunding.com/v1");
  const [refreshInterval, setRefreshInterval] = useState(60);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Load pairings from localStorage
  useEffect(() => {
    setPairings(loadPairings());
  }, []);

  const updatePairings = (updated: Pairing[]) => {
    setPairings(updated);
    savePairings(updated);
  };

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apex/accounts", {
        headers: { "X-Apex-Key": apiKey, "X-Apex-Base-URL": apiBaseUrl },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Грешка при зареждане"); return; }
      setAccounts(data.accounts ?? []);
      setAlerts(deriveAlerts(data.accounts ?? []));
      setMode(data.mode ?? "demo");
      setLastRefresh(new Date());
    } catch {
      setError("Мрежова грешка — не може да се свърже с API");
    } finally {
      setLoading(false);
    }
  }, [apiKey, apiBaseUrl]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchAccounts, refreshInterval * 1000);
    return () => clearInterval(id);
  }, [autoRefresh, refreshInterval, fetchAccounts]);

  // Pairing actions
  const handleCreatePairing = (pairing: Pairing) => {
    updatePairings([...pairings, pairing]);
    setShowCreatePairing(false);
    setActiveTab("combinations");
  };

  const handleCompletePhase1 = (pairingId: string) => {
    const updated = pairings.map((p) => {
      if (p.id !== pairingId) return p;
      const phase2StartBals: Record<string, number> = {};
      for (const id of p.accountIds) {
        const acc = accounts.find((a) => a.id === id);
        if (acc) phase2StartBals[id] = acc.balance;
      }
      return {
        ...p,
        phase: 2 as const,
        status: "active" as const,
        phase2StartBalances: phase2StartBals,
        phase2TradingDays: [],
      };
    });
    updatePairings(updated);
  };

  const handleLogTradingDay = (pairingId: string) => {
    const updated = pairings.map((p) => {
      if (p.id !== pairingId) return p;
      if (p.phase2TradingDays.includes(today())) return p;
      return { ...p, phase2TradingDays: [...p.phase2TradingDays, today()] };
    });
    updatePairings(updated);
  };

  const handleMarkComplete = (pairingId: string) => {
    updatePairings(pairings.map((p) =>
      p.id === pairingId ? { ...p, status: "complete" as const } : p
    ));
  };

  const handleDeletePairing = (pairingId: string) => {
    updatePairings(pairings.filter((p) => p.id !== pairingId));
  };

  // Summary stats
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalPnL = accounts.reduce((s, a) => s + a.dailyPnL, 0);
  const activeCount = accounts.filter((a) => a.status === "active").length;
  const passedCount = accounts.filter((a) => a.status === "passed").length;
  const failedCount = accounts.filter((a) => a.status === "failed").length;
  const highAlerts = alerts.filter((a) => a.severity === "high").length;
  const activePairings = pairings.filter((p) => p.status === "active").length;
  const completedPairings = pairings.filter((p) => p.status === "complete").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-6 py-3.5 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
                <Activity className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <div className="font-bold leading-none">Apex Balance Monitor</div>
                <div className="mt-0.5 text-xs text-slate-500">Apex Trader Funding</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`hidden rounded-full border px-3 py-1 text-xs font-semibold sm:inline-flex ${
              mode === "live" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-yellow-200 bg-yellow-50 text-yellow-700"
            }`}>
              {mode === "live" ? "● Live" : "Demo Mode"}
            </span>
            {lastRefresh && (
              <span className="hidden text-xs text-slate-400 md:block">{lastRefresh.toLocaleTimeString()}</span>
            )}
            {highAlerts > 0 && (
              <div className="relative">
                <Bell className="h-5 w-5 text-red-500" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">{highAlerts}</span>
              </div>
            )}
            <button onClick={fetchAccounts} disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Опресни</span>
            </button>
            <button onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition hover:bg-slate-50">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-[16px] border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Summary stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: <Wallet className="h-5 w-5 text-slate-600" />, iconBg: "bg-slate-100",
              label: "Общ баланс", value: fmt(totalBalance),
              sub: <span className={totalPnL >= 0 ? "text-emerald-600" : "text-red-500"}>{totalPnL >= 0 ? "+" : ""}{fmt(totalPnL)} днес</span>,
              card: "border-slate-200 bg-white", delay: 0,
            },
            {
              icon: <Users className="h-5 w-5 text-blue-600" />, iconBg: "bg-blue-50",
              label: "Акаунти", value: String(accounts.length),
              sub: <span className="text-slate-500">{activeCount} активни · {passedCount} преминали · {failedCount} провалени</span>,
              card: "border-slate-200 bg-white", delay: 0.05,
            },
            {
              icon: <Layers className="h-5 w-5 text-purple-600" />, iconBg: "bg-purple-50",
              label: "Комбинации", value: String(pairings.length),
              sub: <span className="text-slate-500">{activePairings} активни · {completedPairings} завършени</span>,
              card: "border-slate-200 bg-white", delay: 0.1,
            },
            {
              icon: <Bell className={`h-5 w-5 ${highAlerts > 0 ? "text-red-500" : "text-slate-500"}`} />,
              iconBg: highAlerts > 0 ? "bg-red-100" : "bg-slate-100",
              label: "Сигнали", value: <span className={highAlerts > 0 ? "text-red-600" : ""}>{alerts.length}</span>,
              sub: <span className="text-slate-500">{highAlerts} критични · {alerts.filter((a) => a.severity === "medium").length} предупреждения</span>,
              card: highAlerts > 0 ? "border-red-200 bg-red-50" : "border-slate-200 bg-white", delay: 0.15,
            },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: card.delay }}
              className={`rounded-[20px] border p-5 shadow-sm ${card.card}`}>
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>{card.icon}</div>
                <span className="text-xs text-slate-400">{card.label}</span>
              </div>
              <div className="mt-3 text-2xl font-bold">{card.value}</div>
              <div className="mt-1 text-sm">{card.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-6 rounded-[20px] border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-semibold">Активни сигнали</h2>
            </div>
            <div className="mt-3 space-y-2">
              {alerts.map((alert, i) => (
                <div key={i} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
                  alert.severity === "high" ? "border-red-200 bg-white text-red-700" : "border-yellow-200 bg-yellow-50 text-yellow-700"
                }`}>
                  <div className="flex items-center gap-2">
                    {alert.severity === "high" ? <XCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                    <span>{alert.message}</span>
                  </div>
                  <button onClick={() => { const acc = accounts.find((a) => a.id === alert.accountId); if (acc) setSelectedAccount(acc); }}
                    className="ml-4 shrink-0 text-xs underline opacity-70 hover:opacity-100">Виж</button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="mt-8 flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 w-fit shadow-sm">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === "accounts" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="h-4 w-4" />
            Акаунти
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${activeTab === "accounts" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
              {accounts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("combinations")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === "combinations" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="h-4 w-4" />
            Комбинации
            {pairings.length > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${activeTab === "combinations" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {pairings.length}
              </span>
            )}
          </button>
        </div>

        {/* Accounts tab */}
        {activeTab === "accounts" && (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading && accounts.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 animate-pulse rounded-[20px] border border-slate-200 bg-slate-100" />
                ))
              : accounts.map((acc, i) => (
                  <AccountCard key={acc.id} account={acc} index={i} onClick={() => setSelectedAccount(acc)} />
                ))}
          </div>
        )}

        {/* Combinations tab */}
        {activeTab === "combinations" && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Комбинации на акаунти</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Проследяване на комбинирани акаунти с двуфазни цели за профит
                </p>
              </div>
              <button
                onClick={() => setShowCreatePairing(true)}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Нова комбинация
              </button>
            </div>

            {pairings.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-white py-16 text-center">
                <Layers className="h-10 w-10 text-slate-300 mb-3" />
                <div className="font-semibold text-slate-500">Няма създадени комбинации</div>
                <p className="mt-1 text-sm text-slate-400 max-w-xs">
                  Комбинирайте два или повече акаунта и проследявайте прогреса към целите $3,000 → $2,600
                </p>
                <button
                  onClick={() => setShowCreatePairing(true)}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Създай първата комбинация
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pairings.map((pairing, i) => (
                  <PairingCard
                    key={pairing.id}
                    pairing={pairing}
                    accounts={accounts}
                    index={i}
                    onCompletePhase1={() => handleCompletePhase1(pairing.id)}
                    onLogTradingDay={() => handleLogTradingDay(pairing.id)}
                    onMarkComplete={() => handleMarkComplete(pairing.id)}
                    onDelete={() => handleDeletePairing(pairing.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {selectedAccount && <AccountModal account={selectedAccount} onClose={() => setSelectedAccount(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            apiKey={apiKey} setApiKey={setApiKey}
            apiBaseUrl={apiBaseUrl} setApiBaseUrl={setApiBaseUrl}
            refreshInterval={refreshInterval} setRefreshInterval={setRefreshInterval}
            autoRefresh={autoRefresh} setAutoRefresh={setAutoRefresh}
            onSave={() => { setShowSettings(false); fetchAccounts(); }}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCreatePairing && (
          <CreatePairingModal
            accounts={accounts}
            onCreate={handleCreatePairing}
            onClose={() => setShowCreatePairing(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
