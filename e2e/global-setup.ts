import { validateEventImport } from '@camphoric/camphoric-event-import-spec';
import { setUpEvent } from '@camphoric/camphoric-event-import-tools/e2e';

import event, { epaymentHandling } from '../index.ts';

// Starts a throwaway Camphoric, imports this event with its registration open,
// its sample registrations (so the reports have campers to render) and online
// payment through the harness's fake PayPal, and removes the server afterwards.
// (onlinePayment needs the throwaway server, not CAMPHORIC_E2E_SERVER_URL's.)
// The harness enables PayPal, but not the handling, which the event sets only
// with PAYPAL_CLIENT_ID: so it's set here.
const withHandling = {
  ...event,
  data: { ...event.data, event: { ...event.data.event, epayment_handling: epaymentHandling } },
};
export default setUpEvent({
  event: withHandling,
  validate: validateEventImport,
  withSampleRegistrations: true,
  onlinePayment: true,
});
