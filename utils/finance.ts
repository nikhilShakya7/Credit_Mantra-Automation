/**
 * Lightweight finance utilities for calculators & assertions.
 */
export function toNPR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount))
    return "NPR 0";
  return `NPR ${Math.round(amount).toLocaleString()}`;
}

export function toPercent(
  value: number | null | undefined,
  decimals = 1,
): string {
  if (value === null || value === undefined || Number.isNaN(value))
    return "0.0%";
  return `${value.toFixed(decimals)}%`;
}

export function pmt(
  rateAnnualPct: number,
  years: number,
  principal: number,
): number {
  const months = years * 12;
  if (months <= 0) return 0;
  const r = rateAnnualPct / 100 / 12;
  if (r === 0) return principal / months;
  const numerator = r * principal * Math.pow(1 + r, months);
  const denominator = Math.pow(1 + r, months) - 1;
  return numerator / denominator;
}

export function totalPayment(emi: number, months: number): number {
  return emi * months;
}

export function totalInterest(
  emi: number,
  months: number,
  principal: number,
): number {
  return totalPayment(emi, months) - principal;
}

export function dti(percent: number): string {
  if (percent <= 15) return "Excellent / Low Debt";
  if (percent <= 36) return "Moderate Debt Ratio";
  if (percent <= 50) return "High Debt Burden";
  return "Critical Debt Levels";
}

export function dtiBadgeClass(percent: number): string {
  if (percent <= 36) return "badge-low";
  if (percent <= 50) return "badge-medium";
  return "badge-high";
}

/** Same grouping the calculators use (`formatNumber`): 1234567 -> "1,234,567". */
export function formatAmount(amount: number): string {
  return Math.round(amount).toLocaleString("en-US");
}

/** "NPR 22,244" - the exact string the calculator writes into the hero value. */
export function npr(amount: number): string {
  return `NPR ${formatAmount(amount)}`;
}

/**
 * Standard reducing-balance EMI, mirroring `calculateEMI()` in the app's JS.
 * Inputs are clamped to the app's slider bounds (principal 25k..2.5Cr,
 * rate 0..24%, tenure 0..30yrs) before the formula is applied.
 */
export function emiMonthly(
  principal: number,
  annualRatePct: number,
  years: number,
): number {
  const p = Math.min(Math.max(principal, 0), 25_000_000);
  const r = Math.min(Math.max(annualRatePct, 0), 24);
  const y = Math.min(Math.max(years, 0), 30);
  const monthlyRate = r / 12 / 100;
  const months = Math.round(y * 12);
  if (p <= 0 || months <= 0) return 0;
  if (monthlyRate > 0) {
    return (p * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
  }
  return p / months;
}

/** Total interest over the life of the loan (app: `totalPayment - principal`). */
export function emiTotalInterest(
  principal: number,
  annualRatePct: number,
  years: number,
): number {
  const emi = emiMonthly(principal, annualRatePct, years);
  const months = Math.round(
    Math.min(Math.max(years, 0), 30) * 12,
  );
  return Math.max(0, emi * months - principal);
}

export interface SalaryTaxInput {
  basic: number;
  months?: number;
  grade?: number;
  allowances?: number;
  bonus?: number;
  otherIncome?: number;
  ssf?: number;
  epf?: number;
  cit?: number;
  insurance?: number;
  medical?: number;
  fy?: "8283" | "8384";
  status?: "single" | "married";
  female?: boolean;
  ssfContributor?: boolean;
}

export interface SalaryTaxResult {
  grossAnnual: number;
  retirementApplied: number;
  totalDeduction: number;
  assessable: number;
  totalTax: number;
  monthlyTax: number;
  effectivePct: number;
  monthlyTakehome: number;
}

/**
 * Reproduces `calculateSalaryTax()` from the app's JS (Nepal FY 2082/83 and the
 * proposed FY 2083/84 slabs), so tests can assert the UI numbers are arithmetically
 * correct rather than just "contains NPR".
 */
export function salaryTax(input: SalaryTaxInput): SalaryTaxResult {
  const nonNeg = (v = 0) => (Number.isFinite(v) && v > 0 ? v : 0);
  const basic = nonNeg(input.basic);
  const grade = nonNeg(input.grade);
  const allowances = nonNeg(input.allowances);
  const bonus = nonNeg(input.bonus);
  const otherIncome = nonNeg(input.otherIncome);
  const months = Math.min(Math.max(nonNeg(input.months ?? 12) || 1, 1), 12);
  const ssf = nonNeg(input.ssf);
  const epf = nonNeg(input.epf);
  const cit = nonNeg(input.cit);
  const insurance = nonNeg(input.insurance);
  const medical = nonNeg(input.medical);
  const fy = input.fy ?? "8283";
  const status = input.status ?? "single";

  const grossAnnual = (basic + grade + allowances) * months + bonus + otherIncome;

  const totalRetirement = ssf + epf + cit;
  const retirementCap = Math.min(grossAnnual / 3, 500_000);
  const retirementApplied = Math.min(totalRetirement, retirementCap);
  const lifeInsApplied = Math.min(insurance, 40_000);
  const medInsApplied = Math.min(medical, 20_000);
  const totalDeduction = retirementApplied + lifeInsApplied + medInsApplied;
  const assessable = Math.max(0, grossAnnual - totalDeduction);

  type Slab = { limit: number; rate: number };
  let slabs: Slab[];
  if (fy === "8384") {
    slabs = [
      { limit: 1_000_000, rate: 0.01 },
      { limit: 300_000, rate: 0.1 },
      { limit: 700_000, rate: 0.2 },
      { limit: 1_000_000, rate: 0.265 },
      { limit: Infinity, rate: 0.29 },
    ];
  } else if (status === "married") {
    slabs = [
      { limit: 600_000, rate: 0.01 },
      { limit: 200_000, rate: 0.1 },
      { limit: 300_000, rate: 0.2 },
      { limit: 1_000_000, rate: 0.3 },
      { limit: 3_000_000, rate: 0.36 },
      { limit: Infinity, rate: 0.39 },
    ];
  } else {
    slabs = [
      { limit: 500_000, rate: 0.01 },
      { limit: 200_000, rate: 0.1 },
      { limit: 300_000, rate: 0.2 },
      { limit: 1_000_000, rate: 0.3 },
      { limit: 3_000_000, rate: 0.36 },
      { limit: Infinity, rate: 0.39 },
    ];
  }

  let remaining = assessable;
  let totalTax = 0;
  for (let i = 0; i < slabs.length && remaining > 0; i++) {
    const slab = slabs[i];
    const cap = slab.limit === Infinity ? remaining : slab.limit;
    const taxable = Math.min(remaining, cap);
    if (taxable <= 0) continue;
    const rate = i === 0 && input.ssfContributor ? 0 : slab.rate;
    totalTax += taxable * rate;
    remaining -= taxable;
  }

  if (input.female && status === "single") {
    totalTax -= totalTax * 0.1;
  }

  return {
    grossAnnual,
    retirementApplied,
    totalDeduction,
    assessable,
    totalTax,
    monthlyTax: totalTax / 12,
    effectivePct: grossAnnual > 0 ? (totalTax / grossAnnual) * 100 : 0,
    monthlyTakehome: (grossAnnual - totalTax) / 12,
  };
}
