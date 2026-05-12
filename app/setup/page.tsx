"use client";

import { useState } from "react";
import { Brain, CheckCircle2, AlertCircle, Loader2, ExternalLink, Copy, ChevronRight } from "lucide-react";

interface SetupResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
  rootPageUrl?: string;
  databases?: Record<string, string>;
}

export default function SetupPage() {
  const [token, setToken] = useState("");
  const [parentPageId, setParentPageId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<SetupResult | null>(null);
  const [copied, setCopied] = useState("");

  const handleSetup = async () => {
    if (!token.trim()) return;
    setStatus("loading");
    setResult(null);

    try {
      const res = await fetch("/api/setup-notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          parentPageId: parentPageId.trim() || undefined,
        }),
      });
      const data: SetupResult = await res.json();
      setResult(data);
      setStatus(data.success ? "done" : "error");
    } catch {
      setResult({ success: false, error: "Network error. Please try again." });
      setStatus("error");
    }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const DB_LABELS: Record<string, string> = {
    tasks: "✅ Tasks",
    projects: "📁 Projects",
    goals: "🎯 Goals",
    habits: "🔥 Habits",
    lifeAreas: "🌱 Life Areas",
    books: "📚 Books",
    watchlist: "📺 Watchlist",
    notes: "📝 Notes",
    contacts: "👤 Contacts",
  };

  return (
    <div className="min-h-screen bg-[#191614] text-[#e2d9ce] flex items-start justify-center p-4 pt-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-700 to-orange-900">
            <Brain className="h-5 w-5 text-amber-100" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-amber-100">Second Brain OS Setup</h1>
            <p className="text-sm text-zinc-500">Автоматично създава всичко в Notion</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 rounded-xl border border-[#2e2926] bg-[#1a1714] p-4 text-sm text-zinc-400 space-y-2">
          <p className="font-semibold text-zinc-300">Преди да продължиш:</p>
          <div className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
            <span>Отвори Notion → избери произволна страница → кликни <strong className="text-zinc-300">«···»</strong> → <strong className="text-zinc-300">Connections</strong> → добави <strong className="text-zinc-300">Second Brain Setup</strong></span>
          </div>
          <div className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
            <span>Копирай URL-а на тази страница и постави ID-то (32-те символа от URL-а) в полето по-долу</span>
          </div>
          <div className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
            <span>Ако оставиш полето за страница празно, системата ще се опита да създаде в workspace root-а (изисква workspace access)</span>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">
              Notion Integration Token *
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ntn_xxxx... или secret_xxxx..."
              className="w-full rounded-xl border border-[#2e2926] bg-[#141210] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 outline-none focus:border-amber-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">
              Parent Page ID <span className="text-zinc-700 font-normal normal-case">(незадължително)</span>
            </label>
            <input
              type="text"
              value={parentPageId}
              onChange={(e) => setParentPageId(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-xl border border-[#2e2926] bg-[#141210] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 outline-none focus:border-amber-800 transition font-mono"
            />
            <p className="mt-1 text-xs text-zinc-600">
              От URL-а: notion.so/My-Page-<span className="text-zinc-400">32символа</span>
            </p>
          </div>

          <button
            onClick={handleSetup}
            disabled={!token.trim() || status === "loading"}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-800/80 hover:bg-amber-700/80 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-3.5 font-semibold text-amber-100 transition"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Създавам Second Brain в Notion...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                Създай Second Brain OS
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {status === "done" && result?.success && (
          <div className="mt-6 rounded-xl border border-green-900/40 bg-green-950/30 p-4 space-y-4">
            <div className="flex items-center gap-2 text-green-400 font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              Second Brain OS е създаден успешно!
            </div>

            {result.rootPageUrl && (
              <a
                href={result.rootPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-amber-800/40 hover:bg-amber-700/40 px-4 py-3 text-sm font-medium text-amber-300 transition"
              >
                <Brain className="h-4 w-4" />
                Отвори Second Brain OS в Notion
                <ExternalLink className="h-3.5 w-3.5 ml-auto" />
              </a>
            )}

            {result.databases && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Създадени бази данни:</p>
                <div className="space-y-1">
                  {Object.entries(result.databases).map(([key, url]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border border-[#2e2926] px-3 py-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-zinc-300 hover:text-amber-300 transition flex items-center gap-1.5"
                      >
                        {DB_LABELS[key] || key}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        onClick={() => copy(url, key)}
                        className="text-xs text-zinc-600 hover:text-zinc-300 transition flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        {copied === key ? "Копирано!" : "Копирай"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {status === "error" && result && (
          <div className="mt-6 rounded-xl border border-red-900/40 bg-red-950/20 p-4">
            <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
              <AlertCircle className="h-5 w-5" />
              Грешка
            </div>
            <p className="text-sm text-zinc-400">{result.error}</p>
            {result.details && (
              <p className="mt-2 text-xs text-zinc-600 font-mono break-all">{result.details}</p>
            )}
            <p className="mt-3 text-xs text-zinc-500">
              Провери дали токенът е верен и дали интеграцията е добавена към страницата в Notion.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
