import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage';
import { AssistantPage } from '../../pages/AssistantPage';
import { invalidUsers, registration } from '../../test-data/users';

test.describe('Guest: Auth flows', () => {
  test('Invalid credentials show error', async ({ page }) => {
    const login = new LoginPage(page);
    const res = await login.submitInvalidCredentials(invalidUsers.notFound.email, invalidUsers.notFound.password);
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain('Invalid email or password.');
  });

  test('Register empty submit blocked by HTML5 validation', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.gotoRegister();
    await reg.submit.click();
    await reg.expectFieldValidationEmailRequired();
  });

  test('Register password mismatch', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.gotoRegister();
    const data = registration.default(Date.now().toString());
    await reg.email.fill(data.email);
    await reg.password1.fill(data.password);
    await reg.password2.fill('DifferentPass123!');
    await reg.acceptTerms.check({ force: true }).catch(async () => {
      await page.evaluate(() => {
        const cb = document.querySelector('#accept_terms') as HTMLInputElement | null;
        if (cb) cb.checked = true;
      });
    });
    await reg.submit.click();
    await page.waitForLoadState('networkidle');
    await reg.expectPasswordMismatch();
  });

  test('Forgot password non-existent email redirects to verify (as observed)', async ({ page }) => {
    const fp = new ForgotPasswordPage(page);
    await fp.gotoForgot();
    const email = `nope.${Date.now()}@example.com`;
    await fp.requestReset(email);
    await fp.expectRedirectToVerify();
  });

  test('Unauthenticated user redirected to login for protected pages', async ({ page }) => {
    // `maxRedirects: 0` asserts the 302 + Location header directly. The protected
    // paths are not under /auth/*, so this test costs ZERO auth-throttle budget.
    const protectedPaths = ['/analyzer/upload/', '/sme/dashboard/', '/api/portal/'];
    for (const path of protectedPaths) {
      const res = await page.request.get(path, { maxRedirects: 0, failOnStatusCode: false });
      expect(res.status()).toBe(302);
      expect(res.headers()['location']).toBe(`/auth/login/?next=${path}`);
    }
  });

  test('Assistant loads for guests', async ({ page }) => {
    const asst = new AssistantPage(page);
    await asst.gotoAssistant();
    await expect(asst.heading).toBeVisible();
    await expect(asst.chatInput).toBeVisible();
    await expect(asst.sendBtn).toBeVisible();
  });

  test('Developer portal / Underwriter / Portfolio require login when anonymous', async ({ page }) => {
    for (const path of ['/api/portal/', '/underwriter/dashboard/', '/portfolio/dashboard/']) {
      const res = await page.request.get(path, { maxRedirects: 0, failOnStatusCode: false });
      expect(res.status()).toBe(302);
      expect(res.headers()['location']).toBe(`/auth/login/?next=${path}`);
    }
  });
});
