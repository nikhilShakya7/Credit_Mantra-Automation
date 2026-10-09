import { test, expect } from '@playwright/test';
import { CalculatorsPage } from '../../pages/CalculatorsPage';
import { emiMonthly, emiTotalInterest, npr, salaryTax } from '../../utils/finance';

/**
 * These tests recompute every figure from the published formula and compare it
 * to what the UI renders, so a wrong result fails even when the format is fine.
 */
test.describe('Integration: Calculator calculation correctness', () => {
  test('EMI outputs equal the reducing-balance formula', async ({ page }) => {
    const calc = new CalculatorsPage(page);
    await calc.gotoCalc();
    await calc.switchTabEmi();

    const cases = [
      { principal: 1_000_000, rate: 12, tenureYrs: 5 },
      { principal: 2_500_000, rate: 9.5, tenureYrs: 10 },
      { principal: 4_500_000, rate: 18.75, tenureYrs: 2.5 },
      { principal: 25_000_000, rate: 24, tenureYrs: 30 },
    ];

    for (const c of cases) {
      await calc.setEmi(c.principal, c.rate, c.tenureYrs);

      const emi = emiMonthly(c.principal, c.rate, c.tenureYrs);
      const months = Math.round(c.tenureYrs * 12);
      const totalInterest = emiTotalInterest(c.principal, c.rate, c.tenureYrs);
      const totalPayment = emi * months;

      await expect(
        calc.emiOutput,
        `EMI for ${JSON.stringify(c)}`,
      ).toHaveText(npr(emi));
      await expect(calc.emiTotalInterest).toHaveText(npr(totalInterest));
      await expect(calc.emiTotalPayment).toHaveText(npr(totalPayment));
    }
  });

  test('DTI percentage equals debts / income * 100', async ({ page }) => {
    const calc = new CalculatorsPage(page);
    await calc.gotoCalc();
    await calc.switchTabDti();

    const cases = [
      { income: 200_000, debts: 30_000, badge: 'Excellent / Low Debt' },
      { income: 90_000, debts: 27_000, badge: 'Moderate Debt Ratio' },
      { income: 45_000, debts: 10_000, badge: 'Moderate Debt Ratio' },
      { income: 120_000, debts: 60_000, badge: 'High Debt Burden' },
      { income: 80_000, debts: 56_000, badge: 'Critical Debt Levels' },
    ];

    for (const c of cases) {
      await calc.dtiIncomeInput.fill(String(c.income));
      await calc.dtiDebtsInput.fill(String(c.debts));
      await calc.dtiDebtsInput.blur();

      const percent = (c.debts / c.income) * 100;
      await expect(
        calc.dtiOutputPct,
        `DTI for ${JSON.stringify(c)}`,
      ).toHaveText(`${percent.toFixed(1)}%`);
      await expect(calc.dtiRiskBadge).toHaveText(c.badge, { ignoreCase: true });
    }
  });

  test('Salary tax (single, no deductions) matches the slab calculation', async ({ page }) => {
    const calc = new CalculatorsPage(page);
    await calc.gotoCalc();
    await calc.switchTabTax();

    const input = { basic: 50_000, months: 12, fy: '8283' as const, status: 'single' as const };
    await calc.taxFy.selectOption(input.fy);
    await calc.taxStatus.selectOption(input.status);
    await calc.taxBasic.fill(String(input.basic));
    await calc.taxMonths.fill(String(input.months));

    const expected = salaryTax(input);
    await expect(calc.taxGrossDisplay).toHaveText(npr(expected.grossAnnual));
    await expect(calc.taxRetireApplied).toHaveText(npr(expected.retirementApplied));
    await expect(calc.taxTotalDeduction).toHaveText(npr(expected.totalDeduction));
    await expect(calc.taxOutput).toHaveText(npr(expected.totalTax));
    await expect(calc.taxOutputMonthly).toHaveText(`Monthly: ${npr(expected.monthlyTax)}`);
    await expect(calc.taxEffectiveRate).toHaveText(`${expected.effectivePct.toFixed(2)}%`);
    await expect(calc.taxTakehome).toHaveText(npr(expected.monthlyTakehome));
  });

  test('Salary tax (married + retirement/insurance deductions capped) is correct', async ({ page }) => {
    const calc = new CalculatorsPage(page);
    await calc.gotoCalc();
    await calc.switchTabTax();

    const input = {
      basic: 100_000,
      months: 12,
      ssf: 200_000,
      insurance: 30_000,
      medical: 15_000,
      fy: '8283' as const,
      status: 'married' as const,
    };
    await calc.taxFy.selectOption(input.fy);
    await calc.taxStatus.selectOption(input.status);
    await calc.taxBasic.fill(String(input.basic));
    await calc.taxSsf.fill(String(input.ssf));
    await calc.taxInsurance.fill(String(input.insurance));
    await calc.taxMedical.fill(String(input.medical));

    const expected = salaryTax(input);
    await expect(calc.taxGrossDisplay).toHaveText(npr(expected.grossAnnual));
    await expect(calc.taxRetireApplied).toHaveText(npr(expected.retirementApplied));
    await expect(calc.taxTotalDeduction).toHaveText(npr(expected.totalDeduction));
    await expect(calc.taxOutput).toHaveText(npr(expected.totalTax));
    await expect(calc.taxOutputMonthly).toHaveText(`Monthly: ${npr(expected.monthlyTax)}`);
    await expect(calc.taxEffectiveRate).toHaveText(`${expected.effectivePct.toFixed(2)}%`);
  });

  test('Salary tax: SSF 1% waiver and female rebate are applied', async ({ page }) => {
    const calc = new CalculatorsPage(page);
    await calc.gotoCalc();
    await calc.switchTabTax();

    const input = {
      basic: 100_000,
      months: 12,
      fy: '8283' as const,
      status: 'single' as const,
      ssfContributor: true,
      female: true,
    };
    await calc.taxFy.selectOption(input.fy);
    await calc.taxStatus.selectOption(input.status);
    await calc.taxSsfContrib.check();
    await calc.taxFemale.check();
    await calc.taxBasic.fill(String(input.basic));

    const expected = salaryTax(input);
    await expect(calc.taxOutput).toHaveText(npr(expected.totalTax));
    await expect(calc.taxEffectiveRate).toHaveText(`${expected.effectivePct.toFixed(2)}%`);
  });

  test('Proposed FY 2083/84 slabs are applied (uniform, top rate 29%)', async ({ page }) => {
    const calc = new CalculatorsPage(page);
    await calc.gotoCalc();
    await calc.switchTabTax();

    const input = { basic: 200_000, months: 12, fy: '8384' as const, status: 'single' as const };
    await calc.taxFy.selectOption(input.fy);
    await calc.taxBasic.fill(String(input.basic));

    const expected = salaryTax(input);
    await expect(calc.taxGrossDisplay).toHaveText(npr(expected.grossAnnual));
    await expect(calc.taxOutput).toHaveText(npr(expected.totalTax));
  });
});
