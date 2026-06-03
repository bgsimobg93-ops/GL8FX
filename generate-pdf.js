const puppeteer = require("puppeteer");
const fs = require("fs");

/* ── helpers ── */
const row = (l, v, bold = false) =>
  `<tr class="${bold ? "bold" : ""}"><td>${l}</td><td>${v}</td></tr>`;

const statBox = (label, value, sub) => `
  <div class="stat-box">
    <div class="stat-label">${label}</div>
    <div class="stat-value">${value}</div>
    ${sub ? `<div class="stat-sub">${sub}</div>` : ""}
  </div>`;

const pbar = (pct, raw, max, label) => `
  <div class="pbar-row">
    <span class="pbar-pct">${pct}</span>
    <div class="pbar-track"><div class="pbar-fill" style="width:${Math.round((raw/max)*100)}%"></div></div>
    <span class="pbar-val">${label}</span>
  </div>`;

const contentsRow = (n, t, s, p) => `
  <div class="c-row">
    <div class="c-left"><span class="c-num">${n}</span><div><div class="c-title">${t}</div><div class="c-sub">${s}</div></div></div>
    <span class="c-page">${p}</span>
  </div>`;

const paramBox = (k, v) => `<div class="param-box"><div class="param-key">${k}</div><div class="param-val">${v}</div></div>`;

const cardComment = (num, label, body) => `
  <div class="comment-card">
    <div class="cc-label">// ${num}, ${label}</div>
    <div class="cc-body">${body}</div>
  </div>`;

const verdictCol = (title, items) => `
  <div class="v-col">
    <div class="v-col-title">// ${title}</div>
    ${items.map(i => `<p class="v-item">${i}</p>`).join("")}
  </div>`;

/* ── HTML ── */
const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #000;
  color: #fff;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.55;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── PAGE SHELL ── */
.page { width: 210mm; background: #000010; }

/* ── SECTION WRAPPERS ── */
.s-cover   { background: #000018; padding: 36px 48px; min-height: 297mm; display: flex; flex-direction: column; justify-content: space-between; border-bottom: 1px solid #1e3a8a; }
.s-dark    { background: #000014; padding: 36px 48px; border-bottom: 1px solid #1a2f6e; }
.s-mid     { background: #04042e; padding: 36px 48px; border-bottom: 1px solid #1a2f6e; }
.s-deep    { background: #020220; padding: 36px 48px; border-bottom: 1px solid #1a2f6e; }

/* ── GRID PATTERN (cover) ── */
.grid-bg {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(30,58,138,0.25) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30,58,138,0.25) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* ── TYPOGRAPHY ── */
.label {
  font-size: 7.5pt;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: #3b82f6;
  margin-bottom: 6px;
  font-weight: 600;
}
.section-title {
  font-size: 30pt;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: #fff;
  line-height: 1.05;
}
.page-hdr {
  display: flex;
  justify-content: space-between;
  font-size: 7pt;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #1e3a8a;
  margin-bottom: 28px;
}
.divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, #2563eb 0%, rgba(37,99,235,0.15) 60%, transparent 100%);
  margin: 18px 0;
}
.ghost {
  font-size: 90pt;
  font-weight: 900;
  color: rgba(30,58,138,0.15);
  line-height: 1;
  margin-right: 14px;
  flex-shrink: 0;
  letter-spacing: -0.04em;
}
.section-head { display: flex; align-items: flex-start; margin-bottom: 20px; }
.section-head-text { padding-top: 8px; }

.muted { color: #93b4e4; font-size: 10.5pt; line-height: 1.65; }
.blue  { color: #60a5fa; }
.italic-quote {
  border-left: 2px solid #2563eb;
  padding-left: 14px;
  font-style: italic;
  font-size: 10pt;
  color: #6b94d4;
  margin-top: 14px;
  line-height: 1.6;
}
.quote-label { font-size: 7pt; letter-spacing: 0.28em; text-transform: uppercase; color: #1e3a8a; margin-top: 5px; }

/* ── COVER SPECIFIC ── */
.cover-top, .cover-bot {
  font-size: 7.5pt; letter-spacing: 0.3em; text-transform: uppercase; color: #1d4ed8;
  display: flex; justify-content: space-between;
}
.cover-label { font-size: 8pt; letter-spacing: 0.45em; text-transform: uppercase; color: #3b82f6; margin-bottom: 14px; }
.cover-title { font-size: 52pt; font-weight: 900; line-height: 1; letter-spacing: -0.02em; color: #fff; margin-bottom: 14px; }
.cover-subtitle { font-size: 11pt; color: #5b7fbe; font-style: italic; max-width: 440px; margin-bottom: 26px; line-height: 1.6; }
.cover-rule { width: 100%; height: 1px; background: linear-gradient(90deg, #2563eb, rgba(37,99,235,0.1), transparent); margin-bottom: 24px; }
.cover-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px 24px; }
.cover-meta-item .cm-label { font-size: 7.5pt; letter-spacing: 0.3em; text-transform: uppercase; color: #1d4ed8; }
.cover-meta-item .cm-value { font-size: 11pt; font-weight: 700; color: #fff; margin-top: 3px; }

/* ── LAYOUT ── */
.two-col  { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
.three-col{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
.four-col { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }

/* ── CARDS ── */
.card {
  border: 1px solid rgba(30,58,138,0.5);
  background: rgba(4,4,46,0.7);
  padding: 16px;
}
.card-sm {
  border: 1px solid rgba(30,58,138,0.35);
  background: rgba(2,2,24,0.5);
  padding: 14px;
}
.validated-box {
  border: 1px solid rgba(37,99,235,0.4);
  background: rgba(4,4,46,0.6);
  padding: 18px;
  margin-top: 18px;
}
.validated-tag {
  display: inline-block;
  border: 1px solid rgba(96,165,250,0.45);
  padding: 5px 13px;
  font-size: 7.5pt;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #93c5fd;
  margin-bottom: 10px;
}
.badge {
  display: inline-block;
  border: 1px solid rgba(96,165,250,0.38);
  padding: 3px 10px;
  font-size: 7.5pt;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #93c5fd;
  margin-right: 6px;
  margin-top: 10px;
}

/* ── STAT BOXES ── */
.stat-box {
  border: 1px solid rgba(30,58,138,0.5);
  background: rgba(4,4,46,0.75);
  padding: 14px;
}
.stat-label { font-size: 7.5pt; letter-spacing: 0.28em; text-transform: uppercase; color: #3b82f6; }
.stat-value { font-size: 22pt; font-weight: 900; color: #fff; margin: 4px 0 2px; }
.stat-sub   { font-size: 8pt; color: #1e4080; }

/* ── TABLES ── */
table { width: 100%; border-collapse: collapse; }
tr { border-bottom: 1px solid rgba(30,58,138,0.2); }
td { padding: 5px 0; font-size: 10.5pt; color: #7da8d8; }
td:last-child { text-align: right; font-family: 'Courier New', monospace; font-size: 10pt; }
tr.bold td { font-weight: 700; color: #fff; }

/* ── CONTENTS ── */
.c-row  { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(30,58,138,0.2); padding: 7px 0; }
.c-left { display: flex; gap: 10px; align-items: flex-start; }
.c-num  { font-size: 9pt; font-family: monospace; color: rgba(37,99,235,0.5); width: 18px; flex-shrink: 0; padding-top: 1px; }
.c-title{ font-size: 10.5pt; font-weight: 600; color: #fff; }
.c-sub  { font-size: 7.5pt; letter-spacing: 0.18em; text-transform: uppercase; color: #1e3a8a; margin-top: 1px; }
.c-page { font-size: 9pt; font-family: monospace; color: #1e3a8a; flex-shrink: 0; margin-left: 8px; padding-top: 1px; }

/* ── PARAMS ── */
.param-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.param-box  { border: 1px solid rgba(30,58,138,0.32); background: rgba(2,2,24,0.45); padding: 8px 11px; }
.param-key  { font-size: 7.5pt; color: rgba(37,99,235,0.55); }
.param-val  { font-size: 10.5pt; font-weight: 700; font-family: monospace; color: #fff; margin-top: 2px; }

/* ── PROGRESS BARS ── */
.pbar-row   { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.pbar-pct   { font-size: 9.5pt; color: #1e4080; width: 30px; }
.pbar-track { flex: 1; background: rgba(4,4,46,0.5); border-radius: 3px; height: 5px; }
.pbar-fill  { height: 5px; border-radius: 3px; background: linear-gradient(90deg, #1d4ed8, #60a5fa); }
.pbar-val   { font-size: 9.5pt; font-family: monospace; color: #fff; text-align: right; min-width: 60px; }

/* ── COMMENT CARDS ── */
.comment-card { border: 1px solid rgba(30,58,138,0.4); background: rgba(2,2,24,0.45); padding: 14px; }
.cc-label { font-size: 7.5pt; letter-spacing: 0.27em; text-transform: uppercase; color: rgba(59,130,246,0.5); margin-bottom: 8px; }
.cc-body  { font-size: 10.5pt; color: #7da8d8; line-height: 1.6; }

/* ── VERDICT ── */
.verdict-main { border: 1px solid rgba(37,99,235,0.38); background: rgba(4,4,46,0.65); padding: 18px 22px; display: flex; align-items: flex-start; gap: 18px; margin-bottom: 20px; }
.verdict-tag  { border: 1px solid rgba(96,165,250,0.45); padding: 7px 14px; font-size: 8pt; letter-spacing: 0.28em; text-transform: uppercase; color: #93c5fd; white-space: nowrap; flex-shrink: 0; }
.verdict-body { font-size: 10.5pt; color: #7da8d8; line-height: 1.6; }
.v-col  { border: 1px solid rgba(30,58,138,0.32); background: rgba(2,2,24,0.45); padding: 14px; }
.v-col-title { font-size: 7.5pt; letter-spacing: 0.28em; text-transform: uppercase; color: #1e4080; margin-bottom: 10px; }
.v-item { font-size: 10pt; color: #7da8d8; line-height: 1.55; margin-bottom: 8px; }

/* ── CHART PLACEHOLDER ── */
.chart-ph {
  background: rgba(4,4,46,0.6);
  border: 1px solid rgba(30,58,138,0.3);
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 7px;
}
.chart-ph span { font-size: 7pt; letter-spacing: 0.25em; text-transform: uppercase; color: rgba(30,58,138,0.45); }

/* ── CODE ── */
.code-block {
  font-family: 'Courier New', monospace;
  font-size: 8.5pt;
  color: #7db4e4;
  line-height: 1.65;
  background: #000014;
  border: 1px solid rgba(30,58,138,0.38);
  padding: 20px 22px;
  white-space: pre;
  overflow: hidden;
}

/* ── FOOTER ── */
.footer {
  background: #000010;
  border-top: 1px solid rgba(30,58,138,0.35);
  padding: 28px 48px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.footer-name { font-size: 16pt; font-weight: 900; color: #fff; margin: 3px 0; }
.footer-meta { font-size: 7.5pt; letter-spacing: 0.2em; text-transform: uppercase; color: #1e3a8a; }

/* ── LIMITATIONS ── */
.limitations { font-size: 8.5pt; color: #1e3a8a; line-height: 1.6; border-top: 1px solid rgba(30,58,138,0.2); padding-top: 14px; margin-top: 20px; }
.limitations strong { color: #2563eb; }

@media print { @page { size: A4; margin: 0; } }
</style>
</head>
<body>
<div class="page">

<!-- ══ COVER ══ -->
<div class="s-cover" style="position:relative;">
  <div class="grid-bg"></div>
  <div style="position:relative;">
    <div class="cover-top"><span>Independent Model Validation</span><span>Confidential · Internal</span></div>
  </div>

  <div style="position:relative; padding: 32px 0;">
    <div class="cover-label">// Independent Model Validation</div>
    <div class="cover-title">FABERVAALE<br>OPENING RANGE<br>BREAKOUT</div>
    <div class="cover-subtitle">An independent statistical validation of Fabio Valentini's long-only ORB stop-entry strategy, executed on 5 years of intraday NQ data.</div>
    <div class="cover-rule"></div>
    <div class="cover-meta">
      ${[["Instrument","NQ Futures"],["Sample","823 trades"],["Period","2021 / 2026"],["Simulations","20,000"],
         ["Prepared By","Simeon Natev"],["Methodology","Bootstrap / MC"],["Platform","MultiCharts"],["Issue","v1.0 / 2026"]]
        .map(([l,v])=>`<div class="cover-meta-item"><div class="cm-label">${l}</div><div class="cm-value">${v}</div></div>`).join("")}
    </div>
  </div>

  <div style="position:relative;">
    <div class="cover-bot"><span>Process &gt; Prediction</span><span>@SimeonNatev</span></div>
  </div>
</div>

<!-- ══ CONTENTS + ABSTRACT ══ -->
<div class="s-mid">
  <div class="page-hdr"><span>The Institutional Protocol</span><span>00 / Executive Summary</span></div>
  <div class="two-col">
    <div>
      <div class="label">// Contents</div>
      <div class="section-title" style="font-size:24pt;">CONTENTS.</div>
      <div style="margin-top:16px;">
        ${contentsRow("01","Strategy Specification","Rules, Data Feeds, Inputs","03")}
        ${contentsRow("02","Headline Performance","KPIs and Full Report","04 / 05")}
        ${contentsRow("03","Equity and Drawdown","Base Curve, Run-Up Overlay","06")}
        ${contentsRow("04","Trade Distribution","Win Rate, Payoff Geometry","07")}
        ${contentsRow("05","Shuffled Sequences","1,000 Permutations","08")}
        ${contentsRow("06","Expected Value Bootstrap","Edge Significance, 95% CI","09")}
        ${contentsRow("07","Monte Carlo","20,000 Simulations","10 / 11")}
        ${contentsRow("08","Cost-Adjusted Re-Run","Commissions, Slippage","12 / 13")}
        ${contentsRow("09","Verdict","Deployment Notes, Limitations","14")}
        ${contentsRow("10","Appendix, EasyLanguage Source","MultiCharts Copy-Paste","15 / 16")}
      </div>
    </div>
    <div>
      <div class="label">// Abstract</div>
      <div class="section-title" style="font-size:24pt;">THE CASE.</div>
      <div class="muted" style="margin-top:16px;">
        <p style="margin-bottom:10px;">Fabio Valentini model is a long-only opening-range breakout on NQ, with a volume-delta filter and a fixed one-R take-profit. We re-run the strategy across five years of intraday data and stress the resulting trade log under permutation, bootstrap, and Monte-Carlo procedures.</p>
        <p style="margin-bottom:10px;">The edge is small per trade but significant. Realised drawdown sits near the median of plausible orderings, not the tail. After loading native MultiCharts commissions and a one-tick slippage, every conclusion survives.</p>
        <p>The numbers behave as a rule-based mechanical system should: positive expectancy over a large sample, with diffuse contribution and no single-trade dependency.</p>
      </div>
      <div class="validated-box">
        <div class="validated-tag">Validated</div>
        <div class="muted">Over 823 NQ trades the model delivers a positive, statistically-significant edge with <strong style="color:#fff;">P(EV ≤ 0) = 0.001</strong>. Net profit holds at <strong style="color:#fff;">$151,013</strong>, annual return at <strong style="color:#fff;">28.6%</strong>, profit factor at <strong style="color:#fff;">1.28</strong>. <span class="blue" style="text-decoration:underline;">Deployable.</span></div>
      </div>
    </div>
  </div>
</div>

<!-- ══ 01 SPECIFICATION ══ -->
<div class="s-dark">
  <div class="page-hdr"><span>Strategy Elements</span><span>01 / Specification</span></div>
  <div class="section-head">
    <div class="ghost">01</div>
    <div class="section-head-text">
      <div class="label">// Strategy Elements</div>
      <div class="section-title">SPECIFICATION.</div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="two-col">
    <div class="muted">
      <p style="margin-bottom:12px;"><strong style="color:#fff;">// Entry Logic</strong><br>The model defines an opening range from 08:30 to 09:00 NY time. On a five-minute close above the range high, with a cumulative-delta reading above the threshold, a single long position is opened at the close. Only one long entry per session.</p>
      <p style="margin-bottom:12px;"><strong style="color:#fff;">// Exit Logic</strong><br>Take-profit is a fixed 1R multiple of the range width above entry. Stop-loss is the range low. Any open position is flattened on the bar that crosses 15:00 ET time. TP and SL are re-armed every bar while the position is open.</p>
      <p style="margin-bottom:12px;"><strong style="color:#fff;">// Position Sizing</strong><br>Fixed at 1 contract of NQ across the entire backtest. No conditional sizing, no ATR filter, no fractional Kelly.</p>
      <p><strong style="color:#fff;">// Data &amp; Range</strong><br>Data 1 is NQ on a 5-minute timeframe. Data 2 is NQ on a 30-minute timeframe for delta accumulation. Backtest range: 01 Jan 2021 to 16 Apr 2026.</p>
    </div>
    <div>
      <div style="font-weight:700; color:#fff; margin-bottom:12px; font-size:10.5pt;">// Parameters As Tested</div>
      <div class="param-grid">
        ${paramBox("ORB_Start_H_NY","8")}
        ${paramBox("ORB_Start_M_NY","30")}
        ${paramBox("ORB_Dur_Min","30")}
        ${paramBox("Trade_End_H_NY","14")}
        ${paramBox("Trade_End_M_NY","0")}
        ${paramBox("TP_RR_Ratio","1.0")}
        ${paramBox("Num_Contracts","1")}
        ${paramBox("DeltaThreshold","200")}
        ${paramBox("UseCumulativeDelta","false")}
        ${paramBox("CumDeltaThreshold","500")}
      </div>
    </div>
  </div>
</div>

<!-- ══ 03 KEY METRICS A ══ -->
<div class="s-mid">
  <div class="page-hdr"><span>The Protocol</span><span>03 / Key Metrics, Part A</span></div>
  <div class="section-head">
    <div class="ghost">03</div>
    <div class="section-head-text">
      <div class="label">// Analyzing the Results</div>
      <div class="section-title">DOES THE STRATEGY<br>WORK?</div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="four-col">
    ${statBox("// Net Profit","$165,715","823 trades, gross of costs")}
    ${statBox("// Annual Return","31.4%","CAGR, $100k base")}
    ${statBox("// Max Drawdown","17.6%","$25,295 strategy DD")}
    ${statBox("// Profit Factor","1.31","adj. 1.18 / select 1.42")}
  </div>
  <div class="two-col">
    <div class="card">
      <table>
        ${row("Net Profit","$165,715.00",true)}
        ${row("Gross Profit","$707,715.00")}
        ${row("Gross Loss","($542,000.00)")}
        ${row("Adjusted Net Profit","$104,147.13",true)}
        ${row("Select Net Profit","$146,480.00")}
        ${row("Return on Initial Capital","165.72%")}
        ${row("Return on Account","745.96%")}
        ${row("Max Strategy DD ($)","($25,295.00)")}
        ${row("Max Strategy DD (%)","(17.63%)")}
        ${row("Max Close-to-Close DD","($22,215.00)")}
        ${row("Return on Max DD","6.55",true)}
      </table>
    </div>
    <div class="card">
      <table>
        ${row("Profit Factor","1.31",true)}
        ${row("Adjusted Profit Factor","1.18")}
        ${row("Select Profit Factor","1.42")}
        ${row("Annual Rate of Return","31.38%")}
        ${row("Monthly Rate of Return","2.62%")}
        ${row("Avg Monthly Return","$2,589.30")}
        ${row("Monthly Return StDev","$6,340.09")}
        ${row("Total # of Trades","823",true)}
        ${row("Percent Profitable","58.32%",true)}
        ${row("Max Contracts Held","1")}
        ${row("Buy & Hold Return","$67,059.10")}
      </table>
    </div>
  </div>
</div>

<!-- ══ 03B READING THE PRINT ══ -->
<div class="s-deep">
  <div class="page-hdr"><span>The Protocol</span><span>03 / Key Metrics, Part B</span></div>
  <div class="label">// Reviewer Commentary</div>
  <div class="section-title">READING THE PRINT.</div>
  <div class="divider"></div>
  <div class="three-col">
    ${cardComment("01","Signal-to-Risk","A 6.55 return-on-max-DD ratio is institutionally respectable. The model earns roughly 6.5 dollars of profit for every dollar of peak-to-trough pain. Anything above 3 passes the desk's first-gate screen.")}
    ${cardComment("02","Profit Factor","At 1.31 the raw PF is modest, which is the honest number for a one-R fixed-TP breakout with ~58% hit rate. Profitability is carried by frequency, not by home-run trades.")}
    ${cardComment("03","Monthly Volatility","Monthly StDev ($6,340) exceeds avg monthly P&L ($2,589), implying a monthly t-stat of order 2.4 over the sample. Sharpe, annualised on monthly data, lands near 1.4.")}
  </div>
  <div class="italic-quote">
    <em>Profitability carried by frequency, not by home runs. Edge is diffused across the sample.</em>
    <div class="quote-label">Headline Commentary</div>
  </div>
</div>

<!-- ══ 04 EQUITY / DRAWDOWN ══ -->
<div class="s-dark">
  <div class="page-hdr"><span>The Protocol</span><span>04 / Equity and Drawdown</span></div>
  <div class="section-head">
    <div class="ghost">04</div>
    <div class="section-head-text">
      <div class="label">// Visual Inspection</div>
      <div class="section-title">EQUITY / DRAWDOWN.</div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="muted" style="max-width:560px; margin-bottom:18px;">Three things matter on an equity plot: monotonicity, regime stability, and the absence of a single outlier trade carrying the P&L. The model curve shows a smoothly convex ascent with consolidations consistent with low-volatility NQ regimes, not with model failure.</div>
  <div class="two-col">
    <div>
      <div class="label" style="margin-bottom:6px;">// Fig. 2 / Equity Curve</div>
      <div class="chart-ph"><span>Equity Curve — $100k to $265k, 5 Years</span></div>
      <div class="label">Fig. 2 · $100k to $265k over five years, no regime breaks</div>
      <div class="card-sm" style="margin-top:10px;">
        <div class="label" style="margin-bottom:4px;">// Monotonicity</div>
        <div class="muted" style="font-size:9.5pt;">No regime breaks. Visible consolidations around Q2-2022 and Q3-2024 align with low-vol NQ environments, not model failure.</div>
      </div>
    </div>
    <div>
      <div class="label" style="margin-bottom:6px;">// Fig. 3 / Run-Up &amp; Drawdown</div>
      <div class="chart-ph"><span>Equity Run-Up vs Closed-Bar Drawdown</span></div>
      <div class="label">Fig. 3 · Cumulative run-up vs closed-bar drawdown</div>
      <div class="card-sm" style="margin-top:10px;">
        <div class="label" style="margin-bottom:4px;">// Drawdown Envelope</div>
        <div class="muted" style="font-size:9.5pt;">Excursions cluster -$10k to -$15k with three visits to the -$20k to -$25k shelf. Worst excursion tags the realised max of $25,295.</div>
      </div>
    </div>
  </div>
</div>

<!-- ══ 05 DISTRIBUTION ══ -->
<div class="s-mid">
  <div class="page-hdr"><span>The Protocol</span><span>05 / Trade Distribution</span></div>
  <div class="section-head">
    <div class="ghost">05</div>
    <div class="section-head-text">
      <div class="label">// Per-Trade Geometry</div>
      <div class="section-title">DISTRIBUTION.</div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="two-col">
    <div>
      <div class="muted" style="margin-bottom:14px;">Across 823 fills the model wins 58.3% of the time, with an average winner of <strong style="color:#fff;">$1,474</strong> against an average loser of <strong style="color:#fff;">$1,580</strong>. The ratio of 0.93 is sub-unity; the model pays a win-rate premium to compensate for a slightly negative payoff asymmetry. That is the defining shape of a one-R fixed-TP breakout.</div>
      <div class="card">
        <table>
          ${row("Total Trades","823",true)}
          ${row("Winning Trades","480")}
          ${row("Losing Trades","343")}
          ${row("Percent Profitable","58.32%",true)}
          ${row("Avg Trade","$201.35")}
          ${row("Avg Winning Trade","$1,474.41")}
          ${row("Avg Losing Trade","($1,580.17)")}
          ${row("Ratio Avg Win / Avg Loss","0.93")}
          ${row("Largest Winner","$9,825.00")}
          ${row("Largest Loser","($8,525.00)")}
          ${row("Avg Bars in Winners","39.6")}
          ${row("Avg Bars in Losers","33.4")}
        </table>
      </div>
    </div>
    <div>
      <div class="card-sm" style="margin-bottom:12px;">
        <div class="label" style="margin-bottom:6px;">// Sample Adequacy</div>
        <div class="muted" style="font-size:9.5pt;">n = 823 is comfortably above the desk minimum of 200 for a daily-frequency strategy. The 95% binomial CI on the true hit rate is [55.0%, 61.7%]; even the lower bound keeps expectancy positive.</div>
      </div>
      <div class="card-sm">
        <div class="label" style="margin-bottom:6px;">// Per-Trade Review</div>
        <div class="muted" style="font-size:9.5pt; font-style:italic;">Winners and losers are roughly symmetric in magnitude. There is no fat-tail dependency on a handful of lucky trades.</div>
      </div>
    </div>
  </div>
</div>

<!-- ══ 06 PERMUTATIONS ══ -->
<div class="s-dark">
  <div class="page-hdr"><span>The Protocol</span><span>06 / Shuffled Sequences</span></div>
  <div class="section-head">
    <div class="ghost">06</div>
    <div class="section-head-text">
      <div class="label">// Path vs Set</div>
      <div class="section-title">1,000 PERMUTATIONS.</div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="muted" style="max-width:560px; margin-bottom:18px;">Do the realised drawdowns depend on the <em>order</em> of trades, or on the <em>set</em> of trades? We permute the trade sequence 1,000 times and re-walk the equity curve on each permutation. Terminal P&amp;L is invariant; drawdown is not.</div>
  <div class="two-col">
    <div class="card-sm">
      <div class="label" style="margin-bottom:6px;">// Fig. 5 / 1,000 Shuffled Paths</div>
      <div class="chart-ph"><span>1,000 Permutation Paths — Grey / Base / Extremes</span></div>
      <div class="label">Fig. 5 · Grey = 1,000 perms / Base = Realised / Extremes Annotated</div>
    </div>
    <div>
      <div style="font-weight:700; color:#fff; margin-bottom:10px; font-size:10.5pt;">// Interpretation</div>
      <div class="muted" style="margin-bottom:12px; font-size:9.5pt;">All 1,000 permutations terminate in positive territory. The smallest drawdown observed is $16,055; the largest is $61,680; the base curve sits at $22,215.</div>
      <div class="card">
        <table>
          ${row("Permutations","1,000",true)}
          ${row("Realised Max DD","$22,215")}
          ${row("Smallest Shuffled DD","$16,055")}
          ${row("Largest Shuffled DD","$61,680")}
          ${row("Max Sequential Wins","12")}
          ${row("Max Sequential Losses","5")}
          ${row("Avg Sequential Wins","2.39")}
          ${row("Avg Sequential Losses","1.71")}
        </table>
      </div>
      <div class="italic-quote">The historical drawdown of $22k is not a tail event. A live trader should budget for the 95th-percentile shuffled DD of ~$55k as a realistic pain threshold.</div>
    </div>
  </div>
</div>

<!-- ══ 07 EXPECTANCY ══ -->
<div class="s-mid">
  <div class="page-hdr"><span>The Protocol</span><span>07 / Expected Value Bootstrap</span></div>
  <div class="section-head">
    <div class="ghost">07</div>
    <div class="section-head-text">
      <div class="label">// Edge Significance</div>
      <div class="section-title">EXPECTANCY.</div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="four-col">
    ${statBox("// EV Per Trade ($)","$194.26","n = 820, long only")}
    ${statBox("// EV Per Trade (R)","0.1295 R","risk-normalised")}
    ${statBox("// P(EV$ ≤ 0)","0.001","bootstrap, 1-tail")}
    ${statBox("// P(EV_R ≤ 0)","0.001","bootstrap, 1-tail")}
  </div>
  <div class="two-col">
    <div>
      <div style="font-weight:700; color:#fff; margin-bottom:8px; font-size:10.5pt;">// Test Design</div>
      <div class="muted" style="margin-bottom:12px; font-size:9.5pt;">We resample the 820-trade return series with replacement 20,000 times and compute the expected value under each resample. The distribution gives us the confidence interval; the fraction of resamples with EV ≤ 0 gives the edge probability.</div>
      <div class="card">
        <table>
          ${row("EV ($/trade)","$194.26",true)}
          ${row("EV (R/trade)","0.1295 R",true)}
          ${row("95% CI (EV $)","[$65.62, $323.70]")}
          ${row("95% CI (EV R)","[0.0437, 0.2158]")}
          ${row("P(EV_R ≤ 0)","0.001",true)}
          ${row("P(EV_$ ≤ 0)","0.001",true)}
        </table>
      </div>
      <div class="italic-quote">Only 1 resample in 1,000 delivers a non-positive expectancy. The null hypothesis of no edge is rejected at the 0.001 level.</div>
    </div>
    <div>
      <div style="font-weight:700; color:#fff; margin-bottom:8px; font-size:10.5pt;">// Reading The Floor</div>
      <div class="muted" style="font-size:9.5pt; line-height:1.65;">The lower CI bound of <strong style="color:#fff;">$65.62 per trade</strong> is the number to carry into live-sizing. Even at this floor the model generates ~$53,800 of gross P&amp;L per 820-trade sample, before fees of $4.26k. R-normalised floor of <strong style="color:#fff;">0.044 R</strong> means a desk that budgets only for this floor still earns a positive expectancy.</div>
    </div>
  </div>
</div>

<!-- ══ 08 MONTE CARLO ══ -->
<div class="s-dark">
  <div class="page-hdr"><span>The Protocol</span><span>08 / Monte Carlo, Part A</span></div>
  <div class="section-head">
    <div class="ghost">08</div>
    <div class="section-head-text">
      <div class="label">// 20,000 Simulations</div>
      <div class="section-title">MONTE CARLO.</div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="muted" style="max-width:560px; margin-bottom:18px;">Each simulation resamples 821 trades with replacement and walks the equity path. We record the maximum closed-equity drawdown and the terminal P&amp;L on every path, then read percentiles off the resulting distributions.</div>
  <div class="two-col">
    <div>
      <div style="font-weight:700; color:#fff; margin-bottom:10px; font-size:10.5pt;">// Max Drawdown / Percentiles</div>
      ${pbar("50th",28838,64458,"$28,838")}
      ${pbar("75th",35857,64458,"$35,857")}
      ${pbar("90th",44372,64458,"$44,372")}
      ${pbar("95th",50521,64458,"$50,521")}
      ${pbar("99th",64458,64458,"$64,458")}
      <div style="font-weight:700; color:#fff; margin:14px 0 10px; font-size:10.5pt;">// Terminal P&amp;L / Percentiles</div>
      ${pbar("50th",159588,283204,"$159,588")}
      ${pbar("75th",194849,283204,"$194,849")}
      ${pbar("90th",228861,283204,"$228,861")}
      ${pbar("95th",248083,283204,"$248,083")}
      ${pbar("99th",283204,283204,"$283,204")}
    </div>
    <div>
      <div class="card-sm" style="margin-bottom:12px;">
        <div class="label" style="margin-bottom:6px;">// Fig. 7 / Max DD Distribution</div>
        <div class="chart-ph"><span>MC Max DD Distribution — 20,000 Sims</span></div>
        <div class="label">Fig. 7 · Right-skewed, mode ~$25k</div>
      </div>
      <div class="card">
        <table>
          ${row("Simulations","20,000",true)}
          ${row("Trades per Sim","821")}
          ${row("$ per 1R","$1,500")}
          ${row("Date Range","2021-01-05 / 2026-04-14")}
          ${row("P(MaxDD ≥ $15,000)","0.994",true)}
        </table>
      </div>
      <div class="italic-quote">The realised drawdown of $25k sits between the 25th and 50th percentile. Plan for the 95th, not the mean.</div>
    </div>
  </div>
  <!-- Part B -->
  <div style="border-top:1px solid rgba(30,58,138,0.2); margin-top:28px; padding-top:22px;">
    <div class="page-hdr" style="margin-bottom:14px;"><span>The Protocol</span><span>08 / Monte Carlo, Part B</span></div>
    <div class="label">// Equity Paths &amp; Median Band</div>
    <div class="section-title" style="font-size:22pt; margin-bottom:14px;">PATH GEOMETRY.</div>
    <div class="divider"></div>
    <div class="two-col">
      <div>
        <div style="font-weight:700; color:#fff; margin-bottom:8px; font-size:10.5pt;">// Fig. 8 / Sample Equity Paths</div>
        <div class="chart-ph"><span>100 of 20,000 Bootstrap Equity Paths</span></div>
        <div class="label">Fig. 8 · 100 of 20,000 bootstrap equity paths</div>
        <div class="muted" style="font-size:9.5pt; margin-top:8px;">Most paths terminate between $120k and $230k; dispersion at the upper end is wider than at the lower end, a property of the underlying winner/loser geometry.</div>
      </div>
      <div>
        <div style="font-weight:700; color:#fff; margin-bottom:8px; font-size:10.5pt;">// Fig. 9 / Median &amp; 5/95 Band</div>
        <div class="chart-ph"><span>MC Equity Curve — Median + 5–95% Band</span></div>
        <div class="label">Fig. 9 · Median $159,588, 95% band [$70k, $250k]</div>
        <div class="muted" style="font-size:9.5pt; margin-top:8px;">The median terminal P&amp;L of $159,588 is within 4% of the realised $165,715. The 90% inter-percentile band sets a reasonable expectation range for the next 821-trade window.</div>
      </div>
    </div>
    <div class="italic-quote">A trader deploying this model should expect terminal P&amp;L inside [$70k, $250k] over an equivalent forward sample, ~19 of 20 times.</div>
  </div>
</div>

<!-- ══ 09 COST-ADJUSTED ══ -->
<div class="s-mid">
  <div class="page-hdr"><span>The Protocol</span><span>09 / Cost-Adjusted, Part A</span></div>
  <div class="section-head">
    <div class="ghost">09</div>
    <div class="section-head-text">
      <div class="label">// Realistic Transaction Costs</div>
      <div class="section-title">COST-ADJUSTED RUN.</div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="muted" style="max-width:580px; margin-bottom:18px;">Re-execute the backtest in MultiCharts with <strong style="color:#fff;">$4.50/contract commission</strong> loaded on the Strategy Properties panel, plus a <strong style="color:#fff;">1-tick ($5) slippage</strong> charge. This is the cross-check against the §07 bootstrap.</div>
  <div class="four-col">
    ${statBox("// Net Profit","$151,013","vs $165,715 gross, -$14,702")}
    ${statBox("// Annual Return","28.6%","vs 31.4%, -2.8 pp")}
    ${statBox("// Profit Factor","1.28","vs 1.31, above 1.20 floor")}
    ${statBox("// Avg Trade","$183.49","vs $201.35, above cost floor")}
  </div>
  <div class="two-col">
    <div class="card">
      <table>
        ${row("Net Profit","$151,013.00",true)}
        ${row("Gross Profit","$699,570.00")}
        ${row("Gross Loss","($548,557.00)")}
        ${row("Adjusted Net Profit","$89,508.79")}
        ${row("Return on Initial Capital","151.01%")}
        ${row("Return on Account","670.19%")}
        ${row("Max Strategy DD ($)","($25,897.00)")}
        ${row("Return on Max DD","5.83",true)}
        ${row("Profit Factor","1.28",true)}
        ${row("Annual Rate of Return","28.60%")}
        ${row("Avg Monthly Return","$2,359.58")}
        ${row("Slippage Paid","$7,295.00")}
        ${row("Commission Paid","$7,407.00")}
        ${row("Percent Profitable","57.72%",true)}
      </table>
    </div>
    <div>
      <div class="card-sm" style="margin-bottom:12px;">
        <div class="muted" style="font-size:9.5pt; margin-bottom:8px;">Costs subtract $14,702 of P&amp;L, the sum of $7,407 commission and $7,295 slippage, and leave every other structural property of the equity curve unchanged.</div>
        <div class="badge">Edge Survives Costs</div>
        <div class="badge">PF &gt; 1.20</div>
      </div>
      <div class="card-sm">
        <div class="label" style="margin-bottom:6px;">// Cross-Validation</div>
        <div class="muted" style="font-size:9.5pt; font-style:italic;">Two independent cost pipelines, MultiCharts and the Python bootstrap, agree to within 2%. That is the cross-validation we want before moving to live sizing.</div>
      </div>
    </div>
  </div>
</div>

<!-- ══ 10 VERDICT ══ -->
<div class="s-deep">
  <div class="page-hdr"><span>The Protocol</span><span>10 / Verdict</span></div>
  <div class="section-head">
    <div class="ghost">10</div>
    <div class="section-head-text">
      <div class="label">// Deployment Notes</div>
      <div class="section-title">VERDICT.</div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="verdict-main">
    <div class="verdict-tag">Validated / Deployable</div>
    <div class="verdict-body">All four independent tests agree: a real, small, positive, statistically-significant long-only edge on NQ opening breakouts. Realised drawdown is a typical, not tail, outcome. <span class="blue" style="text-decoration:underline;">Live-sizing risk is the binding constraint, not statistical risk.</span></div>
  </div>
  <div class="three-col">
    ${verdictCol("What The Evidence Shows",[
      "Edge is real. Bootstrap P(EV ≤ 0) = 0.001 on both $ and R axes. Lower-CI expectancy still positive.",
      "Path is not flattering. Base DD of $22k sits near the median of 1,000 permutations.",
      "Sample is sufficient. 823 closed trades over five years of diverse NQ regimes."
    ])}
    ${verdictCol("Risk Budget For Live",[
      "Plan for $50k peak-to-trough. 95th-percentile MC drawdown is $50,521, ~3× the backtest high-water mark.",
      "P($15k+ DD) = 99.4%. If a trader cannot tolerate that, the model is the wrong fit.",
      "Costs confirmed realistic. MultiCharts re-run loads $14,702 of drag, ~2% of gross profit."
    ])}
    ${verdictCol("Next Checks Before Capital",[
      "Walk-forward. Re-run on a rolling-origin basis; confirm stability across non-overlapping 12-month windows.",
      "Slippage stress. Re-price at +1 and +2 ticks adverse; confirm CI lower-bound still positive.",
      "Regime breakdown. Decompose P&L by VIX quintile and NY-morning realised-vol buckets."
    ])}
  </div>
  <div class="limitations">
    <strong>// Statement Of Limitations</strong><br>
    Not financial advice. This document is an internal statistical validation prepared for desk review and does not constitute an offer, solicitation, or recommendation to trade any instrument. The validation is conducted on the author-supplied MultiCharts trade log; no independent re-execution of the strategy on raw market data was performed. Bootstrap and Monte Carlo methods assume trades are exchangeable (i.i.d.); mild autocorrelation in daily-vol regimes may understate tail drawdowns by an estimated 5 to 10%. All returns are gross of taxes.
  </div>
  <div style="margin-top:18px; display:flex; justify-content:space-between; align-items:flex-end;">
    <div>
      <div class="label">Prepared By</div>
      <div style="font-size:14pt; font-weight:900; color:#fff; margin: 3px 0;">Simeon Natev.</div>
      <div class="label">The Institutional Protocol / @SimeonNatev / Issued 2026 / Internal</div>
    </div>
    <div class="label">Independent-Val</div>
  </div>
</div>

<!-- ══ APPENDIX ══ -->
<div class="s-dark">
  <div class="page-hdr"><span>Appendix</span><span>10 / EasyLanguage Source</span></div>
  <div class="label">// MultiCharts Copy-Paste</div>
  <div class="section-title">EASYLANGUAGE SOURCE.</div>
  <div class="divider"></div>
  <div class="code-block">{ Fabio Valentini Model }

Inputs:
    ORB_Start_H_NY(8),        ORB_Start_M_NY(30),
    ORB_Dur_Min(30),           Trade_End_H_NY(14),
    Trade_End_M_NY(0),         TP_RR_Ratio(1.0),
    Num_Contracts(1),          DeltaThreshold(200),
    UseCumulativeDelta(false), CumDeltaThreshold(500);

Variables:
    ORB_Start_Time(0), ORB_End_Time(0), Trade_End_Time(0),
    ORB_Inited(false), ORB_Session_Ended(false),
    ORB_High(0), ORB_Low(0), Long_Done_Today(false), Was_Long(false),
    Pos_SL(0), Pos_TP(0), Cur_Date_Int(0), Prev_Bar_Time(0), Bar_Time(0),
    In_ORB(false), Trade_Active(false), EP(0), SL_Price(0), TP_Price(0),
    BarDelta(0), CumDelta(0), DeltaOK(false);

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

if CurrentBar < 2 then begin
    Cur_Date_Int = Date; Prev_Bar_Time = Time;
end;

if CurrentBar >= 2 then begin
    if Date <> Cur_Date_Int then begin
        Cur_Date_Int = Date; ORB_Inited = false; ORB_Session_Ended = false;
        ORB_High = 0; ORB_Low = 0; Long_Done_Today = false; Was_Long = false;
        Pos_SL = 0; Pos_TP = 0; CumDelta = 0;
    end;
    Bar_Time = Time;
    In_ORB     = (Bar_Time > ORB_Start_Time) and (Bar_Time <= ORB_End_Time);
    Trade_Active = (Bar_Time > ORB_End_Time) and (Bar_Time <= Trade_End_Time);
    BarDelta = Upticks - Downticks;
    if Bar_Time > ORB_Start_Time and Bar_Time <= Trade_End_Time then
        CumDelta = CumDelta + BarDelta;
    if In_ORB then begin
        if ORB_Inited = false then begin
            ORB_High = High; ORB_Low = Low; ORB_Inited = true;
        end else begin
            if High > ORB_High then ORB_High = High;
            if Low  < ORB_Low  then ORB_Low  = Low;
        end;
    end;
    if ORB_Session_Ended = false and ORB_Inited and Bar_Time > ORB_End_Time then
        ORB_Session_Ended = true;
    if MarketPosition = 1 then Was_Long = true;
    if MarketPosition = 0 and Was_Long then begin
        Was_Long = false; Pos_SL = 0; Pos_TP = 0;
    end;
    if Bar_Time >= Trade_End_Time and Prev_Bar_Time < Trade_End_Time then begin
        if MarketPosition = 1 then Sell ("EOD-L") this bar on close;
    end;
    Prev_Bar_Time = Bar_Time;
    if MarketPosition = 1 and Pos_SL <> 0 and Pos_TP <> 0 then begin
        Sell ("L-TP") next bar at Pos_TP limit;
        Sell ("L-SL") next bar at Pos_SL stop;
    end;
    if ORB_Session_Ended and Trade_Active and Long_Done_Today = false
        and MarketPosition = 0 and Close > ORB_High then begin
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
end;</div>
</div>

<!-- FOOTER -->
<div class="footer">
  <div>
    <div class="footer-meta">Prepared By</div>
    <div class="footer-name">Simeon Natev.</div>
    <div class="footer-meta">The Institutional Protocol / @SimeonNatev / Issued 2026 / Internal</div>
  </div>
  <div style="text-align:right;">
    <div class="footer-meta">Document</div>
    <div style="font-size:12pt; font-weight:700; color:#fff; margin:2px 0;">Independent-Val v1.0</div>
    <div class="footer-meta">NQ Futures / 823 Trades / 2021–2026</div>
  </div>
</div>

</div><!-- .page -->
</body>
</html>`;

fs.writeFileSync("/tmp/report.html", html);

(async () => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--force-color-profile=srgb"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123 });
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: "/tmp/simeon-natev-fabervaale-orb-report.pdf",
    format: "A4",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  await browser.close();
  console.log("Done.");
})();
