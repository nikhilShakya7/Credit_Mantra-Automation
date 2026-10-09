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
  readonly taxFy = this.page.locator('#tax-fy');
  readonly taxStatus = this.page.locator('#tax-status');
  readonly taxFemale = this.page.locator('#tax-female');
  readonly taxSsfContrib = this.page.locator('#tax-ssf-contrib');
  readonly taxBasic = this.page.locator('#tax-basic');
  readonly taxMonths = this.page.locator('#tax-months');
  readonly taxGrade = this.page.locator('#tax-grade');
  readonly taxAllowances = this.page.locator('#tax-allowances');
  readonly taxBonus = this.page.locator('#tax-bonus');
  readonly taxOtherIncome = this.page.locator('#tax-other-income');
  readonly taxSsf = this.page.locator('#tax-ssf');
  readonly taxEpf = this.page.locator('#tax-epf');
  readonly taxCit = this.page.locator('#tax-cit');
  readonly taxInsurance = this.page.locator('#tax-insurance');
  readonly taxMedical = this.page.locator('#tax-medical');
  readonly taxSsfWarning = this.page.locator('#tax-ssf-warning');
  readonly taxOutput = this.page.locator('#tax-output-value');
  readonly taxOutputMonthly = this.page.locator('#tax-output-monthly');
  readonly taxEffectiveRate = this.page.locator('#tax-effective-rate');
  readonly taxTakehome = this.page.locator('#tax-takehome');
  readonly taxTotalDeduction = this.page.locator('#tax-total-deduction');
  readonly taxRetireApplied = this.page.locator('#tax-retire-applied');
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
