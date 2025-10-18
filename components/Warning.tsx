export function Warning({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-warning/40 bg-amber-50 p-4">
      <div className="font-medium text-warning">{title}</div>
      {children && <div className="text-sm text-amber-800 mt-1">{children}</div>}
    </div>
  );
}
