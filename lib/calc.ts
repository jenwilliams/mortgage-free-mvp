export const fmtGBP = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(isFinite(n) ? n : 0);
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// Monthly payment for amortising loan
export function monthlyPayment(principal: number, aprPct: number, months: number): number {
  const r = aprPct / 100 / 12;
  if (months <= 0) return 0;
  if (r === 0) return principal / months;
  return principal * (r / (1 - Math.pow(1 + r, -months)));
}

export function buildSchedule(principal: number, aprPct: number, monthlyPay: number, maxMonths = 50 * 12) {
  const r = aprPct / 100 / 12;
  const rows: { month: number; interest: number; principalPaid: number; balance: number }[] = [];
  let bal = principal;
  let m = 0;
  while (bal > 0 && m < maxMonths) {
    const interest = bal * r;
    let principalPaid = monthlyPay - interest;
    if (principalPaid <= 0) principalPaid = 0; // guard negative amortisation
    if (principalPaid > bal) principalPaid = bal;
    bal = bal - principalPaid;
    rows.push({ month: m + 1, interest, principalPaid, balance: bal });
    m++;
    if (m > 1200) break; // hard safety limit
  }
  return rows;
}

export function sumInterest(schedule: ReturnType<typeof buildSchedule>) {
  return schedule.reduce((acc, r) => acc + r.interest, 0);
}
