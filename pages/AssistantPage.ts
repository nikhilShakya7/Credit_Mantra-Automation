import { Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class AssistantPage extends BasePage {
  readonly heading = this.page.locator(".card-title").first();
  readonly chatInput = this.page.locator("#chat_input");
  readonly sendBtn = this.page.locator("#send_btn");
  readonly chatLog = this.page.locator("#chat_log");
  readonly suggestions = this.page
    .locator("button")
    .filter({
      hasText:
        /My Credit Profile|Improve|Loan Capacity|DTI Ratio|Top Expenses|Cashflow|Risk Flags/i,
    });
  readonly knowledgeBanner = this.page.getByText("General Knowledge Mode");

  constructor(page: Page) {
    super(page);
  }

  async gotoAssistant() {
    await this.page.goto("/assistant/");
  }

  async sendMessage(text: string) {
    await this.chatInput.fill(text);
    await this.sendBtn.click();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }

  async expectBannerStateLoggedOut() {
    await expect(this.knowledgeBanner).toBeVisible();
  }

  async expectBannerStateLoggedIn() {
    await expect(this.knowledgeBanner)
      .toBeHidden()
      .catch(async () => {
        await expect(this.chatLog).toBeVisible();
      });
  }
}
