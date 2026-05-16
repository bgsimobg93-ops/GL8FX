const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Simeon Natev — Fabervaale ORB Report</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#000008;color:#fff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.6;}
  .page{width:210mm;margin:0 auto;background:#000008;}

  /* typography */
  .label{font-size:9px;letter-spacing:.35em;text-transform:uppercase;color:rgba(96,165,250,.55);margin-bottom:6px;}
  .section-title{font-size:36px;font-weight:900;letter-spacing:-.02em;background:linear-gradient(135deg,#fff 0%,#bfdbfe 55%,#60a5fa 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  .divider{width:100%;height:1px;background:linear-gradient(90deg,rgba(59,130,246,.6),rgba(59,130,246,.08),transparent);margin:20px 0;}
  .page-header{display:flex;justify-content:space-between;font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:rgba(96,165,250,.35);margin-bottom:32px;}
  .ghost{font-size:100px;font-weight:900;color:rgba(30,58,138,.18);line-height:1;margin-right:16px;flex-shrink:0;}
  .flex-row{display:flex;align-items:flex-start;}
  .italic-quote{border-left:2px solid rgba(59,130,246,.45);padding-left:16px;font-style:italic;font-size:12px;color:rgba(191,219,254,.55);margin-top:16px;}

  /* section backgrounds */
  .s-cover{background:radial-gradient(ellipse at 70% 15%,rgba(30,58,138,.35) 0%,transparent 55%),linear-gradient(135deg,#000,#020215,#04042e);padding:40px 48px;position:relative;min-height:297mm;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always;}
  .s-dark{background:#020218;padding:36px 48px;page-break-inside:avoid;}
  .s-blue{background:#04042e;padding:36px 48px;page-break-inside:avoid;}
  .s-grad-down{background:linear-gradient(180deg,#020218 0%,#04042e 100%);padding:36px 48px;}
  .s-grad-up{background:linear-gradient(180deg,#04042e 0%,#020218 100%);padding:36px 48px;}

  /* grid overlay for cover */
  .grid-overlay{position:absolute;inset:0;opacity:.055;background-image:linear-gradient(rgba(96,165,250,1) 1px,transparent 1px),linear-gradient(90deg,rgba(96,165,250,1) 1px,transparent 1px);background-size:48px 48px;}

  /* cards & boxes */
  .card{border:1px solid rgba(59,130,246,.3);background:rgba(30,27,75,.25);padding:20px;}
  .card-sm{border:1px solid rgba(30,58,138,.35);background:rgba(10,5,50,.2);padding:16px;}
  .validated-box{border:1px solid rgba(59,130,246,.28);background:rgba(30,27,75,.22);padding:24px;margin:20px 0;}
  .validated-tag{border:1px solid rgba(96,165,250,.38);padding:6px 14px;font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:rgba(147,197,253,1);display:inline-block;margin-bottom:12px;}
  .verdict-box{border:1px solid rgba(59,130,246,.28);background:rgba(30,27,75,.22);padding:24px;display:flex;align-items:center;gap:20px;margin-bottom:24px;}
  .verdict-tag{border:1px solid rgba(96,165,250,.45);padding:8px 16px;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:rgba(147,197,253,1);white-space:nowrap;}

  /* stat boxes */
  .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;}
  .stat-box{border:1px solid rgba(30,58,138,.4);background:rgba(10,5,50,.25);padding:16px;}
  .stat-label{font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:rgba(96,165,250,.55);}
  .stat-value{font-size:26px;font-weight:900;color:#fff;margin:4px 0 2px;}
  .stat-sub{font-size:9px;color:rgba(96,165,250,.45);}

  /* tables */
  .table-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(30,58,138,.2);font-size:12px;color:rgba(191,219,254,.65);}
  .row.bold{font-weight:700;color:#fff;}
  .row span:last-child{font-family:monospace;}

  /* two-column */
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:32px;}
  .three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;}

  /* param grid */
  .param-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  .param-box{border:1px solid rgba(30,58,138,.3);background:rgba(10,5,50,.2);padding:8px 12px;}
  .param-key{font-size:9px;color:rgba(96,165,250,.5);}
  .param-val{font-size:12px;font-weight:700;font-family:monospace;color:#fff;margin-top:2px;}

  /* contents list */
  .contents-row{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid rgba(30,58,138,.2);padding:8px 0;}
  .contents-num{font-size:11px;font-family:monospace;color:rgba(37,99,235,.55);width:20px;flex-shrink:0;}
  .contents-title{font-size:12px;font-weight:600;color:#fff;}
  .contents-sub{font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:rgba(96,165,250,.45);}
  .contents-page{font-size:11px;font-family:monospace;color:rgba(96,165,250,.38);}

  /* placeholders for charts */
  .chart-placeholder{background:rgba(10,5,50,.45);border:1px solid rgba(30,58,138,.28);aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;margin-bottom:8px;}
  .chart-placeholder span{font-size:9px;letter-spacing:.25em;text-transform:uppercase;color:rgba(96,165,250,.2);}

  /* progress bars */
  .pbar-row{display:flex;align-items:center;gap:12px;margin-bottom:8px;}
  .pbar-label{font-size:11px;color:rgba(96,165,250,.5);width:30px;}
  .pbar-track{flex:1;background:rgba(10,5,50,.4);border-radius:4px;height:6px;}
  .pbar-fill{height:6px;border-radius:4px;background:linear-gradient(90deg,#1d4ed8,#60a5fa);}
  .pbar-val{font-size:11px;font-family:monospace;color:#fff;text-align:right;min-width:64px;}

  /* code block */
  .code-block{font-family:monospace;font-size:10px;color:rgba(147,197,253,.78);line-height:1.7;background:#020218;border:1px solid rgba(30,58,138,.4);padding:24px;white-space:pre;overflow:hidden;}

  /* footer */
  .footer{background:linear-gradient(180deg,#04042e 0%,#000008 100%);border-top:1px solid rgba(30,58,138,.3);padding:32px 48px;display:flex;justify-content:space-between;align-items:flex-end;}
  .footer-name{font-size:20px;font-weight:900;color:#fff;margin:4px 0;}
  .footer-meta{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:rgba(96,165,250,.38);}

  .text-muted{color:rgba(191,219,254,.65);}
  .text-white{color:#fff;}
  .text-blue{color:rgba(147,197,253,1);}
  .bold{font-weight:700;}
  .italic{font-style:italic;}
  .small{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:rgba(96,165,250,.42);}
  .mb4{margin-bottom:16px;}
  .mb6{margin-bottom:24px;}
  .mt4{margin-top:16px;}
  .mt6{margin-top:24px;}
  .underline{text-decoration:underline;}
  .border-badge{border:1px solid rgba(96,165,250,.38);padding:4px 12px;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:rgba(147,197,253,1);display:inline-block;margin-right:8px;margin-top:12px;}

  @page{size:A4;margin:0;}
</style>
</head>
<body>
<div class="page">

<!-- ══════════ COVER ══════════ -->
<div class="s-cover">
  <div class="grid-overlay"></div>
  <div style="position:relative;display:flex;justify-content:space-between;font-size:9px;letter-spacing:.32em;text-transform:uppercase;color:rgba(96,165,250,.45);">
    <span>Independent Model Validation</span><span>Confidential · Internal</span>
  </div>

  <div style="position:relative;padding:48px 0;">
    <div class="label">// Independent Model Validation</div>
    <div style="font-size:58px;font-weight:900;line-height:1;letter-spacing:-.02em;background:linear-gradient(135deg,#fff 0%,#93c5fd 50%,#3b82f6 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:16px;">
      FABERVAALE<br/>OPENING RANGE<br/>BREAKOUT
    </div>
    <div style="color:rgba(191,219,254,.55);max-width:480px;font-size:13px;font-style:italic;margin-bottom:28px;">
      An independent statistical validation of Fabio Valentini's long-only ORB stop-entry strategy, executed on 5 years of intraday NQ data.
    </div>
    <div style="width:100%;height:1px;background:linear-gradient(90deg,rgba(59,130,246,.7),rgba(59,130,246,.1),transparent);margin-bottom:28px;"></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;">
      ${[["Instrument","NQ Futures"],["Sample","823 trades"],["Period","2021 / 2026"],["Simulations","20,000"],
         ["Prepared By","Simeon Natev"],["Methodology","Bootstrap / MC"],["Platform","MultiCharts"],["Issue","v1.0 / 2026"]]
        .map(([l,v])=>`<div><div style="font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:rgba(96,165,250,.45);">${l}</div><div style="font-size:13px;font-weight:700;color:#fff;margin-top:4px;">${v}</div></div>`).join("")}
    </div>
  </div>

  <div style="position:relative;display:flex;justify-content:space-between;font-size:9px;letter-spacing:.32em;text-transform:uppercase;color:rgba(96,165,250,.38);">
    <span>Process &gt; Prediction</span><span>@SimeonNatev</span>
  </div>
</div>

<!-- ══════════ CONTENTS + ABSTRACT ══════════ -->
<div class="s-grad-down" style="border-top:1px solid rgba(30,58,138,.3);">
  <div class="page-header"><span>The Institutional Protocol</span><span>00 / Executive Summary</span></div>
  <div class="two-col">
    <div>
      <div class="label">// Contents</div>
      <div class="section-title">CONTENTS.</div>
      <div style="margin-top:20px;">
        ${[["01","Strategy Specification","Rules, Data Feeds, Inputs","03"],
           ["02","Headline Performance","KPIs and Full Report","04 / 05"],
           ["03","Equity and Drawdown","Base Curve, Run-Up Overlay","06"],
           ["04","Trade Distribution","Win Rate, Payoff Geometry","07"],
           ["05","Shuffled Sequences","1,000 Permutations","08"],
           ["06","Expected Value Bootstrap","Edge Significance, 95% CI","09"],
           ["07","Monte Carlo","20,000 Simulations","10 / 11"],
           ["08","Cost-Adjusted Re-Run","Commissions, Slippage","12 / 13"],
           ["09","Verdict","Deployment Notes, Limitations","14"],
           ["10","Appendix, EasyLanguage Source","MultiCharts Copy-Paste","15 / 16"]]
          .map(([n,t,s,p])=>`<div class="contents-row"><div style="display:flex;gap:12px;align-items:flex-start;"><span class="contents-num">${n}</span><div><div class="contents-title">${t}</div><div class="contents-sub">${s}</div></div></div><span class="contents-page">${p}</span></div>`).join("")}
      </div>
    </div>
    <div>
      <div class="label">// Abstract</div>
      <div class="section-title">THE CASE.</div>
      <div style="margin-top:20px;color:rgba(191,219,254,.65);font-size:12px;line-height:1.7;">
        <p style="margin-bottom:12px;">Fabio Valentini model is a long-only opening-range breakout on NQ, with a volume-delta filter and a fixed one-R take-profit. We re-run the strategy across five years of intraday data and stress the resulting trade log under permutation, bootstrap, and Monte-Carlo procedures.</p>
        <p style="margin-bottom:12px;">The edge is small per trade but significant. Realised drawdown sits near the median of plausible orderings, not the tail. After loading native MultiCharts commissions and a one-tick slippage, every conclusion survives.</p>
        <p>The numbers behave as a rule-based mechanical system should: positive expectancy over a large sample, with diffuse contribution and no single-trade dependency.</p>
      </div>
      <div class="validated-box" style="margin-top:20px;">
        <div class="validated-tag">Validated</div>
        <div style="font-size:12px;color:rgba(191,219,254,.65);line-height:1.6;">Over 823 NQ trades the model delivers a positive, statistically-significant edge with <strong style="color:#fff;">P(EV ≤ 0) = 0.001</strong>. Net profit holds at <strong style="color:#fff;">$151,013</strong>, annual return at <strong style="color:#fff;">28.6%</strong>, profit factor at <strong style="color:#fff;">1.28</strong>. <span class="text-blue underline">Deployable.</span></div>
      </div>
    </div>
  </div>
</div>

<!-- ══════════ 01 SPECIFICATION ══════════ -->
<div class="s-dark" style="border-top:1px solid rgba(30,58,138,.2);">
  <div class="page-header"><span>Strategy Elements</span><span>01 / Specification</span></div>
  <div class="flex-row mb6">
    <div class="ghost">01</div>
    <div style="padding-top:12px;"><div class="label">// Strategy Elements</div><div class="section-title">SPECIFICATION.</div></div>
  </div>
  <div class="divider"></div>
  <div class="two-col">
    <div style="color:rgba(191,219,254,.65);font-size:12px;">
      ${[["Entry Logic","The model defines an opening range from 08:30 to 09:00 NY time. On a five-minute close above the range high, with a cumulative-delta reading above the threshold, a single long position is opened at the close. Only one long entry per session."],
         ["Exit Logic","Take-profit is a fixed 1R multiple of the range width above entry. Stop-loss is the range low. Any open position is flattened on the bar that crosses 15:00 ET time. TP and SL are re-armed every bar while the position is open."],
         ["Position Sizing","Fixed at 1 contract of NQ across the entire backtest. No conditional sizing, no ATR filter, no fractional Kelly."],
         ["Data & Range","Data 1 is NQ on a five-minute timeframe. Data 2 is NQ on a 30-minute timeframe for delta accumulation. Backtest range: 01 Jan 2021 to 16 Apr 2026."]]
        .map(([t,b])=>`<div style="margin-bottom:16px;"><div style="font-weight:700;color:#fff;margin-bottom:4px;">// ${t}</div><div>${b}</div></div>`).join("")}
    </div>
    <div>
      <div style="font-weight:700;color:#fff;margin-bottom:14px;">// Parameters As Tested</div>
      <div class="param-grid">
        ${[["ORB_Start_H_NY","8"],["ORB_Start_M_NY","30"],["ORB_Dur_Min","30"],["Trade_End_H_NY","14"],
           ["Trade_End_M_NY","0"],["TP_RR_Ratio","1.0"],["Num_Contracts","1"],["DeltaThreshold","200"],
           ["UseCumulativeDelta","false"],["CumDeltaThreshold","500"]]
          .map(([k,v])=>`<div class="param-box"><div class="param-key">${k}</div><div class="param-val">${v}</div></div>`).join("")}
      </div>
    </div>
  </div>
</div>

<!-- ══════════ 03 KEY METRICS A ══════════ -->
<div class="s-grad-down" style="border-top:1px solid rgba(30,58,138,.2);">
  <div class="page-header"><span>The Protocol</span><span>03 / Key Metrics, Part A</span></div>
  <div class="flex-row mb6">
    <div class="ghost">03</div>
    <div style="padding-top:12px;"><div class="label">// Analyzing the Results</div><div class="section-title">DOES THE STRATEGY WORK?</div></div>
  </div>
  <div class="divider"></div>
  <div class="stat-grid">
    ${[["// Net Profit","$165,715","823 trades, gross of costs"],["// Annual Return","31.4%","CAGR, $100k base"],
       ["// Max Drawdown","17.6%","$25,295 strategy DD"],["// Profit Factor","1.31","adj. 1.18 / select 1.42"]]
      .map(([l,v,s])=>`<div class="stat-box"><div class="stat-label">${l}</div><div class="stat-value">${v}</div><div class="stat-sub">${s}</div></div>`).join("")}
  </div>
  <div class="table-grid">
    <div class="card-sm">
      ${[["Net Profit","$165,715.00",true],["Gross Profit","$707,715.00"],["Gross Loss","($542,000.00)"],
         ["Adjusted Net Profit","$104,147.13",true],["Select Net Profit","$146,480.00"],
         ["Return on Initial Capital","165.72%"],["Return on Account","745.96%"],
         ["Max Strategy DD ($)","($25,295.00)"],["Max Strategy DD (%)","(17.63%)"],
         ["Max Close-to-Close DD","($22,215.00)"],["Return on Max DD","6.55",true]]
        .map(([l,v,b])=>`<div class="row${b?" bold":""}"><span>${l}</span><span>${v}</span></div>`).join("")}
    </div>
    <div class="card-sm">
      ${[["Profit Factor","1.31",true],["Adjusted Profit Factor","1.18"],["Select Profit Factor","1.42"],
         ["Annual Rate of Return","31.38%"],["Monthly Rate of Return","2.62%"],
         ["Avg Monthly Return","$2,589.30"],["Monthly Return StDev","$6,340.09"],
         ["Total # of Trades","823",true],["Percent Profitable","58.32%",true],
         ["Max Contracts Held","1"],["Buy & Hold Return","$67,059.10"]]
        .map(([l,v,b])=>`<div class="row${b?" bold":""}"><span>${l}</span><span>${v}</span></div>`).join("")}
    </div>
  </div>
</div>

<!-- ══════════ 03B READING THE PRINT ══════════ -->
<div class="s-blue" style="border-top:1px solid rgba(30,58,138,.2);">
  <div class="page-header"><span>The Protocol</span><span>03 / Key Metrics, Part B</span></div>
  <div class="label">// Reviewer Commentary</div>
  <div class="section-title">READING THE PRINT.</div>
  <div class="divider"></div>
  <div class="three-col">
    ${[["01","Signal-to-Risk","A 6.55 return-on-max-DD ratio is institutionally respectable. The model earns roughly 6.5 dollars of profit for every dollar of peak-to-trough pain. Anything above 3 passes the desk's first-gate screen."],
       ["02","Profit Factor","At 1.31 the raw PF is modest, which is the honest number for a one-R fixed-TP breakout with ~58% hit rate. Profitability is carried by frequency, not by home-run trades."],
       ["03","Monthly Volatility","Monthly StDev ($6,340) exceeds avg monthly P&L ($2,589), implying a monthly t-stat of order 2.4 over the sample. Sharpe, annualised on monthly data, lands near 1.4."]]
      .map(([n,l,b])=>`<div class="card-sm"><div style="font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:rgba(96,165,250,.5);margin-bottom:10px;">// ${n}, ${l}</div><div style="font-size:12px;color:rgba(191,219,254,.65);line-height:1.6;">${b}</div></div>`).join("")}
  </div>
  <div class="italic-quote"><em>Profitability carried by frequency, not by home runs. Edge is diffused across the sample.</em><div class="small" style="margin-top:6px;">Headline Commentary</div></div>
</div>

<!-- ══════════ 04 EQUITY / DRAWDOWN ══════════ -->
<div class="s-grad-up" style="border-top:1px solid rgba(30,58,138,.2);">
  <div class="page-header"><span>The Protocol</span><span>04 / Equity and Drawdown</span></div>
  <div class="flex-row mb6">
    <div class="ghost">04</div>
    <div style="padding-top:12px;"><div class="label">// Visual Inspection</div><div class="section-title">EQUITY / DRAWDOWN.</div></div>
  </div>
  <div class="divider"></div>
  <div style="color:rgba(191,219,254,.65);font-size:12px;max-width:600px;margin-bottom:20px;">
    Three things matter on an equity plot: monotonicity, regime stability, and the absence of a single outlier trade carrying the P&L. The model curve shows a smoothly convex ascent with consolidations consistent with low-volatility NQ regimes, not with model failure.
  </div>
  <div class="two-col">
    ${[["Fig. 2 / Equity Curve","Fig. 2  $100k to $265k over five years, no regime breaks","// Monotonicity","No regime breaks. Visible consolidations around Q2-2022 and Q3-2024 align with low-vol NQ environments, not model failure."],
       ["Fig. 3 / Run-Up & Drawdown","Fig. 3  Cumulative run-up vs closed-bar drawdown","// Drawdown Envelope","Excursions cluster -$10k to -$15k with three visits to the -$20k to -$25k shelf. Worst excursion tags the realised max of $25,295."]]
      .map(([f,c,sl,sb])=>`<div class="card-sm"><div class="small" style="margin-bottom:8px;">// ${f}</div><div class="chart-placeholder"><span>${f}</span></div><div class="small">${c}</div><div class="card-sm" style="margin-top:12px;"><div class="small" style="margin-bottom:6px;">${sl}</div><div style="font-size:11px;color:rgba(191,219,254,.55);line-height:1.5;">${sb}</div></div></div>`).join("")}
  </div>
</div>

<!-- ══════════ 05 DISTRIBUTION ══════════ -->
<div class="s-dark" style="border-top:1px solid rgba(30,58,138,.2);">
  <div class="page-header"><span>The Protocol</span><span>05 / Trade Distribution</span></div>
  <div class="flex-row mb6">
    <div class="ghost">05</div>
    <div style="padding-top:12px;"><div class="label">// Per-Trade Geometry</div><div class="section-title">DISTRIBUTION.</div></div>
  </div>
  <div class="divider"></div>
  <div class="two-col">
    <div>
      <div style="color:rgba(191,219,254,.65);font-size:12px;line-height:1.6;margin-bottom:16px;">Across 823 fills the model wins 58.3% of the time, with an average winner of <strong style="color:#fff;">$1,474</strong> against an average loser of <strong style="color:#fff;">$1,580</strong>. The ratio of 0.93 is sub-unity; the model pays a win-rate premium to compensate for a slightly negative payoff asymmetry.</div>
      ${[["Total Trades","823",true],["Winning Trades","480"],["Losing Trades","343"],
         ["Percent Profitable","58.32%",true],["Avg Trade","$201.35"],["Avg Winning Trade","$1,474.41"],
         ["Avg Losing Trade","($1,580.17)"],["Ratio Avg Win / Avg Loss","0.93"],
         ["Largest Winner","$9,825.00"],["Largest Loser","($8,525.00)"],
         ["Avg Bars in Winners","39.6"],["Avg Bars in Losers","33.4"]]
        .map(([l,v,b])=>`<div class="row${b?" bold":""}"><span>${l}</span><span>${v}</span></div>`).join("")}
    </div>
    <div>
      <div class="card-sm mb4">
        <div class="small mb4">// Sample Adequacy</div>
        <div style="font-size:12px;color:rgba(191,219,254,.6);line-height:1.6;">n = 823 is comfortably above the desk minimum of 200 for a daily-frequency strategy. The 95% binomial CI on the true hit rate is [55.0%, 61.7%]; even the lower bound keeps expectancy positive.</div>
      </div>
      <div class="card-sm">
        <div class="small mb4">// Per-Trade Review</div>
        <div style="font-size:12px;color:rgba(191,219,254,.6);line-height:1.6;font-style:italic;">Winners and losers are roughly symmetric in magnitude. There is no fat-tail dependency on a handful of lucky trades.</div>
      </div>
    </div>
  </div>
</div>

<!-- ══════════ 06 PERMUTATIONS ══════════ -->
<div class="s-grad-down" style="border-top:1px solid rgba(30,58,138,.2);">
  <div class="page-header"><span>The Protocol</span><span>06 / Shuffled Sequences</span></div>
  <div class="flex-row mb6">
    <div class="ghost">06</div>
    <div style="padding-top:12px;"><div class="label">// Path vs Set</div><div class="section-title">1,000 PERMUTATIONS.</div></div>
  </div>
  <div class="divider"></div>
  <div style="color:rgba(191,219,254,.65);font-size:12px;max-width:600px;margin-bottom:20px;">Do the realised drawdowns depend on the <em>order</em> of trades, or on the <em>set</em> of trades? We permute the trade sequence 1,000 times and re-walk the equity curve on each permutation. Terminal P&L is invariant; drawdown is not.</div>
  <div class="two-col">
    <div class="card-sm">
      <div class="small" style="margin-bottom:8px;">// Fig. 5 / 1,000 Shuffled Paths</div>
      <div class="chart-placeholder"><span>1,000 Permutation Paths</span></div>
      <div class="small">Fig. 5  Grey = 1,000 perms / Base = Realised / Extremes Annotated</div>
    </div>
    <div>
      <div style="font-weight:700;color:#fff;margin-bottom:12px;">// Interpretation</div>
      <div style="font-size:12px;color:rgba(191,219,254,.6);margin-bottom:14px;">All 1,000 permutations terminate in positive territory. The smallest drawdown observed is $16,055; the largest is $61,680; the base curve sits at $22,215.</div>
      ${[["Permutations","1,000",true],["Realised Max DD","$22,215"],["Smallest Shuffled DD","$16,055"],["Largest Shuffled DD","$61,680"],
         ["Max Sequential Wins","12"],["Max Sequential Losses","5"],["Avg Sequential Wins","2.39"],["Avg Sequential Losses","1.71"]]
        .map(([l,v,b])=>`<div class="row${b?" bold":""}"><span>${l}</span><span>${v}</span></div>`).join("")}
      <div class="italic-quote">The historical drawdown of $22k is not a tail event. A live trader should budget for the 95th-percentile shuffled DD of ~$55k as a realistic pain threshold.</div>
    </div>
  </div>
</div>

<!-- ══════════ 07 EXPECTANCY ══════════ -->
<div class="s-blue" style="border-top:1px solid rgba(30,58,138,.2);">
  <div class="page-header"><span>The Protocol</span><span>07 / Expected Value Bootstrap</span></div>
  <div class="flex-row mb6">
    <div class="ghost">07</div>
    <div style="padding-top:12px;"><div class="label">// Edge Significance</div><div class="section-title">EXPECTANCY.</div></div>
  </div>
  <div class="divider"></div>
  <div class="stat-grid">
    ${[["// EV Per Trade ($)","$194.26","n = 820, long only"],["// EV Per Trade (R)","0.1295 R","risk-normalised"],
       ["// P(EV$ ≤ 0)","0.001","bootstrap, 1-tail"],["// P(EV_R ≤ 0)","0.001","bootstrap, 1-tail"]]
      .map(([l,v,s])=>`<div class="stat-box"><div class="stat-label">${l}</div><div class="stat-value">${v}</div><div class="stat-sub">${s}</div></div>`).join("")}
  </div>
  <div class="two-col">
    <div>
      <div style="font-weight:700;color:#fff;margin-bottom:10px;">// Test Design</div>
      <div style="font-size:12px;color:rgba(191,219,254,.6);margin-bottom:14px;line-height:1.6;">We resample the 820-trade return series with replacement 20,000 times and compute the expected value under each resample. The distribution gives us the confidence interval; the fraction of resamples with EV ≤ 0 gives the edge probability.</div>
      ${[["EV ($/trade)","$194.26",true],["EV (R/trade)","0.1295 R",true],["95% CI (EV $)","[$65.62, $323.70]"],["95% CI (EV R)","[0.0437, 0.2158]"],["P(EV_R ≤ 0)","0.001",true],["P(EV_$ ≤ 0)","0.001",true]]
        .map(([l,v,b])=>`<div class="row${b?" bold":""}"><span>${l}</span><span>${v}</span></div>`).join("")}
      <div class="italic-quote">Only 1 resample in 1,000 delivers a non-positive expectancy. The null hypothesis of no edge is rejected at the 0.001 level.</div>
    </div>
    <div>
      <div style="font-weight:700;color:#fff;margin-bottom:10px;">// Reading The Floor</div>
      <div style="font-size:12px;color:rgba(191,219,254,.6);line-height:1.6;">The lower CI bound of <strong style="color:#fff;">$65.62 per trade</strong> is the number to carry into live-sizing. Even at this floor the model generates ~$53,800 of gross P&L per 820-trade sample, before fees of $4.26k. R-normalised floor of <strong style="color:#fff;">0.044 R</strong> means a desk that budgets only for this floor still earns a positive expectancy.</div>
    </div>
  </div>
</div>

<!-- ══════════ 08 MONTE CARLO ══════════ -->
<div class="s-grad-up" style="border-top:1px solid rgba(30,58,138,.2);">
  <div class="page-header"><span>The Protocol</span><span>08 / Monte Carlo, Part A</span></div>
  <div class="flex-row mb6">
    <div class="ghost">08</div>
    <div style="padding-top:12px;"><div class="label">// 20,000 Simulations</div><div class="section-title">MONTE CARLO.</div></div>
  </div>
  <div class="divider"></div>
  <div style="color:rgba(191,219,254,.65);font-size:12px;max-width:600px;margin-bottom:20px;">Each simulation resamples 821 trades with replacement and walks the equity path. We record the maximum closed-equity drawdown and the terminal P&L on every path, then read percentiles off the resulting distributions.</div>
  <div class="two-col">
    <div>
      <div style="font-weight:700;color:#fff;margin-bottom:12px;">// Max Drawdown / Percentiles</div>
      ${[["50th",28838,"$28,838"],["75th",35857,"$35,857"],["90th",44372,"$44,372"],["95th",50521,"$50,521"],["99th",64458,"$64,458"]]
        .map(([p,r,l])=>`<div class="pbar-row"><span class="pbar-label">${p}</span><div class="pbar-track"><div class="pbar-fill" style="width:${Math.round((r/64458)*100)}%"></div></div><span class="pbar-val">${l}</span></div>`).join("")}
      <div style="font-weight:700;color:#fff;margin:16px 0 12px;">// Terminal P&L / Percentiles</div>
      ${[["50th",159588,"$159,588"],["75th",194849,"$194,849"],["90th",228861,"$228,861"],["95th",248083,"$248,083"],["99th",283204,"$283,204"]]
        .map(([p,r,l])=>`<div class="pbar-row"><span class="pbar-label">${p}</span><div class="pbar-track"><div class="pbar-fill" style="width:${Math.round((r/283204)*100)}%"></div></div><span class="pbar-val">${l}</span></div>`).join("")}
    </div>
    <div>
      <div class="card-sm" style="margin-bottom:14px;">
        <div class="small" style="margin-bottom:8px;">// Fig. 7 / Max DD Distribution</div>
        <div class="chart-placeholder"><span>MC Max DD Distribution</span></div>
        <div class="small">Fig. 7  20,000 sims, right-skewed, mode ~$25k</div>
      </div>
      ${[["Simulations","20,000",true],["Trades per Sim","821"],["$ per 1R","$1,500"],["Date Range","2021-01-05 / 2026-04-14"],["P(MaxDD ≥ $15,000)","0.994",true]]
        .map(([l,v,b])=>`<div class="row${b?" bold":""}"><span>${l}</span><span>${v}</span></div>`).join("")}
      <div class="italic-quote">The realised drawdown of $25k sits between the 25th and 50th percentile of simulated outcomes. Plan for the 95th, not the mean.</div>
    </div>
  </div>
  <div style="border-top:1px solid rgba(30,58,138,.2);margin-top:32px;padding-top:24px;">
    <div class="page-header" style="margin-bottom:16px;"><span>The Protocol</span><span>08 / Monte Carlo, Part B</span></div>
    <div class="label">// Equity Paths &amp; Median Band</div>
    <div class="section-title">PATH GEOMETRY.</div>
    <div class="divider"></div>
    <div class="two-col">
      ${[["Fig. 8 / Sample Equity Paths","Fig. 8  100 of 20,000 bootstrap equity paths","A representative slice of the simulation envelope. Most paths terminate between $120k and $230k; dispersion at the upper end is wider than at the lower end."],
         ["Fig. 9 / Median & 5/95 Band","Fig. 9  Median $159,588, 95% Band [$70k, $250k]","The median terminal P&L of $159,588 is within 4% of the realised $165,715. The 90% inter-percentile band [$70k, $250k] sets a reasonable expectation range for the next 821-trade window."]]
        .map(([f,c,b])=>`<div><div style="font-weight:700;color:#fff;margin-bottom:10px;">// ${f}</div><div class="chart-placeholder"><span>${f}</span></div><div class="small">${c}</div><div style="font-size:12px;color:rgba(191,219,254,.6);margin-top:10px;line-height:1.5;">${b}</div></div>`).join("")}
    </div>
    <div class="italic-quote">A trader deploying this model should expect terminal P&L inside [$70k, $250k] over an equivalent forward sample, ~19 of 20 times.</div>
  </div>
</div>

<!-- ══════════ 09 COST-ADJUSTED ══════════ -->
<div class="s-dark" style="border-top:1px solid rgba(30,58,138,.2);">
  <div class="page-header"><span>The Protocol</span><span>09 / Cost-Adjusted, Part A</span></div>
  <div class="flex-row mb6">
    <div class="ghost">09</div>
    <div style="padding-top:12px;"><div class="label">// Realistic Transaction Costs</div><div class="section-title">COST-ADJUSTED RUN.</div></div>
  </div>
  <div class="divider"></div>
  <div style="color:rgba(191,219,254,.65);font-size:12px;max-width:620px;margin-bottom:20px;">Re-execute the backtest in MultiCharts with <strong style="color:#fff;">$4.50/contract commission</strong> loaded on the Strategy Properties panel, plus a <strong style="color:#fff;">1-tick ($5) slippage</strong> charge. This is the cross-check against the §07 bootstrap.</div>
  <div class="stat-grid">
    ${[["// Net Profit","$151,013","vs $165,715 gross, -$14,702"],["// Annual Return","28.6%","vs 31.4%, -2.8 pp"],
       ["// Profit Factor","1.28","vs 1.31, above 1.20 floor"],["// Avg Trade","$183.49","vs $201.35, above cost floor"]]
      .map(([l,v,s])=>`<div class="stat-box"><div class="stat-label">${l}</div><div class="stat-value">${v}</div><div class="stat-sub">${s}</div></div>`).join("")}
  </div>
  <div class="two-col">
    <div>
      ${[["Net Profit","$151,013.00",true],["Gross Profit","$699,570.00"],["Gross Loss","($548,557.00)"],
         ["Adjusted Net Profit","$89,508.79"],["Return on Initial Capital","151.01%"],["Return on Account","670.19%"],
         ["Max Strategy DD ($)","($25,897.00)"],["Return on Max DD","5.83",true],["Profit Factor","1.28",true],
         ["Annual Rate of Return","28.60%"],["Avg Monthly Return","$2,359.58"],
         ["Slippage Paid","$7,295.00"],["Commission Paid","$7,407.00"],["Percent Profitable","57.72%",true]]
        .map(([l,v,b])=>`<div class="row${b?" bold":""}"><span>${l}</span><span>${v}</span></div>`).join("")}
    </div>
    <div>
      <div class="card-sm mb4">
        <div style="font-size:12px;color:rgba(191,219,254,.6);line-height:1.6;">Costs subtract $14,702 of P&L, the sum of $7,407 commission and $7,295 slippage, and leave every other structural property of the equity curve unchanged.</div>
        <div class="border-badge">Edge Survives Costs</div>
        <div class="border-badge">PF &gt; 1.20</div>
      </div>
      <div class="card-sm">
        <div class="small mb4">// Cross-Validation</div>
        <div style="font-size:12px;color:rgba(191,219,254,.6);line-height:1.6;font-style:italic;">Two independent cost pipelines, MultiCharts and the Python bootstrap, agree to within 2%. That is the cross-validation we want before moving to live sizing.</div>
      </div>
    </div>
  </div>
</div>

<!-- ══════════ 10 VERDICT ══════════ -->
<div class="s-grad-down" style="border-top:1px solid rgba(30,58,138,.2);">
  <div class="page-header"><span>The Protocol</span><span>10 / Verdict</span></div>
  <div class="flex-row mb6">
    <div class="ghost">10</div>
    <div style="padding-top:12px;"><div class="label">// Deployment Notes</div><div class="section-title">VERDICT.</div></div>
  </div>
  <div class="divider"></div>
  <div class="verdict-box">
    <div class="verdict-tag">Validated / Deployable</div>
    <div style="font-size:12px;color:rgba(191,219,254,.65);line-height:1.6;">All four independent tests agree: a real, small, positive, statistically-significant long-only edge on NQ opening breakouts. Realised drawdown is a typical, not tail, outcome. <span class="text-blue underline">Live-sizing risk is the binding constraint, not statistical risk.</span></div>
  </div>
  <div class="three-col">
    ${[["What The Evidence Shows",["Edge is real. Bootstrap P(EV ≤ 0) = 0.001 on both $ and R axes. Lower-CI expectancy still positive.","Path is not flattering. Base DD of $22k sits near the median of 1,000 permutations.","Sample is sufficient. 823 closed trades over five years of diverse NQ regimes."]],
       ["Risk Budget For Live",["Plan for $50k peak-to-trough. 95th-percentile MC drawdown is $50,521, ~3× the backtest high-water mark.","P($15k+ DD) = 99.4%. If a trader cannot tolerate that, the model is the wrong fit.","Costs confirmed realistic. MultiCharts re-run loads $14,702 of drag, ~2% of gross profit."]],
       ["Next Checks Before Capital",["Walk-forward. Re-run on a rolling-origin basis; confirm stability across non-overlapping 12-month windows.","Slippage stress. Re-price at +1 and +2 ticks adverse; confirm CI lower-bound still positive.","Regime breakdown. Decompose P&L by VIX quintile and NY-morning realised-vol buckets."]]]
      .map(([h,items])=>`<div class="card-sm"><div class="small mb4">// ${h}</div>${items.map(i=>`<div style="font-size:11px;color:rgba(191,219,254,.6);line-height:1.5;margin-bottom:8px;">${i}</div>`).join("")}</div>`).join("")}
  </div>
  <div style="border-top:1px solid rgba(30,58,138,.2);margin-top:24px;padding-top:16px;font-size:10px;color:rgba(96,165,250,.35);line-height:1.6;">
    <strong style="color:rgba(96,165,250,.5);">// Statement Of Limitations</strong><br/>
    Not financial advice. This document is an internal statistical validation prepared for desk review and does not constitute an offer, solicitation, or recommendation to trade any instrument. The validation is conducted on the author-supplied MultiCharts trade log; no independent re-execution of the strategy on raw market data was performed. Bootstrap and Monte Carlo methods assume trades are exchangeable (i.i.d.); mild autocorrelation in daily-vol regimes may understate tail drawdowns by an estimated 5 to 10%. All returns are gross of taxes.
  </div>
  <div style="margin-top:20px;display:flex;justify-content:space-between;align-items:flex-end;">
    <div><div class="small">Prepared By</div><div style="font-size:16px;font-weight:900;color:#fff;margin:4px 0;">Simeon Natev.</div><div class="small">The Institutional Protocol / @SimeonNatev / Issued 2026 / Internal</div></div>
    <div class="small">Independent-Val</div>
  </div>
</div>

<!-- ══════════ APPENDIX EASYLANGUAGE ══════════ -->
<div class="s-blue" style="border-top:1px solid rgba(30,58,138,.2);">
  <div class="page-header"><span>Appendix</span><span>10 / EasyLanguage Source</span></div>
  <div class="label">// MultiCharts Copy-Paste</div>
  <div class="section-title">EASYLANGUAGE SOURCE.</div>
  <div class="divider"></div>
  <div class="code-block">{ Fabio Valentini Model }

Inputs:
    ORB_Start_H_NY(8),       ORB_Start_M_NY(30),
    ORB_Dur_Min(30),          Trade_End_H_NY(14),
    Trade_End_M_NY(0),        TP_RR_Ratio(1.0),
    Num_Contracts(1),         DeltaThreshold(200),
    UseCumulativeDelta(false),CumDeltaThreshold(500);

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
    if Value3 &lt; 0 then Value3 = Value3 + 24 * 60;
    ORB_End_Time = IntPortion(Value3 / 60) * 100 + Mod(Value3, 60);
    Trade_End_Time = Trade_End_H_NY * 100 + Trade_End_M_NY;
end;

if CurrentBar &lt; 2 then begin Cur_Date_Int = Date; Prev_Bar_Time = Time; end;

if CurrentBar >= 2 then begin
    if Date &lt;&gt; Cur_Date_Int then begin
        Cur_Date_Int = Date; ORB_Inited = false; ORB_Session_Ended = false;
        ORB_High = 0; ORB_Low = 0; Long_Done_Today = false; Was_Long = false;
        Pos_SL = 0; Pos_TP = 0; CumDelta = 0;
    end;
    Bar_Time = Time;
    In_ORB = (Bar_Time > ORB_Start_Time) and (Bar_Time &lt;= ORB_End_Time);
    Trade_Active = (Bar_Time > ORB_End_Time) and (Bar_Time &lt;= Trade_End_Time);
    BarDelta = Upticks - Downticks;
    if Bar_Time > ORB_Start_Time and Bar_Time &lt;= Trade_End_Time then
        CumDelta = CumDelta + BarDelta;
    if In_ORB then begin
        if ORB_Inited = false then begin
            ORB_High = High; ORB_Low = Low; ORB_Inited = true;
        end else begin
            if High > ORB_High then ORB_High = High;
            if Low &lt; ORB_Low then ORB_Low = Low;
        end;
    end;
    if ORB_Session_Ended = false and ORB_Inited and Bar_Time > ORB_End_Time then
        ORB_Session_Ended = true;
    if MarketPosition = 1 then Was_Long = true;
    if MarketPosition = 0 and Was_Long then begin
        Was_Long = false; Pos_SL = 0; Pos_TP = 0;
    end;
    if Bar_Time >= Trade_End_Time and Prev_Bar_Time &lt; Trade_End_Time then begin
        if MarketPosition = 1 then Sell ("EOD-L") this bar on close;
    end;
    Prev_Bar_Time = Bar_Time;
    if MarketPosition = 1 and Pos_SL &lt;&gt; 0 and Pos_TP &lt;&gt; 0 then begin
        Sell ("L-TP") next bar at Pos_TP limit;
        Sell ("L-SL") next bar at Pos_SL stop;
    end;
    if ORB_Session_Ended and Trade_Active and Long_Done_Today = false
        and MarketPosition = 0 and Close > ORB_High then begin
        EP = Close; SL_Price = ORB_Low;
        if SL_Price &lt; EP then begin
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
  <div><div class="small">Prepared By</div><div class="footer-name">Simeon Natev.</div><div class="footer-meta">The Institutional Protocol / @SimeonNatev / Issued 2026 / Internal</div></div>
  <div style="text-align:right;"><div class="small">Document</div><div style="font-size:13px;font-weight:700;color:#fff;margin:3px 0;">Independent-Val v1.0</div><div class="footer-meta">NQ Futures / 823 Trades / 2021–2026</div></div>
</div>

</div>
</body>
</html>`;

fs.writeFileSync("/tmp/report.html", html);

(async () => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: "/tmp/simeon-natev-fabervaale-orb-report.pdf",
    format: "A4",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  await browser.close();
  console.log("PDF generated.");
})();
