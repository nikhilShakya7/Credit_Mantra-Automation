import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { performAuthFlow, gotoAuth, rateLimitBanner } from '../utils/rate-limit';

export class LoginPage extends BasePage {
  readonly email = this.page.locator('#id_email');
  readonly password = this.page.locator('#id_password');
  readonly loginButton = this.page.getByRole('button', { name: 'Log In', exact: true });
  readonly forgotLink = this.page.getByRole('link', { name: /Forgot Password/i }).first();
  readonly invalidMsg = this.page.locator('.messages-container').first();
  readonly errorBanner = this.page.locator('.alert, .error, .form-error').first();
  readonly heading = this.page.getByRole('heading', { name: /Sign In to Credit Mantra/i }).first();
  readonly title = () => this.page.title();

  constructor(page: Page) {
    super(page);
  }

  async gotoLogin() {
    return gotoAuth(this.page, '/auth/login/');
  }

  async fillCredentials(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
  }

  async submit() {
    await this.loginButton.click();
  }

  /**
   * Authenticates against the real /auth/login/ endpoint. Handles 429 transparently.
   * Expects success -> redirect to "/" (as observed).
   */
  async login(email: string, password: string) {
    await performAuthFlow(this.page, '/auth/login/', async () => {
      await this.email.fill(email);
      await this.password.fill(password);
      await this.loginButton.click();
      await Promise.race([
        this.page.waitForURL((u) => u.pathname === '/', { timeout: 15_000 }).catch(() => undefined),
        rateLimitBanner(this.page).waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined),
      ]);
    });
    await expect(this.page).toHaveURL(/\/$|\/home|\/$/);
  }

  async expectInvalid() {
    await expect(this.invalidMsg).toBeVisible();
    await expect(this.invalidMsg).toContainText(/Invalid email or password|Invalid/i);
  }

  async expectRateLimitedBanner() {
    await expect(this.page.getByRole('heading', { name: 'Too Many Requests' })).toBeVisible();
  }
}
