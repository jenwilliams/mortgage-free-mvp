export function computePlan({ balance, rate, years, months, overpay=0 }:{
  balance:number; rate:number; years:number; months:number; overpay?:number
}) {
  const n = (years*12) + months;
  const r = rate/100/12;
  const basePayment = r === 0 ? balance/n : (balance*r)/(1 - Math.pow(1+r, -n));
  const payment = basePayment + (overpay||0);

  // amortize to get months to payoff and interest
  let principal = balance, interest=0, m=0;
  while (principal > 0 && m < 1200) {
    const int = r * principal;
    const princ = Math.max(0, payment - int);
    principal -= princ;
    interest += int;
    m++;
    if (principal <= 0) break;
  }
  const monthsSaved = n - m;
  return {
    basePayment: Math.round(basePayment),
    payment: Math.round(payment),
    totalInterest: Math.round(interest),
    monthsToClear: m,
    monthsSaved
  };
}
