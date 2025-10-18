export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
