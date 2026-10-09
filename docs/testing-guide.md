# Testing Guide

## Prerequisites

Before running the suite, make sure the following are installed:

- Node.js (current project uses Playwright and TypeScript)
- npm
- a valid browser runtime for Playwright

Install dependencies:

```bash
npm install
```

## Environment setup

Create a `.env` file at the project root with values similar to these:

```bash
BASE_URL=https://credit-mantra.codepixelz.tech
BORROWER_EMAIL=your.borrower@example.com
BORROWER_PASSWORD=your-password
CREDIT_OFFICER_EMAIL=your.officer@example.com
CREDIT_OFFICER_PASSWORD=your-password
DEVELOPER_EMAIL=your.developer@example.com
DEVELOPER_PASSWORD=your-password
CREDIT_API_KEY=optional-api-key
```

`BASE_URL` is required for the suite to run reliably. Set it explicitly in `.env` before executing Playwright tests.

## Running the suite

Run the full suite:

```bash
npx playwright test
```

Run a specific project:

```bash
npx playwright test --project=guest
npx playwright test --project=auth
npx playwright test --project=borrower
npx playwright test --project=officer
npx playwright test --project=developer
npx playwright test --project=integration
```

Run a single file:

```bash
npx playwright test tests/auth/auth-flows.spec.ts
```

Run a single test by name:

```bash
npx playwright test -g "Invalid credentials show error"
```

Run headed mode:

```bash
npm run test:headed
```

Open the HTML report:

```bash
npm run test:report
```

Type-check the project:

```bash
npm run typecheck
```

## Understanding the project layout

The suite is organized by user type and lifecycle:

- `guest/`: anonymous browsing behaviors, public UI checks, and navigation smoke tests
- `auth/`: login, registration, password reset, and redirect validation
- `borrower/`: borrower dashboard, upload, analysis flows, and borrower navigation checks
- `officer/`: officer role checks and underwriter/portfolio coverage
- `developer/`: secured API checks, developer portal behavior, and developer navigation checks
- `integration/`: business-logic scenarios for calculators and formula validation
- `setup/`: reusable role-state generation

Current navigation-focused specs include:

- `tests/guest/navigation.spec.ts`
- `tests/borrower/nav.spec.ts`
- `tests/officer/nav.spec.ts`
- `tests/developer/nav.spec.ts`

Current formula-focused specs include:

- `tests/integration/calculations.spec.ts`
- `tests/integration/calculators.spec.ts`

## Important runtime behaviors

### Auth throttling

Auth endpoints are rate-limited. If the app responds with a 429 banner, the framework automatically waits out the cooldown instead of failing immediately.

This is implemented in `utils/rate-limit.ts` and is essential for stable auth tests in a real deployment.

### Storage state reuse

The `setup` project creates authenticated browser contexts and stores them in `.auth/*.json`. This reduces repeated login work and makes tests more deterministic.

### Redirect-based assertions

Several tests validate redirect URLs, including protected routes such as:

- `/analyzer/upload/`
- `/sme/dashboard/`
- `/api/portal/`
- `/underwriter/dashboard/`
- `/portfolio/dashboard/`

This is a reliable way to confirm authorization behavior in a live app.

## Writing new tests

When adding a new test, prefer these patterns:

1. Put the test in the correct role-specific suite
2. Reuse an existing page object class when possible
3. Keep selectors inside page objects, not directly in test files
4. Use role-based and text-based assertions where practical
5. Handle auth throttling with existing helper utilities
6. Add test data to the appropriate fixture file rather than embedding literals in the spec

## Troubleshooting

### Playwright cannot find browser binaries

Reinstall Playwright browsers:

```bash
npx playwright install
```

### Auth tests fail with 429 rate-limit pages

This is expected under heavy test repetition. The suite includes built-in cooldown logic. If the rate limit persists, reduce parallelism or space out runs.

### Session state is stale

Delete the generated `.auth` files and rerun the setup project:

```bash
rm -rf .auth
npx playwright test --project=setup
```

### `BASE_URL` or credentials are missing

Confirm your `.env` is populated correctly and that the application is reachable from this environment.

## Recommended workflow for daily development

Use targeted runs for quick feedback:

```bash
npx playwright test --project=guest
npx playwright test --project=auth
```

Then run the broader suite before release:

```bash
npx playwright test
```

## Summary

This project is designed to validate the live Credit Mantra app as a real user would experience it. The automation model emphasizes role-based access checks, browser stability, resilient auth handling, and strong coverage across the product's most important customer and developer journeys.
