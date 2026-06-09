"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, Edit2, Save, X, Users, Layers,
  Activity, LogOut, CheckCircle, TrendingUp, TrendingDown,
  ArrowRight, AlertTriangle, History, ChevronDown, ChevronUp,
  RefreshCw, Zap, Circle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RealAccount {
  id: string;
  traderName: string;
  accountSize: number;
  startingBalance: number;
  currentBalance: number;
  groupId: string | null;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  color: string;
}

interface TradePair {
  id: string;
  accountAId: string;
  accountBId: string;
  startBalanceA: number;
  startBalanceB: number;
  endBalanceA: number | null;
  endBalanceB: number | null;
  status: "active" | "completed";
}

interface TradeSession {
  id: string;
  name: string;
  groupAId: string;
  groupBId: string;
  pairs: TradePair[];
  status: "active" | "completed";
  startedAt: string;
  completedAt: string | null;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const K = {
  accounts: "apex-real-accounts-v1",
  groups: "apex-real-groups-v1",
  trades: "apex-real-trades-v1",
};

function load<T>(key: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : fb; }
  catch { return fb; }
}
function persist<T>(key: string, data: T) { localStorage.setItem(key, JSON.stringify(data)); }
function uid() { return Math.random().toString(36).slice(2, 9); }
function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function pct(n: number) { return (n >= 0 ? "+" : "") + n.toFixed(2) + "%"; }

// ─── Colors ───────────────────────────────────────────────────────────────────

const COLORS = ["blue", "emerald", "purple", "amber", "rose", "cyan", "orange", "indigo", "teal", "violet"] as const;
type Color = typeof COLORS[number];

const C: Record<string, { bg: string; border: string; text: string; chip: string; dot: string }> = {
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    chip: "bg-blue-100 text-blue-700",    dot: "bg-blue-400" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", chip: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  purple:  { bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-700",  chip: "bg-purple-100 text-purple-700",  dot: "bg-purple-400" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   chip: "bg-amber-100 text-amber-700",   dot: "bg-amber-400" },
  rose:    { bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-700",    chip: "bg-rose-100 text-rose-700",    dot: "bg-rose-400" },
  cyan:    { bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-700",    chip: "bg-cyan-100 text-cyan-700",    dot: "bg-cyan-400" },
  orange:  { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-700",  chip: "bg-orange-100 text-orange-700",  dot: "bg-orange-400" },
  indigo:  { bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-700",  chip: "bg-indigo-100 text-indigo-700",  dot: "bg-indigo-400" },
  teal:    { bg: "bg-teal-50",    border: "border-teal-200",    text: "text-teal-700",    chip: "bg-teal-100 text-teal-700",    dot: "bg-teal-400" },
  violet:  { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-700",  chip: "bg-violet-100 text-violet-700",  dot: "bg-violet-400" },
};

const SIZES = [25000, 50000, 100000, 150000, 200000];

// ─── Account Form Modal ───────────────────────────────────────────────────────

function AccountModal({
  initial,
  groups,
  onSave,
  onClose,
}: {
  initial?: RealAccount;
  groups: Group[];
  onSave: (a: RealAccount) => void;
  onClose: () => void;
}) {
  const [id, setId] = useState(initial?.id ?? "");
  const [name, setName] = useState(initial?.traderName ?? "");
  const [size, setSize] = useState<number>(initial?.accountSize ?? 50000);
  const [balance, setBalance] = useState<string>(String(initial?.currentBalance ?? initial?.accountSize ?? 50000));
  const [groupId, setGroupId] = useState<string>(initial?.groupId ?? "");
  const [err, setErr] = useState("");

  const handleSave = () => {
    if (!id.trim()) { setErr("Въведете ID на акаунта"); return; }
    if (!name.trim()) { setErr("Въведете трейдър"); return; }
    const bal = parseFloat(balance);
    if (isNaN(bal) || bal <= 0) { setErr("Невалиден баланс"); return; }
    onSave({
      id: id.trim().toUpperCase(),
      traderName: name.trim(),
      accountSize: size,
      startingBalance: initial?.startingBalance ?? size,
      currentBalance: bal,
      groupId: groupId || null,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? "Редакция на акаунт" : "Нов акаунт"}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">ID на акаунта</label>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="ATF-48291"
              disabled={!!initial}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-mono focus:border-slate-400 focus:outline-none disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Трейдър</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван Петров"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Размер на акаунта</label>
            <select
              value={size}
              onChange={(e) => { const v = Number(e.target.value); setSize(v); if (!initial) setBalance(String(v)); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-400 focus:outline-none"
            >
              {SIZES.map((s) => <option key={s} value={s}>{fmt(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              {initial ? "Текущ баланс ($)" : "Начален баланс ($)"}
            </label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-mono focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Група</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-400 focus:outline-none"
            >
              <option value="">— без група —</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          {err && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">{err}</div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              Откажи
            </button>
            <button onClick={handleSave} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
              <Save className="mr-1.5 inline h-4 w-4" />
              Запази
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── End Balance Modal ────────────────────────────────────────────────────────

function EndBalanceModal({
  pair,
  accountA,
  accountB,
  onSave,
  onClose,
}: {
  pair: TradePair;
  accountA: RealAccount;
  accountB: RealAccount;
  onSave: (endA: number, endB: number) => void;
  onClose: () => void;
}) {
  const [endA, setEndA] = useState(String(pair.endBalanceA ?? pair.startBalanceA));
  const [endB, setEndB] = useState(String(pair.endBalanceB ?? pair.startBalanceB));
  const [err, setErr] = useState("");

  const valA = parseFloat(endA);
  const valB = parseFloat(endB);
  const pnlA = isNaN(valA) ? null : valA - pair.startBalanceA;
  const pnlB = isNaN(valB) ? null : valB - pair.startBalanceB;

  const handleSave = () => {
    if (isNaN(valA) || valA <= 0) { setErr("Невалиден краен баланс за " + accountA.id); return; }
    if (isNaN(valB) || valB <= 0) { setErr("Невалиден краен баланс за " + accountB.id); return; }
    onSave(valA, valB);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Краен баланс на комбинацията</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500">
          Въведете крайните баланси след приключване на търгуването за тази двойка.
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { acc: accountA, start: pair.startBalanceA, val: endA, setVal: setEndA, pnl: pnlA },
            { acc: accountB, start: pair.startBalanceB, val: endB, setVal: setEndB, pnl: pnlB },
          ].map(({ acc, start, val, setVal, pnl }) => (
            <div key={acc.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3">
                <div className="font-mono text-xs font-bold text-slate-500">{acc.id}</div>
                <div className="text-sm font-semibold">{acc.traderName}</div>
                <div className="mt-1 text-xs text-slate-400">Начален: <strong className="text-slate-700">{fmt(start)}</strong></div>
              </div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Краен баланс ($)</label>
              <input
                type="number"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:border-slate-400 focus:outline-none"
              />
              {pnl !== null && (
                <div className={`mt-2 text-sm font-bold ${pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {pnl >= 0 ? <TrendingUp className="mr-1 inline h-3.5 w-3.5" /> : <TrendingDown className="mr-1 inline h-3.5 w-3.5" />}
                  {fmt(pnl)}
                </div>
              )}
            </div>
          ))}
        </div>

        {err && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">{err}</div>
        )}

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            Откажи
          </button>
          <button onClick={handleSave} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
            <CheckCircle className="mr-1.5 inline h-4 w-4" />
            Завърши двойката
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── New Session Modal ────────────────────────────────────────────────────────

function NewSessionModal({
  groups,
  accounts,
  onStart,
  onClose,
}: {
  groups: Group[];
  accounts: RealAccount[];
  onStart: (groupAId: string, groupBId: string, name: string) => void;
  onClose: () => void;
}) {
  const [groupA, setGroupA] = useState("");
  const [groupB, setGroupB] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  const accA = [...accounts.filter((a) => a.groupId === groupA)].sort((a, b) => b.currentBalance - a.currentBalance);
  const accB = [...accounts.filter((a) => a.groupId === groupB)].sort((a, b) => b.currentBalance - a.currentBalance);
  const pairCount = Math.min(accA.length, accB.length);

  // Suggested pairs sorted by balance — preview
  const suggestedPairs = Array.from({ length: pairCount }, (_, i) => ({
    a: accA[i],
    b: accB[i],
    diff: Math.abs(accA[i].currentBalance - accB[i].currentBalance),
  }));

  const handle = () => {
    if (!groupA) { setErr("Изберете Група A"); return; }
    if (!groupB) { setErr("Изберете Група B"); return; }
    if (groupA === groupB) { setErr("Групите трябва да са различни"); return; }
    if (pairCount === 0) { setErr("Няма акаунти за комбиниране"); return; }
    const gA = groups.find((g) => g.id === groupA)!;
    const gB = groups.find((g) => g.id === groupB)!;
    onStart(groupA, groupB, name.trim() || `${gA.name} × ${gB.name}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Нова търговска сесия</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Група A</label>
            <select value={groupA} onChange={(e) => setGroupA(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-400 focus:outline-none">
              <option value="">— изберете —</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({accounts.filter((a) => a.groupId === g.id).length} акаунта)</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Група B</label>
            <select value={groupB} onChange={(e) => setGroupB(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-400 focus:outline-none">
              <option value="">— изберете —</option>
              {groups.filter((g) => g.id !== groupA).map((g) => <option key={g.id} value={g.id}>{g.name} ({accounts.filter((a) => a.groupId === g.id).length} акаунта)</option>)}
            </select>
          </div>
          {pairCount > 0 && (
            <div className="rounded-[16px] border border-slate-200 bg-slate-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Предложени двойки по баланс
                </span>
                <span className="text-xs text-slate-400">{pairCount} двойки
                  {Math.abs(accA.length - accB.length) > 0 && (
                    <span className="ml-1 text-amber-600">· {Math.abs(accA.length - accB.length)} без двойка</span>
                  )}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                {suggestedPairs.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 text-xs">
                    <span className="w-4 text-center font-mono text-slate-400">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-mono font-bold text-slate-600">{p.a.id}</span>
                      <span className="ml-1 text-slate-400">{fmt(p.a.currentBalance)}</span>
                    </div>
                    <span className="text-slate-300">×</span>
                    <div className="flex-1 min-w-0 text-right">
                      <span className="font-mono font-bold text-slate-600">{p.b.id}</span>
                      <span className="ml-1 text-slate-400">{fmt(p.b.currentBalance)}</span>
                    </div>
                    <span className={`w-20 text-right font-semibold ${p.diff === 0 ? "text-emerald-600" : p.diff < 500 ? "text-emerald-500" : p.diff < 2000 ? "text-amber-600" : "text-red-500"}`}>
                      Δ {fmt(p.diff)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Име на сесията (незадължително)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Сесия 1"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-400 focus:outline-none" />
          </div>
          {err && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">{err}</div>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Откажи</button>
            <button onClick={handle} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
              <Zap className="mr-1.5 inline h-4 w-4" />Започни
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "accounts" | "groups" | "trading" | "history";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<RealAccount[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [trades, setTrades] = useState<TradeSession[]>([]);
  const [tab, setTab] = useState<Tab>("accounts");
  const [mounted, setMounted] = useState(false);

  // Modals
  const [editAccount, setEditAccount] = useState<RealAccount | null | true>(null);
  const [endPair, setEndPair] = useState<{ sessionId: string; pairId: string } | null>(null);
  const [newSession, setNewSession] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Groups panel expand
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    setAccounts(load(K.accounts, []));
    setGroups(load(K.groups, []));
    setTrades(load(K.trades, []));
    setMounted(true);
  }, []);

  const saveAccounts = (a: RealAccount[]) => { setAccounts(a); persist(K.accounts, a); };
  const saveGroups = (g: Group[]) => { setGroups(g); persist(K.groups, g); };
  const saveTrades = (t: TradeSession[]) => { setTrades(t); persist(K.trades, t); };

  // ── Derived ──
  const activeTrades = trades.filter((t) => t.status === "active");
  const completedTrades = trades.filter((t) => t.status === "completed");
  const ungrouped = accounts.filter((a) => !a.groupId);

  // ── Account handlers ──
  const upsertAccount = (a: RealAccount) => {
    const existing = accounts.findIndex((x) => x.id === a.id);
    const next = existing >= 0
      ? accounts.map((x) => x.id === a.id ? a : x)
      : [...accounts, a];
    saveAccounts(next);
    setEditAccount(null);
  };
  const deleteAccount = (id: string) => {
    saveAccounts(accounts.filter((a) => a.id !== id));
  };

  // ── Group handlers ──
  const addGroup = () => {
    if (!newGroupName.trim()) return;
    const color = COLORS[groups.length % COLORS.length];
    const g: Group = { id: uid(), name: newGroupName.trim(), color };
    saveGroups([...groups, g]);
    setNewGroupName("");
  };
  const deleteGroup = (id: string) => {
    saveGroups(groups.filter((g) => g.id !== id));
    saveAccounts(accounts.map((a) => a.groupId === id ? { ...a, groupId: null } : a));
  };
  const assignAccountToGroup = (accountId: string, groupId: string | null) => {
    saveAccounts(accounts.map((a) => a.id === accountId ? { ...a, groupId } : a));
  };

  // ── Trade handlers ──
  const startSession = (groupAId: string, groupBId: string, name: string) => {
    // Sort both groups by balance descending so closest balances are paired
    const accA = [...accounts.filter((a) => a.groupId === groupAId)].sort((a, b) => b.currentBalance - a.currentBalance);
    const accB = [...accounts.filter((a) => a.groupId === groupBId)].sort((a, b) => b.currentBalance - a.currentBalance);
    const count = Math.min(accA.length, accB.length);
    const pairs: TradePair[] = Array.from({ length: count }, (_, i) => ({
      id: uid(),
      accountAId: accA[i].id,
      accountBId: accB[i].id,
      startBalanceA: accA[i].currentBalance,
      startBalanceB: accB[i].currentBalance,
      endBalanceA: null,
      endBalanceB: null,
      status: "active",
    }));
    const session: TradeSession = {
      id: uid(), name, groupAId, groupBId, pairs,
      status: "active",
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    saveTrades([...trades, session]);
    setNewSession(false);
    setTab("trading");
    setExpandedSession(session.id);
  };

  const saveEndBalance = (sessionId: string, pairId: string, endA: number, endB: number) => {
    const next = trades.map((s) => {
      if (s.id !== sessionId) return s;
      const updatedPairs = s.pairs.map((p) => {
        if (p.id !== pairId) return p;
        return { ...p, endBalanceA: endA, endBalanceB: endB, status: "completed" as const };
      });
      const allDone = updatedPairs.every((p) => p.status === "completed");
      return {
        ...s,
        pairs: updatedPairs,
        status: allDone ? "completed" as const : s.status,
        completedAt: allDone ? new Date().toISOString() : s.completedAt,
      };
    });
    // Update account balances
    const session = next.find((s) => s.id === sessionId)!;
    const pair = session.pairs.find((p) => p.id === pairId)!;
    const updatedAccounts = accounts.map((a) => {
      if (a.id === pair.accountAId) return { ...a, currentBalance: endA };
      if (a.id === pair.accountBId) return { ...a, currentBalance: endB };
      return a;
    });
    saveTrades(next);
    saveAccounts(updatedAccounts);
    setEndPair(null);
  };

  const closeSession = (sessionId: string) => {
    const next = trades.map((s) =>
      s.id === sessionId
        ? { ...s, status: "completed" as const, completedAt: new Date().toISOString() }
        : s
    );
    saveTrades(next);
  };

  if (!mounted) return null;

  const getAccount = (id: string) => accounts.find((a) => a.id === id);
  const getGroup = (id: string) => groups.find((g) => g.id === id);

  // ── End balance modal data ──
  const endModal = endPair
    ? (() => {
        const session = trades.find((s) => s.id === endPair.sessionId);
        const pair = session?.pairs.find((p) => p.id === endPair.pairId);
        const accA = pair ? getAccount(pair.accountAId) : undefined;
        const accB = pair ? getAccount(pair.accountBId) : undefined;
        if (!session || !pair || !accA || !accB) return null;
        return { session, pair, accA, accB };
      })()
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-6 py-3.5 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/apex-monitor"
              className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />Монитор
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-bold leading-none">Реални акаунти</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {accounts.length} акаунта · {groups.length} групи · {activeTrades.length} активни сесии
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNewSession(true)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
            >
              <Zap className="h-3.5 w-3.5" />
              Нова сесия
            </button>
            <button
              onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Tabs */}
        <div className="mb-6 flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 w-fit shadow-sm">
          {([
            { key: "accounts", icon: <Users className="h-4 w-4" />, label: "Акаунти", count: accounts.length },
            { key: "groups",   icon: <Layers className="h-4 w-4" />, label: "Групи",   count: groups.length },
            { key: "trading",  icon: <Zap className="h-4 w-4" />,    label: "Търгуване", count: activeTrades.length },
            { key: "history",  icon: <History className="h-4 w-4" />, label: "История", count: completedTrades.length },
          ] as { key: Tab; icon: React.ReactNode; label: string; count: number }[]).map(({ key, icon, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                tab === key ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {icon}
              {label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${tab === key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ═══ АКАУНТИ TAB ═══ */}
        {tab === "accounts" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Реални акаунти</h2>
                <p className="text-sm text-slate-500">Добавете всеки Apex Trader Funding акаунт ръчно</p>
              </div>
              <button
                onClick={() => setEditAccount(true)}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                <Plus className="h-4 w-4" />Добави акаунт
              </button>
            </div>

            {accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-white py-20 text-center">
                <Users className="mb-4 h-12 w-12 text-slate-300" />
                <div className="text-lg font-semibold text-slate-500">Няма добавени акаунти</div>
                <div className="mt-1 text-sm text-slate-400">Кликнете „Добави акаунт" за да започнете</div>
                <button onClick={() => setEditAccount(true)}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
                  <Plus className="h-4 w-4" />Добави първия акаунт
                </button>
              </div>
            ) : (
              <div className="rounded-[20px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <span>ID</span>
                  <span>Трейдър</span>
                  <span className="text-right">Размер</span>
                  <span className="text-right">Баланс</span>
                  <span>Група</span>
                  <span></span>
                </div>
                <div className="divide-y divide-slate-100">
                  {accounts.map((acc) => {
                    const group = acc.groupId ? getGroup(acc.groupId) : null;
                    const pnl = acc.currentBalance - acc.startingBalance;
                    const pnlPct = (pnl / acc.startingBalance) * 100;
                    return (
                      <motion.div
                        key={acc.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition"
                      >
                        <span className="font-mono text-xs font-bold text-slate-600 w-20">{acc.id}</span>
                        <span className="text-sm font-semibold truncate">{acc.traderName}</span>
                        <span className="text-right text-sm text-slate-500 w-20">{fmt(acc.accountSize)}</span>
                        <div className="text-right w-32">
                          <div className="text-sm font-bold">{fmt(acc.currentBalance)}</div>
                          <div className={`text-xs font-semibold ${pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {pnl >= 0 ? "+" : ""}{fmt(pnl)} ({pct(pnlPct)})
                          </div>
                        </div>
                        <div className="w-28">
                          {group ? (
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${C[group.color]?.chip}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${C[group.color]?.dot}`} />
                              {group.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditAccount(acc as RealAccount)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteAccount(acc.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ ГРУПИ TAB ═══ */}
        {tab === "groups" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Групи</h2>
                <p className="text-sm text-slate-500">Организирайте акаунтите в групи за group-vs-group търгуване</p>
              </div>
            </div>

            {/* Add group form */}
            <div className="mb-6 flex gap-2">
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGroup()}
                placeholder="Група 1, Група 2, …"
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-slate-400 focus:outline-none shadow-sm"
              />
              <button onClick={addGroup}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
                <Plus className="h-4 w-4" />Нова група
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-white py-16 text-center">
                <Layers className="mb-4 h-10 w-10 text-slate-300" />
                <div className="text-base font-semibold text-slate-500">Създайте поне две групи</div>
                <div className="mt-1 text-sm text-slate-400">Въведете имена като „Група 1", „Група 2" и т.н.</div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {groups.map((g) => {
                  const inGroup = accounts.filter((a) => a.groupId === g.id);
                  const col = C[g.color] ?? C.blue;
                  const isOpen = expandedGroup === g.id;
                  return (
                    <div key={g.id} className={`rounded-[20px] border ${col.border} ${col.bg} shadow-sm overflow-hidden`}>
                      <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${col.dot}`} />
                          <div>
                            <div className={`font-bold ${col.text}`}>{g.name}</div>
                            <div className="text-xs text-slate-500">{inGroup.length} акаунта</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedGroup(isOpen ? null : g.id)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            {isOpen ? "Скрий" : "Управлявай"}
                          </button>
                          <button onClick={() => deleteGroup(g.id)}
                            className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-slate-200/60 bg-white px-5 py-4"
                          >
                            {/* Accounts in this group */}
                            {inGroup.length > 0 && (
                              <div className="mb-3 space-y-1.5">
                                {inGroup.map((acc) => (
                                  <div key={acc.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs font-bold text-slate-500">{acc.id}</span>
                                      <span className="text-sm">{acc.traderName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-400">{fmt(acc.currentBalance)}</span>
                                      <button onClick={() => assignAccountToGroup(acc.id, null)}
                                        className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition">
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Add account from ungrouped */}
                            {ungrouped.length > 0 ? (
                              <div>
                                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Добави акаунт</div>
                                <select
                                  defaultValue=""
                                  onChange={(e) => { if (e.target.value) assignAccountToGroup(e.target.value, g.id); e.target.value = ""; }}
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                                >
                                  <option value="">— без група ({ungrouped.length}) —</option>
                                  {ungrouped.map((a) => <option key={a.id} value={a.id}>{a.id} · {a.traderName}</option>)}
                                </select>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400">Всички акаунти са разпределени</div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ungrouped accounts */}
            {ungrouped.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-700">{ungrouped.length} акаунта без група</span>
                </div>
                <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4">
                  <div className="space-y-2">
                    {ungrouped.map((acc) => (
                      <div key={acc.id} className="flex items-center justify-between rounded-xl border border-amber-100 bg-white px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">{acc.id}</span>
                          <span className="text-sm">{acc.traderName}</span>
                          <span className="text-xs text-slate-400">{fmt(acc.currentBalance)}</span>
                        </div>
                        <select
                          defaultValue=""
                          onChange={(e) => { if (e.target.value) assignAccountToGroup(acc.id, e.target.value); }}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:border-slate-400 focus:outline-none"
                        >
                          <option value="">Добави в група</option>
                          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ ТЪРГУВАНЕ TAB ═══ */}
        {tab === "trading" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Активни сесии</h2>
                <p className="text-sm text-slate-500">Group vs Group комбинации — задължителен краен баланс за всяка двойка</p>
              </div>
              <button
                onClick={() => setNewSession(true)}
                disabled={groups.length < 2}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />Нова сесия
              </button>
            </div>

            {activeTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-white py-20 text-center">
                <Zap className="mb-4 h-12 w-12 text-slate-300" />
                <div className="text-lg font-semibold text-slate-500">Няма активни сесии</div>
                <div className="mt-1 text-sm text-slate-400">Създайте нова сесия за group-vs-group търгуване</div>
                {groups.length < 2 && (
                  <div className="mt-3 text-xs text-amber-600">Нужни са поне 2 групи — създайте ги в таб „Групи"</div>
                )}
                <button onClick={() => setNewSession(true)} disabled={groups.length < 2}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50">
                  <Zap className="h-4 w-4" />Нова сесия
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTrades.map((session) => {
                  const gA = getGroup(session.groupAId);
                  const gB = getGroup(session.groupBId);
                  const done = session.pairs.filter((p) => p.status === "completed").length;
                  const total = session.pairs.length;
                  const allDone = done === total;
                  const isOpen = expandedSession === session.id;

                  return (
                    <div key={session.id} className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                      {/* Session header */}
                      <div className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50 transition"
                        onClick={() => setExpandedSession(isOpen ? null : session.id)}>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {gA && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${C[gA.color]?.chip}`}>{gA.name}</span>}
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                            {gB && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${C[gB.color]?.chip}`}>{gB.name}</span>}
                          </div>
                          <div>
                            <div className="font-bold">{session.name}</div>
                            <div className="text-xs text-slate-500">
                              {done}/{total} двойки завършени · {new Date(session.startedAt).toLocaleDateString("bg-BG")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-24 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-400 transition-all"
                                style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">{Math.round(total > 0 ? (done / total) * 100 : 0)}%</span>
                          </div>
                          {allDone && (
                            <button
                              onClick={(e) => { e.stopPropagation(); closeSession(session.id); }}
                              className="rounded-xl bg-emerald-100 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200"
                            >
                              <CheckCircle className="mr-1 inline h-3.5 w-3.5" />Завърши сесия
                            </button>
                          )}
                          {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>
                      </div>

                      {/* Pairs list */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-slate-100"
                          >
                            <div className="divide-y divide-slate-100">
                              {session.pairs.map((pair, idx) => {
                                const accA = getAccount(pair.accountAId);
                                const accB = getAccount(pair.accountBId);
                                if (!accA || !accB) return null;
                                const isDone = pair.status === "completed";
                                const pnlA = isDone && pair.endBalanceA != null ? pair.endBalanceA - pair.startBalanceA : null;
                                const pnlB = isDone && pair.endBalanceB != null ? pair.endBalanceB - pair.startBalanceB : null;
                                const balDiff = Math.abs(pair.startBalanceA - pair.startBalanceB);

                                return (
                                  <div key={pair.id}
                                    className={`flex items-center gap-4 px-6 py-4 ${isDone ? "bg-emerald-50/30" : ""}`}>
                                    <span className="w-6 text-center text-xs font-mono text-slate-400">#{idx + 1}</span>

                                    {/* Account A */}
                                    <div className="flex-1 min-w-0">
                                      <div className="font-mono text-xs font-bold text-slate-500">{accA.id}</div>
                                      <div className="text-sm font-semibold truncate">{accA.traderName}</div>
                                      <div className="text-xs text-slate-400">Начало: {fmt(pair.startBalanceA)}</div>
                                      {isDone && pair.endBalanceA != null && (
                                        <div className={`text-xs font-bold ${pnlA! >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                          Край: {fmt(pair.endBalanceA)} ({pnlA! >= 0 ? "+" : ""}{fmt(pnlA!)})
                                        </div>
                                      )}
                                    </div>

                                    {/* Balance diff badge */}
                                    <div className="flex flex-col items-center gap-1 shrink-0">
                                      <span className="text-slate-300 text-base font-light">×</span>
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        balDiff === 0 ? "bg-emerald-100 text-emerald-600"
                                        : balDiff < 500 ? "bg-emerald-50 text-emerald-500"
                                        : balDiff < 2000 ? "bg-amber-50 text-amber-600"
                                        : "bg-red-50 text-red-500"
                                      }`}>
                                        Δ {fmt(balDiff)}
                                      </span>
                                    </div>

                                    {/* Account B */}
                                    <div className="flex-1 min-w-0">
                                      <div className="font-mono text-xs font-bold text-slate-500">{accB.id}</div>
                                      <div className="text-sm font-semibold truncate">{accB.traderName}</div>
                                      <div className="text-xs text-slate-400">Начало: {fmt(pair.startBalanceB)}</div>
                                      {isDone && pair.endBalanceB != null && (
                                        <div className={`text-xs font-bold ${pnlB! >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                          Край: {fmt(pair.endBalanceB)} ({pnlB! >= 0 ? "+" : ""}{fmt(pnlB!)})
                                        </div>
                                      )}
                                    </div>

                                    {/* Action */}
                                    {isDone ? (
                                      <div className="flex items-center gap-1.5 text-emerald-600">
                                        <CheckCircle className="h-4 w-4" />
                                        <span className="text-xs font-semibold">Завършена</span>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setEndPair({ sessionId: session.id, pairId: pair.id })}
                                        className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 whitespace-nowrap"
                                      >
                                        <Save className="h-3.5 w-3.5" />
                                        Краен баланс
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ ИСТОРИЯ TAB ═══ */}
        {tab === "history" && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold">История на сесиите</h2>
              <p className="text-sm text-slate-500">Завършени group-vs-group сесии</p>
            </div>

            {completedTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-white py-20 text-center">
                <History className="mb-4 h-12 w-12 text-slate-300" />
                <div className="text-lg font-semibold text-slate-500">Няма завършени сесии</div>
              </div>
            ) : (
              <div className="space-y-3">
                {[...completedTrades].reverse().map((session) => {
                  const gA = getGroup(session.groupAId);
                  const gB = getGroup(session.groupBId);
                  const isOpen = expandedSession === session.id;
                  const totalPnl = session.pairs.reduce((sum, p) => {
                    const a = p.endBalanceA != null ? p.endBalanceA - p.startBalanceA : 0;
                    const b = p.endBalanceB != null ? p.endBalanceB - p.startBalanceB : 0;
                    return sum + a + b;
                  }, 0);

                  return (
                    <div key={session.id} className="rounded-[20px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <div
                        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50 transition"
                        onClick={() => setExpandedSession(isOpen ? null : session.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {gA && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${C[gA.color]?.chip}`}>{gA.name}</span>}
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                            {gB && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${C[gB.color]?.chip}`}>{gB.name}</span>}
                          </div>
                          <div>
                            <div className="font-semibold">{session.name}</div>
                            <div className="text-xs text-slate-400">
                              {new Date(session.startedAt).toLocaleDateString("bg-BG")}
                              {session.completedAt && " → " + new Date(session.completedAt).toLocaleDateString("bg-BG")}
                              · {session.pairs.length} двойки
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`text-sm font-bold ${totalPnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {totalPnl >= 0 ? <TrendingUp className="mr-1 inline h-4 w-4" /> : <TrendingDown className="mr-1 inline h-4 w-4" />}
                            {totalPnl >= 0 ? "+" : ""}{fmt(totalPnl)}
                          </div>
                          {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-slate-100"
                          >
                            <div className="divide-y divide-slate-100">
                              {session.pairs.map((pair, idx) => {
                                const accA = getAccount(pair.accountAId);
                                const accB = getAccount(pair.accountBId);
                                if (!accA || !accB) return null;
                                const pnlA = pair.endBalanceA != null ? pair.endBalanceA - pair.startBalanceA : null;
                                const pnlB = pair.endBalanceB != null ? pair.endBalanceB - pair.startBalanceB : null;
                                return (
                                  <div key={pair.id} className="grid grid-cols-2 gap-6 px-6 py-3.5">
                                    {[
                                      { acc: accA, start: pair.startBalanceA, end: pair.endBalanceA, pnl: pnlA },
                                      { acc: accB, start: pair.startBalanceB, end: pair.endBalanceB, pnl: pnlB },
                                    ].map(({ acc, start, end, pnl }) => (
                                      <div key={acc.id} className="flex items-center justify-between">
                                        <div>
                                          <span className="font-mono text-xs font-bold text-slate-400">{acc.id}</span>
                                          <div className="text-sm font-semibold">{acc.traderName}</div>
                                          <div className="text-xs text-slate-400">{fmt(start)} → {end != null ? fmt(end) : "—"}</div>
                                        </div>
                                        {pnl !== null && (
                                          <div className={`text-sm font-bold ${pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                            {pnl >= 0 ? "+" : ""}{fmt(pnl)}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      <AnimatePresence>
        {editAccount !== null && (
          <AccountModal
            key="account-modal"
            initial={editAccount !== true ? editAccount : undefined}
            groups={groups}
            onSave={upsertAccount}
            onClose={() => setEditAccount(null)}
          />
        )}
        {endModal && (
          <EndBalanceModal
            key="end-modal"
            pair={endModal.pair}
            accountA={endModal.accA}
            accountB={endModal.accB}
            onSave={(endA, endB) => saveEndBalance(endModal.session.id, endModal.pair.id, endA, endB)}
            onClose={() => setEndPair(null)}
          />
        )}
        {newSession && (
          <NewSessionModal
            key="session-modal"
            groups={groups}
            accounts={accounts}
            onStart={startSession}
            onClose={() => setNewSession(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
