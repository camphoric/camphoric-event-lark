import { expect, test as base } from '@camphoric/camphoric-event-import-tools/e2e';
import { request, type BrowserContextOptions, type Page } from '@playwright/test';

import reports from '../reports.ts';

// Every report opens in the admin and renders without an error. Only that:
// what a report says is for its own tests (__tests__/). The reports render on
// the server (Jinja), so a broken template shows as the page's "Render error",
// or as the render request failing; a broken page as a page or console error.

type StorageState = Exclude<BrowserContextOptions['storageState'], string | undefined>;

interface AdminSession {
  storageState: StorageState;
  organizationId: number;
}

// The admin is signed in with a session cookie (the browser's admin doesn't
// take the API token). The global setup's import signs in with
// DJANGO_SUPERUSER_USERNAME / _PASSWORD (import-tools' getAuthToken), which
// the workers inherit.
async function signIn(baseURL: string, eventId: number): Promise<AdminSession> {
  const { DJANGO_SUPERUSER_USERNAME: username, DJANGO_SUPERUSER_PASSWORD: password } = process.env;
  if (!username || !password) {
    throw new Error('no admin credentials: the global setup\'s import sets DJANGO_SUPERUSER_USERNAME / _PASSWORD');
  }
  const api = await request.newContext({ baseURL });
  try {
    await api.get('/api/set-csrf-cookie');
    const csrf = (await api.storageState()).cookies.find(c => c.name === 'csrftoken')?.value ?? '';
    // Camphoric throttles sign-in: if a run has signed in too often (a failed
    // test restarts the worker, which signs in again), wait as it says, once
    for (let attempt = 1; ; attempt++) {
      const response = await api.post('/api/login', {
        headers: { 'X-CSRFToken': csrf },
        data: { username, password },
      });
      if (response.ok()) break;
      const wait = Number(response.headers()['retry-after']);
      if (response.status() !== 429 || attempt > 1 || !(wait <= 40)) {
        throw new Error(`signing in answered ${response.status()}: ${await response.text()}`);
      }
      await new Promise(resolve => setTimeout(resolve, wait * 1000));
    }
    const event = await api.get(`/api/events/${eventId}/`);
    if (!event.ok()) throw new Error(`GET /api/events/${eventId}/ answered ${event.status()}`);
    const { organization } = await event.json() as { organization: number };
    return { storageState: await api.storageState(), organizationId: organization };
  } finally {
    await api.dispose();
  }
}

// Signed in once per worker (a module's state lasts as long as its worker),
// not per test
let session: Promise<AdminSession> | undefined;

const test = base.extend<{ adminSession: AdminSession, problems: string[] }>({
  adminSession: async ({ baseURL, eventId }, use) => {
    if (!baseURL) throw new Error('no Camphoric server: run these tests with a config from defineEventE2EConfig');
    session ??= signIn(baseURL, eventId);
    // (A failed sign-in isn't kept, so the next test tries again)
    session.catch(() => { session = undefined; });
    await use(await session);
  },
  storageState: async ({ adminSession }, use) => {
    await use(adminSession.storageState);
  },
  // What went wrong on the page: uncaught errors, console errors and failed
  // requests to the server
  problems: async ({ page, baseURL }, use) => {
    const problems: string[] = [];
    page.on('pageerror', error => problems.push(`page error: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error') problems.push(`console error: ${message.text()}`);
    });
    page.on('response', response => {
      if (response.status() >= 400 && baseURL && response.url().startsWith(baseURL)) {
        problems.push(`${response.request().method()} ${response.url()} answered ${response.status()}`);
      }
    });
    page.on('requestfailed', req => problems.push(`${req.method()} ${req.url()} failed: ${req.failure()?.errorText}`));
    await use(problems);
  },
});

// The reports render on the server, so another device would only test the
// admin's layout
test.skip(({ isMobile }) => isMobile, 'reports render on the server: desktop is enough');

async function openReports(page: Page, organizationId: number, eventId: number) {
  await page.goto(`/admin/organization/${organizationId}/event/${eventId}/reports`);
  await expect(page.getByRole('heading', { name: 'Reports', level: 2 })).toBeVisible();
}

for (const { title } of reports) {
  test(`the report "${title}" renders`, async ({ page, eventId, adminSession, problems }) => {
    await openReports(page, adminSession.organizationId, eventId);

    const rendered = page.waitForResponse(response => /\/api\/reports\/\d+\/render$/.test(response.url()));
    await page.getByRole('button', { name: title, exact: true }).click();
    const response = await rendered;
    expect(response.status(), `rendering answered ${response.status()}: ${await response.text()}`).toBe(200);
    const { error } = await response.json() as { error?: string | null };
    expect(error ?? '', 'the server\'s render error').toBe('');

    await expect(page.getByRole('heading', { name: title, level: 3 })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Report output' })).toBeVisible();
    await expect(page.getByText('Render error')).toHaveCount(0);
    expect(problems).toEqual([]);
  });
}
