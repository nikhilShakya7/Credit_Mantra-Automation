import { Page } from "@playwright/test";

export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }

  async toggleTheme() {
    const themeButton = this.page
      .getByRole("button", { name: /toggle theme/i })
      .or(this.page.getByTitle(/toggle theme/i));
    await themeButton.click();
  }

  async logout() {
    const logoutButton = this.page
      .getByRole("button", { name: /log out/i })
      .or(this.page.getByRole("link", { name: /log out/i }))
      .or(
        this.page
          .locator('form[action*="logout"]')
          .getByRole("button", { name: /log out/i })
      );
    await logoutButton.click();
  }
}
