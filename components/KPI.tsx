export function KPI({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="card" role="group" aria-label={title}>
      <div className="kpi-title">{title}</div>
      <div className="kpi-value mt-1" aria-live="polite" suppressHydrationWarning>{value}</div>
      {subtitle && <div className="kpi-sub mt-1">{subtitle}</div>}
    </div>
  );
}
