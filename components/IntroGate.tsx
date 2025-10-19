"use client";
import { useEffect, useState } from "react";

export default function IntroGate({ children }: { children: React.ReactNode }) {
  const [hasSetup, setHasSetup] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("mortgageData");
    setHasSetup(!!saved);
  }, []);

  if (hasSetup === null) return null; // avoid hydration mismatch
  return hasSetup ? <>{children}</> : <Welcome />;
}

function Welcome() {
  return (
    <div className="min-h-dvh grid place-items-center bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full max-w-xl rounded-2xl shadow-soft bg-white p-8">
        <h1 className="text-3xl font-semibold">Welcome to Mortgage-Free</h1>
        <p className="mt-3 text-slate-600">
          See how small overpayments can shave years off your mortgage and save thousands in interest.
        </p>
        <ul className="mt-4 space-y-2 text-slate-700 list-disc pl-5">
          <li>Add your current mortgage details</li>
          <li>Adjust overpayments and interest rate</li>
          <li>Get a clear payoff date and savings estimate</li>
        </ul>
        <a href="/setup" className="mt-6 inline-flex btn-primary">Get started</a>
        <div className="mt-3 text-xs text-slate-500 space-y-1">
          <p>No sign-up needed. Your data stays on your device.</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">
            <li>• This tool assumes you have no other significant debts and have rainy day savings of 10% your annual income.</li>
            <li>• This tool is for educational-use only and does not offer financial advice.</li>
            <li>• Before making financial decisions, please seek advice from a Financial Advisor.</li>
            <li>• Figures shown are estimates based on the information you enter and current market assumptions, which may change over time.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
