import { expect, test } from '@camphoric/camphoric-event-import-tools/e2e';
import { request } from '@playwright/test';

import emails from '../emails.ts';
import { signIn } from './admin.ts';

// Lark Camp's group emails (#8), as the server has them once the event is
// imported: each is there, renders for every camper it reaches without an
// error or warning, and the Good Samaritan email reaches only volunteers. The
// sample registrations have no admin answers (guardian forms, early arrival
// volunteers, meal assignments), so the branches for those aren't reached
// here, and what each email says isn't checked.

// Only the server is checked, so one device is enough
test.skip(({ isMobile }) => isMobile, 'checks the server only: desktop is enough');

test('the group emails are imported, and render for the campers they reach', async ({ baseURL, eventId }) => {
  if (!baseURL) throw new Error('no Camphoric server: run these tests with a config from defineEventE2EConfig');
  const { storageState } = await signIn(baseURL, eventId);
  const api = await request.newContext({ baseURL, storageState });
  try {
    const templates = await (await api.get('/api/emailtemplates/')).json() as
      { event: number, purpose: string, name: string, recipient_source: string }[];
    const group = templates.filter(t => t.event === eventId && t.purpose === 'group');
    expect(group.map(t => t.name).sort()).toEqual(emails.map(e => e.name).sort());
    for (const template of group) expect(template.recipient_source, template.name).toBe('campers');

    const check = await api.get(`/api/events/${eventId}/templates/check`);
    expect(check.status()).toBe(200);
    const { results } = await check.json() as {
      results: { kind: string, label: string, mode: string, diagnostics: { severity: string, message: string, line: number | null }[] }[],
    };
    const checked = results.filter(r => r.kind === 'group_email');
    expect(checked).toHaveLength(emails.length);
    for (const result of checked) {
      expect(result.mode, `${result.label} was rendered for its recipients`).toBe('rendered');
      expect(result.diagnostics.map(d => `line ${d.line ?? '?'}: ${d.severity}: ${d.message}`), result.label)
        .toEqual([]);
    }
  } finally {
    await api.dispose();
  }
});

test('the Good Samaritan email reaches only the campers who volunteered', async ({ baseURL, eventId }) => {
  if (!baseURL) throw new Error('no Camphoric server: run these tests with a config from defineEventE2EConfig');
  const { storageState } = await signIn(baseURL, eventId);
  const api = await request.newContext({ baseURL, storageState });
  try {
    const csrf = storageState.cookies.find(c => c.name === 'csrftoken')?.value ?? '';
    const goodSamaritan = emails.find(e => e.name === 'Good Samaritan July')!;
    const response = await api.post(`/api/events/${eventId}/email/recipients`, {
      headers: { 'X-CSRFToken': csrf },
      data: { recipient_source: goodSamaritan.recipient_source, filter: goodSamaritan.filter },
    });
    expect(response.status(), await response.text()).toBe(200);
    const { recipients, skipped } = await response.json() as {
      recipients: { camper: number | null }[],
      skipped: { camper?: number | null, reason: string }[],
    };
    // A camper with no email of their own gets the registrant's, and the
    // server sends an address one email: so a household's later volunteers
    // are skipped as duplicates of the first
    const duplicates = skipped.filter(s => s.reason === 'duplicate').map(s => s.camper);
    expect(skipped.filter(s => s.reason !== 'duplicate'), 'skipped for another reason').toEqual([]);

    const body = await (await api.get(`/api/campers/?event=${eventId}`)).json() as
      { id: number, attributes: { good_samaritan?: { volunteer?: boolean } } }[] |
      { results: { id: number, attributes: { good_samaritan?: { volunteer?: boolean } } }[] };
    const campers = Array.isArray(body) ? body : body.results;
    const volunteers = campers.filter(c => c.attributes.good_samaritan?.volunteer).map(c => c.id);
    expect(volunteers.length, 'some sample campers volunteer').toBeGreaterThan(0);
    expect([...recipients.map(r => r.camper), ...duplicates].sort()).toEqual(volunteers.sort());
  } finally {
    await api.dispose();
  }
});
