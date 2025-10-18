"use client";
import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";

export function BalanceChart({
  baselineSchedule,
  targetSchedule,
  principal,
}: {
  baselineSchedule: { month: number; interest: number; principalPaid: number; balance: number }[];
  targetSchedule: { month: number; interest: number; principalPaid: number; balance: number }[];
  principal: number;
}) {
  const data = useMemo(() => {
    const years = Math.max(
      Math.ceil(baselineSchedule.length / 12),
      Math.ceil(targetSchedule.length / 12)
    );
    const byYear: { name: string; Baseline: number; Target: number }[] = [];
    for (let y = 0; y <= years; y++) {
      const bi = Math.min(baselineSchedule.length - 1, y * 12 - 1);
      const ti = Math.min(targetSchedule.length - 1, y * 12 - 1);
      byYear.push({
        name: `Year ${y}`,
        Baseline: bi >= 0 ? Math.max(0, baselineSchedule[bi].balance) : principal,
        Target: ti >= 0 ? Math.max(0, targetSchedule[ti].balance) : principal,
      });
    }
    return byYear;
  }, [baselineSchedule, targetSchedule, principal]);

  return (
    <section className="card">
      <h2 className="text-lg font-medium">Balance over time</h2>
      <div className="h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" tickFormatter={(v) => `£${Math.round(v/1000)}k`} />
            <Tooltip
              contentStyle={{ borderRadius: 12 }}
              formatter={(value: number) =>
                new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: "GBP",
                  maximumFractionDigits: 0,
                }).format(value as number)
              }
            />
            <Legend />
            <Line type="monotone" dataKey="Baseline" dot={false} strokeWidth={2} stroke="#94a3b8" />
            <Line type="monotone" dataKey="Target"   dot={false} strokeWidth={2} stroke="#2f79ff" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
