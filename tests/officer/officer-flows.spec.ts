import { test, expect } from '@playwright/test';
import { LandingPage } from '../../pages/LandingPage';
import { UnderwriterPage } from '../../pages/UnderwriterPage';
import { PortfolioPage } from '../../pages/PortfolioPage';

test.describe('Credit Officer: Underwriter & Portfolio', () => {
  test('Officer landing has underwriter/portfolio nav', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.gotoLanding();
    await landing.expectOfficerNavPresent();
    await expect(landing.userMenuName).toBeVisible();
  });

  test('Underwriter dashboard loads', async ({ page }) => {
    const uw = new UnderwriterPage(page);
    await uw.gotoUnderwriter();
    await uw.expectLoaded();
    await expect(uw.heading).toContainText('Underwriting Credit Evaluation Engine');
    await expect(uw.newAnalysis).toBeVisible();
    await expect(uw.historyTableHeaders).toContainText([
      'Date Reviewed',
      'Applicant',
      'Credit Score',
      'Risk Classification',
      'Recommended Loan',
    ]);
  });

  test('Portfolio dashboard loads with metrics', async ({ page }) => {
    const pf = new PortfolioPage(page);
    await pf.gotoPortfolio();
    await pf.expectLoaded();
    const labels = (await pf.metricLabels.allInnerTexts()).join('|').toLowerCase();
    expect(labels).toContain('total applications evaluated');
    expect(labels).toContain('avg portfolio score');
  });

  test('Officer cannot access Developer API portal', async ({ page }) => {
    const res = await page.goto('/api/portal/');
    expect(res?.status()).toBe(403);
    const text = await page.locator('main').innerText();
    expect(text).toContain('Access Denied');
  });
});
