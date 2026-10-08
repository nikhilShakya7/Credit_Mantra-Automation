import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SmePage extends BasePage {
  readonly heading = this.page.locator('h3').first();
  readonly statementSelector = this.page.locator('#statement-selector');
  readonly tabAnalysis = this.page.locator('#tabBtn-analysis');
  readonly tabHistory = this.page.locator('#tabBtn-history');
  readonly metricBoxes = this.page.locator('.metric-box');
  readonly dscr = this.metricBoxes.filter({ hasText: /DSCR|Debt Service/i });
  readonly revenueExpenseChart = this.page.locator('#revenueExpenseChart');

  constructor(page: Page) {
    super(page);
  }

  async gotoSme() {
    await this.page.goto('/sme/dashboard/');
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.metricBoxes.first()).toBeVisible();
  }

  async selectStatement(value: string) {
    await this.statementSelector.selectOption(value);
    await this.page.waitForLoadState('networkidle');
  }
}
