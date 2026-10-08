import { test, expect } from '@playwright/test';
import { LandingPage } from '../../pages/LandingPage';
import { CalculatorsPage } from '../../pages/CalculatorsPage';

test.describe('Guest: Landing & Public UI', () => {
  test('Landing page renders correctly', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.gotoLanding();
    expect(await landing.title()).toContain('Credit Mantra');
    await expect(landing.h1).toContainText('Credit Mantra');
    await expect(landing.heroCta1).toBeVisible();
    await expect(landing.heroCta2).toBeVisible();
    await landing.expectAnonymousNavPresent();
  });

  test('Theme toggle persists across reload', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.gotoLanding();
    await landing.verifyThemePersistence();
  });

  test('Calculators tabs switch and default DTI badge', async ({ page }) => {
    const calc = new CalculatorsPage(page);
    await calc.gotoCalc();
    await expect(calc.tabEmi).toBeVisible();
    await expect(calc.tabTax).toBeVisible();
    await expect(calc.tabAfford).toBeVisible();
    await expect(calc.tabDti).toBeVisible();
    await calc.switchTabDti();
    await expect(calc.dtiOutputPct).toContainText('%');
    await expect(calc.dtiRiskBadge).toBeVisible();
  });

  test('EMI calculator shows defaults', async ({ page }) => {
    const calc = new CalculatorsPage(page);
    await calc.gotoCalc();
    await calc.expectEmiDefaults();
  });
});
