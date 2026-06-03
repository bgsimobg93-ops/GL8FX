import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GL8FX Training Hub",
  description: "Internal training portal for GL8FX team leaders.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
