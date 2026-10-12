import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class UnderwriterPage extends BasePage {
  readonly heading = this.page.getByRole('heading', { level: 3 });
  readonly newAnalysis = this.page.getByRole('link', { name: /Analyze New Statement/i });
  readonly historyTableHeaders = this.page.getByRole('columnheader');
  readonly historyTable = this.page.getByRole('table');

  constructor(page: Page) {
    super(page);
  }

  async gotoUnderwriter() {
    await this.page.goto('/underwriter/dashboard/');
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.historyTableHeaders.first()).toBeVisible();
  }
}
