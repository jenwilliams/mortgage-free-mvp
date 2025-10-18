import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mortgage‑Free Planner (MVP)",
  description: "Estimate what you need per month to clear your mortgage in a chosen timeframe. UK educational tool.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}