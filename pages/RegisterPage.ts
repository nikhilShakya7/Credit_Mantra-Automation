import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { performAuthFlow, gotoAuth, isRateLimited, rateLimitBanner } from '../utils/rate-limit';

export class RegisterPage extends BasePage {
  readonly email = this.page.locator('#id_email');
  readonly role = this.page.locator('#id_role');
  readonly password1 = this.page.locator('#id_password1');
  readonly password2 = this.page.locator('#id_password2');
  readonly acceptTerms = this.page.locator('#accept_terms');
  readonly submit = this.page.getByRole('button', { name: 'Create Account' });
  readonly messages = this.page.locator('.messages-container').first();
  readonly heading = this.page.getByRole('heading', { name: /Join Credit Mantra|Create Account/i }).first();

  constructor(page: Page) {
    super(page);
  }

  async gotoRegister() {
    return gotoAuth(this.page, '/auth/register/');
  }

  async register({ email, password, confirm, role }: { email: string; password: string; confirm: string; role: 'BORROWER' | 'UNDERWRITER' | 'DEVELOPER' }) {
    await performAuthFlow(this.page, '/auth/register/', async () => {
      await this.email.fill(email);
      await this.password1.fill(password);
      await this.password2.fill(confirm);
      await this.acceptTerms.check({ force: true }).catch(async () => {
        await this.page.evaluate(() => {
          const cb = document.querySelector('#accept_terms') as HTMLInputElement | null;
          if (cb) cb.checked = true;
        });
      });
      await this.submit.click();
      await Promise.race([
        this.page.waitForURL(/\/auth\/verify-otp/, { timeout: 15_000 }).catch(() => undefined),
        this.messages.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined),
        rateLimitBanner(this.page).waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined),
      ]);
    },
    async () =>
      this.page.url().includes('/auth/verify-otp') || !(await isRateLimited(this.page)));
  }

  async expectFieldValidationEmailRequired() {
    const msg = await this.email.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(msg).toBeTruthy();
  }

  async expectPasswordMismatch() {
    await expect(this.messages).toBeVisible();
    await expect(this.messages).toContainText(/Passwords do not match|__all__/i);
  }

  async expectEmailExists() {
    await expect(this.messages).toBeVisible();
    await expect(this.messages).toContainText(/A user with this email address already exists/i);
  }

  async expectRedirectToOtp() {
    await expect(this.page).toHaveURL(/\/auth\/verify-otp/);
  }
}
