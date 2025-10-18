"use client";
import { useEffect, useMemo, useState } from "react";
import { KPI } from "@/components/KPI";
import { Field } from "@/components/Field";
import { Warning } from "@/components/Warning";
import { BalanceChart } from "@/components/BalanceChart";
import { clamp, fmtGBP, monthlyPayment, buildSchedule, sumInterest } from "@/lib/calc";
import { loadState, saveState } from "@/lib/storage";

export default function Page() {
  // Use fixed defaults on first render to avoid hydration mismatch with server-rendered HTML.
  const DEFAULTS = { loanAmount: 508_000, apr: 3.99, remainingYears: 28, targetYears: 10 };

  const [loanAmount, setLoanAmount] = useState<number>(DEFAULTS.loanAmount);
  const [apr, setApr] = useState<number>(DEFAULTS.apr);
  const [remainingYears, setRemainingYears] = useState<number>(DEFAULTS.remainingYears);
  const [targetYears, setTargetYears] = useState<number>(DEFAULTS.targetYears);
  const [hydrated, setHydrated] = useState(false);

  // After hydration, load any saved values from localStorage.
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setLoanAmount(saved.loanAmount);
      setApr(saved.apr);
      setRemainingYears(saved.remainingYears);
      setTargetYears(saved.targetYears);
    }
    setHydrated(true);
  }, []);

  // Persist changes once hydrated
  useEffect(() => {
    if (!hydrated) return;
    saveState({ loanAmount, apr, remainingYears, targetYears });
  }, [hydrated, loanAmount, apr, remainingYears, targetYears]);

  const remainingMonths = useMemo(() => clamp(Math.round(remainingYears * 12), 12, 50 * 12), [remainingYears]);
  const targetMonths = useMemo(() => clamp(Math.round(targetYears * 12), 12, 50 * 12), [targetYears]);

  const baselineMonthly = useMemo(() => monthlyPayment(loanAmount, apr, remainingMonths), [loanAmount, apr, remainingMonths]);
  const targetMonthly = useMemo(() => monthlyPayment(loanAmount, apr, targetMonths), [loanAmount, apr, targetMonths]);
  const extraNeeded = Math.max(0, targetMonthly - baselineMonthly);

  const baselineSchedule = useMemo(() => buildSchedule(loanAmount, apr, baselineMonthly, remainingMonths + 1), [loanAmount, apr, baselineMonthly, remainingMonths]);
  const targetSchedule = useMemo(() => buildSchedule(loanAmount, apr, targetMonthly, targetMonths + 1), [loanAmount, apr, targetMonthly, targetMonths]);

  const baselineInterest = useMemo(() => sumInterest(baselineSchedule), [baselineSchedule]);
  const targetInterest = useMemo(() => sumInterest(targetSchedule), [targetSchedule]);
  const interestSaved = Math.max(0, baselineInterest - targetInterest);

  const negativeAmortisation = baselineMonthly <= (loanAmount * (apr / 100 / 12));

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl grid gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-semibold">Mortgage‑Free Planner (MVP)</h1>
          <p className="text-slate-600">Estimate the monthly payment needed to clear your mortgage in a chosen timeframe and see potential interest saved. <strong>Educational use only (UK).</strong></p>
        </header>

        {negativeAmortisation && (
          <Warning title="Payment too small to reduce balance">
            With the current inputs, the baseline payment may not fully cover monthly interest. Increase the term or payment.
          </Warning>
        )}

        {/* Inputs */}
        <section className="grid md:grid-cols-4 gap-4 card">
          <Field label="Outstanding balance (£)">
            <input
              inputMode="decimal"
              className="input"
              type="number"
              min={1}
              step={1000}
              value={loanAmount}
              onChange={(e) => setLoanAmount(clamp(Number(e.target.value || 0), 1, 10_000_000))}
            />
          </Field>
          <Field label="Interest rate (APR %)">
            <input
              inputMode="decimal"
              className="input"
              type="number"
              min={0}
              step={0.01}
              value={apr}
              onChange={(e) => setApr(clamp(Number(e.target.value || 0), 0, 100))}
            />
          </Field>
          <Field label="Years remaining (baseline)">
            <input
              className="input"
              type="number"
              min={1}
              max={50}
              step={1}
              value={remainingYears}
              onChange={(e) => setRemainingYears(clamp(Number(e.target.value || 0), 1, 50))}
            />
          </Field>
          <Field label="Target payoff (years)">
            <input
              className="input"
              type="number"
              min={1}
              max={50}
              step={1}
              value={targetYears}
              onChange={(e) => setTargetYears(clamp(Number(e.target.value || 0), 1, 50))}
            />
          </Field>
        </section>

        {/* KPIs */}
        <section className="grid md:grid-cols-3 gap-4">
          <KPI title="Baseline monthly payment" value={fmtGBP(baselineMonthly)} subtitle={`${remainingMonths} months`} />
          <KPI title="Payment for target payoff" value={fmtGBP(targetMonthly)} subtitle={`${targetMonths} months`} />
          <KPI title="Extra needed per month" value={fmtGBP(extraNeeded)} subtitle={extraNeeded > 0 ? "to hit your target" : "already meets target"} />
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          <KPI title="Total interest (baseline)" value={fmtGBP(baselineInterest)} />
          <KPI title="Total interest (target)" value={fmtGBP(targetInterest)} />
          <KPI title="Interest saved" value={fmtGBP(interestSaved)} subtitle="vs baseline" />
        </section>

        {/* Chart */}
        <BalanceChart baselineSchedule={baselineSchedule} targetSchedule={targetSchedule} principal={loanAmount} />

        {/* Disclaimer */}
        <section className="text-sm text-slate-500 leading-relaxed">
          <p>
            This tool is for educational purposes only and does not account for product fees, early repayment charges, or changes in interest rate. Figures are illustrative only and may differ from lender quotes. Consider seeking advice from an FCA‑authorised adviser.
          </p>
        </section>
      </div>
    </main>
  );
}