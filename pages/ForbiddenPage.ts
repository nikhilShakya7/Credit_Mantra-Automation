import { Page } from '@playwright/test';

export class ForbiddenPage {
  readonly heading = (page: Page) => page.getByRole('heading', { name: 'Access Denied' });
  readonly body = (page: Page) => page.locator('main').first();

  static async expectForbidden(page: Page, roleDenied = 'Borrower') {
    await page.getByRole('heading', { name: 'Access Denied' }).waitFor({ timeout: 10_000 });
    const text = await page.locator('main').first().innerText();
    if (!text.includes('Access Denied')) throw new Error('Expected Access Denied');
  }
}
