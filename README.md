# Credit Mantra — E2E Test Coverage (Playwright + TypeScript)

Production-ready end-to-end suite covering every role, page, and API contract observed in the application.

|                      |                                                                      |
| -------------------- | -------------------------------------------------------------------- |
| **Framework**        | Playwright `^1.64.0` + TypeScript `^7.0.2`                           |
| **Design**           | Page Object Model + role-scoped projects + shared fixtures/test-data |
| **Test files**       | 7                                                                    |
| **Total test cases** | 44 (40 unique + 4 mobile re-runs)                                    |
| **Last result**      | ✅ 40 passed / 0 failed (`npx playwright test`)                      |

---

## 1. Roles & Access Matrix

Verified against the live application sidebar navigation (`/` → `.sidebar-nav .nav-item`).

| Feature / Route                              |      Guest      |       Borrower       |    Credit Officer    |      Developer       |
| -------------------------------------------- | :-------------: | :------------------: | :------------------: | :------------------: |
| `/` Landing Page                             |       ✅        |          ✅          |          ✅          |          ✅          |
| `/analyzer/upload/` Statement Analyzer       |    🔒 login     |          ✅          |       🔒 login       |       🔒 login       |
| `/calculators/` Financial Calculators        |       ✅        |          ✅          |          ✅          |          ✅          |
| `/sme/dashboard/` SME Cashflow Analyzer      |    🔒 login     |          ✅          |       🔒 login       |       🔒 login       |
| `/assistant/` AI Loan Assistant              | ✅ (guest mode) |          ✅          |          ✅          |          ✅          |
| `/api/portal/` Credit Score REST API         |    🔒 login     | ⛔ 403 Access Denied | ⛔ 403 Access Denied |          ✅          |
| `/underwriter/dashboard/` Credit Underwriter |    🔒 login     | ⛔ 403 Access Denied |          ✅          | ⛔ 403 Access Denied |
| `/portfolio/dashboard/` Portfolio Dashboard  |    🔒 login     | ⛔ 403 Access Denied |          ✅          | ⛔ 403 Access Denied |
| Sidebar nav item count                       |        6        |          5           |          7           |          6           |

- 🔒 = unauthenticated → HTTP 302 → `/auth/login/?next=<requested path>`
- ⛔ = authenticated but wrong role → HTTP 403 + `Access Denied` panel
- Post-login landing is always `/` (the `next` parameter is ignored by the app)

---

## 2. Coverage Summary

| #   | Playwright Project | Spec file                               | Auth                   | Cases | Focus                                          |
| --- | ------------------ | --------------------------------------- | ---------------------- | :---: | ---------------------------------------------- |
| 1   | `setup`            | `tests/setup/auth.setup.ts`             | performs login         |   3   | Builds reusable `storageState` for each role   |
| 2   | `guest`            | `tests/guest/public-ui.spec.ts`         | anonymous              |   4   | Public UI, theme, calculators smoke            |
| 3   | `auth`             | `tests/auth/auth-flows.spec.ts`         | anonymous              |   9   | Login, register, forgot password, route guards |
| 4   | `borrower`         | `tests/borrower/borrower-flows.spec.ts` | `.auth/borrower.json`  |   8   | Analyzer, SME, assistant, RBAC denials         |
| 5   | `officer`          | `tests/officer/officer-flows.spec.ts`   | `.auth/officer.json`   |   4   | Underwriter, portfolio, RBAC denials           |
| 6   | `developer`        | `tests/developer/api-portal.spec.ts`    | `.auth/developer.json` |   9   | API portal + REST API contract                 |
| 7   | `integration`      | `tests/integration/calculators.spec.ts` | anonymous              |   3   | Calculator boundary/edge-case behavior         |
| 8   | `mobile-chromium`  | `tests/guest/public-ui.spec.ts`         | anonymous              |   4   | Same guest suite on Pixel 7 (Pixel 7 viewport) |

> Projects 4–7 depend on `setup`, so all logins happen **once per run** and every subsequent test reuses the cookie jar. This is essential: the application rate-limits `/auth/*` per IP (see §8).

---

## 3. Test Cases by Role

### 3.1 `setup` — Session Bootstrap (3 cases)

Authenticates each role once and writes the browser storage state to `.auth/`. These are not assertions about the app; they are prerequisites.

| ID     | Test             | Steps                                                                       | Output                 |
| ------ | ---------------- | --------------------------------------------------------------------------- | ---------------------- |
| SET-01 | `borrower auth`  | Visit `/auth/login/`, submit borrower credentials, wait for redirect to `/` | `.auth/borrower.json`  |
| SET-02 | `officer auth`   | Same flow with credit officer credentials                                   | `.auth/officer.json`   |
| SET-03 | `developer auth` | Same flow with developer credentials                                        | `.auth/developer.json` |

---

### 3.2 Guest — Anonymous / Public UI (`guest`, 4 cases)

| ID     | Test                                          | Steps & Assertions                                                                                                                                                                                                                                                                                                                                                       |
| ------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GUE-01 | Landing page renders correctly                | Visit `/` → `document.title` contains `Credit Mantra`; `h1` contains `Credit Mantra`; hero CTA links **Analyze Bank Statement** and **Use Calculators** are visible; sidebar shows exactly **6** nav items (Landing Page, Statement Analyzer, Financial Calculators, SME Cashflow Analyzer, Credit Score API, AI Loan Assistant); top bar shows **Log In** / **Sign Up** |
| GUE-02 | Theme toggle persists across reload           | Click `Toggle Theme` → capture `document.body.className` + `localStorage.theme` → reload → values are identical                                                                                                                                                                                                                                                          |
| GUE-03 | Calculators tabs switch and default DTI badge | Visit `/calculators/` → EMI / Salary Tax / Affordability / DTI buttons all visible → switch to DTI → `#dti-output-percent` contains `%` → `#dti-risk-badge` visible                                                                                                                                                                                                      |
| GUE-04 | EMI calculator shows defaults                 | Visit `/calculators/` → `#emi-output-value` contains `NPR` → `#emi-principal-input` default value matches `/1000000/`                                                                                                                                                                                                                                                    |

---

### 3.3 Guest — Auth & Route Guards (`auth`, 9 cases)

| ID     | Test                                                         | Steps & Assertions                                                                                                                                                 |
| ------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AUT-01 | Invalid credentials show error                               | `/auth/login/` → submit `notfound.e2e@example.com` / `WrongPass123!` → `.messages-container` contains `Invalid email or password.`                                 |
| AUT-02 | Register empty submit blocked by HTML5 validation            | `/auth/register/` → click **Create Account** with empty fields → `#id_email.validationMessage` is non-empty (client-side constraint, no POST issued)               |
| AUT-03 | Register password mismatch                                   | Fill valid email/password/confirm-mismatch + accept terms → submit → `.messages-container` contains `Passwords do not match`                                       |
| AUT-04 | Forgot password non-existent email redirects to verify       | `/auth/forgot-password/` → submit a random `@example.com` address → **302 → `/auth/forgot-password/verify/`** (the app does not reveal whether the account exists) |
| AUT-05 | Unauthenticated user redirected to login for protected pages | `page.goto()` each of `/analyzer/upload/`, `/sme/dashboard/`, `/api/portal/` → final URL equals `/auth/login/?next=<original path>` for each                       |
| AUT-06 | Assistant loads for guests                                   | `/assistant/` → card title visible → `#chat_input` visible → `#send_btn` visible; guest banner shows **General Knowledge Mode**                                    |
| AUT-07 | Developer portal redirects to login when anonymous           | `/api/portal/` → URL matches `/auth/login/`                                                                                                                        |
| AUT-08 | Underwriter requires login                                   | `/underwriter/dashboard/` → URL matches `/auth/login/`                                                                                                             |
| AUT-09 | Portfolio requires login                                     | `/portfolio/dashboard/` → URL matches `/auth/login/`                                                                                                               |

---

### 3.4 Borrower — Statement Analyzer & SME (`borrower`, 8 cases)

Session: `.auth/borrower.json` · User: `nikhil@codepixelzmedia.com.np`

| ID     | Test                                                   | Steps & Assertions                                                                                                                                                                                                                                              |
| ------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BOR-01 | Borrower landing has correct nav                       | Visit `/` → sidebar contains **Statement Analyzer** + **SME Cashflow Analyzer**; sidebar does **not** contain **Credit Underwriter** or **Portfolio Dashboard**; `.user-menu-name` contains `nikhil` (session really is the borrower)                           |
| BOR-02 | Statement upload UI loads                              | `/analyzer/upload/` → `#drop_zone` visible → **Upload Bank Statements** card heading visible                                                                                                                                                                    |
| BOR-03 | Demo: use Salaried Professional and reach results      | `/analyzer/upload/` → submit the **💼 Salaried Professional** demo form → URL matches `/analyzer/results/<id>/` → `h3` contains `Step 1: Extraction Complete` → **Run Credit Underwriter** link `href` matches `/underwriter/run/<id>/` → metric boxes rendered |
| BOR-04 | SME dashboard loads with metrics and tabs              | `/sme/dashboard/` → `h3` contains `SME Commercial Analysis Dashboard` → tabs `#tabBtn-analysis` and `#tabBtn-history` visible → a `.metric-box` containing **DSCR** visible → `#statement-selector` present                                                     |
| BOR-05 | Assistant accessible to logged-in borrower             | `/assistant/` → `General Knowledge Mode` banner hidden (context-aware mode) → send `What is DTI?` → `#chat_log` contains `DTI` / `Debt-to-Income`                                                                                                               |
| BOR-06 | Borrower denied API portal                             | `/api/portal/` → `main` text contains **Access Denied** and references the **Borrower / Individual** role                                                                                                                                                       |
| BOR-07 | Uploading an unsupported file shows an error message   | `/analyzer/upload/` → set `#file_input` to a `.txt` file → click **Analyze** → `.messages-container` contains `unsupported format. Use CSV, XLS, XLSX, or PDF.` → URL stays on `/analyzer/upload/` (no half-created analysis)                                   |
| BOR-08 | Analyzer rejects access for other protected role pages | `/underwriter/dashboard/` → `main` text contains **Access Denied**                                                                                                                                                                                              |

---

### 3.5 Credit Officer / Underwriter (`officer`, 4 cases)

Session: `.auth/officer.json` · User: `rsnikhil77@gmail.com`

| ID     | Test                                          | Steps & Assertions                                                                                                                                                                                                                                 |
| ------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OFF-01 | Officer landing has underwriter/portfolio nav | Visit `/` → sidebar contains **Credit Underwriter** and **Portfolio Dashboard** → `.user-menu-name` visible (logged in)                                                                                                                            |
| OFF-02 | Underwriter dashboard loads                   | `/underwriter/dashboard/` → `h3` contains `Underwriting Credit Evaluation Engine` → **Analyze New Statement** link visible → history table headers contain `Date Reviewed`, `Applicant`, `Credit Score`, `Risk Classification`, `Recommended Loan` |
| OFF-03 | Portfolio dashboard loads with metrics        | `/portfolio/dashboard/` → `.metric-label` values (case-insensitive) contain `total applications evaluated` and `avg portfolio score` → `#riskCategoryChart` present                                                                                |
| OFF-04 | Officer cannot access Developer API portal    | `/api/portal/` → response status is **403** and `main` contains **Access Denied**                                                                                                                                                                  |

---

### 3.6 Developer — API Portal & REST Contract (`developer`, 9 cases)

Session: `.auth/developer.json` · User: `dcefuajmbeqwkigity@vtmpj.net`

| ID     | Test                                                                  | Steps & Assertions                                                                                                                                                                                                                                                                                                                                                       |
| ------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DEV-01 | Developer landing has API portal nav                                  | Visit `/` → sidebar contains **Credit Score API**                                                                                                                                                                                                                                                                                                                        |
| DEV-02 | Developer portal loads                                                | `/api/portal/` → `.card-title` texts contain **Credit Score REST API v1** and **Developer Credentials**                                                                                                                                                                                                                                                                  |
| DEV-03 | `POST /api/v1/score/` with valid minimal payload returns 200 + scores | Read the 64-hex API key from the portal UI at runtime (never from env) → `POST` with `Authorization: Api-Key <token>` and the 3-row transaction array → status **200**, `content-type: application/json`, body contains `overall_credit_score`, `risk_category`, `nepal_risk_band`, `nepal_risk_description`, `recommended_loan`, `suggested_emi`; status is not 201/301 |
| DEV-04 | `POST /api/v1/score/` without auth returns 401                        | Same payload, no `Authorization` header → **401**                                                                                                                                                                                                                                                                                                                        |
| DEV-05 | `POST /api/v1/score/` with bad token returns 403                      | `Authorization: Api-Key deadbeef…` → **403**                                                                                                                                                                                                                                                                                                                             |
| DEV-06 | `POST /api/v1/score/` non-array returns 400 with error                | Payload `{ "bad": 1 }` → **400** with JSON body containing `error` (`Request body must be a list of transactions.`)                                                                                                                                                                                                                                                      |
| DEV-07 | `POST /api/v1/score/` bad type returns 400                            | Row with `amount: "abc"` → **400** (`Malformed transaction record.`)                                                                                                                                                                                                                                                                                                     |
| DEV-08 | `GET /api/v1/score/` returns 405                                      | `GET` on the endpoint → **405** (write-only contract)                                                                                                                                                                                                                                                                                                                    |
| DEV-09 | Developer cannot access underwriter/portfolio (negative role check)   | `/underwriter/dashboard/` → **Access Denied**; `/portfolio/dashboard/` → **Access Denied**                                                                                                                                                                                                                                                                               |

---

### 3.7 Integration — Calculator Edge Cases (`integration`, 3 cases)

Anonymous session; these assert the JS behaviour behind the calculators rather than page rendering.

| ID     | Test                                                | Input → Expected output                                                                                                                                                                                                                                                                                                                                                                               |
| ------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| INT-01 | DTI calculator bands (boundary/edge cases)          | income `0` → output `N/A`/`0`, badge **Income Required**<br>income `10000` blur → field clamps/persists to `10000`<br>income `80000` + debt `12000` → `15.0%` → **Excellent / Low Debt**<br>income `80000` + debt `28800` → `36.0%` → **Moderate Debt Ratio**<br>income `80000` + debt `40000` → `50.0%` → **High Debt Burden**<br>income `80000` + debt `60000` → `75.0%` → **Critical Debt Levels** |
| INT-02 | EMI input clamping on blur                          | principal `10000` + blur → `25000` (min clamp)<br>principal `999999999` + blur → `25000000` (max clamp)                                                                                                                                                                                                                                                                                               |
| INT-03 | TAX: months clamp to 12, SSF warning + capped value | months `15` + blur → `12`<br>SSF `600000` → `#tax-ssf-warning` visible and contains `Exceeds max limit of NPR 500,000 (capped at NPR 500,000)` → `#tax-output-value` contains `NPR`                                                                                                                                                                                                                   |

> Note: the risk badge is rendered in uppercase by CSS (`EXCELLENT / LOW DEBT`), so all badge assertions are case-insensitive (`toContainText`).

---

### 3.8 Mobile Chromium (`mobile-chromium`, 4 cases)

Replays the entire guest suite (GUE-01 … GUE-04) on a **Pixel 7** device profile (mobile viewport + touch + mobile UA) to catch responsive-only breakage. Run explicitly:

```bash
npx playwright test --project=mobile-chromium
```

---

## 4. Coverage Gaps / Not Covered

| Gap                                                              | Reason                                                                            |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| OTP verification screen (`/auth/verify-otp/`, input `#otp_code`) | Requires a real emailed code — no test seam in the app                            |
| Successful password-reset completion                             | Same OTP dependency                                                               |
| Real CSV/XLSX/PDF upload happy-path                              | Demo statements cover the full analyze → results → underwriter pipeline instead   |
| Assistant reply content                                          | LLM-generated, non-deterministic — only the request/response envelope is asserted |
| Database-level assertions                                        | Suite is UI/API black-box only                                                    |
| Visual/regression screenshot baselines                           | Not configured                                                                    |

---

## 5. Project Structure

```
credit-mantra automation/
├── playwright.config.ts          # 8 projects, reporters, retries, timeouts
├── tsconfig.json
├── package.json                  # test / test:headed / test:ui / test:report / typecheck
├── .env                          # git-ignored credentials (NEVER commit)
├── .env.example                  # documented template
├── .gitignore
├── README.md                     # ← this file
├── TESTS.md                      # short test inventory
├── docs/
│   ├── architecture.md
│   ├── testing-guide.md
│   └── test-conditions.md
├── pages/                        # Page Object Model (14 objects)
│   ├── BasePage.ts               # shared goto / theme toggle / logout
│   ├── LandingPage.ts            # nav-per-role assertions, theme persistence
│   ├── LoginPage.ts              # rate-limit-aware login
│   ├── RegisterPage.ts           # field validation + messages + OTP redirect
│   ├── ForgotPasswordPage.ts     # reset request + verify redirect
│   ├── UploadPage.ts             # drop zone, demo forms, unsupported file
│   ├── ResultsPage.ts            # extraction-complete metrics + underwriter link
│   ├── SmePage.ts                # tabs, DSCR metric, statement selector
│   ├── UnderwriterPage.ts        # engine heading + history table
│   ├── PortfolioPage.ts          # metric labels/values + risk chart
│   ├── DeveloperPortalPage.ts    # cards + runtime API-key extraction
│   ├── AssistantPage.ts          # chat input/log + banner state
│   ├── CalculatorsPage.ts        # EMI/DTI/TAX/Salary inputs & outputs
│   └── ForbiddenPage.ts          # shared 403 "Access Denied" helper
├── fixtures/
│   └── auth.fixture.ts           # optional asBorrower/asOfficer/asDeveloper fixtures
├── test-data/
│   ├── users.ts                  # role credentials (from .env), invalid users, registration
│   ├── api-payloads.ts           # valid/invalid REST payloads
│   └── calculators.ts            # calculator fixtures
├── utils/
│   ├── env.ts                    # dotenv loading
│   ├── storage-state.ts          # .auth/*.json paths
│   ├── rate-limit.ts             # /auth/* 429 handling (the only waitForTimeout)
│   └── finance.ts                # DTI/EMI helpers
└── tests/
    ├── setup/auth.setup.ts       # 3 cases  → storageState
    ├── guest/public-ui.spec.ts   # 4 cases  → anonymous
    ├── auth/auth-flows.spec.ts   # 9 cases  → anonymous
    ├── borrower/borrower-flows.spec.ts  # 8 cases → .auth/borrower.json
    ├── officer/officer-flows.spec.ts    # 4 cases → .auth/officer.json
    ├── developer/api-portal.spec.ts     # 9 cases → .auth/developer.json
    └── integration/calculators.spec.ts  # 3 cases → anonymous
```

---

## 6. Page Objects & Locator Strategy

Selectors were verified against the live DOM — no invented/placeholder selectors are used.

| Locator type                                 | Used for                                                                                                                                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getByRole('button' \| 'link' \| 'heading')` | CTAs, tabs, nav, messages (`Log In`, **Create Account**, `Send Reset Code`, `Run Credit Underwriter`)                                                                                               |
| `getByTitle`                                 | Theme toggle                                                                                                                                                                                        |
| `getByPlaceholder` / `getByLabel`            | Form fields where no id exists                                                                                                                                                                      |
| Stable `#id` hooks                           | Widget internals the app exposes (`#drop_zone`, `#file_input`, `#analyze_btn`, `#chat_input`, `#send_btn`, `#statement-selector`, `#tabBtn-analysis`, `#dti-income-input`, `#riskCategoryChart`, …) |
| Structural CSS                               | `.card-title`, `.metric-box`, `.metric-label`, `.messages-container`, `.sidebar-nav .nav-item`, `th`                                                                                                |

**Known DOM quirks encoded in the page objects:**

- `#analyze_btn` is **hidden until a file is selected** — tests assert the drop zone instead.
- SME tabs must be addressed by `#tabBtn-analysis` / `#tabBtn-history`; a `hasText` filter on `.sme-tab` matches two nodes and trips strict mode.
- Portfolio metric labels render uppercase via CSS — assertions are lowercased first.
- The forgot-password button text is **Send Reset Code** (regex `/Reset Password|Send Reset/i`).

---

## 7. Configuration

`playwright.config.ts` highlights:

| Setting                | Value                                                     | Why                                                                  |
| ---------------------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| `fullyParallel`        | `false`                                                   | Tests inside a file run sequentially — `/auth/*` is per-IP throttled |
| `retries`              | `2` on CI / `1` locally                                   | Absorbs transient 429s                                               |
| `workers`              | `2` on CI / `3` locally                                   | Limits concurrent auth traffic                                       |
| `timeout`              | `60_000` default; `180_000` for `setup` & `auth`          | Cool-down retries need wall-clock budget                             |
| `trace`                | `on-first-retry`                                          | Debuggable failure artifacts without huge reports                    |
| `screenshot` / `video` | `only-on-failure` / `retain-on-failure`                   | Evidence only when needed                                            |
| Reporters              | `list` + `html` locally; `github` + `html` + `list` on CI |                                                                      |
| `BASE_URL`             | `process.env.BASE_URL` (`dotenv`)                         | Environment-agnostic                                                 |

**Projects & dependencies**

```
setup ──► guest
      ├──► auth
      ├──► borrower   (storageState: .auth/borrower.json)
      ├──► officer    (storageState: .auth/officer.json)
      ├──► developer  (storageState: .auth/developer.json)
      ├──► integration
      └──► mobile-chromium
```

---

## 8. Rate-Limit Handling (important)

The application throttles **everything under `/auth/*` per client IP** (~4 requests / 17s window) and responds with **HTTP 429** + a page whose heading is `Too Many Requests` and body contains `Please wait <strong>N</strong> second(s)`.

All auth traffic goes through `utils/rate-limit.ts`:

| Helper                                     | Behaviour                                                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `rateLimitBanner(page)`                    | Locator for the 429 heading                                                                                                   |
| `isRateLimited(page)`                      | Non-network visibility check                                                                                                  |
| `waitOutRateLimit(page)`                   | Sleeps the **full advertised** delay, then re-requests **once** — polling the throttled URL mid-window only feeds the counter |
| `gotoAuth(page, url)`                      | Navigates, waits out a 429, skips the GET if already on the target URL                                                        |
| `performAuthFlow(page, url, flow, isDone)` | navigate → fill → submit → retry the whole cycle until `isDone()` or a hard deadline (90s)                                    |
| `expectNotRateLimited(page)`               | Assertion helper                                                                                                              |

`utils/rate-limit.ts` is the **only** sanctioned place for `page.waitForTimeout()` — the cool-down is a server-side wall-clock window with no DOM/network event to await. No other file uses it.

Practical consequences:

- Never run a single test file in parallel with another auth test.
- After a burst of manual probing, wait ~60–90s before starting a run.
- If `Auth rate limit did not clear` appears, the IP is still blocked — wait and re-run, do not increase retries.

---

### Test-data modules

| File                        | Contents                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `test-data/users.ts`        | `users` (3 roles, from env), `invalidUsers` (`notFound`, `wrongPassword`, `invalidEmail`, `shortPassword`), `registration.default(suffix)` |
| `test-data/api-payloads.ts` | `minimalValid` (3 rows), `empty`, `nonArray`, `badType`, `missingDate`, `badTypeEnum`, `tiny`                                              |
| `test-data/calculators.ts`  | Calculator fixtures                                                                                                                        |

---

## 9. How to Run

```bash
# 1. Install
npm install
npx playwright install chromium

# 2. Configure
cp .env.example .env        # then fill in credentials

# 3. Verify
npm run typecheck           # tsc --noEmit

# 4. Run
npm test                    # full suite (all 7 projects)
npm run test:headed         # watch it
npm run test:ui             # interactive UI mode
npm run test:report         # open the last HTML report

# Targeted runs
npx playwright test --project=borrower
npx playwright test --project=developer
npx playwright test --project=mobile-chromium
npx playwright test tests/integration/calculators.spec.ts
npx playwright test -g "Access Denied"
```

### Expected output

```
  40 passed (≈ 2–3 min)
```

(`mobile-chromium` adds 4 more when selected.)

### Artifacts on failure

```
test-results/<spec>/test-failed-1.png    # screenshot
test-results/<spec>/video.webm           # video (retain-on-failure)
test-results/<spec>/trace.zip            # trace (on-first-retry)
test-results/<spec>/error-context.md     # page snapshot + DOM refs
playwright-report/index.html             # HTML report
```

---

## 10. CI/CD

Create `.github/workflows/playwright.yml`:

```yaml
name: Playwright E2E

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Type check
        run: npm run typecheck

      - name: Run E2E suite
        run: npx playwright test
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          BORROWER_EMAIL: ${{ secrets.BORROWER_EMAIL }}
          BORROWER_PASSWORD: ${{ secrets.BORROWER_PASSWORD }}
          CREDIT_OFFICER_EMAIL: ${{ secrets.CREDIT_OFFICER_EMAIL }}
          CREDIT_OFFICER_PASSWORD: ${{ secrets.CREDIT_OFFICER_PASSWORD }}
          DEVELOPER_EMAIL: ${{ secrets.DEVELOPER_EMAIL }}
          DEVELOPER_PASSWORD: ${{ secrets.DEVELOPER_PASSWORD }}

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14

      - name: Upload traces
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-traces
          path: test-results/
          retention-days: 7
```

Store all credentials as **GitHub Actions secrets** — nothing secret lives in the repo.

> **CI note:** the deployed app rate-limits `/auth/*` per IP. GitHub-hosted runners use shared egress IPs, so keep `workers: 2`, `retries: 2`, and the `setup` project as-is. If runs become flaky, reduce `workers` to `1`.

---

## 11. Conventions Used

1. **POM** — every spec calls page objects; raw selectors live only in `pages/`.
2. **Role-scoped projects** — the correct `storageState` is injected by the project, not by `beforeEach` re-logins (which would burn the rate-limit budget).
3. **Accessible selectors first** — `getByRole` / `getByLabel` / `getByPlaceholder` / `getByTestId` preferred; `#id` only for app-exposed widget internals that were verified in the DOM.
4. **No fake selectors** — every locator in this suite was confirmed against the live app.
5. **No stray `waitForTimeout()`** — only `utils/rate-limit.ts` uses it, with an explanatory comment.
6. **No hardcoded secrets** — credentials come from `.env` / CI secrets; the API key is scraped from the portal UI at runtime when `CREDIT_API_KEY` is empty.
7. **No invented behaviour** — assertions document observed behaviour, including quirks (e.g. forgot-password always redirects, `next` is ignored after login).
