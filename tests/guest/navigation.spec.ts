import { test, expect, Page } from "@playwright/test";
import { LandingPage } from "../../pages/LandingPage";

async function expectRoute(page: Page, landing: LandingPage, label: string, urlPattern: RegExp) {
  await landing.gotoLanding();
  await landing.clickNavItem(label);
  await expect(page).toHaveURL(urlPattern);
}

test.describe("Navigation: public and borrower quick links", () => {
  test("Anonymous: nav links and hero CTAs navigate correctly", async ({ page }) => {
    const landing = new LandingPage(page);

    await landing.gotoLanding();
    await landing.expectAnonymousNavPresent();

    await expectRoute(page, landing, "Statement Analyzer", /\/analyzer\/upload\//);
    await expectRoute(page, landing, "Financial Calculators", /\/calculators\//);
    await expectRoute(page, landing, "SME Cashflow Analyzer", /\/sme\/dashboard\//);
    await expectRoute(page, landing, "Credit Score API", /\/api\/portal\//);
    await expectRoute(page, landing, "AI Loan Assistant", /\/assistant\//);
    await expectRoute(page, landing, "Landing Page", /\/$/);

    await landing.gotoLanding();
    await expect(landing.heroCta1).toBeVisible();
    await expect(landing.heroCta2).toBeVisible();

    await landing.heroCta1.click();
    await expect(page).toHaveURL(/\/analyzer\/upload\//);

    await landing.gotoLanding();
    await landing.heroCta2.click();
    await expect(page).toHaveURL(/\/calculators\//);
  });

  test.describe("Borrower navigation", () => {
    test.use({ storageState: ".auth/borrower.json" });

    test("nav links navigate correctly", async ({ page }) => {
      const landing = new LandingPage(page);

      await landing.gotoLanding();
      await landing.expectBorrowerNavPresent();

      await expectRoute(page, landing, "Statement Analyzer", /\/analyzer\/upload\//);
      await expectRoute(page, landing, "SME Cashflow Analyzer", /\/sme\/dashboard\//);
      await expectRoute(page, landing, "AI Loan Assistant", /\/assistant\//);
      await expectRoute(page, landing, "Financial Calculators", /\/calculators\//);
    });
  });
});
