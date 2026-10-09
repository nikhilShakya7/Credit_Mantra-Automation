# Test Documentation — Credit Mantra Playwright Suite

## Scope
End-to-end, API contract, and role-based regression for https://credit-mantra.codepixelz.tech/.

> Full per-test coverage (steps + assertions + access matrix + run/CI docs) lives in **[README.md](./README.md)**.

## Roles & Access
- Guest (anonymous): Landing, Calculators (public), Auth pages, Assistant (guest banner), all protected endpoints redirect to /auth/login/.
- Borrower (nikhil@codepixelzmedia.com.np): Statement Analyzer (upload/demo/results), SME Cashflow Analyzer, Assistant (personalized context), denied on /api/portal/, underwriter/portfolio.
- Credit Officer/Underwriter (rsnikhil77@gmail.com): Underwriter dashboard, Portfolio dashboard, denied on /api/portal/.
- Developer (dcefuajmbeqwkigity@vtmpj.net): Developer API portal, API contract tests; denied on underwriter/portfolio.

## Authentication model — login once
- All logins happen in the `setup` project only.
- `setup` probes a protected page with the cached `.auth/<role>.json`; if it is still valid the login is skipped entirely.
- On a warm cache a full run performs **0 logins**; otherwise at most one login per role. Force with `FORCE_LOGIN=1`.
- Role projects (`borrower`, `officer`, `developer`) load the saved `storageState`; no test logs in.

## Test Inventory — 38 unique cases (+4 mobile re-runs = 42 total)

### Project: setup (3)
1. borrower session → reuse or log in once → `.auth/borrower.json`
2. officer session → reuse or log in once → `.auth/officer.json`
3. developer session → reuse or log in once → `.auth/developer.json`

### Project: guest — no auth (4)
4. Landing page renders correctly
5. Theme toggle persists across reload
6. Calculators tabs switch and default DTI badge
7. EMI calculator shows defaults

### Project: auth — anonymous (7)
8. Invalid credentials show error (response body: `Invalid email or password.`)
9. Register empty submit blocked by HTML5 validation
10. Register password mismatch
11. Forgot password non-existent email redirects to verify (302 → /auth/forgot-password/verify/)
12. Unauthenticated redirected to login for protected pages (analyzer/upload, sme/dashboard, api/portal)
13. Assistant loads for guests
14. Protected role pages require login (api/portal, underwriter/dashboard, portfolio/dashboard)

### Project: borrower (8)
15. Borrower landing has correct nav
16. Statement upload UI loads
17. Demo: Salaried Professional reaches results + underwriter link
18. SME dashboard loads with metrics/tabs (DSCR present)
19. Assistant accessible/logged-in; can send message
20. Borrower denied API portal
21. Unsupported file upload shows error, stays on upload page
22. Borrower denied underwriter dashboard

### Project: officer (4)
23. Officer landing has underwriter/portfolio nav
24. Underwriter dashboard loads
25. Portfolio dashboard loads with metrics
26. Officer denied Developer API portal (403)

### Project: developer (9)
27. Developer landing has API portal nav
28. Developer portal loads (API v1 + credentials)
29. POST /api/v1/score/ valid -> 200 with scores/fields
30. POST /api/v1/score/ no auth -> 401
31. POST /api/v1/score/ bad token -> 403
32. POST /api/v1/score/ non-array -> 400 with error
33. POST /api/v1/score/ bad type -> 400
34. GET /api/v1/score/ -> 405
35. Developer denied underwriter/portfolio

### Project: integration (3)
36. DTI bands + edge cases (defaults 30.0%, income 0 clamps to 10000, 15/36/50/75%)
37. EMI input clamping on blur (10000->25000, large->25000000)
38. TAX: months clamp 15->12, SSF over-limit warning, tax output present

### Project: mobile-chromium (4)
39–42. Cases 4–7 replayed on a Pixel 7 device profile.

## Design Notes
- POM with role-based pages
- `setup` project (runs first, serial) builds/reuses `storageState` per role — one login only
- rate-limit resilience (429 detection + waitOutRateLimit) — the only sanctioned `waitForTimeout()`
- auth assertions use raw request responses (CSRF form POST / redirect headers) to avoid extra `/auth/*` calls
- CI-safe config (traces/screenshots/videos on failure, retries)
- No hardcoded secrets (.env)
