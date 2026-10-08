import { test as setup } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";
import { storageState, STORAGE_STATE_DIR } from "../../utils/storage-state";
import { users } from "../../test-data/users";
import fs from "fs/promises";
import path from "path";

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

setup.describe.configure({ mode: 'serial' });

setup.describe("Create reusable auth states", () => {
  setup.beforeAll(async () => {
    await ensureDir(STORAGE_STATE_DIR);
  });

  setup("borrower auth", async ({ page }) => {
    const login = new LoginPage(page);
    await login.login(users.borrower.email, users.borrower.password);
    await page.context().storageState({ path: storageState.borrower });
  });

  setup("officer auth", async ({ page }) => {
    const login = new LoginPage(page);
    await login.login(users.officer.email, users.officer.password);
    await page.context().storageState({ path: storageState.officer });
  });

  setup("developer auth", async ({ page }) => {
    const login = new LoginPage(page);
    await login.login(users.developer.email, users.developer.password);
    await page.context().storageState({ path: storageState.developer });
  });
});
