import { test, expect } from '@playwright/test';
import { LandingPage } from '../../pages/LandingPage';
import { storageState } from '../../utils/storage-state';

test.describe('Navigation: officer', () => {
  test.use({ storageState: storageState.officer });
  test('Officer: nav links navigate correctly', async ({ page }) => {
    const lp = new LandingPage(page);
    await lp.gotoLanding();
    await lp.expectOfficerNavPresent();
    await lp.navItems.filter({ hasText: 'Credit Underwriter' }).click();
    await expect(page).toHaveURL(/\/underwriter\/dashboard\//);
    await lp.gotoLanding();
    await lp.navItems.filter({ hasText: 'Portfolio Dashboard' }).click();
    await expect(page).toHaveURL(/\/portfolio\/dashboard\//);
    await lp.gotoLanding();
    await lp.navItems.filter({ hasText: 'Financial Calculators' }).click();
    await expect(page).toHaveURL(/\/calculators\//);
    await lp.gotoLanding();
    await lp.navItems.filter({ hasText: 'AI Loan Assistant' }).click();
    await expect(page).toHaveURL(/\/assistant\//);
  });
});
