import { test as setup, expect } from "@playwright/test";
import { Browser } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";
import { storageState, STORAGE_STATE_DIR, roleProbeUrl, Role } from "../../utils/storage-state";
import { users } from "../../test-data/users";
import fs from "fs/promises";

/**
 * Runs ONCE per Playwright run (project dependencies make every other project
 * wait for it). For each role we either:
 *
 *   - reuse an already-saved session when it is still valid (no login at all), or
 *   - perform exactly ONE login and persist the cookie jar to `.auth/`.
 *
 * This is the only place in the suite that authenticates. Role projects load the
 * saved `storageState`, so no test ever logs in again. Set FORCE_LOGIN=1 to wipe
 * the cache and force fresh logins.
 */
setup.describe.configure({ mode: 'serial' });

const credentials: Record<Role, { email: string; password: string }> = {
  borrower: users.borrower,
  officer: users.officer,
  developer: users.developer,
};

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

/** True when the saved session is still accepted by the server (probe returns 2xx, no login redirect). */
async function sessionIsValid(browser: Browser, role: Role): Promise<boolean> {
  const file = storageState[role];
  if (process.env.FORCE_LOGIN === '1' || !(await exists(file))) return false;

  const context = await browser.newContext({ storageState: file });
  try {
    const res = await context.request.get(roleProbeUrl[role], {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    return res.status() >= 200 && res.status() < 300;
  } catch {
    return false;
  } finally {
    await context.close();
  }
}

async function authenticate(browser: Browser, role: Role): Promise<void> {
  console.log(`[auth.setup] logging in once as ${role}`);
  const context = await browser.newContext();
  const page = await context.newPage();
  const login = new LoginPage(page);
  await login.login(credentials[role].email, credentials[role].password);
  await expect(page).toHaveURL(/\/$/);
  await context.storageState({ path: storageState[role] });
  await context.close();
}

setup.describe("Create reusable auth states", () => {
  setup.beforeAll(async () => {
    await fs.mkdir(STORAGE_STATE_DIR, { recursive: true });
  });

  for (const role of ['borrower', 'officer', 'developer'] as Role[]) {
    setup(`${role} session`, async ({ browser }) => {
      if (await sessionIsValid(browser, role)) {
        console.log(`[auth.setup] reusing saved ${role} session (no login)`);
        return;
      }
      await authenticate(browser, role);
    });
  }
});
