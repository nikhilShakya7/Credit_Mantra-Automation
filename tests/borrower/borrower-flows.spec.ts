import { test, expect } from "@playwright/test";
import { LandingPage } from "../../pages/LandingPage";
import { UploadPage } from "../../pages/UploadPage";
import { ResultsPage } from "../../pages/ResultsPage";
import { SmePage } from "../../pages/SmePage";
import { AssistantPage } from "../../pages/AssistantPage";
import { storageState } from "../../utils/storage-state";

test.describe("Borrower: Dashboard & Statement flows", () => {
  test.use({ storageState: storageState.borrower });

  test("Borrower landing has correct nav", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.gotoLanding();
    await landing.expectBorrowerNavPresent();
    await expect(landing.userMenuName).toContainText("nikhil");
  });

  test("Statement upload UI loads", async ({ page }) => {
    const upload = new UploadPage(page);
    await upload.gotoUpload();
    await upload.expectUploadUiLoaded();
  });

  test("Demo: use Salaried Professional and reach results", async ({
    page,
  }) => {
    const upload = new UploadPage(page);
    await upload.gotoUpload();
    await upload.useDemo("salaried");
    await expect(page).toHaveURL(/\/analyzer\/results\/\d+\/$/);
    const results = new ResultsPage(page);
    await results.expectResultsLoaded();
    await expect(results.heading).toContainText("Step 1: Extraction Complete");
    await expect(results.underwriterLink).toHaveAttribute(
      "href",
      /\/underwriter\/run\/\d+\//,
    );
  });

  test("SME dashboard loads with metrics and tabs", async ({ page }) => {
    const sme = new SmePage(page);
    await sme.gotoSme();
    await sme.expectLoaded();
    await expect(sme.heading).toContainText(
      "SME Commercial Analysis Dashboard",
    );
    await expect(sme.tabAnalysis).toBeVisible();
    await expect(sme.tabHistory).toBeVisible();
    await expect(sme.dscr).toBeVisible();
  });

  test("Assistant accessible to logged-in borrower", async ({ page }) => {
    const asst = new AssistantPage(page);
    await asst.gotoAssistant();
    await asst.expectBannerStateLoggedIn();
    await asst.sendMessage("What is DTI?");
    await expect(asst.chatLog).toContainText(/DTI|Debt-to-Income/i);
  });

  test("Borrower denied API portal", async ({ page }) => {
    await page.goto("/api/portal/");
    const text = await page.locator("main").innerText();
    expect(text).toContain("Access Denied");
    expect(text).toMatch(/Borrower|Individual/i);
  });

  test("Uploading an unsupported file shows an error message", async ({
    page,
  }) => {
    const upload = new UploadPage(page);
    await upload.gotoUpload();
    await upload.uploadInvalidFile("this is not a bank statement");
    await upload.clickAnalyze();
    await upload.expectUnsupportedFormatMessage();
    await expect(page).toHaveURL(/\/analyzer\/upload\//);
  });

  test("Borrower can upload valid CSV/XLS/XLSX/PDF and then delete the created statement", async ({
    page,
  }) => {
    const upload = new UploadPage(page);
    const deleteStatement = async (statementId: string) => {
      const stmt = page.locator(
        `form[action="/analyzer/statements/${statementId}/delete/"]`,
      );
      await expect(stmt).toBeVisible();
      await page.once("dialog", async (dialog) => {
        await dialog.accept();
      });
      await stmt.locator('button[type="submit"]').click();
      await page.waitForURL(/\/analyzer\/upload\//);
      await expect(stmt).toBeHidden();
    };

    await upload.gotoUpload();
    await upload.expectUploadUiLoaded();

    // Upload CSV
    const csvPath = "test-data/samples/sample.csv";
    await upload.uploadFile(csvPath);
    await upload.clickAnalyze();
    await expect(page).toHaveURL(/\/analyzer\/results\/\d+\/$/);
    const created = page.url().match(/\/results\/(\d+)\//)?.[1];
    expect(created).toBeTruthy();
    await upload.gotoUpload();
    await upload.expectUploadUiLoaded();
    //await expect(upload.yourAnalyzedHeading).toBeVisible();
    await deleteStatement(created!);

    // Upload XLSX
    const xlsxPath = "test-data/samples/sample.xlsx";
    await upload.gotoUpload();
    await upload.uploadFile(xlsxPath);
    await upload.clickAnalyze();
    await expect(page).toHaveURL(/\/analyzer\/results\/\d+\/$/);
    const created2 = page.url().match(/\/results\/(\d+)\//)?.[1];
    expect(created2).toBeTruthy();
    await upload.gotoUpload();
    await upload.expectUploadUiLoaded();
    await deleteStatement(created2!);

    // Upload PDF
    const pdfPath = "test-data/samples/sample.pdf";
    await upload.gotoUpload();
    await upload.uploadFile(pdfPath);
    await upload.clickAnalyze();
    await expect(page).toHaveURL(/\/analyzer\/results\/\d+\/$/);
    const created4 = page.url().match(/\/results\/(\d+)\//)?.[1];
    expect(created4).toBeTruthy();
    await upload.gotoUpload();
    await upload.expectUploadUiLoaded();
    await deleteStatement(created4!);
  });

  test("Analyzer rejects access for other protected role pages", async ({
    page,
  }) => {
    await page.goto("/underwriter/dashboard/");
    const text = await page.locator("main").innerText();
    expect(text).toContain("Access Denied");
  });
});
