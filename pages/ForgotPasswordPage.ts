import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { performAuthFlow, gotoAuth, rateLimitBanner } from '../utils/rate-limit';

export class ForgotPasswordPage extends BasePage {
  readonly email = this.page.locator('#email');
  readonly submit = this.page.getByRole('button', { name: /Reset Password|Send Reset/i });
  readonly messages = this.page.locator('.messages-container').first();
  readonly heading = this.page.getByRole('heading', { name: /Forgot Password|Reset your password/i }).first();

  constructor(page: Page) {
    super(page);
  }

  async gotoForgot() {
    return gotoAuth(this.page, '/auth/forgot-password/');
  }

  async requestReset(email: string) {
    await performAuthFlow(this.page, '/auth/forgot-password/', async () => {
      await this.email.fill(email);
      await this.submit.click();
      await Promise.race([
        this.page.waitForURL(/\/auth\/forgot-password\/verify/, { timeout: 15_000 }).catch(() => undefined),
        rateLimitBanner(this.page).waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined),
      ]);
    },
    // Landing on the verify page is success even if that page then 429s.
    async () => this.page.url().includes('/auth/forgot-password/verify'));
  }

  async expectRedirectToVerify() {
    await expect(this.page).toHaveURL(/\/auth\/forgot-password\/verify|\/auth\/verify-otp/);
  }
}
