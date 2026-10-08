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
