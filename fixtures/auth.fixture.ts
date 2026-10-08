import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { storageState } from '../utils/storage-state';
import { users } from '../test-data/users';

type AuthFixtures = {
  asBorrower: void;
  asOfficer: void;
  asDeveloper: void;
  withLoggedInBorrower: () => Promise<void>;
  withLoggedInOfficer: () => Promise<void>;
  withLoggedInDeveloper: () => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
  asBorrower: [async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: storageState.borrower });
    const page = await context.newPage();
    await use();
    await page.close();
    await context.close();
  }, { auto: false }],

  asOfficer: [async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: storageState.officer });
    const page = await context.newPage();
    await use();
    await page.close();
    await context.close();
  }, { auto: false }],

  asDeveloper: [async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: storageState.developer });
    const page = await context.newPage();
    await use();
    await page.close();
    await context.close();
  }, { auto: false }],

  withLoggedInBorrower: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.login(users.borrower.email, users.borrower.password);
    await use(async () => login.login(users.borrower.email, users.borrower.password));
  },

  withLoggedInOfficer: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.login(users.officer.email, users.officer.password);
    await use(async () => login.login(users.officer.email, users.officer.password));
  },

  withLoggedInDeveloper: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.login(users.developer.email, users.developer.password);
    await use(async () => login.login(users.developer.email, users.developer.password));
  },
});

export { expect } from '@playwright/test';
