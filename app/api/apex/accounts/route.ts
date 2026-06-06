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

const FIRST_NAMES = [
  "Ivan", "Maria", "Georgi", "Elena", "Dimitar", "Petya", "Nikolay", "Desislava",
  "Stoyan", "Galina", "Hristo", "Yana", "Aleksandar", "Viktoria", "Boris", "Tsvetelina",
  "Kaloyan", "Radost", "Martin", "Iva", "Plamen", "Silvia", "Todor", "Nadezhda",
  "Emil", "Kristina", "Valentin", "Mariana", "Stefan", "Daniela",
];
const LAST_NAMES = [
  "Petrov", "Georgieva", "Stoyanov", "Ivanova", "Nikolov", "Krasteva", "Dimitrov",
  "Angelova", "Todorov", "Marinova", "Hristov", "Koleva", "Vasilev", "Popova",
  "Iliev", "Stefanova", "Mihaylov", "Dimova", "Yordanov", "Petkova",
];

const SIZES = [25000, 50000, 100000, 150000];

function generateDemoAccounts() {
  const base = 0x9e3779b1;
  return Array.from({ length: 100 }, (_, idx) => {
    const i = idx + 1;
    const seed = Math.imul(i, 0x27d4eb2f) ^ base;
    let s = seed >>> 0;
    const rand = () => {
      s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
      s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
      s ^= s >>> 16;
      return (s >>> 0) / 0xffffffff;
    };

    const accountSize = SIZES[Math.floor(rand() * SIZES.length)];
    const dailyLossLimit = -Math.round(accountSize * 0.02); // 2% daily loss limit

    // Daily P&L: mostly small swings, a few big winners / drawdown hits
    const roll = rand();
    let dailyPnL: number;
    if (roll < 0.14) {
      // hit daily drawdown
      dailyPnL = -(Math.abs(dailyLossLimit) + Math.round(rand() * accountSize * 0.01));
    } else {
      dailyPnL = Math.round((rand() - 0.4) * accountSize * 0.035);
    }

    const balance = accountSize + Math.round((rand() - 0.35) * accountSize * 0.08);
    const maxTrailingDrawdown = Math.round(accountSize * (0.94 + rand() * 0.03));

    let status: "active" | "passed" | "failed" | "pending";
    const sRoll = rand();
    if (balance < maxTrailingDrawdown) status = "failed";
    else if (sRoll < 0.12) status = "passed";
    else if (sRoll < 0.18) status = "failed";
    else if (sRoll < 0.22) status = "pending";
    else status = "active";

    return {
      id: `ATF-${String(10000 + i * 137).slice(-5)}`,
      traderName: `${FIRST_NAMES[idx % FIRST_NAMES.length]} ${LAST_NAMES[idx % LAST_NAMES.length]}`,
      accountSize,
      balance,
      startingBalance: accountSize,
      dailyPnL,
      dailyLossLimit,
      maxTrailingDrawdown,
      status,
      lastUpdated: new Date().toISOString(),
      balanceHistory: generateHistory(accountSize, 21, seed),
    };
  });
}

const DEMO_ACCOUNTS = generateDemoAccounts();

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
