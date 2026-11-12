import { adminCredentials, expect, test as base } from '@camphoric/camphoric-event-import-tools/e2e';
import { request, type BrowserContextOptions, type Page } from '@playwright/test';

import reports from '../reports.ts';

// Every report opens in the admin and renders without an error, and a CSV
// report is well-formed CSV. Only that: what a report says is for its own
// tests (__tests__/). The reports render on the server (Jinja), so a broken
// template shows as the page's "Render error", or as the render request
// failing; a broken page as a page or console error.

// A CSV's rows (RFC 4180: a quoted field may hold commas, doubled quotes and
// line breaks), or what's wrong with it
function csvRows(text: string): string[][] | string {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let fieldStart = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') {
        quoted = false;
        const next = text[i + 1];
        if (next !== undefined && next !== ',' && next !== '\n' && next !== '\r') {
          return `row ${rows.length + 1}: text after a closing quote (${JSON.stringify(text.slice(Math.max(0, i - 20), i + 20))})`;
        }
      } else field += ch;
    } else if (ch === '"' && fieldStart) { quoted = true; fieldStart = false; }
    else if (ch === '"') {
      return `row ${rows.length + 1}: a quote inside an unquoted field (${JSON.stringify(text.slice(Math.max(0, i - 20), i + 20))})`;
    } else if (ch === ',') { row.push(field); field = ''; fieldStart = true; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = ''; fieldStart = true;
    } else { field += ch; fieldStart = false; }
  }
  if (quoted) return `row ${rows.length + 1}: a quoted field that never closes`;
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// What's wrong with a CSV report: bad quoting, or a row whose number of
// fields isn't the header's (a field with an unquoted comma). Blank lines are
// allowed (some reports separate their tables with them).
function csvProblems(text: string): string[] {
  const rows = csvRows(text);
  if (typeof rows === 'string') return [rows];
  const lines = rows.map((fields, index) => ({ fields, line: index + 1 }))
    .filter(({ fields }) => fields.some(field => field.trim()));
  const [header] = lines;
  if (!header) return [];
  return lines
    .filter(({ fields }) => fields.length !== header.fields.length)
    .slice(0, 5)
    .map(({ fields, line }) =>
      `row ${line} has ${fields.length} fields, the header ${header.fields.length}: ${JSON.stringify(fields.join(','))}`);
}

type StorageState = Exclude<BrowserContextOptions['storageState'], string | undefined>;

interface AdminSession {
  storageState: StorageState;
  organizationId: number;
}

// The admin is signed in with a session cookie (the browser's admin doesn't
// take the API token the event was imported with), as the throwaway server's
// admin, whose username and password the global setup leaves for the workers.
async function signIn(baseURL: string, eventId: number): Promise<AdminSession> {
  const { username, password } = adminCredentials();
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

// Reports known to read a field Lark doesn't define, as __tests__/reportVariables
// test's knownMissing lists them: since Camphoric v0.18.0 the server warns about
// those too (camphoric#994), but only when a registration reaches the line, so
// whether one shows depends on what the tests have registered: a known warning
// may show, and any other fails. Each is a fix to make, and is removed from
// here with it. (#21's report, "Campers, Parking Exceptions", reads a registration
// admin field that the server doesn't warn about.)
const knownWarnings: Record<string, string[]> = {
  'Campers, By Zip Code (For Carpool)': ['line 31: warning: camper.attributes has no field \'phone\''], // #22
  'Campers, Confirmation Email Info': [
    'line 97: warning: camper.admin_attributes has no field \'meal_assignment\'', // #23
  ],
};

async function openReports(page: Page, organizationId: number, eventId: number) {
  await page.goto(`/admin/organization/${organizationId}/event/${eventId}/reports`);
  await expect(page.getByRole('heading', { name: 'Reports', level: 2 })).toBeVisible();
}

for (const { title, output } of reports) {
  test(`the report "${title}" renders`, async ({ page, eventId, adminSession, problems }) => {
    await openReports(page, adminSession.organizationId, eventId);

    const rendered = page.waitForResponse(response => /\/api\/reports\/\d+\/render$/.test(response.url()));
    await page.getByRole('button', { name: title, exact: true }).click();
    const response = await rendered;
    expect(response.status(), `rendering answered ${response.status()}: ${await response.text()}`).toBe(200);
    const { report, error, diagnostics = [] } = await response.json() as {
      report?: string,
      error?: string | null,
      diagnostics?: { severity: string, message: string, line?: number | null }[],
    };
    expect(error ?? '', 'the server\'s render error').toBe('');
    // The server's warnings: a field a Camphoric object doesn't have
    // (camper.frist_name) renders blank but is flagged here, apart from the
    // known ones
    const known = knownWarnings[title] ?? [];
    expect(diagnostics.map(d => `line ${d.line ?? '?'}: ${d.severity}: ${d.message}`)
      .filter(warning => !known.includes(warning)), 'the server\'s render warnings').toEqual([]);
    if (output === 'csv') expect(csvProblems(report ?? ''), 'the CSV\'s shape').toEqual([]);

    await expect(page.getByRole('heading', { name: title, level: 3 })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Report output' })).toBeVisible();
    await expect(page.getByText('Render error')).toHaveCount(0);
    expect(problems).toEqual([]);
  });
}
