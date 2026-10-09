import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

const baseURL = process.env.BASE_URL?.trim();
if (!baseURL) {
  throw new Error(
    'Missing environment variable "BASE_URL". Copy .env.example to .env and set the app URL before running Playwright tests.',
  );
}
const onCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  // Tests inside a file run sequentially (one worker per file). The app rate-limits
  // everything under /auth/* per IP, so auth flows must not run concurrently.
  fullyParallel: false,
  forbidOnly: onCI,
  retries: onCI ? 2 : 1,
  workers: onCI ? 2 : 3,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  globalTimeout: onCI ? 30 * 60_000 : undefined,

  reporter: onCI
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "en-US",
    timezoneId: "Asia/Kathmandu",
  },

  projects: [
    // 1. Creates the reusable authenticated sessions (storageState) exactly once per run.
    {
      name: "setup",
      testMatch: "**/*.setup.ts",
      timeout: 180_000,
    },

    // 2. Anonymous / public pages - never carries a session cookie.
    {
      name: "guest",
      dependencies: ["setup"],
      testMatch: "**/guest/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },

    // 3. Authentication flows (login/register/forgot password) - hit the /auth/* endpoints,
    //    which are rate limited, so they get a longer timeout for cool-down retries.
    {
      name: "auth",
      dependencies: ["setup"],
      testMatch: "**/auth/**/*.spec.ts",
      timeout: 180_000,
      use: { ...devices["Desktop Chrome"] },
    },

    // 4. Role: Borrower
    {
      name: "borrower",
      dependencies: ["setup"],
      testMatch: "**/borrower/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/borrower.json",
      },
    },

    // 5. Role: Credit Officer / Underwriter
    {
      name: "officer",
      dependencies: ["setup"],
      testMatch: "**/officer/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/officer.json",
      },
    },

    // 6. Role: Developer (owns the Credit Score API portal + API contract tests)
    {
      name: "developer",
      dependencies: ["setup"],
      testMatch: "**/developer/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/developer.json",
      },
    },

    // 7. Cross-role / deep-behavior tests (calculator edge cases, etc.) - anonymous session.
    {
      name: "integration",
      dependencies: ["setup"],
      testMatch: "**/integration/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },

    // Optional cross-browser smoke run: npx playwright test --project=mobile-chromium
    {
      name: "mobile-chromium",
      dependencies: ["setup"],
      testMatch: "**/guest/**/*.spec.ts",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
