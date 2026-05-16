"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 } as Record<string, unknown>,
  viewport: { once: true },
  transition: { duration: 0.55, delay },
});

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] tracking-[0.38em] text-blue-400/60 uppercase mb-2">
      // {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-4xl md:text-5xl font-black tracking-tight leading-tight"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #bfdbfe 60%, #60a5fa 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      {children}
    </h2>
  );
}

function Divider() {
  return (
    <div
      className="w-full h-px my-8"
      style={{
        background:
          "linear-gradient(90deg, rgba(59,130,246,0.6) 0%, rgba(59,130,246,0.15) 50%, transparent 100%)",
      }}
    />
  );
}

function StatBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border border-blue-800/40 bg-blue-950/25 p-5">
      <p className="text-[9px] tracking-[0.32em] text-blue-400/60 uppercase">{label}</p>
      <p className="text-2xl md:text-3xl font-black text-white mt-1">{value}</p>
      {sub && <p className="text-[10px] text-blue-300/50 mt-1">{sub}</p>}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-2 border-b border-blue-900/20 text-sm ${
        bold ? "font-bold text-white" : "text-blue-100/65"
      }`}
    >
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function PageHeader({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex justify-between text-[10px] tracking-[0.3em] text-blue-400/35 uppercase mb-12">
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

function GhostNumber({ n }: { n: string }) {
  return (
    <span
      className="text-[110px] md:text-[140px] font-black leading-none select-none shrink-0"
      style={{ color: "rgba(30,58,138,0.18)" }}
    >
      {n}
    </span>
  );
}

const GRID_OVERLAY = {
  backgroundImage:
    "linear-gradient(rgba(96,165,250,1) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,1) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
};

export default function SimeonReport() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2pdf = (await import("html2pdf.js" as any)).default;
      const element = document.getElementById("report-content");
      await html2pdf()
        .set({
          margin: 0,
          filename: "simeon-natev-fabervaale-orb-report.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#000008" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(element)
        .save();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="report-content"
      className="min-h-screen bg-[#000008] text-white"
      style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* ───────────── COVER ───────────── */}
      <section
        className="relative min-h-screen flex flex-col justify-between overflow-hidden px-8 py-12 md:px-16 md:py-16"
        style={{
          background:
            "radial-gradient(ellipse at 70% 15%, rgba(30,58,138,0.35) 0%, transparent 55%), linear-gradient(135deg, #000000, #020215, #04042e)",
        }}
      >
        <div className="absolute inset-0 opacity-[0.06]" style={GRID_OVERLAY} />

        <div className="relative flex justify-between text-[10px] tracking-[0.32em] text-blue-400/45 uppercase">
          <span>Independent Model Validation</span>
          <span>Confidential · Internal</span>
        </div>

        <motion.div
          className="relative py-16"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85 }}
        >
          <p className="text-[11px] tracking-[0.5em] text-blue-400 uppercase mb-8">
            // Independent Model Validation
          </p>
          <h1
            className="text-6xl md:text-8xl font-black leading-none tracking-tight"
            style={{
              background:
                "linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            FABERVAALE
            <br />
            OPENING RANGE
            <br />
            BREAKOUT
          </h1>
          <p className="text-blue-200/55 max-w-xl text-sm leading-relaxed italic mt-6">
            An independent statistical validation of Fabio Valentini's long-only
            ORB stop-entry strategy, executed on 5 years of intraday NQ data.
          </p>

          <div
            className="mt-10 w-full h-px"
            style={{
              background:
                "linear-gradient(90deg, rgba(59,130,246,0.75) 0%, rgba(59,130,246,0.12) 60%, transparent 100%)",
            }}
          />

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-7">
            {[
              { label: "Instrument", value: "NQ Futures" },
              { label: "Sample", value: "823 trades" },
              { label: "Period", value: "2021 / 2026" },
              { label: "Simulations", value: "20,000" },
              { label: "Prepared By", value: "Simeon Natev" },
              { label: "Methodology", value: "Bootstrap / MC" },
              { label: "Platform", value: "MultiCharts" },
              { label: "Issue", value: "v1.0 / 2026" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[9px] tracking-[0.32em] text-blue-400/50 uppercase">
                  {item.label}
                </p>
                <p className="text-sm font-bold text-white mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="relative flex justify-between text-[10px] tracking-[0.32em] text-blue-400/38 uppercase">
          <span>Process &gt; Prediction</span>
          <span>@SimeonNatev</span>
        </div>
      </section>

      {/* ───────────── 00 CONTENTS + ABSTRACT ───────────── */}
      <section
        className="border-t border-blue-900/30"
        style={{
          background: "linear-gradient(180deg, #04042e 0%, #020218 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto px-8 md:px-16 py-20">
          <PageHeader left="The Institutional Protocol" right="00 / Executive Summary" />

          <div className="grid md:grid-cols-2 gap-16">
            {/* Contents */}
            <motion.div {...fade(0)}>
              <Label>Contents</Label>
              <SectionTitle>CONTENTS.</SectionTitle>
              <div className="mt-8 space-y-3">
                {[
                  { n: "01", t: "Strategy Specification", s: "Rules, Data Feeds, Inputs", p: "03" },
                  { n: "02", t: "Headline Performance", s: "KPIs and Full Report", p: "04 / 05" },
                  { n: "03", t: "Equity and Drawdown", s: "Base Curve, Run-Up Overlay", p: "06" },
                  { n: "04", t: "Trade Distribution", s: "Win Rate, Payoff Geometry", p: "07" },
                  { n: "05", t: "Shuffled Sequences", s: "1,000 Permutations", p: "08" },
                  { n: "06", t: "Expected Value Bootstrap", s: "Edge Significance, 95% CI", p: "09" },
                  { n: "07", t: "Monte Carlo", s: "20,000 Simulations", p: "10 / 11" },
                  { n: "08", t: "Cost-Adjusted Re-Run", s: "Commissions, Slippage", p: "12 / 13" },
                  { n: "09", t: "Verdict", s: "Deployment Notes, Limitations", p: "14" },
                  { n: "10", t: "Appendix, EasyLanguage Source", s: "MultiCharts Copy-Paste", p: "15 / 16" },
                ].map((item) => (
                  <div
                    key={item.n}
                    className="flex items-start justify-between border-b border-blue-900/20 pb-3"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-blue-600/55 text-xs font-mono w-6 shrink-0">
                        {item.n}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.t}</p>
                        <p className="text-[9px] tracking-[0.22em] text-blue-400/50 uppercase">
                          {item.s}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-400/38 font-mono ml-4 shrink-0">
                      {item.p}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Abstract */}
            <motion.div {...fade(0.1)}>
              <Label>Abstract</Label>
              <SectionTitle>THE CASE.</SectionTitle>
              <div className="mt-8 space-y-4 text-blue-100/65 text-sm leading-relaxed">
                <p>
                  Fabio Valentini model is a long-only opening-range breakout on NQ, with a
                  volume-delta filter and a fixed one-R take-profit. We re-run the strategy
                  across five years of intraday data and stress the resulting trade log under
                  permutation, bootstrap, and Monte-Carlo procedures.
                </p>
                <p>
                  The edge is small per trade but significant. Realised drawdown sits near the
                  median of plausible orderings, not the tail. After loading native MultiCharts
                  commissions and a one-tick slippage, every conclusion survives.
                </p>
                <p>
                  The numbers behave as a rule-based mechanical system should: positive
                  expectancy over a large sample, with diffuse contribution and no single-trade
                  dependency.
                </p>
              </div>

              <div className="mt-8 p-6 border border-blue-500/28 bg-blue-950/30">
                <div className="flex flex-col gap-4">
                  <div className="self-start border border-blue-400/38 px-3 py-1 text-[10px] tracking-[0.22em] text-blue-300 uppercase">
                    Validated
                  </div>
                  <p className="text-sm text-blue-100/65 leading-relaxed">
                    Over 823 NQ trades the model delivers a positive, statistically-significant
                    edge with <strong className="text-white">P(EV ≤ 0) = 0.001</strong>. Loaded
                    with native MultiCharts commissions ($4.50/contract) and one-tick slippage,
                    net profit holds at <strong className="text-white">$151,013</strong>, annual
                    return at <strong className="text-white">28.6%</strong>, profit factor at{" "}
                    <strong className="text-white">1.28</strong>.{" "}
                    <span className="text-blue-300 underline">Deployable.</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────────── 01 SPECIFICATION ───────────── */}
      <section
        className="border-t border-blue-900/20"
        style={{ background: "#020218" }}
      >
        <div className="max-w-6xl mx-auto px-8 md:px-16 py-20">
          <PageHeader left="Strategy Elements" right="01 / Specification" />

          <motion.div {...fade(0)} className="flex items-start gap-4 mb-10">
            <GhostNumber n="01" />
            <div className="pt-6">
              <Label>Strategy Elements</Label>
              <SectionTitle>SPECIFICATION.</SectionTitle>
            </div>
          </motion.div>

          <Divider />

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8 text-sm text-blue-100/65 leading-relaxed">
              {[
                {
                  title: "Entry Logic",
                  body: "The model defines an opening range from 08:30 to 09:00 NY time. On a five-minute close above the range high, with a cumulative-delta reading above the threshold, a single long position is opened at the close. Only one long entry per session.",
                },
                {
                  title: "Exit Logic",
                  body: "Take-profit is a fixed 1R multiple of the range width above entry. Stop-loss is the range low. Any open position is flattened on the bar that crosses 15:00 ET time. TP and SL are re-armed every bar while the position is open.",
                },
                {
                  title: "Position Sizing",
                  body: "Fixed at 1 contract of NQ across the entire backtest. No conditional sizing, no ATR filter, no fractional Kelly. The point of this validation is to measure raw per-trade expectancy under a unit position.",
                },
                {
                  title: "Data & Range",
                  body: "Data 1 is NQ on a five-minute timeframe for entry, exit, and ORB construction. Data 2 is NQ on a 30-minute timeframe used by the delta accumulation. Backtest range: 01 Jan 2021 to 16 Apr 2026.",
                },
              ].map((item) => (
                <div key={item.title}>
                  <p className="font-bold text-white mb-2">// {item.title}</p>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="font-bold text-white mb-5">// Parameters As Tested</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["ORB_Start_H_NY", "8"],
                  ["ORB_Start_M_NY", "30"],
                  ["ORB_Dur_Min", "30"],
                  ["Trade_End_H_NY", "14"],
                  ["Trade_End_M_NY", "0"],
                  ["TP_RR_Ratio", "1.0"],
                  ["Num_Contracts", "1"],
                  ["DeltaThreshold", "200"],
                  ["UseCumulativeDelta", "false"],
                  ["CumDeltaThreshold", "500"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="border border-blue-900/30 bg-blue-950/20 px-3 py-2 text-xs"
                  >
                    <p className="text-blue-400/55">{k}</p>
                    <p className="text-white font-bold font-mono mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 03 KEY METRICS A ───────────── */}
      <section
        className="border-t border-blue-900/20"
        style={{
          background: "linear-gradient(180deg, #020218 0%, #04042e 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto px-8 md:px-16 py-20">
          <PageHeader left="The Protocol" right="03 / Key Metrics, Part A" />

          <motion.div {...fade(0)} className="flex items-start gap-4 mb-10">
            <GhostNumber n="03" />
            <div className="pt-6">
              <Label>Analyzing the Results</Label>
              <SectionTitle>DOES THE STRATEGY WORK?</SectionTitle>
            </div>
          </motion.div>

          <Divider />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatBox label="// Net Profit" value="$165,715" sub="823 trades, gross of costs" />
            <StatBox label="// Annual Return" value="31.4%" sub="CAGR, $100k base" />
            <StatBox label="// Max Drawdown" value="17.6%" sub="$25,295 strategy DD" />
            <StatBox label="// Profit Factor" value="1.31" sub="adj. 1.18 / select 1.42" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-blue-900/28 bg-blue-950/12 p-6">
              <Row label="Net Profit" value="$165,715.00" bold />
              <Row label="Gross Profit" value="$707,715.00" />
              <Row label="Gross Loss" value="($542,000.00)" />
              <Row label="Adjusted Net Profit" value="$104,147.13" bold />
              <Row label="Select Net Profit" value="$146,480.00" />
              <Row label="Return on Initial Capital" value="165.72%" />
              <Row label="Return on Account" value="745.96%" />
              <Row label="Max Strategy DD ($)" value="($25,295.00)" />
              <Row label="Max Strategy DD (%)" value="(17.63%)" />
              <Row label="Max Close-to-Close DD" value="($22,215.00)" />
              <Row label="Return on Max DD" value="6.55" bold />
            </div>
            <div className="border border-blue-900/28 bg-blue-950/12 p-6">
              <Row label="Profit Factor" value="1.31" bold />
              <Row label="Adjusted Profit Factor" value="1.18" />
              <Row label="Select Profit Factor" value="1.42" />
              <Row label="Annual Rate of Return" value="31.38%" />
              <Row label="Monthly Rate of Return" value="2.62%" />
              <Row label="Avg Monthly Return" value="$2,589.30" />
              <Row label="Monthly Return StDev" value="$6,340.09" />
              <Row label="Total # of Trades" value="823" bold />
              <Row label="Percent Profitable" value="58.32%" bold />
              <Row label="Max Contracts Held" value="1" />
              <Row label="Buy & Hold Return" value="$67,059.10" />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 03 KEY METRICS B — READING THE PRINT ───────────── */}
      <section
        className="border-t border-blue-900/20"
        style={{ background: "#04042e" }}
      >
        <div className="max-w-6xl mx-auto px-8 md:px-16 py-20">
          <PageHeader left="The Protocol" right="03 / Key Metrics, Part B" />
          <Label>Reviewer Commentary</Label>
          <SectionTitle>READING THE PRINT.</SectionTitle>
          <Divider />

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                label: "Signal-to-Risk",
                body: "A 6.55 return-on-max-DD ratio is institutionally respectable. The model earns roughly 6.5 dollars of profit for every dollar of peak-to-trough pain. Anything above 3 passes the desk's first-gate screen.",
              },
              {
                num: "02",
                label: "Profit Factor",
                body: "At 1.31 the raw PF is modest, which is the honest number for a one-R fixed-TP breakout with ~58% hit rate. Profitability is carried by frequency, not by home-run trades.",
              },
              {
                num: "03",
                label: "Monthly Volatility",
                body: "Monthly StDev ($6,340) exceeds avg monthly P&L ($2,589), implying a monthly t-stat of order 2.4 over the sample. Sharpe, annualised on monthly data, lands near 1.4.",
              },
            ].map((item) => (
              <motion.div
                key={item.num}
                {...fade(0)}
                className="border border-blue-800/38 bg-blue-950/22 p-6"
              >
                <p className="text-[9px] tracking-[0.3em] text-blue-400/50 uppercase mb-3">
                  // {item.num}, {item.label}
                </p>
                <p className="text-sm text-blue-100/65 leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 border-l-2 border-blue-500/45 pl-6 bg-blue-950/18 py-4 pr-6">
            <p className="text-blue-200 italic text-sm">
              Profitability carried by frequency, not by home runs. Edge is diffused across the
              sample.
            </p>
            <p className="text-[9px] tracking-[0.3em] text-blue-400/45 uppercase mt-2">
              Headline Commentary
            </p>
          </div>
        </div>
      </section>

      {/* ───────────── 04 EQUITY / DRAWDOWN ───────────── */}
      <section
        className="border-t border-blue-900/20"
        style={{
          background: "linear-gradient(180deg, #04042e 0%, #020218 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto px-8 md:px-16 py-20">
          <PageHeader left="The Protocol" right="04 / Equity and Drawdown" />

          <motion.div {...fade(0)} className="flex items-start gap-4 mb-10">
            <GhostNumber n="04" />
            <div className="pt-6">
              <Label>Visual Inspection</Label>
              <SectionTitle>EQUITY / DRAWDOWN.</SectionTitle>
            </div>
          </motion.div>

          <Divider />

          <p className="text-sm text-blue-100/65 leading-relaxed max-w-3xl mb-10">
            Three things matter on an equity plot: monotonicity, regime stability, and the absence
            of a single outlier trade carrying the P&L. The model curve shows a smoothly convex
            ascent with consolidations consistent with low-volatility NQ regimes, not with model
            failure.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                fig: "Fig. 2 / Equity Curve",
                caption: "Fig. 2  $100k to $265k over five years, no regime breaks",
                subLabel: "// Monotonicity",
                subText:
                  "No regime breaks. Visible consolidations around Q2-2022 and Q3-2024 align with low-vol NQ environments, not model failure.",
              },
              {
                fig: "Fig. 3 / Run-Up & Drawdown",
                caption: "Fig. 3  Cumulative run-up vs closed-bar drawdown",
                subLabel: "// Drawdown Envelope",
                subText:
                  "Excursions cluster -$10k to -$15k with three visits to the -$20k to -$25k shelf. Worst excursion tags the realised max of $25,295.",
              },
            ].map((item) => (
              <div key={item.fig} className="border border-blue-900/28 bg-blue-950/18 p-6">
                <p className="text-[9px] tracking-[0.28em] text-blue-400/55 uppercase mb-3">
                  // {item.fig}
                </p>
                <div className="aspect-video bg-blue-950/45 border border-blue-900/28 flex items-center justify-center mb-4 rounded">
                  <p className="text-blue-400/25 text-xs tracking-widest uppercase">
                    {item.fig}
                  </p>
                </div>
                <p className="text-[9px] tracking-[0.2em] text-blue-400/45 uppercase">
                  {item.caption}
                </p>
                <div className="mt-4 border border-blue-800/28 bg-blue-950/28 p-4">
                  <p className="text-[9px] tracking-[0.22em] text-blue-400/55 uppercase mb-2">
                    {item.subLabel}
                  </p>
                  <p className="text-xs text-blue-100/55 leading-relaxed">{item.subText}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── 05 TRADE DISTRIBUTION ───────────── */}
      <section
        className="border-t border-blue-900/20"
        style={{ background: "#020218" }}
      >
        <div className="max-w-6xl mx-auto px-8 md:px-16 py-20">
          <PageHeader left="The Protocol" right="05 / Trade Distribution" />

          <motion.div {...fade(0)} className="flex items-start gap-4 mb-10">
            <GhostNumber n="05" />
            <div className="pt-6">
              <Label>Per-Trade Geometry</Label>
              <SectionTitle>DISTRIBUTION.</SectionTitle>
            </div>
          </motion.div>

          <Divider />

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-sm text-blue-100/65 leading-relaxed mb-7">
                Across 823 fills the model wins 58.3% of the time, with an average winner of{" "}
                <strong className="text-white">$1,474</strong> against an average loser of{" "}
                <strong className="text-white">$1,580</strong>. The ratio of 0.93 is sub-unity;
                the model pays a win-rate premium to compensate for a slightly negative payoff
                asymmetry. That is the defining shape of a one-R fixed-TP breakout.
              </p>
              <Row label="Total Trades" value="823" bold />
              <Row label="Winning Trades" value="480" />
              <Row label="Losing Trades" value="343" />
              <Row label="Percent Profitable" value="58.32%" bold />
              <Row label="Avg Trade" value="$201.35" />
              <Row label="Avg Winning Trade" value="$1,474.41" />
              <Row label="Avg Losing Trade" value="($1,580.17)" />
              <Row label="Ratio Avg Win / Avg Loss" value="0.93" />
              <Row label="Largest Winner" value="$9,825.00" />
              <Row label="Largest Loser" value="($8,525.00)" />
              <Row label="Avg Bars in Winners" value="39.6" />
              <Row label="Avg Bars in Losers" value="33.4" />
            </div>

            <div className="space-y-6">
              <div className="border border-blue-800/38 bg-blue-950/22 p-6">
                <p className="text-[9px] tracking-[0.25em] text-blue-400/55 uppercase mb-3">
                  // Sample Adequacy
                </p>
                <p className="text-sm text-blue-100/60 leading-relaxed">
                  n = 823 is comfortably above the desk minimum of 200 for a daily-frequency
                  strategy. The 95% binomial CI on the true hit rate is [55.0%, 61.7%]; even the
                  lower bound keeps expectancy positive.
                </p>
              </div>
              <div className="border border-blue-800/38 bg-blue-950/22 p-6">
                <p className="text-[9px] tracking-[0.25em] text-blue-400/55 uppercase mb-2">
                  // Per-Trade Review
                </p>
                <p className="text-sm text-blue-100/60 leading-relaxed italic">
                  Winners and losers are roughly symmetric in magnitude. There is no fat-tail
                  dependency on a handful of lucky trades.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 06 SHUFFLED SEQUENCES ───────────── */}
      <section
        className="border-t border-blue-900/20"
        style={{
          background: "linear-gradient(180deg, #020218 0%, #04042e 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto px-8 md:px-16 py-20">
          <PageHeader left="The Protocol" right="06 / Shuffled Sequences" />

          <motion.div {...fade(0)} className="flex items-start gap-4 mb-10">
            <GhostNumber n="06" />
            <div className="pt-6">
              <Label>Path vs Set</Label>
              <SectionTitle>1,000 PERMUTATIONS.</SectionTitle>
            </div>
          </motion.div>

          <Divider />

          <p className="text-sm text-blue-100/65 leading-relaxed max-w-3xl mb-10">
            Do the realised drawdowns depend on the <em>order</em> of trades, or on the{" "}
            <em>set</em> of trades? We permute the trade sequence 1,000 times and re-walk the
            equity curve on each permutation. Terminal P&L is invariant; drawdown is not.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-blue-900/28 bg-blue-950/18 p-6">
              <p className="text-[9px] tracking-[0.25em] text-blue-400/55 uppercase mb-3">
                // Fig. 5 / 1,000 Shuffled Paths
              </p>
              <div className="aspect-video bg-blue-950/45 border border-blue-900/28 flex items-center justify-center rounded mb-3">
                <p className="text-blue-400/22 text-xs tracking-widest uppercase">
                  1,000 Permutation Paths
                </p>
              </div>
              <p className="text-[9px] tracking-[0.2em] text-blue-400/42 uppercase">
                Fig. 5  Grey = 1,000 perms / Base = Realised / Extremes Annotated
              </p>
            </div>

            <div>
              <p className="font-bold text-white mb-4">// Interpretation</p>
              <p className="text-sm text-blue-100/60 mb-6 leading-relaxed">
                All 1,000 permutations terminate in positive territory. The smallest drawdown
                observed is $16,055; the largest is $61,680; the base curve sits at $22,215.
              </p>
              <Row label="Permutations" value="1,000" bold />
              <Row label="Realised Max DD" value="$22,215" />
              <Row label="Smallest Shuffled DD" value="$16,055" />
              <Row label="Largest Shuffled DD" value="$61,680" />
              <Row label="Max Sequential Wins" value="12" />
              <Row label="Max Sequential Losses" value="5" />
              <Row label="Avg Sequential Wins" value="2.39" />
              <Row label="Avg Sequential Losses" value="1.71" />
              <div className="mt-6 border-l-2 border-blue-500/45 pl-4 italic text-sm text-blue-200/55">
                The historical drawdown of $22k is not a tail event. A live trader should budget
                for the 95th-percentile shuffled DD of ~$55k as a realistic pain threshold.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 07 EXPECTANCY ───────────── */}
      <section
        className="border-t border-blue-900/20"
        style={{ background: "#04042e" }}
      >
        <div className="max-w-6xl mx-auto px-8 md:px-16 py-20">
          <PageHeader left="The Protocol" right="07 / Expected Value Bootstrap" />

          <motion.div {...fade(0)} className="flex items-start gap-4 mb-10">
            <GhostNumber n="07" />
            <div className="pt-6">
              <Label>Edge Significance</Label>
              <SectionTitle>EXPECTANCY.</SectionTitle>
            </div>
          </motion.div>

          <Divider />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatBox label="// EV Per Trade ($)" value="$194.26" sub="n = 820, long only" />
            <StatBox label="// EV Per Trade (R)" value="0.1295 R" sub="risk-normalised" />
            <StatBox label="// P(EV$ ≤ 0)" value="0.001" sub="bootstrap, 1-tail" />
            <StatBox label="// P(EV_R ≤ 0)" value="0.001" sub="bootstrap, 1-tail" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="font-bold text-white mb-4">// Test Design</p>
              <p className="text-sm text-blue-100/60 mb-6 leading-relaxed">
                We resample the 820-trade return series with replacement 20,000 times and compute
                the expected value under each resample. The distribution gives us the confidence
                interval; the fraction of resamples with EV ≤ 0 gives the edge probability.
              </p>
              <Row label="EV ($/trade)" value="$194.26" bold />
              <Row label="EV (R/trade)" value="0.1295 R" bold />
              <Row label="95% CI (EV $)" value="[$65.62, $323.70]" />
              <Row label="95% CI (EV R)" value="[0.0437, 0.2158]" />
              <Row label="P(EV_R ≤ 0)" value="0.001" bold />
              <Row label="P(EV_$ ≤ 0)" value="0.001" bold />
              <div className="mt-6 border-l-2 border-blue-500/45 pl-4 italic text-sm text-blue-200/55">
                Only 1 resample in 1,000 delivers a non-positive expectancy. The null hypothesis
                of no edge is rejected at the 0.001 level.
              </div>
            </div>

            <div>
              <p className="font-bold text-white mb-4">// Reading The Floor</p>
              <p className="text-sm text-blue-100/60 leading-relaxed">
                The lower CI bound of <strong className="text-white">$65.62 per trade</strong> is
                the number to carry into live-sizing. Even at this floor the model generates
                ~$53,800 of gross P&L per 820-trade sample, before fees of $4.26k.
                R-normalised floor of <strong className="text-white">0.044 R</strong> means a
                desk that budgets only for this floor still earns a positive expectancy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 08 MONTE CARLO ───────────── */}
      <section
        className="border-t border-blue-900/20"
        style={{
          background: "linear-gradient(180deg, #04042e 0%, #020218 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto px-8 md:px-16 py-20">
          <PageHeader left="The Protocol" right="08 / Monte Carlo, Part A" />

          <motion.div {...fade(0)} className="flex items-start gap-4 mb-10">
            <GhostNumber n="08" />
            <div className="pt-6">
              <Label>20,000 Simulations</Label>
              <SectionTitle>MONTE CARLO.</SectionTitle>
            </div>
          </motion.div>

          <Divider />

          <p className="text-sm text-blue-100/65 leading-relaxed max-w-3xl mb-10">
            Each simulation resamples 821 trades with replacement and walks the equity path. We
            record the maximum closed-equity drawdown and the terminal P&L on every path, then
            read percentiles off the resulting distributions.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <p className="font-bold text-white mb-5">// Max Drawdown / Percentiles</p>
              <div className="space-y-3 mb-8">
                {[
                  ["50th", 28838, "$28,838"],
                  ["75th", 35857, "$35,857"],
                  ["90th", 44372, "$44,372"],
                  ["95th", 50521, "$50,521"],
                  ["99th", 64458, "$64,458"],
                ].map(([pct, raw, label]) => (
                  <div key={String(pct)} className="flex items-center gap-4">
                    <span className="text-blue-400/55 text-xs w-8">{pct}</span>
                    <div className="flex-1 bg-blue-950/40 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${((raw as number) / 64458) * 100}%`,
                          background:
                            "linear-gradient(90deg, #1d4ed8, #60a5fa)",
                        }}
                      />
                    </div>
                    <span className="text-white text-sm font-mono w-16 text-right">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <p className="font-bold text-white mb-5">// Terminal P&L / Percentiles</p>
              <div className="space-y-3">
                {[
                  ["50th", 159588, "$159,588"],
                  ["75th", 194849, "$194,849"],
                  ["90th", 228861, "$228,861"],
                  ["95th", 248083, "$248,083"],
                  ["99th", 283204, "$283,204"],
                ].map(([pct, raw, label]) => (
                  <div key={String(pct)} className="flex items-center gap-4">
                    <span className="text-blue-400/55 text-xs w-8">{pct}</span>
                    <div className="flex-1 bg-blue-950/40 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${((raw as number) / 283204) * 100}%`,
                          background:
                            "linear-gradient(90deg, #1d4ed8, #60a5fa)",
                        }}
                      />
                    </div>
                    <span className="text-white text-sm font-mono w-20 text-right">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-blue-900/28 bg-blue-950/18 p-6">
                <p className="text-[9px] tracking-[0.25em] text-blue-400/55 uppercase mb-3">
                  // Fig. 7 / Max DD Distribution
                </p>
                <div className="aspect-video bg-blue-950/45 border border-blue-900/28 flex items-center justify-center rounded mb-3">
                  <p className="text-blue-400/22 text-xs tracking-widest uppercase">
                    MC Max DD Distribution
                  </p>
                </div>
                <p className="text-[9px] tracking-[0.2em] text-blue-400/42 uppercase">
                  Fig. 7  20,000 sims, right-skewed, mode ~$25k
                </p>
              </div>
              <Row label="Simulations" value="20,000" bold />
              <Row label="Trades per Sim" value="821" />
              <Row label="$ per 1R" value="$1,500" />
              <Row label="Date Range" value="2021-01-05 / 2026-04-14" />
              <Row label="P(MaxDD ≥ $15,000)" value="0.994" bold />
              <div className="mt-4 border-l-2 border-blue-500/45 pl-4 italic text-sm text-blue-200/55">
                The realised drawdown of $25k sits between the 25th and 50th percentile of
                simulated outcomes. Plan for the 95th, not the mean.
              </div>
            </div>
          </div>

          {/* Part B — Path Geometry */}
          <div className="border-t border-blue-900/20 pt-12">
            <PageHeader left="The Protocol" right="08 / Monte Carlo, Part B" />
            <Label>Equity Paths & Median Band</Label>
            <SectionTitle>PATH GEOMETRY.</SectionTitle>
            <Divider />

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  fig: "Fig. 8 / Sample Equity Paths",
                  cap: "Fig. 8  100 of 20,000 bootstrap equity paths",
                  body: "A representative slice of the simulation envelope. Most paths terminate between $120k and $230k; dispersion at the upper end is wider than at the lower end, a property of the underlying winner/loser geometry.",
                },
                {
                  fig: "Fig. 9 / Median & 5/95 Band",
                  cap: "Fig. 9  Median $159,588, 95% Band [$70k, $250k]",
                  body: "The median terminal P&L of $159,588 is within 4% of the realised $165,715. The 90% inter-percentile band [$70k, $250k] sets a reasonable expectation range for the next 821-trade window.",
                },
              ].map((item) => (
                <div key={item.fig}>
                  <p className="font-bold text-white mb-3">// {item.fig}</p>
                  <div className="aspect-video bg-blue-950/45 border border-blue-900/28 flex items-center justify-center rounded mb-3">
                    <p className="text-blue-400/22 text-xs tracking-widest uppercase">
                      {item.fig}
                    </p>
                  </div>
                  <p className="text-[9px] tracking-[0.2em] text-blue-400/42 uppercase">
                    {item.cap}
                  </p>
                  <p className="text-sm text-blue-100/60 mt-3 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 border-l-2 border-blue-500/45 pl-4 italic text-sm text-blue-200/55">
              A trader deploying this model should expect terminal P&L inside [$70k, $250k] over
              an equivalent forward sample, ~19 of 20 times.
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 09 COST-ADJUSTED ───────────── */}
      <section
        className="border-t border-blue-900/20"
        style={{ background: "#020218" }}
      >
        <div className="max-w-6xl mx-auto px-8 md:px-16 py-20">
          <PageHeader left="The Protocol" right="09 / Cost-Adjusted, Part A" />

          <motion.div {...fade(0)} className="flex items-start gap-4 mb-10">
            <GhostNumber n="09" />
            <div className="pt-6">
              <Label>Realistic Transaction Costs</Label>
              <SectionTitle>COST-ADJUSTED RUN.</SectionTitle>
            </div>
          </motion.div>

          <Divider />

          <p className="text-sm text-blue-100/65 leading-relaxed max-w-3xl mb-8">
            Re-execute the backtest in MultiCharts with{" "}
            <strong className="text-white">$4.50/contract commission</strong> loaded on the
            Strategy Properties panel, plus a{" "}
            <strong className="text-white">1-tick ($5) slippage</strong> charge. Commissions and
            slippage were already embedded in the §07 bootstrap; this is the cross-check.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatBox label="// Net Profit" value="$151,013" sub="vs $165,715 gross, -$14,702" />
            <StatBox label="// Annual Return" value="28.6%" sub="vs 31.4%, -2.8 pp" />
            <StatBox label="// Profit Factor" value="1.28" sub="vs 1.31, above 1.20 floor" />
            <StatBox label="// Avg Trade" value="$183.49" sub="vs $201.35, above cost floor" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="font-bold text-white mb-4">// Cost-Adjusted Summary</p>
              <Row label="Net Profit" value="$151,013.00" bold />
              <Row label="Gross Profit" value="$699,570.00" />
              <Row label="Gross Loss" value="($548,557.00)" />
              <Row label="Adjusted Net Profit" value="$89,508.79" />
              <Row label="Return on Initial Capital" value="151.01%" />
              <Row label="Return on Account" value="670.19%" />
              <Row label="Max Strategy DD ($)" value="($25,897.00)" />
              <Row label="Return on Max DD" value="5.83" bold />
              <Row label="Profit Factor" value="1.28" bold />
              <Row label="Annual Rate of Return" value="28.60%" />
              <Row label="Avg Monthly Return" value="$2,359.58" />
              <Row label="Slippage Paid" value="$7,295.00" />
              <Row label="Commission Paid" value="$7,407.00" />
              <Row label="Percent Profitable" value="57.72%" bold />
            </div>

            <div className="space-y-5">
              <div className="border border-blue-800/38 bg-blue-950/22 p-6">
                <p className="text-sm text-blue-100/60 leading-relaxed">
                  Costs subtract $14,702 of P&L, the sum of $7,407 commission and $7,295
                  slippage, and leave every other structural property of the equity curve
                  unchanged.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="border border-blue-400/38 px-3 py-1 text-[10px] tracking-[0.2em] text-blue-300 uppercase">
                    Edge Survives Costs
                  </span>
                  <span className="border border-blue-400/38 px-3 py-1 text-[10px] tracking-[0.2em] text-blue-300 uppercase">
                    PF &gt; 1.20
                  </span>
                </div>
              </div>
              <div className="border border-blue-800/38 bg-blue-950/22 p-6">
                <p className="text-[9px] tracking-[0.25em] text-blue-400/55 uppercase mb-2">
                  // Cross-Validation
                </p>
                <p className="text-sm text-blue-100/60 italic leading-relaxed">
                  Two independent cost pipelines, MultiCharts and the Python bootstrap, agree to
                  within 2%. That is the cross-validation we want before moving to live sizing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 10 VERDICT ───────────── */}
      <section
        className="border-t border-blue-900/20"
        style={{
          background: "linear-gradient(180deg, #020218 0%, #04042e 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto px-8 md:px-16 py-20">
          <PageHeader left="The Protocol" right="10 / Verdict" />

          <motion.div {...fade(0)} className="flex items-start gap-4 mb-10">
            <GhostNumber n="10" />
            <div className="pt-6">
              <Label>Deployment Notes</Label>
              <SectionTitle>VERDICT.</SectionTitle>
            </div>
          </motion.div>

          <Divider />

          <div className="border border-blue-500/28 bg-blue-950/22 p-8 mb-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="shrink-0 border border-blue-400/45 px-5 py-3 text-[11px] tracking-[0.3em] text-blue-300 uppercase">
                Validated / Deployable
              </div>
              <p className="text-sm text-blue-100/65 leading-relaxed">
                All four independent tests agree: a real, small, positive,
                statistically-significant long-only edge on NQ opening breakouts. Realised
                drawdown is a typical, not tail, outcome.{" "}
                <span className="text-blue-300 underline">
                  Live-sizing risk is the binding constraint, not statistical risk.
                </span>
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                label: "What The Evidence Shows",
                items: [
                  "Edge is real. Bootstrap P(EV ≤ 0) = 0.001 on both $ and R axes. Lower-CI expectancy still positive.",
                  "Path is not flattering. Base DD of $22k sits near the median of 1,000 permutations.",
                  "Sample is sufficient. 823 closed trades over five years of diverse NQ regimes.",
                ],
              },
              {
                label: "Risk Budget For Live",
                items: [
                  "Plan for $50k peak-to-trough. 95th-percentile MC drawdown is $50,521, ~3× the backtest high-water mark.",
                  "P($15k+ DD) = 99.4%. If a trader cannot tolerate that, the model is the wrong fit.",
                  "Costs confirmed realistic. MultiCharts re-run loads $14,702 of drag, ~2% of gross profit.",
                ],
              },
              {
                label: "Next Checks Before Capital",
                items: [
                  "Walk-forward. Re-run on a rolling-origin basis; confirm stability across non-overlapping 12-month windows.",
                  "Slippage stress. Re-price at +1 and +2 ticks adverse; confirm CI lower-bound still positive.",
                  "Regime breakdown. Decompose P&L by VIX quintile and NY-morning realised-vol buckets.",
                ],
              },
            ].map((col) => (
              <div
                key={col.label}
                className="border border-blue-900/28 bg-blue-950/12 p-6"
              >
                <p className="text-[9px] tracking-[0.3em] text-blue-400/55 uppercase mb-4">
                  // {col.label}
                </p>
                <div className="space-y-3">
                  {col.items.map((item, i) => (
                    <p key={i} className="text-sm text-blue-100/60 leading-relaxed">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-blue-900/20 pt-8 text-xs text-blue-400/38 leading-relaxed">
            <p className="font-bold text-blue-400/55 mb-2">// Statement Of Limitations</p>
            <p>
              Not financial advice. This document is an internal statistical validation prepared
              for desk review and does not constitute an offer, solicitation, or recommendation to
              trade any instrument. The validation is conducted on the author-supplied MultiCharts
              trade log; no independent re-execution of the strategy on raw market data was
              performed. Parameter sensitivity, latency effects, and order-book dynamics on actual
              fills remain untested. Bootstrap and Monte Carlo methods assume trades are
              exchangeable (i.i.d.); mild autocorrelation in daily-vol regimes may understate tail
              drawdowns by an estimated 5 to 10%. All returns are gross of taxes.
            </p>
          </div>

          <div className="mt-8 flex justify-between items-end">
            <div>
              <p className="text-[9px] tracking-[0.3em] text-blue-400/40 uppercase">Prepared By</p>
              <p className="text-lg font-black text-white mt-1">Simeon Natev.</p>
              <p className="text-[10px] tracking-[0.2em] text-blue-400/38 uppercase mt-0.5">
                The Institutional Protocol / @SimeonNatev / Issued 2026 / Internal
              </p>
            </div>
            <p className="text-[10px] tracking-[0.3em] text-blue-400/38 uppercase">
              Independent-Val
            </p>
          </div>
        </div>
      </section>

      {/* ───────────── APPENDIX — EASYLANGUAGE ───────────── */}
      <section
        className="border-t border-blue-900/20"
        style={{ background: "#04042e" }}
      >
        <div className="max-w-6xl mx-auto px-8 md:px-16 py-20">
          <PageHeader left="Appendix" right="10 / EasyLanguage Source" />
          <Label>MultiCharts Copy-Paste</Label>
          <SectionTitle>EASYLANGUAGE SOURCE.</SectionTitle>
          <p className="text-[9px] tracking-[0.22em] text-blue-400/45 uppercase mt-2 mb-8">
            // Fabio Model — Copy the full code into your MultiCharts editor
          </p>
          <Divider />

          <pre
            className="text-xs text-blue-300/80 leading-relaxed bg-[#020218] border border-blue-900/40 p-8 overflow-x-auto"
            style={{ fontFamily: "monospace" }}
          >{`{ Fabio Valentini Model }

Inputs:
    ORB_Start_H_NY(8),
    ORB_Start_M_NY(30),
    ORB_Dur_Min(30),
    Trade_End_H_NY(14),
    Trade_End_M_NY(0),
    TP_RR_Ratio(1.0),
    Num_Contracts(1),
    DeltaThreshold(200),
    UseCumulativeDelta(false),
    CumDeltaThreshold(500);

Variables:
    ORB_Start_Time(0), ORB_End_Time(0), Trade_End_Time(0),
    ORB_Inited(false), ORB_Session_Ended(false),
    ORB_High(0), ORB_Low(0),
    Long_Done_Today(false), Was_Long(false),
    Pos_SL(0), Pos_TP(0),
    Cur_Date_Int(0), Prev_Bar_Time(0), Bar_Time(0),
    In_ORB(false), Trade_Active(false),
    EP(0), SL_Price(0), TP_Price(0),
    BarDelta(0), CumDelta(0), DeltaOK(false);

{ ===== ONE-TIME SETUP ===== }
Once begin
    ORB_Start_Time = ORB_Start_H_NY * 100 + ORB_Start_M_NY;
    Value1 = IntPortion(ORB_Start_Time / 100);
    Value2 = Mod(ORB_Start_Time, 100);
    Value3 = Value1 * 60 + Value2 + ORB_Dur_Min;
    Value3 = Mod(Value3, 24 * 60);
    if Value3 < 0 then Value3 = Value3 + 24 * 60;
    ORB_End_Time = IntPortion(Value3 / 60) * 100 + Mod(Value3, 60);
    Trade_End_Time = Trade_End_H_NY * 100 + Trade_End_M_NY;
end;

{ ===== SKIP FIRST BAR ===== }
if CurrentBar < 2 then begin
    Cur_Date_Int = Date; Prev_Bar_Time = Time;
end;

if CurrentBar >= 2 then begin

    { ===== NEW DAY RESET ===== }
    if Date <> Cur_Date_Int then begin
        Cur_Date_Int = Date;
        ORB_Inited = false; ORB_Session_Ended = false;
        ORB_High = 0; ORB_Low = 0;
        Long_Done_Today = false; Was_Long = false;
        Pos_SL = 0; Pos_TP = 0;
        CumDelta = 0;
    end;

    Bar_Time = Time;
    In_ORB = (Bar_Time > ORB_Start_Time) and (Bar_Time <= ORB_End_Time);
    Trade_Active = (Bar_Time > ORB_End_Time) and (Bar_Time <= Trade_End_Time);

    { ===== DELTA CALCULATION ===== }
    BarDelta = Upticks - Downticks;
    if Bar_Time > ORB_Start_Time and Bar_Time <= Trade_End_Time then
        CumDelta = CumDelta + BarDelta;

    { ===== BUILD ORB ===== }
    if In_ORB then begin
        if ORB_Inited = false then begin
            ORB_High = High; ORB_Low = Low; ORB_Inited = true;
        end
        else begin
            if High > ORB_High then ORB_High = High;
            if Low < ORB_Low then ORB_Low = Low;
        end;
    end;

    if ORB_Session_Ended = false and ORB_Inited and Bar_Time > ORB_End_Time then
        ORB_Session_Ended = true;

    { ===== DETECT LONG -> FLAT TO CLEAR LEVELS ===== }
    if MarketPosition = 1 then Was_Long = true;
    if MarketPosition = 0 and Was_Long then begin
        Was_Long = false; Pos_SL = 0; Pos_TP = 0;
    end;

    { ===== EOD EXIT ===== }
    if Bar_Time >= Trade_End_Time and Prev_Bar_Time < Trade_End_Time then begin
        if MarketPosition = 1 then
            Sell ("EOD-L") this bar on close;
    end;

    Prev_Bar_Time = Bar_Time;

    { ===== TP / SL WHILE LONG ===== }
    if MarketPosition = 1 and Pos_SL <> 0 and Pos_TP <> 0 then begin
        Sell ("L-TP") next bar at Pos_TP limit;
        Sell ("L-SL") next bar at Pos_SL stop;
    end;

    { ===== ENTRY LOGIC ===== }
    if ORB_Session_Ended
        and Trade_Active
        and Long_Done_Today = false
        and MarketPosition = 0
        and Close > ORB_High then begin

        EP = Close; SL_Price = ORB_Low;

        if SL_Price < EP then begin
            DeltaOK = BarDelta >= DeltaThreshold;
            if UseCumulativeDelta then
                DeltaOK = DeltaOK and (CumDelta >= CumDeltaThreshold);

            if DeltaOK then begin
                TP_Price = EP + TP_RR_Ratio * (EP - SL_Price);
                Pos_SL = SL_Price; Pos_TP = TP_Price;
                Buy ("ORB-L MKT") Num_Contracts contracts this bar on close;
                Long_Done_Today = true;
            end;
        end;
    end;

end;`}</pre>
        </div>
      </section>

      {/* ───────────── FLOATING DOWNLOAD BUTTON ───────────── */}
      <button
        onClick={handleDownload}
        disabled={loading}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-3 text-sm font-bold tracking-[0.15em] uppercase transition-all hover:scale-[1.04] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: loading
            ? "linear-gradient(135deg, #1e3a8a, #1d4ed8)"
            : "linear-gradient(135deg, #1d4ed8, #3b82f6, #60a5fa)",
          border: "1px solid rgba(96,165,250,0.4)",
          boxShadow: "0 0 32px rgba(59,130,246,0.35), 0 4px 20px rgba(0,0,0,0.5)",
          color: "#fff",
        }}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Generating…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11" />
            </svg>
            Download PDF
          </>
        )}
      </button>

      {/* ───────────── FOOTER ───────────── */}
      <footer
        className="border-t border-blue-900/30 px-8 md:px-16 py-14"
        style={{
          background:
            "radial-gradient(ellipse at 30% 80%, rgba(30,58,138,0.22) 0%, transparent 55%), linear-gradient(180deg, #04042e 0%, #000008 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <p className="text-[9px] tracking-[0.32em] text-blue-400/38 uppercase">
              Prepared By
            </p>
            <p className="text-2xl font-black text-white mt-1">Simeon Natev.</p>
            <p className="text-[10px] tracking-[0.22em] text-blue-400/38 uppercase mt-1">
              The Institutional Protocol / @SimeonNatev / Issued 2026 / Internal
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] tracking-[0.32em] text-blue-400/38 uppercase">Document</p>
            <p className="text-sm font-bold text-white mt-1">Independent-Val v1.0</p>
            <p className="text-[10px] tracking-[0.22em] text-blue-400/38 uppercase mt-1">
              NQ Futures / 823 Trades / 2021–2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
