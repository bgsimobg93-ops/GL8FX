import { NextRequest, NextResponse } from "next/server";

interface BalancePoint {
  date: string;
  balance: number;
}

function generateHistory(startBalance: number, days: number, seed: number): BalancePoint[] {
  const history: BalancePoint[] = [];
  let balance = startBalance;
  let s = seed;

  const rand = () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return ((s >>> 0) / 0xffffffff);
  };

  const base = new Date("2026-06-04");

  for (let i = days; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const change = (rand() - 0.44) * startBalance * 0.009;
    balance = Math.max(balance + change, startBalance * 0.87);
    history.push({
      date: d.toISOString().split("T")[0],
      balance: Math.round(balance * 100) / 100,
    });
  }

  return history;
}

const DEMO_ACCOUNTS = [
  {
    id: "ATF-48291",
    traderName: "Ivan Petrov",
    accountSize: 100000,
    balance: 102450,
    startingBalance: 100000,
    dailyPnL: 820,
    dailyLossLimit: -2000,
    maxTrailingDrawdown: 97000,
    status: "active",
    lastUpdated: new Date().toISOString(),
    balanceHistory: generateHistory(100000, 21, 0x4a3f),
  },
  {
    id: "ATF-51847",
    traderName: "Maria Georgieva",
    accountSize: 50000,
    balance: 51890,
    startingBalance: 50000,
    dailyPnL: -340,
    dailyLossLimit: -1000,
    maxTrailingDrawdown: 48000,
    status: "active",
    lastUpdated: new Date().toISOString(),
    balanceHistory: generateHistory(50000, 21, 0xd3c1),
  },
  {
    id: "ATF-39012",
    traderName: "Georgi Stoyanov",
    accountSize: 150000,
    balance: 162800,
    startingBalance: 150000,
    dailyPnL: 1540,
    dailyLossLimit: -3000,
    maxTrailingDrawdown: 145500,
    status: "passed",
    lastUpdated: new Date().toISOString(),
    balanceHistory: generateHistory(150000, 21, 0x82b5),
  },
  {
    id: "ATF-62341",
    traderName: "Elena Ivanova",
    accountSize: 50000,
    balance: 48100,
    startingBalance: 50000,
    dailyPnL: -890,
    dailyLossLimit: -1000,
    maxTrailingDrawdown: 47500,
    status: "active",
    lastUpdated: new Date().toISOString(),
    balanceHistory: generateHistory(50000, 21, 0x1f7a),
  },
  {
    id: "ATF-77853",
    traderName: "Dimitar Nikolov",
    accountSize: 25000,
    balance: 23450,
    startingBalance: 25000,
    dailyPnL: -380,
    dailyLossLimit: -500,
    maxTrailingDrawdown: 23500,
    status: "active",
    lastUpdated: new Date().toISOString(),
    balanceHistory: generateHistory(25000, 21, 0x6e92),
  },
  {
    id: "ATF-88420",
    traderName: "Petya Krasteva",
    accountSize: 100000,
    balance: 97200,
    startingBalance: 100000,
    dailyPnL: -200,
    dailyLossLimit: -2000,
    maxTrailingDrawdown: 97000,
    status: "failed",
    lastUpdated: new Date().toISOString(),
    balanceHistory: generateHistory(100000, 21, 0x3b08),
  },
];

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("X-Apex-Key");
  const baseUrl =
    request.headers.get("X-Apex-Base-URL") ||
    "https://api.apextraderfunding.com/v1";

  if (!apiKey || apiKey === "demo") {
    return NextResponse.json({ accounts: DEMO_ACCOUNTS, mode: "demo" });
  }

  try {
    const response = await fetch(`${baseUrl}/accounts`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Apex API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ accounts: data, mode: "live" });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to connect to Apex API",
        details: String(error),
      },
      { status: 502 }
    );
  }
}
