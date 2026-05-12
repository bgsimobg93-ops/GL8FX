"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  CheckSquare,
  FolderOpen,
  Hash,
  Play,
  RotateCcw,
  Coffee,
  Plus,
  ChevronRight,
  CheckCircle2,
  Circle,
  Target,
  BookOpen,
  Tv,
  Calendar,
  Database,
  Dumbbell,
  Brain,
  Heart,
  DollarSign,
  Briefcase,
  GraduationCap,
  Palette,
  User,
  Home,
  Pause,
  SkipForward,
  Volume2,
  Star,
  Link,
  NotebookPen,
  Layers,
  StickyNote,
  BarChart3,
  Flame,
  Inbox,
  Settings,
  Search,
  X,
  ChevronDown,
  ExternalLink,
  Clock,
  Flag,
  TrendingUp,
  Music2,
  ListTodo,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Priority = "High" | "Medium" | "Low";
type TaskStatus = "Not started" | "In progress" | "Completed";
type ProjectStatus = "Active" | "To-do" | "On hold";
type GoalStatus = "Done" | "In progress" | "Not started";

interface Task {
  id: string;
  title: string;
  priority: Priority;
  area: string;
  dueIn: string;
  status: TaskStatus;
  done: boolean;
}

interface Habit {
  id: string;
  name: string;
  done: boolean;
  streak: number;
}

interface Goal {
  id: string;
  title: string;
  status: GoalStatus;
  progress: number;
  month: string;
}

interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: number;
  deadline: string;
  area: string;
  tasks: number;
}

interface MediaItem {
  id: string;
  title: string;
  kind: string;
  rating: number;
  progress: string;
  emoji: string;
}

// ─── Static data ─────────────────────────────────────────────────────────────

const LIFE_AREAS = [
  { name: "Family", icon: Home, grad: "from-orange-950 to-orange-900/30", goals: 3, tasks: 2, projects: 1 },
  { name: "Finances", icon: DollarSign, grad: "from-emerald-950 to-emerald-900/30", goals: 5, tasks: 4, projects: 2 },
  { name: "Self-dev", icon: Brain, grad: "from-violet-950 to-violet-900/30", goals: 4, tasks: 6, projects: 3 },
  { name: "Health", icon: Dumbbell, grad: "from-red-950 to-red-900/30", goals: 3, tasks: 5, projects: 1 },
  { name: "Education", icon: GraduationCap, grad: "from-blue-950 to-blue-900/30", goals: 2, tasks: 3, projects: 2 },
  { name: "Hobbies", icon: Palette, grad: "from-amber-950 to-amber-900/30", goals: 2, tasks: 4, projects: 1 },
  { name: "Work", icon: Briefcase, grad: "from-stone-800 to-stone-700/30", goals: 6, tasks: 8, projects: 4 },
  { name: "Personal", icon: Heart, grad: "from-pink-950 to-pink-900/30", goals: 3, tasks: 5, projects: 2 },
];

const TOOLS = [
  { name: "Notion", url: "notion.so" },
  { name: "Deepstash", url: "deepstash.com" },
  { name: "Notel", url: "notel.com" },
  { name: "IFTTT", url: "ifttt.com" },
  { name: "AutoDraw", url: "autodraw.com" },
  { name: "Huntr", url: "huntr.co" },
  { name: "Leonardo AI", url: "leonardo.ai" },
  { name: "Coolers", url: "coolers.co" },
  { name: "Socratic", url: "socratic.org" },
  { name: "Scholarly", url: "scholarly.com" },
];

const DATABASES = [
  { name: "Notes", icon: StickyNote },
  { name: "Tasks", icon: CheckSquare },
  { name: "Projects", icon: FolderOpen },
  { name: "Goals", icon: Target },
  { name: "Spheres", icon: Layers },
  { name: "Topics", icon: Hash },
  { name: "Papers", icon: FileText },
  { name: "Books", icon: BookOpen },
  { name: "Watchlist", icon: Tv },
  { name: "Life areas", icon: Brain },
  { name: "Contacts", icon: User },
  { name: "Passwords", icon: Settings },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function PriorityBadge({ p }: { p: Priority }) {
  const map: Record<Priority, string> = {
    High: "bg-red-950 text-red-400 border-red-900",
    Medium: "bg-amber-950 text-amber-400 border-amber-900",
    Low: "bg-teal-950 text-teal-400 border-teal-900",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border ${map[p]}`}>
      <Flag className="h-2.5 w-2.5" />
      {p}
    </span>
  );
}

function StatusBadge({ s }: { s: TaskStatus }) {
  const map: Record<TaskStatus, string> = {
    "Not started": "bg-zinc-800 text-zinc-400 border-zinc-700",
    "In progress": "bg-blue-950 text-blue-400 border-blue-900",
    Completed: "bg-green-950 text-green-400 border-green-900",
  };
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium border ${map[s]}`}>
      {s}
    </span>
  );
}

function GoalStatusBadge({ s }: { s: GoalStatus }) {
  const map: Record<GoalStatus, string> = {
    Done: "bg-green-950 text-green-400",
    "In progress": "bg-amber-950 text-amber-400",
    "Not started": "bg-zinc-800 text-zinc-500",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[s]}`}>{s}</span>;
}

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3 w-3 ${i < n ? "fill-amber-400 text-amber-400" : "text-zinc-700"}`} />
      ))}
    </span>
  );
}

// ─── Pomodoro Timer ───────────────────────────────────────────────────────────

type PomMode = "focus" | "short" | "long";
const DURATIONS: Record<PomMode, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const MODE_LABELS: Record<PomMode, string> = { focus: "pomodoro", short: "short break", long: "long break" };

function PomodoroTimer() {
  const [mode, setMode] = useState<PomMode>("focus");
  const [timeLeft, setTimeLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback((m: PomMode = mode) => {
    setRunning(false);
    setTimeLeft(DURATIONS[m]);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { setRunning(false); return 0; }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const switchMode = (m: PomMode) => { setMode(m); reset(m); setTimeLeft(DURATIONS[m]); };
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const pct = ((DURATIONS[mode] - timeLeft) / DURATIONS[mode]) * 100;

  return (
    <div className="rounded-xl border border-[#2e2926] bg-[#1e1b18] p-3 text-center">
      <div className="flex justify-center gap-1 mb-2">
        {(["focus", "short", "long"] as PomMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${mode === m ? "bg-[#8B4513]/70 text-amber-300" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="relative inline-flex items-center justify-center my-1">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#2e2926" strokeWidth="4" />
          <circle
            cx="32" cy="32" r="28" fill="none"
            stroke="#8B4513" strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - pct / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className="absolute text-xl font-bold tabular-nums text-amber-100">{mm}:{ss}</span>
      </div>

      <div className="flex justify-center gap-2 mt-1">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-1.5 rounded-lg bg-[#8B4513]/80 hover:bg-[#a05218] px-4 py-1.5 text-xs font-semibold text-amber-100 transition"
        >
          {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {running ? "pause" : "start"}
        </button>
        <button onClick={() => reset()} className="rounded-lg border border-[#3a3330] px-2 py-1.5 text-zinc-400 hover:text-zinc-200 transition">
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SecondBrainOS() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Make a choice between best platforms", priority: "Medium", area: "Work", dueIn: "6d", status: "Not started", done: false },
    { id: "2", title: "Check templation.io website", priority: "Medium", area: "Work", dueIn: "4d", status: "Not started", done: false },
    { id: "3", title: "Buy the Content Planner OS for my videos", priority: "Medium", area: "Work", dueIn: "4d", status: "Not started", done: false },
    { id: "4", title: "Buy Academic OS template", priority: "Low", area: "Education", dueIn: "7d", status: "Not started", done: false },
    { id: "5", title: "Watch at Booking.com listings", priority: "Low", area: "Personal", dueIn: "4d", status: "In progress", done: false },
    { id: "6", title: "Make an Excel game", priority: "Low", area: "Hobbies", dueIn: "4d", status: "In progress", done: false },
    { id: "7", title: "Review current bank accounts", priority: "Low", area: "Finances", dueIn: "4d", status: "Not started", done: false },
    { id: "8", title: "Schedule a meet with Max", priority: "High", area: "Work", dueIn: "4d", status: "In progress", done: false },
  ]);

  const [habits, setHabits] = useState<Habit[]>([
    { id: "1", name: "Water 2L", done: false, streak: 12 },
    { id: "2", name: "Walk 5 km", done: true, streak: 3 },
    { id: "3", name: "Meditation 10 min", done: false, streak: 7 },
    { id: "4", name: "Day analysis", done: true, streak: 21 },
    { id: "5", name: "Book 10 pages", done: false, streak: 5 },
  ]);

  const [goals, setGoals] = useState<Goal[]>([
    { id: "1", title: "Get my first salary", status: "Done", progress: 100, month: "May" },
    { id: "2", title: "Make finance updates", status: "In progress", progress: 65, month: "May" },
    { id: "3", title: "Start the first course", status: "In progress", progress: 40, month: "May" },
    { id: "4", title: "Complete all tasks", status: "Not started", progress: 10, month: "May" },
  ]);

  const [projects, setProjects] = useState<Project[]>([
    { id: "1", title: "Buy all templation.io products to be organized", status: "Active", progress: 19, deadline: "May 29, 2026", area: "Work", tasks: 5 },
    { id: "2", title: "Find a new apartment", status: "Active", progress: 45, deadline: "Jun 27, 2026", area: "Personal", tasks: 8 },
    { id: "3", title: "Launch YouTube Channel", status: "To-do", progress: 5, deadline: "Jul 15, 2026", area: "Work", tasks: 12 },
    { id: "4", title: "Learn Spanish B1", status: "To-do", progress: 20, deadline: "Sep 1, 2026", area: "Education", tasks: 6 },
    { id: "5", title: "Home gym setup", status: "On hold", progress: 0, deadline: "Aug 30, 2026", area: "Health", tasks: 4 },
    { id: "6", title: "Personal finance tracker", status: "On hold", progress: 10, deadline: "Jun 30, 2026", area: "Finances", tasks: 3 },
  ]);

  const watching: MediaItem[] = [
    { id: "1", title: "Attack on Titan", kind: "Anime • Series", rating: 5, progress: "S4 E12", emoji: "⚔️" },
    { id: "2", title: "The Office (US)", kind: "Comedy • Series", rating: 4, progress: "S3 E7", emoji: "📎" },
    { id: "3", title: "Dark", kind: "Thriller • Series", rating: 5, progress: "S2 E3", emoji: "🌀" },
  ];

  const reading: MediaItem[] = [
    { id: "1", title: "1984", kind: "Novel • Dystopian", rating: 5, progress: "63%", emoji: "📕" },
    { id: "2", title: "Atomic Habits", kind: "Self-dev • Audio", rating: 4, progress: "Audio 45%", emoji: "⚡" },
    { id: "3", title: "The Psychology of Money", kind: "Finance • Book", rating: 4, progress: "Page 87", emoji: "💰" },
  ];

  const [projectTab, setProjectTab] = useState<ProjectStatus>("Active");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showNewTask, setShowNewTask] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const recentNotes = [
    "Feat 16 — platform comparison notes",
    "Make a surprise for her",
    "4th month anniversary ideas",
    "Room cleaning checklist",
    "Jacket hunting — sizes and stores",
    "I think I like Mary",
    "Add Jack to contact base",
    "Make a plan for today",
    "The new Canon lens is a beast",
  ];

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => t.id === id ? { ...t, done: !t.done, status: !t.done ? "Completed" : "Not started" } : t)
    );
  };

  const toggleHabit = (id: string) => {
    setHabits((prev) => prev.map((h) => h.id === id ? { ...h, done: !h.done } : h));
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const t: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      priority: "Medium",
      area: "Work",
      dueIn: "7d",
      status: "Not started",
      done: false,
    };
    setTasks((prev) => [t, ...prev]);
    setNewTaskTitle("");
    setShowNewTask(false);
  };

  const habitsDone = habits.filter((h) => h.done).length;
  const habitsPct = Math.round((habitsDone / habits.length) * 100);

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // ── Section header ──
  const SectionHeader = ({ icon: Icon, label, color = "bg-[#4a2e1a]" }: { icon: React.ElementType; label: string; color?: string }) => (
    <div className={`flex items-center gap-2 rounded-lg ${color} px-3 py-2 mb-3`}>
      <Icon className="h-4 w-4 text-amber-400/80 shrink-0" />
      <span className="text-sm font-semibold text-amber-200/80 tracking-wide uppercase">{label}</span>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#191614] text-[#e2d9ce]">

      {/* ── Left Sidebar ──────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-[#2a2520] bg-[#141210]
        transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0
      `}>
        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#2a2520]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-700 to-orange-900">
              <Brain className="h-4 w-4 text-amber-100" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-100 leading-tight">Second Brain OS</div>
              <div className="text-[10px] text-zinc-500">{today}</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Planning */}
          <div>
            <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Planning</div>
            {[
              { icon: Calendar, label: "Dashboard" },
              { icon: ListTodo, label: "All Tasks" },
              { icon: FolderOpen, label: "Projects" },
              { icon: Target, label: "Goals" },
              { icon: TrendingUp, label: "Habits" },
              { icon: NotebookPen, label: "Notes" },
            ].map(({ icon: Icon, label }) => (
              <button key={label} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-zinc-400 hover:bg-[#252220] hover:text-zinc-200 transition">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>

          {/* Fast actions */}
          <div>
            <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Fast actions</div>
            {[
              { icon: FileText, label: "New note", color: "text-amber-400" },
              { icon: NotebookPen, label: "New topic", color: "text-violet-400" },
              { icon: CheckSquare, label: "New task", color: "text-teal-400" },
              { icon: FolderOpen, label: "New project", color: "text-blue-400" },
              { icon: User, label: "New contact", color: "text-pink-400" },
            ].map(({ icon: Icon, label, color }) => (
              <button key={label} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-zinc-400 hover:bg-[#252220] hover:text-zinc-200 transition">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
                {label}
              </button>
            ))}
          </div>

          {/* Pomodoro */}
          <div>
            <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Focus timer</div>
            <PomodoroTimer />
          </div>

          {/* Recent notes */}
          <div>
            <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Recent notes</div>
            <div className="space-y-0.5">
              {recentNotes.slice(0, 7).map((n) => (
                <button key={n} className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-[#252220] hover:text-zinc-300 transition text-left truncate">
                  <StickyNote className="h-3 w-3 shrink-0 text-amber-700" />
                  <span className="truncate">{n}</span>
                </button>
              ))}
            </div>
            <button className="mt-1 px-2 text-xs text-zinc-600 hover:text-zinc-400 transition">+ Load more</button>
          </div>

          {/* Useful tools */}
          <div>
            <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Useful tools</div>
            <div className="space-y-0.5">
              {TOOLS.slice(0, 8).map((t) => (
                <div key={t.name} className="flex items-center justify-between rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-[#252220] hover:text-zinc-300 transition cursor-pointer">
                  <span>{t.name}</span>
                  <span className="text-zinc-700 truncate max-w-[90px] text-right">{t.url}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Content ──────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#2a2520] bg-[#191614]/95 px-4 py-2.5 backdrop-blur">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-500 hover:text-zinc-300">
            <Layers className="h-5 w-5" />
          </button>
          <div className="flex-1 flex items-center gap-2 rounded-lg border border-[#2a2520] bg-[#141210] px-3 py-1.5 max-w-sm">
            <Search className="h-3.5 w-3.5 text-zinc-600" />
            <input className="flex-1 bg-transparent text-sm text-zinc-300 placeholder-zinc-600 outline-none" placeholder="Search everything..." />
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-zinc-600">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-6 max-w-4xl">

          {/* ── Tasks this week ────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-1">
              <SectionHeader icon={CheckSquare} label="Tasks this week" />
              <button
                onClick={() => setShowNewTask((s) => !s)}
                className="flex items-center gap-1.5 rounded-lg bg-[#4a2e1a] hover:bg-[#5e3a21] px-3 py-1.5 text-xs font-medium text-amber-300 transition"
              >
                <Plus className="h-3 w-3" /> New task
              </button>
            </div>

            {showNewTask && (
              <div className="mb-2 flex gap-2">
                <input
                  autoFocus
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder="Task title… (Enter to save)"
                  className="flex-1 rounded-lg border border-[#3a3330] bg-[#1e1b18] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-amber-800"
                />
                <button onClick={addTask} className="rounded-lg bg-amber-800/60 hover:bg-amber-700/60 px-3 py-2 text-xs text-amber-300 transition">Add</button>
                <button onClick={() => setShowNewTask(false)} className="rounded-lg border border-[#3a3330] px-2 text-zinc-500 hover:text-zinc-300">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Task filter tabs */}
            <div className="flex gap-1 mb-2">
              {(["All", "High", "In progress", "Not started"] as const).map((f) => (
                <button key={f} className="rounded-md border border-[#2e2926] bg-[#1e1b18] px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300 hover:border-amber-900/50 transition">
                  {f}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-[#2a2520] overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[1.8rem_1fr_90px_80px_60px_90px] gap-2 bg-[#1a1714] px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                <span />
                <span>Task</span>
                <span>Priority</span>
                <span>Area</span>
                <span>Due</span>
                <span>Status</span>
              </div>
              {tasks.map((task, i) => (
                <div
                  key={task.id}
                  className={`grid grid-cols-[1.8rem_1fr_90px_80px_60px_90px] items-center gap-2 px-3 py-2.5 text-sm transition hover:bg-[#1e1b18] border-t border-[#232018] ${task.done ? "opacity-50" : ""}`}
                >
                  <button onClick={() => toggleTask(task.id)} className="flex shrink-0 items-center justify-center">
                    {task.done
                      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                      : <Circle className="h-4 w-4 text-zinc-600 hover:text-amber-500 transition" />
                    }
                  </button>
                  <span className={`truncate text-sm ${task.done ? "line-through text-zinc-600" : "text-zinc-200"}`}>
                    {task.title}
                  </span>
                  <PriorityBadge p={task.priority} />
                  <span className="text-xs text-zinc-500 truncate">{task.area}</span>
                  <span className="text-xs text-zinc-500">{task.dueIn}</span>
                  <StatusBadge s={task.status} />
                </div>
              ))}
            </div>
            <button className="mt-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition px-1">+ New page</button>
          </section>

          {/* ── Life areas ─────────────────────────────── */}
          <section>
            <SectionHeader icon={Brain} label="Life areas" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {LIFE_AREAS.map(({ name, icon: Icon, grad, goals, tasks: t, projects }) => (
                <div
                  key={name}
                  className={`relative overflow-hidden rounded-xl border border-[#2e2926] bg-gradient-to-br ${grad} p-4 cursor-pointer hover:border-amber-900/40 transition group`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/30">
                      <Icon className="h-4 w-4 text-amber-300/80" />
                    </div>
                    <span className="font-semibold text-sm text-zinc-200">{name}</span>
                  </div>
                  <div className="space-y-0.5 text-[11px] text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Target className="h-2.5 w-2.5" /> Goals {goals}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckSquare className="h-2.5 w-2.5" /> Tasks {t}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FolderOpen className="h-2.5 w-2.5" /> Projects {projects}
                    </div>
                  </div>
                  <ChevronRight className="absolute right-2 bottom-2 h-3.5 w-3.5 text-zinc-700 group-hover:text-zinc-400 transition" />
                </div>
              ))}
            </div>
          </section>

          {/* ── Active projects ────────────────────────── */}
          <section>
            <SectionHeader icon={FolderOpen} label="Active projects" />
            <div className="flex gap-1.5 mb-3">
              {(["Active", "To-do", "On hold"] as ProjectStatus[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setProjectTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    projectTab === tab
                      ? "bg-[#4a2e1a] text-amber-300 border border-amber-900/50"
                      : "border border-[#2e2926] text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab}
                  <span className="ml-1.5 text-zinc-600">
                    {projects.filter((p) => p.status === tab).length}
                  </span>
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {projects.filter((p) => p.status === projectTab).map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-xl border border-[#2e2926] bg-[#1a1714] p-4 hover:border-amber-900/40 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-sm font-medium text-zinc-200 leading-snug">{proj.title}</span>
                    <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] rounded-full bg-[#2e2926] px-2 py-0.5 text-zinc-500">{proj.area}</span>
                    <span className="text-[10px] text-zinc-600">{proj.tasks} tasks</span>
                    <span className="ml-auto text-[10px] text-zinc-500">{proj.deadline}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#2e2926] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-700 to-orange-600 transition-all duration-500"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                  <div className="mt-1 text-right text-[10px] text-zinc-600">{proj.progress}%</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Watching now / Reading now ─────────────── */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Watching */}
            <section>
              <SectionHeader icon={Tv} label="Watching now" color="bg-[#1a2e3a]" />
              <div className="space-y-2">
                {watching.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#2a2520] bg-[#1a1714] px-3 py-2.5 hover:border-blue-900/40 transition cursor-pointer">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f1a24] text-xl">
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-200 truncate">{item.title}</div>
                      <div className="text-[11px] text-zinc-600">{item.kind}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <Stars n={item.rating} />
                      <div className="text-[10px] text-zinc-600 mt-0.5">{item.progress}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Reading */}
            <section>
              <SectionHeader icon={BookOpen} label="Reading now" color="bg-[#1a2e1a]" />
              <div className="space-y-2">
                {reading.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#2a2520] bg-[#1a1714] px-3 py-2.5 hover:border-green-900/40 transition cursor-pointer">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f1a0f] text-xl">
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-200 truncate">{item.title}</div>
                      <div className="text-[11px] text-zinc-600">{item.kind}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <Stars n={item.rating} />
                      <div className="text-[10px] text-zinc-600 mt-0.5">{item.progress}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>
      </main>

      {/* ── Right Sidebar ─────────────────────────────────────── */}
      <aside className="hidden xl:flex w-72 shrink-0 flex-col border-l border-[#2a2520] bg-[#141210] overflow-y-auto">
        <div className="p-4 space-y-5">

          {/* Habits today */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Habits today</span>
              </div>
              <span className="text-[10px] text-zinc-600">Today</span>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                <span>This day</span>
                <span>{habitsPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#2e2926]">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-700 to-amber-500 transition-all duration-500" style={{ width: `${habitsPct}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              {habits.map((h) => (
                <div
                  key={h.id}
                  onClick={() => toggleHabit(h.id)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer hover:bg-[#1e1b18] transition"
                >
                  {h.done
                    ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    : <Circle className="h-4 w-4 text-zinc-600 shrink-0" />
                  }
                  <span className={`flex-1 text-sm ${h.done ? "line-through text-zinc-600" : "text-zinc-300"}`}>
                    {h.name}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-orange-700">
                    <Flame className="h-2.5 w-2.5" />
                    {h.streak}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-[#2a2520]" />

          {/* Goals this month */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Goals this month</span>
            </div>
            <div className="space-y-2">
              {goals.map((g) => (
                <div key={g.id} className="rounded-lg border border-[#2a2520] bg-[#1a1714] p-2.5">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs text-zinc-300 leading-snug">{g.title}</span>
                    <GoalStatusBadge s={g.status} />
                  </div>
                  <div className="h-1 rounded-full bg-[#2e2926]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        g.status === "Done" ? "bg-green-600" :
                        g.status === "In progress" ? "bg-amber-600" : "bg-zinc-600"
                      }`}
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                  <div className="mt-0.5 text-right text-[10px] text-zinc-600">{g.progress}%</div>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-[#2a2520]" />

          {/* Music widget */}
          <section>
            <div className="rounded-xl bg-gradient-to-br from-amber-900/60 to-orange-950/60 border border-amber-900/30 p-3">
              <div className="flex items-center gap-2 mb-2.5">
                <Music2 className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-300">flow state</span>
                <a href="#" className="ml-auto text-[10px] text-amber-700 hover:text-amber-500 flex items-center gap-0.5">
                  <ExternalLink className="h-2.5 w-2.5" /> Spotify
                </a>
              </div>
              <div className="space-y-1.5 text-[11px]">
                {[
                  ["My Love Starts to Liquid", "04:22"],
                  ["Music Harmony and Rhythm", "03:26"],
                  ["The Glass City", "05:48"],
                  ["Grown On Me", "04:14"],
                  ["Planet Waves", "06:27"],
                ].map(([title, dur]) => (
                  <div key={title} className="flex items-center justify-between text-zinc-400 hover:text-zinc-200 cursor-pointer transition">
                    <span className="truncate">{title}</span>
                    <span className="ml-2 shrink-0 text-zinc-600">{dur}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-center gap-3">
                <button className="text-zinc-600 hover:text-zinc-300 transition"><SkipForward className="h-4 w-4 rotate-180" /></button>
                <button className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-700/80 hover:bg-amber-600/80 transition">
                  <Play className="h-3 w-3 text-amber-100 ml-0.5" />
                </button>
                <button className="text-zinc-600 hover:text-zinc-300 transition"><SkipForward className="h-4 w-4" /></button>
                <button className="text-zinc-600 hover:text-zinc-300 transition"><Volume2 className="h-4 w-4" /></button>
              </div>
            </div>
          </section>

          <div className="border-t border-[#2a2520]" />

          {/* Databases */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Databases</span>
            </div>
            <div className="space-y-0.5">
              {DATABASES.map(({ name, icon: Icon }) => (
                <button key={name} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-[#1e1b18] hover:text-zinc-300 transition">
                  <Icon className="h-3 w-3 shrink-0 text-zinc-600" />
                  {name}
                </button>
              ))}
            </div>
          </section>

        </div>
      </aside>
    </div>
  );
}
