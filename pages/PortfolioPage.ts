import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PortfolioPage extends BasePage {
  readonly metricLabels = this.page.locator('.metric-label');
  readonly metricValues = this.page.locator('.metric-value');
  readonly riskChart = this.page.locator('#riskCategoryChart');
  readonly heading = this.page.locator('h3').first();

  constructor(page: Page) {
    super(page);
  }

  async gotoPortfolio() {
    await this.page.goto('/portfolio/dashboard/');
  }

  async expectLoaded() {
    await expect(this.metricLabels.first()).toBeVisible();
  }
}
