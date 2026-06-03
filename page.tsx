"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, TrendingUp, Bell, MessageCircle, BarChart2, Zap, CheckCircle2 } from "lucide-react";

/* ─── Decorative candlestick SVG ─── */
function Candle({ x, h, body, bullish }: { x: number; h: number; body: number; bullish: boolean }) {
  const color = bullish ? "#4ade80" : "#a78bfa";
  const bodyTop = h * 0.2;
  const bodyH = h * body;
  return (
    <g transform={`translate(${x}, 0)`}>
      <line x1="6" y1="0" x2="6" y2={h} stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
      <rect x="1" y={bodyTop} width="10" height={bodyH} rx="1" fill={color} fillOpacity="0.55" />
    </g>
  );
}

function CandlestickDeco({ className }: { className?: string }) {
  const candles = [
    { x: 0,  h: 80,  body: 0.45, bullish: true  },
    { x: 18, h: 60,  body: 0.55, bullish: false },
    { x: 36, h: 100, body: 0.5,  bullish: true  },
    { x: 54, h: 70,  body: 0.4,  bullish: false },
    { x: 72, h: 90,  body: 0.6,  bullish: true  },
  ];
  return (
    <svg width="100" height="110" viewBox="0 0 100 110" className={className} aria-hidden="true">
      {candles.map((c, i) => <Candle key={i} {...c} />)}
    </svg>
  );
}

/* ─── FAQ accordion item ─── */
function FaqItem({ question, answer, open, onToggle }: {
  question: string; answer: string; open: boolean; onToggle: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-[#13132a] overflow-hidden cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between px-5 py-4 gap-4">
        <span className="text-white font-medium leading-snug">{question}</span>
        <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-violet-600 text-white">
          {open ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="px-5 pb-5 text-slate-400 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Step card ─── */
function StepCard({ num, title, desc, children }: {
  num: string; title: string; desc: string; children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] bg-[#13132a] border border-white/8 p-7">
      <p className="text-violet-400 font-bold text-lg mb-3">{num}.</p>
      <h3 className="text-white text-2xl font-bold mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed mb-5">{desc}</p>
      {children}
    </div>
  );
}

/* ─── Feature card ─── */
function FeatureCard({ title, desc, extra, children }: {
  title: string; desc: string; extra?: string; children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] bg-[#0f0f24] border border-white/8 p-7">
      <h3 className="text-white text-2xl font-bold mb-4">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
      {extra && <p className="text-slate-300 leading-relaxed mt-3">{extra}</p>}
      {children}
    </div>
  );
}

/* ─── JOIN button ─── */
function JoinButton({ href = "#join", full = false }: { href?: string; full?: boolean }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center rounded-2xl bg-violet-500 hover:bg-violet-400 active:scale-[0.98] transition-all duration-150 text-white font-bold tracking-widest text-base px-8 py-4 shadow-lg shadow-violet-900/40 ${full ? "w-full" : ""}`}
    >
      JOIN
    </a>
  );
}

/* ─── Image placeholder (swap out with real <img> once you have the files) ─── */
function ImgPlaceholder({ label, aspect = "aspect-video", className = "" }: {
  label: string; aspect?: string; className?: string;
}) {
  return (
    <div className={`${aspect} ${className} rounded-2xl border-2 border-dashed border-violet-500/40 bg-violet-900/10 flex flex-col items-center justify-center gap-2`}>
      <div className="text-violet-400 text-xs font-mono text-center px-4">{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════ */
export default function DailySignalsLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Is this really free? What's the catch?",
      answer: "No catch. The channel is completely free. We post signals every day — no credit card, no subscription, no hidden fee. You click join and you're in.",
    },
    {
      question: "How often do you post signals?",
      answer: "Every trading day. We post entries, take profit levels, and stop losses in real time — before the move, not after.",
    },
    {
      question: "Do I need a trading account already? Which broker?",
      answer: "You don't need one to join the channel. You can follow, learn, and set up your account when you're ready. We cover multiple brokers and can guide you.",
    },
    {
      question: "Which markets do you cover?",
      answer: "Forex (majors and minors), gold, oil, crypto (BTC, ETH and alts), and equities. Something moves every day.",
    },
    {
      question: "Will you eventually start charging for this?",
      answer: "The free channel stays free. If a premium tier is ever added, existing free members keep their access.",
    },
  ];

  return (
    <div className="bg-[#08081a] text-white min-h-screen font-sans antialiased">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center px-5 pt-20 pb-16">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(124,58,237,0.35),transparent_60%)]" />
        {/* Vertical lines grid */}
        <div className="pointer-events-none absolute inset-0 opacity-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:44px]" />

        {/* Candlestick decorations */}
        <CandlestickDeco className="absolute left-4 bottom-24 opacity-40 rotate-180 hidden sm:block" />
        <CandlestickDeco className="absolute right-4 bottom-32 opacity-40 hidden sm:block" />
        <CandlestickDeco className="absolute left-[12%] top-[18%] opacity-20 rotate-12 hidden lg:block" />
        <CandlestickDeco className="absolute right-[12%] top-[22%] opacity-20 -rotate-6 hidden lg:block" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center text-center max-w-xl mx-auto"
        >
          {/* Hero photo — replace with your real photo */}
          {/*
            PHOTO NEEDED: Your photo — ideally standing or portrait,
            clean background or removed background.
            Save as /public/hero-photo.png and replace the ImgPlaceholder below with:
            <img src="/hero-photo.png" alt="Daily Signals" className="w-40 h-40 rounded-full object-cover mx-auto mb-6 border-2 border-violet-500/40" />
          */}
          <ImgPlaceholder
            label="YOUR PHOTO HERE&#10;(portrait / transparent bg)&#10;Save as /public/hero-photo.png"
            aspect="aspect-square"
            className="w-36 mb-6 mx-auto"
          />

          <p className="text-slate-400 text-sm mb-4">
            <strong className="text-white">A private Telegram channel</strong> where we post signals in real time,
            run live market sessions, and walk you through every trade.
          </p>

          <div id="join" className="my-2 w-full">
            <JoinButton href="https://t.me/YOUR_CHANNEL_LINK" full />
          </div>

          <div className="mt-3 flex items-center justify-center gap-5 text-slate-500 text-sm">
            <span>No payment.</span>
            <span>No credit card.</span>
            <span>No catch.</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">You&apos;re inside in 30 seconds.</p>
        </motion.div>
      </section>

      {/* ── HERO HEADLINE (below fold, like the reference) ── */}
      <section className="bg-[#f5f5f5] py-16 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-slate-900 text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
            A live trading floor<br />in your pocket.
          </h2>
          <p className="mt-5 text-slate-600 text-lg leading-relaxed">
            This isn't a signal bot. It's the actual room where the team runs their day.
            Every signal, every market read, every session — posted as it happens.
          </p>

          {/* Trade card screenshots — 3 image slots */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            {/*
              PHOTOS NEEDED: Screenshots of 3 trade signal cards (from your Telegram or broker app).
              Save them as /public/trade-1.png, /public/trade-2.png, /public/trade-3.png
              Then replace these 3 ImgPlaceholders with:
              <img src="/trade-1.png" alt="" className="w-full rounded-2xl" />
            */}
            <ImgPlaceholder label="trade-1.png&#10;Signal screenshot" className="w-full" />
            <ImgPlaceholder label="trade-2.png&#10;Signal screenshot" className="w-full" />
            <ImgPlaceholder label="trade-3.png&#10;Signal screenshot" className="w-full" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-[#08081a] px-5 py-16 space-y-4 max-w-2xl mx-auto">

        <FeatureCard
          title="Daily signals, posted as they happen."
          desc="Entry price, take profit, stop loss — all visible. Forex, gold, oil, BTC, ETH, alts. Posted before the move, not after."
          extra="You see exactly what the team is doing in real time and decide what to do with it."
        >
          {/*
            PHOTO NEEDED: Screenshot of your Telegram channel showing a list of signal messages.
            Save as /public/telegram-signals.png and replace the ImgPlaceholder below:
            <img src="/telegram-signals.png" alt="" className="w-full mt-6 rounded-2xl border border-white/10" />
          */}
          <ImgPlaceholder
            label="telegram-signals.png&#10;Channel screenshot showing signal messages"
            className="w-full mt-6"
          />
        </FeatureCard>

        <FeatureCard
          title="Weekly profit recap."
          desc="Every week we break down what closed, what hit target, what got stopped, and what got carried over."
          extra="Real numbers, not vibes. Look at any week and judge for yourself."
        >
          {/*
            PHOTO NEEDED: Screenshot of a weekly recap post from your Telegram channel.
            Save as /public/weekly-recap.png and replace the ImgPlaceholder:
            <img src="/weekly-recap.png" alt="" className="w-full mt-6 rounded-2xl border border-white/10" />
          */}
          <ImgPlaceholder
            label="weekly-recap.png&#10;Weekly recap message screenshot"
            className="w-full mt-6"
          />
        </FeatureCard>

        <FeatureCard
          title="Direct access to the team."
          desc="Questions get answered via direct messages. Market moves get explained. No gatekeepers, no support tickets."
          extra="Drop a question, the team picks it up."
        />

      </section>

      {/* ── LAST 5 DAYS ── */}
      <section className="bg-[#f5f5f5] py-16 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-slate-900 text-4xl font-extrabold leading-tight">
            Here&apos;s what the last<br />5 days looked like.
          </h2>
          <p className="mt-3 text-slate-600">Don&apos;t take our word for it. Look at the timeline.</p>

          {/*
            PHOTO NEEDED: Screenshot of your Telegram channel showing 5 days of signals/results.
            Save as /public/timeline.png and replace:
            <img src="/timeline.png" alt="" className="w-full mt-8 rounded-2xl shadow-lg" />
          */}
          <ImgPlaceholder
            label="timeline.png&#10;5-day results screenshot from your channel"
            aspect="aspect-[9/16]"
            className="max-w-xs mx-auto mt-8"
          />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-[#08081a] px-5 py-16 max-w-2xl mx-auto space-y-4">
        <p className="text-slate-500 text-sm text-center mb-1">No phone call.</p>

        <StepCard
          num="01"
          title="Hit the button."
          desc="One click. No form, no email, no phone number."
        >
          <JoinButton href="https://t.me/YOUR_CHANNEL_LINK" full />
        </StepCard>

        <StepCard
          num="02"
          title="The bot hands you the channel link."
          desc="Free. Instant. No payment, no card, no catch."
        >
          {/*
            PHOTO NEEDED: Screenshot of Telegram showing the bot sending the channel invite link.
            Save as /public/bot-message.png and replace:
            <img src="/bot-message.png" alt="" className="w-full mt-2 rounded-2xl border border-white/10" />
          */}
          <ImgPlaceholder
            label="bot-message.png&#10;Telegram bot invite screenshot"
            className="w-full mt-2"
          />
        </StepCard>

        <StepCard
          num="03"
          title="Open the channel and turn on notifications."
          desc="The first signal is probably already there. The team posts every day."
        >
          {/*
            PHOTO NEEDED: Screenshot of the Daily Signals Telegram channel profile page.
            Save as /public/channel-profile.png and replace:
            <img src="/channel-profile.png" alt="" className="w-full mt-2 rounded-2xl border border-white/10" />
          */}
          <ImgPlaceholder
            label="channel-profile.png&#10;Telegram channel profile screenshot"
            className="w-full mt-2"
          />
        </StepCard>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#08081a] px-5 pb-16 max-w-2xl mx-auto">
        <h2 className="text-white text-3xl font-extrabold text-center mb-8">
          Questions you&apos;re probably asking.
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FaqItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              open={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-[#0d0d22] border-t border-white/5 px-5 py-20">
        <div className="max-w-md mx-auto flex flex-col items-center text-center">
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {["FREE", "IN REAL TIME", "DAILY SIGNALS"].map((tag) => (
              <span key={tag} className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-bold tracking-widest text-white uppercase">
                {tag}
              </span>
            ))}
          </div>
          <h2 className="text-white text-4xl sm:text-5xl font-extrabold mb-7 leading-tight">
            Get inside the channel.
          </h2>
          <JoinButton href="https://t.me/YOUR_CHANNEL_LINK" full />
          <p className="mt-4 text-slate-500 text-sm">Free forever. One click and you&apos;re inside.</p>

          {/*
            PHOTO NEEDED: Full-screen screenshot of the Daily Signals Telegram channel
            showing active messages/signals (the "inside" preview).
            Save as /public/channel-preview.png and replace:
            <img src="/channel-preview.png" alt="" className="w-full max-w-xs mt-10 rounded-3xl shadow-2xl border border-white/10" />
          */}
          <ImgPlaceholder
            label="channel-preview.png&#10;Full channel screenshot (the 'inside' preview)"
            aspect="aspect-[9/16]"
            className="max-w-xs w-full mt-10"
          />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#08081a] border-t border-white/5 py-6 px-5 text-center text-slate-600 text-sm">
        <span>Daily Signals &copy; {new Date().getFullYear()}</span>
        <span className="mx-3">·</span>
        <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
      </footer>

    </div>
  );
}
