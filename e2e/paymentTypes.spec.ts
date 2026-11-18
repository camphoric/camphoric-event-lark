import { expect, test } from '@camphoric/camphoric-event-import-tools/e2e';
import { request } from '@playwright/test';

import event from '../index.ts';
import { signIn } from './admin.ts';

// The imported event's own payment types (#24), as the server offers them to a
// registrar recording a payment: after the built-in ones, and not online

// Only the server is checked, so one device is enough
test.skip(({ isMobile }) => isMobile, 'checks the server only: desktop is enough');

test('a payment can be recorded as Zelle or FCP Credit', async ({ baseURL, eventId }) => {
  if (!baseURL) throw new Error('no Camphoric server: run these tests with a config from defineEventE2EConfig');
  const { storageState } = await signIn(baseURL, eventId);
  const api = await request.newContext({ baseURL, storageState });
  try {
    const response = await api.get(`/api/events/${eventId}/`);
    expect(response.status()).toBe(200);
    const { payment_types, payment_type_choices } = await response.json() as {
      payment_types: unknown,
      payment_type_choices: { value: string, label: string, online: boolean }[],
    };
    expect(payment_types, 'the imported setting').toEqual(event.data.event.payment_types);
    expect(payment_type_choices.slice(-2)).toEqual([
      { value: 'Zelle', label: 'Zelle', online: false },
      { value: 'FCP Credit', label: 'FCP Credit', online: false },
    ]);
  } finally {
    await api.dispose();
  }
});
