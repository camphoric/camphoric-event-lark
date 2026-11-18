import { expect, test } from '@camphoric/camphoric-event-import-tools/e2e';
import { request } from '@playwright/test';

import event from '../index.ts';
import { signIn } from './admin.ts';

// The imported event's cancellation fee (#29), as the server keeps it and
// works it out for a camper. The fake PayPal never captures, so no sample
// registration has PayPal fees, and none has had a camper cancelled: each
// camper is offered the $150 alone. (__tests__/cancellationFee.test.ts
// checks the PayPal fees and later cancellations.)

// Only the server is checked, so one device is enough
test.skip(({ isMobile }) => isMobile, 'checks the server only: desktop is enough');

test('the event offers its cancellation fee when a camper is cancelled', async ({ baseURL, eventId }) => {
  if (!baseURL) throw new Error('no Camphoric server: run these tests with a config from defineEventE2EConfig');
  const { storageState } = await signIn(baseURL, eventId);
  const api = await request.newContext({ baseURL, storageState });
  try {
    const eventResponse = await api.get(`/api/events/${eventId}/`);
    expect(eventResponse.status()).toBe(200);
    const { cancellation_fee } = await eventResponse.json() as { cancellation_fee: unknown };
    expect(cancellation_fee, 'the imported setting').toEqual(event.data.event.cancellation_fee);

    const campersResponse = await api.get(`/api/campers/?event=${eventId}`);
    expect(campersResponse.status()).toBe(200);
    const body = await campersResponse.json() as { id: number }[] | { results: { id: number }[] };
    const [camper] = Array.isArray(body) ? body : body.results;
    expect(camper, 'a sample camper').toBeDefined();

    const feeResponse = await api.get(`/api/campers/${camper.id}/cancellation-fee/`);
    expect(feeResponse.status(), await feeResponse.text()).toBe(200);
    expect(await feeResponse.json()).toEqual({ amount: '150.00' });
  } finally {
    await api.dispose();
  }
});
