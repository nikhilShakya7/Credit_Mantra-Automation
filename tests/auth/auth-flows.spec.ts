import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage';
import { UploadPage } from '../../pages/UploadPage';
import { AssistantPage } from '../../pages/AssistantPage';
import { DeveloperPortalPage } from '../../pages/DeveloperPortalPage';
import { invalidUsers, registration } from '../../test-data/users';
import { rateLimitBanner } from '../../utils/rate-limit';

test.describe('Guest: Auth flows', () => {
  test('Invalid credentials show error', async ({ page }) => {
    const login = new LoginPage(page);
    await login.gotoLogin();
    await login.fillCredentials(invalidUsers.notFound.email, invalidUsers.notFound.password);
    await login.submit();
    await page.waitForLoadState('networkidle');
    if (await rateLimitBanner(page).isVisible().catch(() => false)) {
      await expect(login.heading).toBeVisible();
      return;
    }
    await login.expectInvalid();
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
    const upload = new UploadPage(page);
    await page.goto('/analyzer/upload/');
    await expect(page).toHaveURL(/\/auth\/login\/\?next=\/analyzer\/upload\//);
    await page.goto('/sme/dashboard/');
    await expect(page).toHaveURL(/\/auth\/login\/\?next=\/sme\/dashboard\//);
    await page.goto('/api/portal/');
    await expect(page).toHaveURL(/\/auth\/login\/\?next=\/api\/portal\//);
  });

  test('Assistant loads for guests', async ({ page }) => {
    const asst = new AssistantPage(page);
    await asst.gotoAssistant();
    await expect(asst.heading).toBeVisible();
    await expect(asst.chatInput).toBeVisible();
    await expect(asst.sendBtn).toBeVisible();
  });

  test('Developer portal redirects to login when anonymous', async ({ page }) => {
    const dev = new DeveloperPortalPage(page);
    await dev.gotoPortal();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('Underwriter requires login', async ({ page }) => {
    await page.goto('/underwriter/dashboard/');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('Portfolio requires login', async ({ page }) => {
    await page.goto('/portfolio/dashboard/');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
