"use client";

import { useMemo, useState } from "react";
import {
  Search,
  PlayCircle,
  ShieldCheck,
  Users,
  Briefcase,
  ChevronRight,
  FileText,
  Video,
  Building2,
  Code2,
} from "lucide-react";
import { motion } from "framer-motion";

export default function GL8FXTrainingPortal() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Overview", "Presentation", "Partner", "Process", "Investor Prep", "FAQ"];

  const modules = [
    {
      title: "Introduction to GL8FX",
      category: "Overview",
      duration: "12 min",
      description:
        "A clear overview of what GL8FX is, the vision behind the project, and how to explain it with confidence to investors.",
      speaker: "Leadership Team",
      status: "Ready",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    {
      title: "The GL8FX Presentation",
      category: "Presentation",
      duration: "18 min",
      description:
        "A full breakdown of the presentation, the key talking points, the order of delivery, and the strongest investor angles.",
      speaker: "Presentation Lead",
      status: "Ready",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    {
      title: "About Our Partner GTC",
      category: "Partner",
      duration: "10 min",
      description:
        "Who GTC is, what their role is, how the partnership should be explained, and why the relationship matters.",
      speaker: "Partnership Team",
      status: "Ready",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    {
      title: "Process Step by Step",
      category: "Process",
      duration: "20 min",
      description:
        "A practical training covering the process from first contact to follow-up, with clear operational guidance.",
      speaker: "Operations Team",
      status: "Ready",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    {
      title: "Investor Meeting Preparation",
      category: "Investor Prep",
      duration: "15 min",
      description:
        "How team leaders should prepare for meetings, answer key questions, present GL8FX clearly, and handle objections.",
      speaker: "Investor Relations",
      status: "Ready",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    {
      title: "FAQ: GL8FX & GTC",
      category: "FAQ",
      duration: "8 min",
      description:
        "The most common questions about the project, the partner, the presentation, and the correct way to communicate the opportunity.",
      speaker: "Support Team",
      status: "Ready",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
  ];

  const quickNotes = [
    "What is GL8FX in one sentence?",
    "What is the role of GTC?",
    "What are the top 3 presentation strengths?",
    "How should the model be explained simply?",
    "What questions do investors ask most often?",
    "What should never be overpromised?",
  ];

  const resources = [
    { name: "GL8FX Master Presentation", type: "PDF / Slides", href: null },
    { name: "Investor Call Flow", type: "Script", href: null },
    { name: "GTC Partnership Summary", type: "Document", href: null },
    { name: "Meeting Objection Handling", type: "Guide", href: null },
    { name: "Gold EMA 50/200 CFD Bot v2.5", type: "MT5 Expert Advisor (.mq5)", href: "/bots/Gold_EMA_50_200_CFD_Bot.mq5" },
    { name: "VWAP Trend CFD Bot v4.0", type: "MT5 Expert Advisor (.mq5)", href: "/bots/VWAP_Trend_CFD_v4.mq5" },
  ];

  const filteredModules = useMemo(() => {
    return modules.filter((module) => {
      const matchesCategory = selectedCategory === "All" || module.category === selectedCategory;
      const loweredQuery = query.toLowerCase();
      const matchesQuery =
        module.title.toLowerCase().includes(loweredQuery) ||
        module.description.toLowerCase().includes(loweredQuery) ||
        module.category.toLowerCase().includes(loweredQuery);
      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.18),_transparent_28%),linear-gradient(135deg,#020617,#0f172a,#1e293b)] text-white">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <div className="mb-5 inline-flex items-center rounded-full border border-yellow-400/30 bg-white/10 px-4 py-2 text-sm backdrop-blur">
                Internal Training Portal
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">GL8FX Training Hub</h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-200 md:text-xl">
                A private internal page for training team leaders with videos, presentation guidance,
                GTC partner information, and investor preparation in one professional place.
              </p>

              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="text-2xl font-bold">6</div>
                  <div className="text-sm text-slate-300">training modules</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="text-2xl font-bold">1</div>
                  <div className="text-sm text-slate-300">standard team message</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm text-slate-300">access for leaders</div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button className="rounded-2xl bg-yellow-400 px-6 py-3 font-semibold text-slate-950 shadow-lg transition hover:scale-[1.02]">
                  Start Training
                </button>
                <button className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 font-semibold transition hover:bg-white/15">
                  Investor Prep
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, delay: 0.1 }}>
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
                <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-6 text-center">
                  <div className="mx-auto flex h-40 w-40 items-center justify-center overflow-hidden rounded-[28px] border border-yellow-400/20 bg-gradient-to-br from-yellow-300/20 via-slate-900 to-white/10 shadow-2xl md:h-48 md:w-48">
                    <img src="/logo-gl8fx.png" alt="GL8FX logo" className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-400">Brand Identity</p>
                  <h3 className="mt-2 text-2xl font-semibold">GL8FX Official Logo</h3>
                  <p className="mx-auto mt-2 max-w-md text-slate-300">
                    Upload your logo file as <span className="font-medium text-white">logo-gl8fx.png</span> when publishing,
                    or replace the image path with your final hosted file.
                  </p>
                </div>

                <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-900/60 p-5">
                  <div className="flex items-center gap-3 text-left">
                    <ShieldCheck className="h-5 w-5 text-yellow-300" />
                    <div>
                      <div className="font-semibold">Private Team Access</div>
                      <div className="text-sm text-slate-300">Best published privately on Vercel, Netlify, or password-protected hosting.</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid items-start gap-6 lg:grid-cols-[1.5fr,1fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Training Library</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Everything your team leaders need</h2>
              </div>
              <div className="flex min-w-[260px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search modules"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {categories.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                <div className="font-semibold">Team Alignment</div>
              </div>
              <p className="mt-3 text-sm text-slate-600">Give every team leader the same message, structure, and investor flow.</p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5" />
                <div className="font-semibold">Partner Clarity</div>
              </div>
              <p className="mt-3 text-sm text-slate-600">Keep the GTC explanation clear, consistent, and professional.</p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5" />
                <div className="font-semibold">Investor Readiness</div>
              </div>
              <p className="mt-3 text-sm text-slate-600">Prepare the team for meetings, objections, and follow-up conversations.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredModules.map((module, index) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-video overflow-hidden border-b border-slate-200 bg-slate-100">
                <iframe
                  className="h-full w-full"
                  src={module.videoUrl}
                  title={module.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                    {module.category}
                  </span>
                  <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{module.duration}</span>
                </div>

                <h3 className="mt-4 text-xl font-bold leading-tight">{module.title}</h3>
                <p className="mt-3 leading-relaxed text-slate-600">{module.description}</p>

                <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                  <span>{module.speaker}</span>
                  <span className="font-medium text-emerald-600">{module.status}</span>
                </div>

                <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:opacity-95">
                  <PlayCircle className="h-4 w-4" />
                  Open Module
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Quick Notes</p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight">Fast investor reminders</h3>
            <div className="mt-6 space-y-3">
              {quickNotes.map((note) => (
                <div key={note} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-700">
                  <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-slate-900 p-8 text-white shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">How To Use This Hub</p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight">Recommended team workflow</h3>
            <div className="mt-6 space-y-5 text-slate-300">
              <div>
                <span className="font-semibold text-white">1. Watch the core videos</span>
                <p className="mt-1">Start with the project overview, then review the presentation, the GTC partnership, and investor preparation.</p>
              </div>
              <div>
                <span className="font-semibold text-white">2. Learn the exact presentation structure</span>
                <p className="mt-1">Keep the flow consistent so every leader explains the opportunity in the same professional way.</p>
              </div>
              <div>
                <span className="font-semibold text-white">3. Study the FAQ before every investor conversation</span>
                <p className="mt-1">Use the notes to handle objections, clarify the model, and avoid weak answers.</p>
              </div>
              <div>
                <span className="font-semibold text-white">4. Review resource files regularly</span>
                <p className="mt-1">Keep the latest presentation, scripts, and partner materials in one place for quick access.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-[28px] border border-yellow-300/30 bg-gradient-to-r from-yellow-400/20 via-white to-yellow-400/10 p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Resource Center</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight">Files your team should always have open</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {resources.map((resource) => (
              <div key={resource.name} className="rounded-2xl border border-slate-200 bg-white/80 p-5 backdrop-blur">
                <div className="flex items-center gap-3">
                  {resource.type.includes("PDF") || resource.type.includes("Script") || resource.type.includes("Document") || resource.type.includes("Guide")
                    ? <FileText className="h-5 w-5" />
                    : resource.type.includes("MT5")
                    ? <Code2 className="h-5 w-5" />
                    : <Video className="h-5 w-5" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{resource.name}</div>
                    <div className="text-sm text-slate-500">{resource.type}</div>
                  </div>
                  {resource.href && (
                    <a
                      href={resource.href}
                      download
                      className="shrink-0 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-85"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Publishing Notes</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight">Best free setup</h3>
          <div className="mt-6 space-y-4 leading-relaxed text-slate-600">
            <p><span className="font-semibold text-slate-900">Frontend:</span> Publish the page on Vercel or Netlify for free.</p>
            <p><span className="font-semibold text-slate-900">Videos:</span> Use YouTube unlisted, Vimeo, or Google Drive embeds.</p>
            <p><span className="font-semibold text-slate-900">Privacy:</span> Keep it internal with private links, password protection, or team-only access.</p>
            <p><span className="font-semibold text-slate-900">Branding:</span> Replace the logo path with your final GL8FX hosted logo file.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
