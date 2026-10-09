import { Page, APIRequestContext, APIResponse, expect } from '@playwright/test';

/**
 * The application throttles everything under /auth/* per client IP.
 * When the budget is exhausted it serves an HTTP 429 page with the heading
 * "Too Many Requests" and a "Please wait N second(s)" cool-down hint.
 *
 * Every helper that touches an /auth/* URL goes through these functions so a
 * single throttled response never fails a test that is otherwise correct.
 */

const RATE_LIMIT_HEADING = 'Too Many Requests';
const DEFAULT_DEADLINE_MS = 60_000;

export function rateLimitBanner(page: Page) {
  return page.getByRole('heading', { name: RATE_LIMIT_HEADING });
}

export async function isRateLimited(page: Page): Promise<boolean> {
  return rateLimitBanner(page).isVisible().catch(() => false);
}

/**
 * Waits out the server-side cool-down window, re-loading `url` once the
 * advertised delay has elapsed.
 *
 * NOTE: this is the only place in the suite that deliberately calls
 * `page.waitForTimeout()`. The cool-down is a wall-clock window enforced by the
 * server - there is no DOM/network event to await - and polling the throttled
 * URL during the window only feeds the counter, so we sleep the full advertised
 * time and then make exactly one request.
 */
export async function waitOutRateLimit(page: Page, deadline = Date.now() + DEFAULT_DEADLINE_MS): Promise<void> {
  while ((await isRateLimited(page)) && Date.now() < deadline) {
    const body = await page.locator('body').innerText().catch(() => '');
    const match = body.match(/Please wait\s+(\d+)\s+second/i);
    const waitMs = Math.min(match ? Number(match[1]) * 1000 : 10_000, Math.max(deadline - Date.now(), 0));
    if (waitMs <= 0) break;
    await page.waitForTimeout(waitMs);
    await page.goto(page.url()).catch(() => undefined);
  }
}

/**
 * Navigates to an /auth/* URL, transparently waiting out a rate-limit response.
 */
export async function gotoAuth(page: Page, url: string, deadline = Date.now() + DEFAULT_DEADLINE_MS): Promise<void> {
  if (new URL(page.url()).pathname === url) return;
  do {
    await page.goto(url).catch(() => undefined);
    if (!(await isRateLimited(page))) return;
    await waitOutRateLimit(page, deadline);
  } while (Date.now() < deadline);

  throw new Error(`Auth rate limit did not clear for ${url}`);
}

/**
 * Runs an /auth/* form submission and retries the whole
 * (navigate -> fill -> submit) cycle if the server answers with a 429 page.
 *
 * `success` is evaluated after every attempt; return true as soon as the flow
 * achieved its goal (e.g. landed on a follow-up page).
 */
export async function performAuthFlow(
  page: Page,
  url: string,
  flow: () => Promise<void>,
  isDone: () => Promise<boolean> = async () => !(await isRateLimited(page)),
  deadline = Date.now() + DEFAULT_DEADLINE_MS
): Promise<void> {
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      await gotoAuth(page, url, deadline);
      await flow();
      if (await isDone()) return;
    } catch (error) {
      lastError = error;
    }
    if (await isRateLimited(page)) await waitOutRateLimit(page, deadline);
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Auth flow on ${url} did not complete before its deadline`);
}

/** Assertion helper: the current page is not showing the throttle screen. */
export async function expectNotRateLimited(page: Page): Promise<void> {
  await expect(rateLimitBanner(page)).toBeHidden();
}

/**
 * Submits an /auth/* form through the API request context (no browser redirect
 * chain) and retries only when the server answers 429. Avoids the extra GETs a
 * real navigation would add, which is important on a per-IP throttle.
 */
export async function postAuthForm(
  request: APIRequestContext,
  url: string,
  form: Record<string, string>,
  headers: Record<string, string> = {},
  deadline = Date.now() + DEFAULT_DEADLINE_MS
): Promise<APIResponse> {
  for (;;) {
    const res = await request.post(url, {
      form,
      headers,
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    if (res.status() !== 429) return res;

    const body = await res.text().catch(() => '');
    const match = body.match(/Please wait\s*(?:<strong>)?\s*(\d+)/i);
    const waitMs = Math.min(match ? Number(match[1]) * 1000 : 10_000, Math.max(deadline - Date.now(), 0));
    if (waitMs <= 0) return res;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}
