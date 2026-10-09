import { test, expect } from '@playwright/test';
import { LandingPage } from '../../pages/LandingPage';
import { storageState } from '../../utils/storage-state';

test.describe('Navigation: borrower', () => {
  test.use({ storageState: storageState.borrower });
  test('Borrower: nav links navigate correctly', async ({ page }) => {
    const lp = new LandingPage(page);
    await lp.gotoLanding();
    await lp.expectBorrowerNavPresent();
    await lp.navItems.filter({ hasText: 'Statement Analyzer' }).click();
    await expect(page).toHaveURL(/\/analyzer\/upload\//);
    await lp.gotoLanding();
    await lp.navItems.filter({ hasText: 'SME Cashflow Analyzer' }).click();
    await expect(page).toHaveURL(/\/sme\/dashboard\//);
    await lp.gotoLanding();
    await lp.navItems.filter({ hasText: 'AI Loan Assistant' }).click();
    await expect(page).toHaveURL(/\/assistant\//);
    await lp.gotoLanding();
    await lp.navItems.filter({ hasText: 'Financial Calculators' }).click();
    await expect(page).toHaveURL(/\/calculators\//);
  });
});
