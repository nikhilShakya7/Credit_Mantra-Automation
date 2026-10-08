import { test, expect } from '@playwright/test';
import { LandingPage } from '../../pages/LandingPage';
import { DeveloperPortalPage } from '../../pages/DeveloperPortalPage';
import { apiPayloads } from '../../test-data/api-payloads';
import { storageState } from '../../utils/storage-state';

test.describe('Developer: Portal & API contract', () => {
  test.use({ storageState: storageState.developer });

  test('Developer landing has API portal nav', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.gotoLanding();
    await landing.expectDeveloperNavPresent();
  });

  test('Developer portal loads', async ({ page }) => {
    const dev = new DeveloperPortalPage(page);
    await dev.gotoPortal();
    await dev.expectLoaded();
    const cards = await dev.cards.allInnerTexts();
    expect(cards.join('|')).toContain('Credit Score REST API v1');
    expect(cards.join('|')).toContain('Developer Credentials');
  });

  test('POST /api/v1/score/ with valid minimal payload returns 200 + scores', async ({ page, request }) => {
    const dev = new DeveloperPortalPage(page);
    await dev.gotoPortal();
    const token = await dev.getApiKey();
    const res = await request.post('/api/v1/score/', {
      headers: { Authorization: `Api-Key ${token}`, 'Content-Type': 'application/json' },
      data: apiPayloads.minimalValid,
    });
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'];
    expect(ct).toContain('application/json');
    const body = await res.json();
    expect(body).toHaveProperty('overall_credit_score');
    expect(body).toHaveProperty('risk_category');
    expect(body).toHaveProperty('nepal_risk_band');
    expect(body).toHaveProperty('nepal_risk_description');
    expect(body).toHaveProperty('recommended_loan');
    expect(body).toHaveProperty('suggested_emi');
    expect([201, 300]).not.toContain(res.status());
  });

  test('POST /api/v1/score/ without auth returns 401', async ({ request }) => {
    const res = await request.post('/api/v1/score/', {
      headers: { 'Content-Type': 'application/json' },
      data: apiPayloads.minimalValid,
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/score/ with bad token returns 403', async ({ request }) => {
    const res = await request.post('/api/v1/score/', {
      headers: { Authorization: 'Api-Key deadbeefdeadbeefdeadbeefdeadbeefdeadbeef', 'Content-Type': 'application/json' },
      data: apiPayloads.minimalValid,
    });
    expect(res.status()).toBe(403);
  });

  test('POST /api/v1/score/ non-array returns 400 with error', async ({ page, request }) => {
    const dev = new DeveloperPortalPage(page);
    await dev.gotoPortal();
    const token = await dev.getApiKey();
    const res = await request.post('/api/v1/score/', {
      headers: { Authorization: `Api-Key ${token}`, 'Content-Type': 'application/json' },
      data: apiPayloads.nonArray,
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  test('POST /api/v1/score/ bad type returns 400', async ({ page, request }) => {
    const dev = new DeveloperPortalPage(page);
    await dev.gotoPortal();
    const token = await dev.getApiKey();
    const res = await request.post('/api/v1/score/', {
      headers: { Authorization: `Api-Key ${token}`, 'Content-Type': 'application/json' },
      data: apiPayloads.badType,
    });
    expect(res.status()).toBe(400);
  });

  test('GET /api/v1/score/ returns 405', async ({ request }) => {
    const res = await request.get('/api/v1/score/');
    expect(res.status()).toBe(405);
  });

  test('Developer cannot access underwriter/portfolio (negative role check)', async ({ page }) => {
    await page.goto('/underwriter/dashboard/');
    const text = await page.locator('main').innerText();
    expect(text).toContain('Access Denied');
    await page.goto('/portfolio/dashboard/');
    const text2 = await page.locator('main').innerText();
    expect(text2).toContain('Access Denied');
  });
});
