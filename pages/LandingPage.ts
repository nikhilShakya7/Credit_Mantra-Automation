import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LandingPage extends BasePage {
  readonly title = () => this.page.title();
  readonly h1 = this.page.locator('h1').first();
  readonly heroCta1 = this.page.getByRole('link', { name: 'Analyze Bank Statement' });
  readonly heroCta2 = this.page.getByRole('link', { name: 'Use Calculators' });
  readonly navItems = this.page.locator('.sidebar-nav .nav-item');
  readonly themeToggle = this.page.getByTitle('Toggle Theme');
  readonly loginBtnTop = this.page.getByRole('link', { name: 'Log In' }).first();
  readonly signupBtnTop = this.page.getByRole('link', { name: 'Sign Up' }).first();
  readonly userMenuName = this.page.locator('.user-menu-name').first();

  constructor(page: Page) {
    super(page);
  }

  async gotoLanding() {
    await this.page.goto('/');
  }

  async clickNavItem(label: string) {
    await this.page.evaluate((targetLabel) => {
      const item = Array.from(document.querySelectorAll('.sidebar-nav .nav-item')).find(
        (node) => node.textContent?.toLowerCase().includes(targetLabel.toLowerCase())
      ) as HTMLElement | undefined;

      if (!item) {
        throw new Error(`Navigation item not found: ${targetLabel}`);
      }

      item.scrollIntoView({ block: 'center', inline: 'center' });
      item.click();
    }, label);
  }

  async expectAnonymousNavPresent() {
    await expect(this.navItems).toHaveCount(6);
    await expect(this.navItems.filter({ hasText: 'Landing Page' })).toBeVisible();
    await expect(this.navItems.filter({ hasText: 'Statement Analyzer' })).toBeVisible();
    await expect(this.navItems.filter({ hasText: 'Financial Calculators' })).toBeVisible();
    await expect(this.navItems.filter({ hasText: 'SME Cashflow Analyzer' })).toBeVisible();
    await expect(this.navItems.filter({ hasText: 'Credit Score API' })).toBeVisible();
    await expect(this.navItems.filter({ hasText: 'AI Loan Assistant' })).toBeVisible();
  }

  async expectBorrowerNavPresent() {
    const texts = await this.navItems.allInnerTexts();
    expect(texts.join('|')).toContain('Statement Analyzer');
    expect(texts.join('|')).toContain('SME Cashflow Analyzer');
    expect(texts.join('|')).not.toContain('Credit Underwriter');
    expect(texts.join('|')).not.toContain('Portfolio Dashboard');
  }

  async expectOfficerNavPresent() {
    const texts = await this.navItems.allInnerTexts();
    expect(texts.join('|')).toContain('Credit Underwriter');
    expect(texts.join('|')).toContain('Portfolio Dashboard');
  }

  async expectDeveloperNavPresent() {
    const texts = await this.navItems.allInnerTexts();
    expect(texts.join('|')).toContain('Credit Score API');
  }

  async getTheme() {
    return this.page.evaluate(() => ({
      bodyClass: document.body.className,
      theme: localStorage.getItem('theme'),
    }));
  }

  async verifyThemePersistence() {
    await this.toggleTheme();
    const t1 = await this.getTheme();
    await this.page.reload();
    const t2 = await this.getTheme();
    expect(t1.theme ?? t1.bodyClass).toBe(t2.theme ?? t2.bodyClass);
  }
}
