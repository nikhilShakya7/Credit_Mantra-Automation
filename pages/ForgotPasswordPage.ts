import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { gotoAuth, postAuthForm } from '../utils/rate-limit';

export class ForgotPasswordPage extends BasePage {
  readonly email = this.page.locator('#email');
  readonly submit = this.page.getByRole('button', { name: /Reset Password|Send Reset/i });
  readonly messages = this.page.locator('.messages-container').first();
  readonly heading = this.page.getByRole('heading', { name: /Forgot Password|Reset your password/i }).first();
  readonly csrf = this.page.locator('input[name=csrfmiddlewaretoken]');

  /** Result of the last reset request, captured without following the redirect chain. */
  lastStatus = 0;
  lastLocation = '';

  constructor(page: Page) {
    super(page);
  }

  async gotoForgot() {
    return gotoAuth(this.page, '/auth/forgot-password/');
  }

  /**
   * Submits the reset form via the API request context using the CSRF token
   * rendered on the real page.
   *
   * The browser flow issues POST -> 302 /verify/ -> GET /verify/ -> 302 back to
   * the form -> GET form, which alone can exhaust the /auth/* budget and wedge
   * the IP in a 429. Requesting with `maxRedirects: 0` asserts the documented
   * behaviour (302 to the verify page) while making only two auth requests.
   */
  async requestReset(email: string) {
    await gotoAuth(this.page, '/auth/forgot-password/');
    const csrf = await this.csrf.inputValue();
    const res = await postAuthForm(
      this.page.request,
      '/auth/forgot-password/',
      { csrfmiddlewaretoken: csrf, email },
      { Referer: this.page.url() }
    );
    this.lastStatus = res.status();
    this.lastLocation = res.headers()['location'] ?? '';
  }

  async expectRedirectToVerify() {
    expect(this.lastStatus).toBe(302);
    expect(this.lastLocation).toMatch(/\/auth\/forgot-password\/verify\/?(?:\?.*)?$/);
  }
}
