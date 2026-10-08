import { Locator, Page } from "@playwright/test";

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string) {
    return this.page.goto(url);
  }

  async toggleTheme() {
    // Prefer title attribute as observed
    return this.page
      .getByTitle(/Toggle Theme/i)
      .click()
      .catch(async () => {
        const buttons = await this.page
          .locator('button[onclick*="toggleTheme"]')
          .all();
        if (buttons.length) await buttons[0].click();
        else await this.page.getByRole("button").first().click();
      });
  }

  async logout() {
    const logoutBtn = this.page
      .getByRole("button", { name: /Log Out/i })
      .first();
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      return;
    }
    const forms = await this.page.locator('form[action*="logout"]').all();
    if (forms.length) {
      const h = await forms[0].elementHandle();
      if (h) await this.page.evaluate((f: any) => f.submit(), h);
    }
  }
}
