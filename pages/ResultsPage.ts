import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ResultsPage extends BasePage {
  readonly heading = this.page.locator('h3').first();
  readonly underwriterLink = this.page.getByRole('link', { name: /Run Credit Underwriter/i });
  readonly metricBoxes = this.page.locator('.metric-box, .stat-box');
  readonly expenseChart = this.page.locator('#expenseChart');
  readonly riskPanel = this.page.locator('.risk-panel, [class*="risk"]');
  readonly topAction = this.page.locator('.glass-card').first();
  readonly pageTitle = () => this.page.title();

  constructor(page: Page) {
    super(page);
  }

  async expectResultsLoaded() {
    await expect(this.underwriterLink).toBeVisible({ timeout: 20000 });
    await expect(this.metricBoxes.first()).toBeVisible();
  }

  async gotoResults(id: string) {
    await this.page.goto(`/analyzer/results/${id}/`);
  }
}
