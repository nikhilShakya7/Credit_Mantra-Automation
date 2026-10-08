import { test, expect } from '@playwright/test';
import { CalculatorsPage } from '../../pages/CalculatorsPage';
import { dti } from '../../utils/finance';

test.describe('Integration: Calculators behavior', () => {
  test('DTI calculator bands (boundary/edge cases)', async ({ page }) => {
    const calc = new CalculatorsPage(page);
    await calc.gotoCalc();
    await calc.switchTabDti();

    // Defaults shipped by the app: 80,000 income vs 24,000 debts -> 30.0%.
    await expect(calc.dtiOutputPct).toContainText('30.0%');
    await expect(calc.dtiRiskBadge).toContainText('Moderate Debt Ratio', { ignoreCase: true });

    // Below the documented minimum, income clamps up to 10,000 on blur.
    await calc.dtiIncomeInput.fill('0');
    await calc.dtiDebtsInput.click();
    await expect(calc.dtiIncomeInput).toHaveValue('10000');
    await expect(calc.dtiOutputPct).toContainText('%');

    // Exactly at the minimum the value is accepted unchanged.
    await calc.dtiIncomeInput.fill('10000');
    await calc.dtiIncomeInput.click();
    await expect(calc.dtiIncomeInput).toHaveValue('10000');

    const cases = [
      { inc: 80000, dbt: 12000, pct: 15.0, badge: 'Excellent / Low Debt' },
      { inc: 80000, dbt: 28800, pct: 36.0, badge: 'Moderate Debt Ratio' },
      { inc: 80000, dbt: 40000, pct: 50.0, badge: 'High Debt Burden' },
      { inc: 80000, dbt: 60000, pct: 75.0, badge: 'Critical Debt Levels' },
    ];
    for (const c of cases) {
      await calc.dtiIncomeInput.fill(String(c.inc));
      await calc.dtiDebtsInput.fill(String(c.dbt));
      await calc.dtiDebtsInput.click();
      await expect(calc.dtiOutputPct).toContainText(`${c.pct.toFixed(1)}%`);
      // Badges are upper-cased by CSS, so assert case-insensitively.
      await expect(calc.dtiRiskBadge).toContainText(c.badge, { ignoreCase: true });
    }
  });

  test('EMI input clamping on blur', async ({ page }) => {
    const calc = new CalculatorsPage(page);
    await calc.gotoCalc();
    await calc.emiPrincipalInput.fill('10000');
    await calc.emiRateInput.click();
    await expect(calc.emiPrincipalInput).toHaveValue('25000');
    await calc.emiPrincipalInput.fill('999999999');
    await calc.emiRateInput.click();
    await expect(calc.emiPrincipalInput).toHaveValue('25000000');
  });

  test('TAX: months clamp to 12, SSF warning + capped value effect', async ({ page }) => {
    const calc = new CalculatorsPage(page);
    await calc.gotoCalc();
    await calc.switchTabTax();
    await calc.taxBasic.fill('50000');
    await calc.taxMonths.fill('15');
    await calc.taxBasic.click();
    await expect(calc.taxMonths).toHaveValue('12');
    await calc.taxSsf.fill('600000');
    await expect(calc.taxSsfWarning).toBeVisible();
    await expect(calc.taxSsfWarning).toContainText(/exceeds max/i);
    await expect(calc.taxOutput).toContainText('NPR');
  });
});
