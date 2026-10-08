import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class UploadPage extends BasePage {
  readonly dropZone = this.page.locator('#drop_zone');
  readonly fileInput = this.page.locator('#file_input');
  readonly analyzeBtn = this.page.locator('#analyze_btn');
  readonly fileList = this.page.locator('#file_list_container');
  readonly messages = this.page.locator('.messages-container').first();
  readonly cardTitles = this.page.locator('.card-title');
  readonly demoSalaried = this.page.locator('form').filter({ hasText: 'Salaried Professional' }).locator('button[type=submit]');
  readonly demoSme = this.page.locator('form').filter({ hasText: 'SME Cashflow Profile' }).locator('button[type=submit]');
  readonly demoHighRisk = this.page.locator('form').filter({ hasText: 'High Risk Profile' }).locator('button[type=submit]');
  readonly yourAnalyzedHeading = this.page.getByRole('heading', { name: 'Your Analyzed Statements' }).first();

  constructor(page: Page) {
    super(page);
  }

  async gotoUpload() {
    await this.page.goto('/analyzer/upload/');
  }

  async uploadInvalidFile(content = 'invalid text') {
    const buffer = Buffer.from(content);
    await this.fileInput.setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer });
  }

  async uploadValidCsvFromBuffer(buffer: Buffer, name = 'sample.csv') {
    await this.fileInput.setInputFiles({ name, mimeType: 'text/csv', buffer });
  }

  async clickAnalyze() {
    await this.analyzeBtn.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  async useDemo(type: 'salaried' | 'sme' | 'high_risk') {
    if (type === 'salaried') await this.demoSalaried.click();
    if (type === 'sme') await this.demoSme.click();
    if (type === 'high_risk') await this.demoHighRisk.click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectUploadUiLoaded() {
    await expect(this.dropZone).toBeVisible();
    await expect(this.page.getByText('Upload Bank Statements')).toBeVisible();
  }

  async expectUnsupportedFormatMessage() {
    await expect(this.messages).toBeVisible();
    await expect(this.messages).toContainText(/unsupported format/i);
  }

  async expectOnResultsOrUpload() {
    await expect(this.page).toHaveURL(/\/analyzer\/(results|upload)/);
  }
}
