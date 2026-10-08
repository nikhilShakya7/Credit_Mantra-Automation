import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '../utils/env';

export class DeveloperPortalPage extends BasePage {
  readonly cards = this.page.locator('.card-title');
  readonly apiEndpoint = this.page.locator('code').filter({ hasText: 'POST /api/v1/score/' }).first();
  readonly sampleRequest = this.page.locator('pre').filter({ hasText: 'Authorization: Api-Key' }).first();
  readonly tokenCodes = this.page.locator('code');
  readonly regenerateForm = this.page.locator('form').filter({ hasText: 'Regenerate' }).first();

  constructor(page: Page) {
    super(page);
  }

  async gotoPortal() {
    await this.page.goto('/api/portal/');
  }

  async expectLoaded() {
    await expect(this.cards.first()).toBeVisible();
  }

  async getApiKey(): Promise<string> {
    const override = env.apiKey();
    if (override) return override;
    const codes = await this.tokenCodes.allInnerTexts();
    for (const c of codes) {
      const t = c.trim();
      if (/^[0-9a-f]{40,64}$/.test(t)) return t;
    }
    throw new Error('Unable to locate Developer API token in portal (no 40-64 hex code found).');
  }
}
