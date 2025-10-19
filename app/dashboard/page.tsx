"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Form = {
  balance: number;
  rate: number;      // APR %
  years: number;
  months: number;
  overpay?: number;  // £/mo
  originalMortgage?: number;
};

// ---------- helpers ----------
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const addMonths = (start: Date, months: number) =>
  new Date(start.getFullYear(), start.getMonth() + months, 1);
const fmtMonth = (d: Date) =>
  d.toLocaleString(undefined, { month: "short", year: "numeric" });

function amortize(
  balance: number,
  aprPercent: number,
  termMonths: number,
  extraOverpay = 0
) {
  const r = aprPercent / 100 / 12;
  const basePayment =
    r === 0 ? balance / termMonths : (balance * r) / (1 - Math.pow(1 + r, -termMonths));
  const payment = basePayment + extraOverpay;

  let principal = balance;
  let interestTotal = 0;
  let m = 0;

  // monthly points for the chart
  const points: { month: number; balance: number }[] = [{ month: 0, balance }];

  // protect against non-reducing payment (e.g., too-low payment when rate very high)
  if (payment <= principal * r && r > 0) {
    // force at least some reduction of principal
    const safetyPayment = principal * r + 1;
    console.warn("Payment was not reducing principal; using safety payment instead.");
    return amortize(balance, aprPercent, termMonths, safetyPayment - basePayment);
  }

  while (principal > 0 && m < 1200) {
    const interest = r * principal;
    const principalPaid = Math.max(0, payment - interest);
    principal = principal - principalPaid;
    interestTotal += interest;
    m++;
    points.push({ month: m, balance: Math.max(0, principal) });
    if (principal <= 0) break;
  }

  return {
    monthsToClear: m,
    totalInterest: Math.round(interestTotal),
    basePayment: Math.round(basePayment),
    monthlyPayment: Math.round(payment),
    points, // for chart
  };
}

function buildChartData(basePoints: { month: number; balance: number }[],
                        withPoints: { month: number; balance: number }[]) {
  const maxLen = Math.max(basePoints.length, withPoints.length);
  const rows = [];
  for (let i = 0; i < maxLen; i++) {
    rows.push({
      year: Math.floor(i / 12),
      current: basePoints[i]?.balance ?? null,
      overpay: withPoints[i]?.balance ?? null,
    });
  }
  return rows;
}

function monthsToYearsMonths(m: number) {
  const y = Math.floor(m / 12);
  const rem = m % 12;
  return { y, m: rem };
}

// ---------- page ----------
export default function Dashboard() {
  const [form, setForm] = useState<Form | null>(null);

  // load saved setup
  useEffect(() => {
    const saved = localStorage.getItem("mortgageData");
    if (!saved) {
      window.location.href = "/setup";
      return;
    }
    const data = JSON.parse(saved) as Form;
    setForm({
      balance: data.balance,
      rate: data.rate,
      years: data.years,
      months: data.months,
      overpay: data.overpay ?? 0,
      originalMortgage: data.originalMortgage ?? 0,
    });
  }, []);

  // recompute on form change
  const computed = useMemo(() => {
    if (!form) return null;

    const n = form.years * 12 + form.months;
    const base = amortize(form.balance, form.rate, n, 0);
    const withOver = amortize(form.balance, form.rate, n, form.overpay || 0);

    const chartData = buildChartData(base.points, withOver.points);

    const savedMonths = base.monthsToClear - withOver.monthsToClear;
    const savedTime = monthsToYearsMonths(Math.max(0, savedMonths));
    const interestSaved = Math.max(0, base.totalInterest - withOver.totalInterest);

    const now = new Date();
    const baseDate = fmtMonth(addMonths(now, base.monthsToClear));
    const overDate = fmtMonth(addMonths(now, withOver.monthsToClear));

    return {
      base,
      withOver,
      chartData,
      savedMonths,
      savedTime,
      interestSaved,
      baseDate,
      overDate,
    };
  }, [form]);

  // persist on change
  useEffect(() => {
    if (form) localStorage.setItem("mortgageData", JSON.stringify(form));
  }, [form]);

  if (!form || !computed) return null;

  const onNum = (v: string) => Number(v.replace(/[^\d.]/g, "") || 0);

  // Calculate mortgage progress
  const originalMortgage = form.originalMortgage || 0;
  const currentBalance = form.balance || 0;
  const paidOff = originalMortgage > 0 ? Math.max(0, originalMortgage - currentBalance) : 0;
  const mortgageProgress = originalMortgage > 0 ? Math.min(100, Math.max(0, (paidOff / originalMortgage) * 100)) : 0;
  
  // Donut chart data - ensure we have valid data for the chart
  const donutData = originalMortgage > 0 && paidOff > 0 ? [
    { name: 'Paid Off', value: paidOff, color: '#10b981' },
    { name: 'Remaining', value: currentBalance, color: '#e5e7eb' }
  ] : originalMortgage > 0 ? [
    { name: 'Remaining', value: currentBalance, color: '#e5e7eb' }
  ] : [
    { name: 'Current Balance', value: currentBalance || 1, color: '#e5e7eb' }
  ];

  return (
    <div className="p-6 mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-semibold">Mortgage-free plan</h1>

      {/* --- Progress Donut Chart --- */}
      <section className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="rounded-2xl bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Mortgage Progress</h3>
            <div className="relative w-32 h-32 mx-auto">
              {donutData.length > 0 && donutData[0].value > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      dataKey="value"
                      startAngle={90}
                      endAngle={450}
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-300 rounded-full">
                  <div className="text-slate-400 text-xs text-center">
                    No data
                  </div>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {originalMortgage > 0 ? Math.round(mortgageProgress) : '—'}%
                  </div>
                  <div className="text-xs text-slate-500">mortgage-free</div>
                </div>
              </div>
            </div>
            {originalMortgage > 0 ? (
              <p className="text-xs text-slate-500 text-center mt-2">
                £{Math.round(paidOff).toLocaleString()} paid off out of £{originalMortgage.toLocaleString()}
              </p>
            ) : (
              <p className="text-xs text-slate-500 text-center mt-2">
                Add original mortgage value to see progress
              </p>
            )}
          </div>
        </div>

        {/* --- Years Saved Card --- */}
        <div className="md:col-span-1">
          <div className="rounded-2xl bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.06)] text-center">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Time Saved</h3>
            <div className="text-4xl font-bold text-emerald-700 mb-1">
              {computed.savedTime.y > 0 || computed.savedTime.m > 0 
                ? `${computed.savedTime.y}y ${computed.savedTime.m}m` 
                : '0y 0m'}
            </div>
            <p className="text-sm text-slate-600">
              New pay-off date {computed.overDate}
            </p>
          </div>
        </div>

        {/* --- Interest Saved Card --- */}
        <div className="md:col-span-1">
          <div className="rounded-2xl bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.06)] text-center">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Interest Saved</h3>
            <div className="text-2xl font-bold text-slate-900">
              £{computed.interestSaved.toLocaleString()}
            </div>
            <p className="text-sm text-slate-600">
              vs current plan
            </p>
          </div>
        </div>

        {/* --- Mortgage Details Card --- */}
        <div className="md:col-span-1">
          <div className="rounded-2xl bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Mortgage Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">Rate:</span>
                <span className="ml-2 font-medium">{form.rate}% APR</span>
              </div>
              <div>
                <span className="text-slate-500">Balance:</span>
                <span className="ml-2 font-medium">£{form.balance.toLocaleString()}</span>
              </div>
            </div>
            <button 
              className="mt-3 w-full btn-ghost text-sm"
              onClick={() => window.location.href = '/setup'}
            >
              Edit Details
            </button>
          </div>
        </div>
      </section>

      {/* --- Action Cards --- */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* One-off Payment Card */}
        <div className="rounded-2xl bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Make a one-off payment</h3>
          <p className="text-sm text-slate-600 mb-3">
            Adding a one-off payment from your savings or a bonus can make you mortgage-free sooner.
          </p>
          <button className="btn-primary w-full">Add One-off Payment</button>
        </div>

        {/* Did You Know Card */}
        <div className="rounded-2xl bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.06)] relative">
          <button 
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
            onClick={() => {/* Add dismiss logic */}}
          >
            ×
          </button>
          <h3 className="text-sm font-medium text-slate-700 mb-2">Did you know?</h3>
          <p className="text-sm text-slate-600">
            Even small overpayments can save thousands in interest. A £100/month overpayment on a £200k mortgage can save over £30k in interest and pay it off 8 years early!
          </p>
        </div>
      </section>

      {/* --- Prefilled, editable form --- */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Field label="Mortgage balance (£)">
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink-300"
            inputMode="decimal"
            value={form.balance}
            onChange={(e) =>
              setForm({ ...form, balance: onNum(e.target.value) })
            }
          />
        </Field>

        <Field label="Interest rate (APR %)">
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink-300"
            type="number"
            step="0.01"
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Years">
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink-300"
              type="number"
              min={0}
              value={form.years}
              onChange={(e) =>
                setForm({ ...form, years: clamp(Number(e.target.value), 0, 50) })
              }
            />
          </Field>
          <Field label="Months">
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink-300"
              type="number"
              min={0}
              max={11}
              value={form.months}
              onChange={(e) =>
                setForm({ ...form, months: clamp(Number(e.target.value), 0, 11) })
              }
            />
          </Field>
        </div>

        <div className="lg:col-span-1 md:col-span-2">
          <Field label="Monthly overpayment (£)">
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink-300"
              type="number"
              min={0}
              step={10}
              value={form.overpay || 0}
              onChange={(e) =>
                setForm({ ...form, overpay: Math.max(0, Number(e.target.value)) })
              }
            />
            <div className="mt-3">
              <input
                className="w-full"
                type="range"
                min={0}
                max={2000}
                step={50}
                value={form.overpay || 0}
                onChange={(e) =>
                  setForm({ ...form, overpay: Number(e.target.value) })
                }
              />
              <p className="mt-1 text-sm text-slate-600">
                Current: <span className="font-medium">£{form.overpay || 0}</span>/month
              </p>
            </div>
          </Field>
        </div>
      </section>


      {/* --- Chart: current vs overpayment --- */}
      <section className="rounded-2xl bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
        <h2 className="text-lg font-semibold">Repayment schedule</h2>
        <p className="text-sm text-slate-600">
          Compare your current schedule vs. adding an overpayment.
        </p>

        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={computed.chartData} margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="year" 
                tickFormatter={(y) => `${y}y`} 
                ticks={[...Array(Math.ceil(computed.chartData.length / 12) + 1)].map((_, i) => i)} 
              />
              <YAxis
                tickFormatter={(v) =>
                  v >= 1_000_000 ? `£${Math.round(v / 1000)}k` : `£${Math.round(v)}`
                }
              />
              <Tooltip
                formatter={(v: any) => `£${Math.round(v).toLocaleString()}`}
                labelFormatter={(y: any) => `${y} years`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="current"
                name="Current"
                strokeWidth={2}
                fillOpacity={0.3}
                fill="url(#g1)"
                stroke="#3b82f6"
              />
              <Area
                type="monotone"
                dataKey="overpay"
                name="With overpayment"
                strokeWidth={2}
                fillOpacity={0.6}
                fill="url(#g2)"
                stroke="#10b981"
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* --- Data Table --- */}
      <section className="rounded-2xl bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
        <h2 className="text-lg font-semibold mb-4">Payment Schedule Details</h2>
        <p className="text-sm text-slate-600 mb-4">
          Year-by-year breakdown of your mortgage balance.
        </p>
        
        <div className="max-w-2xl mx-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 font-medium text-slate-700">Year</th>
                <th className="text-right py-3 px-2 font-medium text-slate-700">Without Overpayment</th>
                <th className="text-right py-3 px-2 font-medium text-slate-700">With Overpayment</th>
              </tr>
            </thead>
            <tbody>
              {computed.chartData
                .filter((_, index) => index % 12 === 0 || index === computed.chartData.length - 1)
                .map((row, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 text-slate-600 font-medium">{row.year}y</td>
                    <td className="py-3 px-2 text-right">
                      {row.current !== null ? `£${Math.round(row.current).toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-2 text-right text-emerald-700 font-medium">
                      {row.overpay !== null ? `£${Math.round(row.overpay).toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- Action / share --- */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="inline-flex items-center rounded-xl border px-4 py-2"
          onClick={() => {
            localStorage.removeItem("mortgageData");
            window.location.href = "/setup";
          }}
        >
          Start over
        </button>

        <button
          className="inline-flex items-center rounded-xl border px-4 py-2"
          onClick={() =>
            navigator.share?.({
              title: "Mortgage-Free",
              text:
                "I'm using this to see how overpayments reduce my payoff date and interest.",
              url: location.origin,
            })
          }
        >
          Share with a friend
        </button>
      </div>
    </div>
  );
}

// ---------- UI bits ----------
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

