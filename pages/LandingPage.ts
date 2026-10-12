import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LandingPage extends BasePage {
  readonly title = () => this.page.title();
  readonly h1 = this.page.getByRole('heading', { level: 1 });
  readonly heroCta1 = this.page.getByRole('link', { name: 'Analyze Bank Statement' });
  readonly heroCta2 = this.page.getByRole('link', { name: 'Use Calculators' });
  readonly navItems = this.page.locator('.sidebar-nav .nav-item');
  readonly mobileMenuToggle = this.page.getByRole('button', { name: '☰' });
  readonly themeToggle = this.page
    .getByRole('button', { name: /toggle theme/i })
    .or(this.page.getByTitle(/toggle theme/i));
  readonly loginBtnTop = this.page.getByRole('link', { name: 'Log In', exact: true });
  readonly signupBtnTop = this.page.getByRole('link', { name: 'Sign Up', exact: true });
  readonly userMenuName = this.page.locator('.user-menu-name');

  constructor(page: Page) {
    super(page);
  }

  async gotoLanding() {
    await this.page.goto('/');
  }

  async clickNavItem(label: string) {
    const viewport = this.page.viewportSize();
    if (viewport && viewport.width <= 768) {
      await this.mobileMenuToggle.click();
    }
    await this.navItems.filter({ hasText: label }).click();
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
