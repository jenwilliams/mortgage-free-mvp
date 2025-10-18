import { describe, expect, it } from "vitest";
import { monthlyPayment, buildSchedule, sumInterest } from "@/lib/calc";

describe("calc", () => {
  it("matches acceptance numbers within tolerance", () => {
    const P = 508_000; const APR = 3.99; const yearsRemain = 28; const targetYears = 10;
    const baselineMonthly = monthlyPayment(P, APR, yearsRemain * 12);
    const targetMonthly = monthlyPayment(P, APR, targetYears * 12);
    const baselineSchedule = buildSchedule(P, APR, baselineMonthly, yearsRemain * 12 + 1);
    const targetSchedule = buildSchedule(P, APR, targetMonthly, targetYears * 12 + 1);
    const baselineInterest = Math.round(sumInterest(baselineSchedule));
    const targetInterest = Math.round(sumInterest(targetSchedule));

    expect(Math.round(baselineMonthly)).toBeCloseTo(2513, 0);
    expect(Math.round(targetMonthly)).toBeCloseTo(5141, 0);
    expect(baselineInterest).toBeGreaterThan(targetInterest);
  });
});
