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
} from "recharts";

type Form = {
  balance: number;
  rate: number;      // APR %
  years: number;
  months: number;
  overpay?: number;  // £/mo
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

  return (
    <div className="p-6 mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-semibold">Your payoff plan</h1>

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

      {/* --- Motivating stats --- */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card 
          title="Without Overpayments"
          label="You'll be mortgage free by" 
          value={computed.baseDate} 
        />
        <Card
          title="With Overpayments"
          label={`With £${form.overpay || 0} overpayment you'll be mortgage free by`}
          value={computed.overDate}
          sub={
            computed.savedMonths > 0
              ? `Save ${computed.savedTime.y}y ${computed.savedTime.m}m`
              : "—"
          }
        />
        <Card
          title="Interest Saved"
          label="Total interest saved"
          value={`£${computed.interestSaved.toLocaleString()}`}
        />
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

function Card({ title, label, value, sub }: { title?: string; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
      {title && <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>}
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-emerald-700 mt-1">{sub}</p>}
    </div>
  );
}
