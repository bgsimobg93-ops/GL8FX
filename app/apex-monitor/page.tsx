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
  DollarSign,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
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

function deriveAlerts(accounts: Account[]): Alert[] {
  const alerts: Alert[] = [];

  for (const acc of accounts) {
    if (acc.status === "failed") {
      alerts.push({
        accountId: acc.id,
        type: "account_failed",
        message: `${acc.traderName} — account failed evaluation (${acc.id})`,
        severity: "high",
      });
      continue;
    }

    // Daily loss: warn if > 80 % of limit used
    if (acc.dailyLossLimit < 0 && acc.dailyPnL < 0) {
      const used = acc.dailyPnL / acc.dailyLossLimit;
      if (used > 0.8) {
        alerts.push({
          accountId: acc.id,
          type: "daily_loss_warning",
          message: `${acc.traderName} — ${Math.round(used * 100)}% of daily loss limit used (${acc.id})`,
          severity: used > 0.95 ? "high" : "medium",
        });
      }
    }

    // Drawdown: warn if buffer < 10 % of account size
    const buffer = acc.balance - acc.maxTrailingDrawdown;
    if (buffer < acc.accountSize * 0.1) {
      alerts.push({
        accountId: acc.id,
        type: "drawdown_warning",
        message: `${acc.traderName} — only ${fmt(buffer)} drawdown buffer remaining (${acc.id})`,
        severity: buffer < acc.accountSize * 0.05 ? "high" : "medium",
      });
    }
  }

  return alerts;
}

// ─── Chart Components ─────────────────────────────────────────────────────────

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

  const W = 100;
  const H = 36;
  const vals = history.map((h) => h.balance);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
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

  const W = 560;
  const H = 190;
  const PX = 48;
  const PY = 16;
  const cW = W - PX;
  const cH = H - PY * 2;

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
  const xIndices = [
    0,
    Math.floor(history.length * 0.25),
    Math.floor(history.length * 0.5),
    Math.floor(history.length * 0.75),
    history.length - 1,
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid + Y labels */}
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

      {/* Starting balance reference */}
      <line
        x1={PX / 2}
        y1={refY}
        x2={W - PX / 2}
        y2={refY}
        stroke="#94a3b8"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <text x={W - PX / 2 + 2} y={refY + 3} fontSize="8" fill="#94a3b8">
        Start
      </text>

      {/* Area + line */}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* X labels */}
      {xIndices.map((idx) => {
        if (idx >= history.length) return null;
        return (
          <text key={idx} x={pts[idx].x} y={H - 2} textAnchor="middle" fontSize="9" fill="#94a3b8">
            {history[idx].date.slice(5)}
          </text>
        );
      })}

      {/* Last point dot */}
      <circle
        cx={pts[pts.length - 1].x}
        cy={pts[pts.length - 1].y}
        r="3.5"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
      />
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
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
  );
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

  const dlUsed =
    account.dailyLossLimit < 0 && account.dailyPnL < 0
      ? Math.min(100, (account.dailyPnL / account.dailyLossLimit) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={onClick}
      className={`cursor-pointer rounded-[20px] border bg-white p-5 shadow-sm transition hover:shadow-md ${
        account.status === "failed"
          ? "border-red-200 opacity-70"
          : account.status === "passed"
          ? "border-emerald-200"
          : "border-slate-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-xs text-slate-400">{account.id}</div>
          <div className="mt-0.5 font-semibold leading-tight">{account.traderName}</div>
        </div>
        <StatusBadge status={account.status} />
      </div>

      {/* Balance + daily P&L */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-xs text-slate-400">Balance</div>
          <div className="text-2xl font-bold leading-none">{fmt(account.balance)}</div>
        </div>
        <div className={`text-right text-sm font-semibold ${positive ? "text-emerald-600" : "text-red-500"}`}>
          <div>{positive ? "+" : ""}{fmt(account.dailyPnL)}</div>
          <div className="text-xs font-normal text-slate-400">today</div>
        </div>
      </div>

      {/* Drawdown buffer bar */}
      <div className="mt-4 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Drawdown buffer</span>
          <span
            className={`font-medium ${
              ddPct < 30 ? "text-red-500" : ddPct < 60 ? "text-yellow-600" : "text-emerald-600"
            }`}
          >
            {fmt(ddBuffer)} left
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${
              ddPct < 30 ? "bg-red-500" : ddPct < 60 ? "bg-yellow-400" : "bg-emerald-500"
            }`}
            style={{ width: `${ddPct}%` }}
          />
        </div>
      </div>

      {/* Daily loss bar (only when losing) */}
      {dlUsed > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Daily loss used</span>
            <span className={`font-medium ${dlUsed > 80 ? "text-red-500" : "text-yellow-600"}`}>
              {Math.round(dlUsed)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${dlUsed > 80 ? "bg-red-500" : "bg-yellow-400"}`}
              style={{ width: `${Math.min(100, dlUsed)}%` }}
            />
          </div>
        </div>
      )}

      {/* Mini chart */}
      <div className="mt-3 border-t border-slate-100 pt-3">
        <MiniChart history={account.balanceHistory} id={account.id} positive={positive} />
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>Size: {fmt(account.accountSize)}</span>
        <span className={pct >= 0 ? "text-emerald-600" : "text-red-500"}>
          {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
        </span>
      </div>
    </motion.div>
  );
}

// ─── Account Detail Modal ─────────────────────────────────────────────────────

function AccountModal({
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) {
  const positive = account.dailyPnL >= 0;

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
        className="w-full max-w-xl overflow-hidden rounded-[24px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="font-mono text-sm text-slate-400">{account.id}</div>
            <h3 className="mt-0.5 text-xl font-bold">{account.traderName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={account.status} />
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Stat row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <div className="text-xs text-slate-400">Balance</div>
              <div className="mt-1 font-bold">{fmt(account.balance)}</div>
            </div>
            <div
              className={`rounded-xl p-3 text-center ${
                positive ? "bg-emerald-50" : "bg-red-50"
              }`}
            >
              <div className="text-xs text-slate-400">Today P&L</div>
              <div
                className={`mt-1 font-bold ${positive ? "text-emerald-700" : "text-red-600"}`}
              >
                {positive ? "+" : ""}
                {fmt(account.dailyPnL)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <div className="text-xs text-slate-400">Account Size</div>
              <div className="mt-1 font-bold">{fmt(account.accountSize)}</div>
            </div>
          </div>

          {/* Limits */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-xs text-slate-400">Max Trailing Drawdown</div>
              <div className="mt-1 font-semibold text-red-600">{fmt(account.maxTrailingDrawdown)}</div>
              <div className="mt-0.5 text-xs text-slate-500">
                Buffer: {fmt(account.balance - account.maxTrailingDrawdown)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-xs text-slate-400">Daily Loss Limit</div>
              <div className="mt-1 font-semibold text-red-600">{fmt(account.dailyLossLimit)}</div>
              <div className="mt-0.5 text-xs text-slate-500">Used today: {fmt(account.dailyPnL)}</div>
            </div>
          </div>

          {/* Chart */}
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold">Balance History (21 days)</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-3">
              <FullChart
                history={account.balanceHistory}
                startingBalance={account.startingBalance}
                id={account.id}
              />
            </div>
          </div>

          <div className="mt-3 text-center text-xs text-slate-400">
            Last updated: {new Date(account.lastUpdated).toLocaleString()}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────

function SettingsModal({
  apiKey,
  setApiKey,
  apiBaseUrl,
  setApiBaseUrl,
  refreshInterval,
  setRefreshInterval,
  autoRefresh,
  setAutoRefresh,
  onSave,
  onClose,
}: {
  apiKey: string;
  setApiKey: (v: string) => void;
  apiBaseUrl: string;
  setApiBaseUrl: (v: string) => void;
  refreshInterval: number;
  setRefreshInterval: (v: number) => void;
  autoRefresh: boolean;
  setAutoRefresh: (v: boolean) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const [showKey, setShowKey] = useState(false);

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
        className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">API Settings</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* API Key */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">API Key</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Apex API key  (or 'demo')"
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button onClick={() => setShowKey(!showKey)} type="button">
                {showKey ? (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Use <code className="rounded bg-slate-100 px-1 text-slate-600">demo</code> to preview with sample data.
            </p>
          </div>

          {/* Base URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">API Base URL</label>
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          {/* Refresh interval */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Auto-refresh Interval (seconds)
            </label>
            <input
              type="number"
              min={10}
              max={3600}
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          {/* Auto-refresh toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <div className="text-sm font-medium">Auto-refresh</div>
              <div className="text-xs text-slate-400">Update every {refreshInterval}s</div>
            </div>
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoRefresh ? "bg-slate-900" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRefresh ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onSave}
            className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Save & Refresh
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-50"
          >
            Cancel
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

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Settings state
  const [apiKey, setApiKey] = useState("demo");
  const [apiBaseUrl, setApiBaseUrl] = useState("https://api.apextraderfunding.com/v1");
  const [refreshInterval, setRefreshInterval] = useState(60);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apex/accounts", {
        headers: {
          "X-Apex-Key": apiKey,
          "X-Apex-Base-URL": apiBaseUrl,
        },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch accounts");
        return;
      }

      setAccounts(data.accounts ?? []);
      setAlerts(deriveAlerts(data.accounts ?? []));
      setMode(data.mode ?? "demo");
      setLastRefresh(new Date());
    } catch {
      setError("Network error — could not reach API");
    } finally {
      setLoading(false);
    }
  }, [apiKey, apiBaseUrl]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchAccounts, refreshInterval * 1000);
    return () => clearInterval(id);
  }, [autoRefresh, refreshInterval, fetchAccounts]);

  // Summary stats
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalPnL = accounts.reduce((s, a) => s + a.dailyPnL, 0);
  const activeCount = accounts.filter((a) => a.status === "active").length;
  const passedCount = accounts.filter((a) => a.status === "passed").length;
  const failedCount = accounts.filter((a) => a.status === "failed").length;
  const highAlerts = alerts.filter((a) => a.severity === "high").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-6 py-3.5 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
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
            {/* Mode badge */}
            <span
              className={`hidden rounded-full border px-3 py-1 text-xs font-semibold sm:inline-flex ${
                mode === "live"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-yellow-200 bg-yellow-50 text-yellow-700"
              }`}
            >
              {mode === "live" ? "● Live" : "Demo Mode"}
            </span>

            {/* Last updated */}
            {lastRefresh && (
              <span className="hidden text-xs text-slate-400 md:block">
                {lastRefresh.toLocaleTimeString()}
              </span>
            )}

            {/* Alert bell */}
            {highAlerts > 0 && (
              <div className="relative">
                <Bell className="h-5 w-5 text-red-500" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {highAlerts}
                </span>
              </div>
            )}

            {/* Refresh */}
            <button
              onClick={fetchAccounts}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition hover:bg-slate-50"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* ── Error banner ── */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-[16px] border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Summary cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: <Wallet className="h-5 w-5 text-slate-600" />,
              iconBg: "bg-slate-100",
              label: "Total Balance",
              value: fmt(totalBalance),
              sub: (
                <span className={totalPnL >= 0 ? "text-emerald-600" : "text-red-500"}>
                  {totalPnL >= 0 ? "+" : ""}
                  {fmt(totalPnL)} today
                </span>
              ),
              card: "border-slate-200 bg-white",
              delay: 0,
            },
            {
              icon: <Users className="h-5 w-5 text-blue-600" />,
              iconBg: "bg-blue-50",
              label: "Accounts",
              value: String(accounts.length),
              sub: (
                <span className="text-slate-500">
                  {activeCount} active · {passedCount} passed · {failedCount} failed
                </span>
              ),
              card: "border-slate-200 bg-white",
              delay: 0.05,
            },
            {
              icon:
                totalPnL >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                ),
              iconBg: totalPnL >= 0 ? "bg-emerald-100" : "bg-red-100",
              label: "Daily P&L",
              value: (
                <span className={totalPnL >= 0 ? "text-emerald-700" : "text-red-600"}>
                  {totalPnL >= 0 ? "+" : ""}
                  {fmt(totalPnL)}
                </span>
              ),
              sub: (
                <span className="text-slate-500">
                  {accounts.filter((a) => a.dailyPnL >= 0).length} profitable today
                </span>
              ),
              card:
                totalPnL >= 0
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50",
              delay: 0.1,
            },
            {
              icon: <Bell className={`h-5 w-5 ${highAlerts > 0 ? "text-red-500" : "text-slate-500"}`} />,
              iconBg: highAlerts > 0 ? "bg-red-100" : "bg-slate-100",
              label: "Alerts",
              value: (
                <span className={highAlerts > 0 ? "text-red-600" : ""}>{alerts.length}</span>
              ),
              sub: (
                <span className="text-slate-500">
                  {highAlerts} critical ·{" "}
                  {alerts.filter((a) => a.severity === "medium").length} warnings
                </span>
              ),
              card: highAlerts > 0 ? "border-red-200 bg-red-50" : "border-slate-200 bg-white",
              delay: 0.15,
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: card.delay }}
              className={`rounded-[20px] border p-5 shadow-sm ${card.card}`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                  {card.icon}
                </div>
                <span className="text-xs text-slate-400">{card.label}</span>
              </div>
              <div className="mt-3 text-2xl font-bold">{card.value}</div>
              <div className="mt-1 text-sm">{card.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Alerts panel ── */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-6 rounded-[20px] border border-red-200 bg-red-50 p-5"
          >
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-semibold">Active Alerts</h2>
            </div>
            <div className="mt-3 space-y-2">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
                    alert.severity === "high"
                      ? "border-red-200 bg-white text-red-700"
                      : "border-yellow-200 bg-yellow-50 text-yellow-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {alert.severity === "high" ? (
                      <XCircle className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{alert.message}</span>
                  </div>
                  <button
                    onClick={() => {
                      const acc = accounts.find((a) => a.id === alert.accountId);
                      if (acc) setSelectedAccount(acc);
                    }}
                    className="ml-4 shrink-0 text-xs underline opacity-70 hover:opacity-100"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Account grid ── */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading && accounts.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-[20px] border border-slate-200 bg-slate-100"
                />
              ))
            : accounts.map((acc, i) => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  index={i}
                  onClick={() => setSelectedAccount(acc)}
                />
              ))}
        </div>
      </main>

      {/* ── Modals ── */}
      <AnimatePresence>
        {selectedAccount && (
          <AccountModal
            account={selectedAccount}
            onClose={() => setSelectedAccount(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            apiKey={apiKey}
            setApiKey={setApiKey}
            apiBaseUrl={apiBaseUrl}
            setApiBaseUrl={setApiBaseUrl}
            refreshInterval={refreshInterval}
            setRefreshInterval={setRefreshInterval}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            onSave={() => {
              setShowSettings(false);
              fetchAccounts();
            }}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
