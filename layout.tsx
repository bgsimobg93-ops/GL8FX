import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Signals",
  description: "A private Telegram channel with daily trading signals — free, in real time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
