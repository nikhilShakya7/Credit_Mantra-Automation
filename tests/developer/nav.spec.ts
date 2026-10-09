import { test, expect } from '@playwright/test';
import { LandingPage } from '../../pages/LandingPage';
import { storageState } from '../../utils/storage-state';

test.describe('Navigation: developer', () => {
  test.use({ storageState: storageState.developer });
  test('Developer: nav links navigate correctly', async ({ page }) => {
    const lp = new LandingPage(page);
    await lp.gotoLanding();
    await lp.expectDeveloperNavPresent();
    await lp.navItems.filter({ hasText: 'Credit Score API' }).click();
    await expect(page).toHaveURL(/\/api\/portal\//);
    await lp.gotoLanding();
    await lp.navItems.filter({ hasText: 'AI Loan Assistant' }).click();
    await expect(page).toHaveURL(/\/assistant\//);
    await lp.gotoLanding();
    await lp.navItems.filter({ hasText: 'Financial Calculators' }).click();
    await expect(page).toHaveURL(/\/calculators\//);
  });
});
