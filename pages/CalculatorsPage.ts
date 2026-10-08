import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CalculatorsPage extends BasePage {
  readonly tabEmi = this.page.getByRole('button', { name: /EMI Calculator/i });
  readonly tabTax = this.page.getByRole('button', { name: /Salary Tax/i });
  readonly tabAfford = this.page.getByRole('button', { name: /Affordability/i });
  readonly tabDti = this.page.getByRole('button', { name: /DTI Calculator/i });

  // EMI
  readonly emiPrincipalInput = this.page.locator('#emi-principal-input');
  readonly emiRateInput = this.page.locator('#emi-rate-input');
  readonly emiTenureInput = this.page.locator('#emi-tenure-input');
  readonly emiOutput = this.page.locator('#emi-output-value');
  readonly emiTotalPrincipal = this.page.locator('#emi-total-principal');
  readonly emiTotalInterest = this.page.locator('#emi-total-interest');
  readonly emiTotalPayment = this.page.locator('#emi-total-payment');

  // DTI
  readonly dtiIncomeInput = this.page.locator('#dti-income-input');
  readonly dtiDebtsInput = this.page.locator('#dti-debts-input');
  readonly dtiOutputPct = this.page.locator('#dti-output-percent');
  readonly dtiRiskBadge = this.page.locator('#dti-risk-badge');
  readonly dtiRiskDesc = this.page.locator('#dti-risk-desc');

  // TAX
  readonly taxBasic = this.page.locator('#tax-basic');
  readonly taxMonths = this.page.locator('#tax-months');
  readonly taxSsf = this.page.locator('#tax-ssf');
  readonly taxSsfWarning = this.page.locator('#tax-ssf-warning');
  readonly taxOutput = this.page.locator('#tax-output-value');
  readonly taxGrossDisplay = this.page.locator('#tax-gross-display');

  constructor(page: Page) {
    super(page);
  }

  async gotoCalc() {
    await this.page.goto('/calculators/');
  }

  async switchTabDti() {
    await this.tabDti.click();
    await expect(this.dtiIncomeInput).toBeVisible();
  }

  async switchTabTax() {
    await this.tabTax.click();
    await expect(this.taxBasic).toBeVisible();
  }

  async switchTabEmi() {
    await this.tabEmi.click();
    await expect(this.emiPrincipalInput).toBeVisible();
  }

  async expectEmiDefaults() {
    await expect(this.emiOutput).toContainText('NPR');
    await expect(this.emiPrincipalInput).toHaveValue(/1000000/);
  }

  async setEmi(principal: number, rate: number, years: number) {
    await this.emiPrincipalInput.fill(String(principal));
    await this.emiRateInput.fill(String(rate));
    await this.emiTenureInput.fill(String(years));
    await this.emiPrincipalInput.click(); // blur to trigger JS
  }
}
