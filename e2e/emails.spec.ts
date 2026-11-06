import { expect, test, type CamphoricAdmin } from '@camphoric/camphoric-event-import-tools/e2e';

import { mealsLookup } from '../pricing/camperPricingLogic.ts';
import pricing from '../pricing/pricing.ts';
import {
  buyBadge,
  chooseMeals,
  DONATION,
  fillInvited,
  fillRequired,
  finishWithNothingDue,
  parkingPasses,
  payByCheck,
  uniqueEmail,
} from './forms.ts';

// The confirmation email a completed registration sends (#14, G), as the
// server sent it (the harness's admin.emails). The fixed text (G4) and the
// invitation emails (G5) are unit tests: __tests__/confirmationEmail.test.ts
// and __tests__/registrationTypes.test.ts.

// The confirmation email sent to this address, with its amounts' thousands
// separators taken out ($1,125.00 → $1125.00)
async function confirmation(admin: CamphoricAdmin, to: string): Promise<string> {
  const [email] = await admin.emails({ to, kind: 'confirmation' });
  expect(email, `a confirmation email to ${to}`).toBeDefined();
  return email.text.replace(/(\d),(\d{3})/g, '$1$2');
}

const dollars = (amount: number) => `$${amount.toFixed(2)}`;

// G1: sheet row "Math on email"; Meghan's emails. The "Payment" procedure's
// registration (payment.spec.ts, C1), paid in full by check
test('the confirmation email lists what was chosen, to the cent', async ({ page, admin, registration }) => {
  const to = uniqueEmail();
  const camper = await fillRequired(registration);
  await registration.fill('Registrant email', to);
  await parkingPasses(camper).add();
  await parkingPasses(camper).add();
  await buyBadge(camper);
  await registration.fill(DONATION, '20');
  await registration.submit();
  await registration.expectPaymentStep();
  await payByCheck(page, registration);

  const total = pricing.full_adult + 2 * pricing.camper_parking_pass + pricing.name_badge + 20;
  const text = await confirmation(admin, to);
  expect(text).toContain(`Tuition: ${dollars(pricing.full_adult)}`);
  expect(text).toContain(`Parking Passes Total: ${dollars(2 * pricing.camper_parking_pass)}`);
  expect(text.match(/^- Regular car/gm)).toHaveLength(2);
  expect(text).toContain(`Name badge (${dollars(pricing.name_badge)})`);
  expect(text).toContain(`Donation to Lark Traditional Arts: ${dollars(20)}`);
  expect(text).toContain(`Amount you are paying now: ${dollars(total)}`);
  expect(text).toContain(`Your total: ${dollars(total)}`);
  // Money always has two decimal places: $32.50, not 32.5
  for (const amount of text.match(/\$\d[\d.]*/g) ?? []) expect(amount).toMatch(/^\$\d+\.\d\d$/);
});

// G2: after C2 with a 50% Deposit: what's paid now is the payment step's, and
// what's due by June 20th is the rest, never negative
test('the confirmation email\'s deposit breakdown adds up', async ({ page, admin, registration }) => {
  const to = uniqueEmail();
  const camper = await fillRequired(registration);
  await registration.fill('Registrant email', to);
  await chooseMeals(camper, mealsLookup.F);
  await registration.fill(DONATION, '100');
  await registration.submit();
  await registration.expectPaymentStep();
  await registration.choosePaymentOption('50% Deposit');
  const total = pricing.full_adult + pricing.meals_adult_full + 100;
  const now = total - pricing.full_adult / 2 - pricing.meals_adult_full / 2;
  await expect.poll(() => registration.paymentTotal()).toBe(now);
  await payByCheck(page, registration);

  const text = await confirmation(admin, to);
  expect(text).toContain(`Amount you are paying now: ${dollars(now)}`);
  expect(text).toContain(`Due by June 20th: ${dollars(total - now)}`);
  expect(text).toContain(`Your total: ${dollars(total)}`);
  expect(text).not.toMatch(/\$-|-\$/);
});

// G3: Meghan, a bus driver: a $0 parking pass is listed, and isn't reported
// as not purchased
test('a free parking pass isn\'t reported as not purchased', async ({ page, admin, registration }) => {
  const to = uniqueEmail();
  const camper = await fillInvited(page, admin, registration, 'bus-driver');
  await registration.fill('Registrant email', to);
  await parkingPasses(camper).add();
  await registration.expectTotal(0);
  await registration.submit();
  await registration.expectPaymentStep();
  await finishWithNothingDue(page);

  const text = await confirmation(admin, to);
  expect(text).toMatch(/^- Regular car/m);
  expect(text).not.toContain('You have not purchased a parking pass');
});

// (Found while writing these: a camper with no meal plan was listed as
// "No meals, : $0.00")
test('a camper without meals isn\'t given an empty meal type', async ({ page, admin, registration }) => {
  const to = uniqueEmail();
  await fillRequired(registration);
  await registration.fill('Registrant email', to);
  await registration.submit();
  await registration.expectPaymentStep();
  await payByCheck(page, registration);
  expect(await confirmation(admin, to)).toContain('No meals: $0.00');
});
