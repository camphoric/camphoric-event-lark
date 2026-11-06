import { expect, test } from '@camphoric/camphoric-event-import-tools/e2e';

import { ageLookup, mealsLookup } from '../pricing/camperPricingLogic.ts';
import pricing from '../pricing/pricing.ts';
import {
  buyBadge,
  chooseMeals,
  DONATION,
  expectDue,
  fillInvited,
  fillRequired,
  money,
  online,
  parkingPasses,
  payByCheck,
  submitExpectingDue,
} from './forms.ts';

// The payment step: full payment or a 50% deposit, by check or online (#14,
// C). Sources: the "Payment" test procedure, the "donation mis-calculated"
// thread and the Registration Bugs Feb 2026 sheet.
//
// The deposit (registrationDepositSchema.ts) halves only tuition and meals;
// parking, the badge and the donation are paid in full. Paying online adds
// the event's e-payment handling (2.5%) to what's paid now; a check doesn't.
// The e2e event takes online payments through the harness's fake PayPal
// (e2e/global-setup.ts), so nothing is paid.

const DEPOSIT = '50% Deposit';
const deposit = (total: number, tuition: number, meals = 0) => total - tuition / 2 - meals / 2;

// C1: the "Payment" procedure's registration: an adult, full camp, no meals
// ($943.00 online), 2 parking passes ($1127.50), a badge ($1132.63) and $20
// ($1153.13)
test('the payment procedure\'s registration: full payment and deposit', async ({ registration }) => {
  const camper = await fillRequired(registration);
  await parkingPasses(camper).add();
  await parkingPasses(camper).add();
  await buyBadge(camper);
  await registration.fill(DONATION, '20');
  const total = pricing.full_adult + 2 * pricing.camper_parking_pass + pricing.name_badge + 20;
  await registration.expectTotal(total);

  await submitExpectingDue(registration, total);
  expect(online(total)).toBe(1153.13);
  // A deposit's handling is on what's paid now. (#14 expects $693.13, the full
  // online total less half the tuition, which charges handling on the half
  // that isn't being paid.)
  await registration.choosePaymentOption(DEPOSIT);
  await expectDue(registration, deposit(total, pricing.full_adult));
});

// C1: going back from the payment step and on again keeps the totals
test('going back from the payment step keeps its totals', async ({ page, registration }) => {
  const camper = await fillRequired(registration);
  await parkingPasses(camper).add();
  const total = pricing.full_adult + pricing.camper_parking_pass;
  await submitExpectingDue(registration, total);
  await page.goBack();
  await expect(page).toHaveURL(/\/register\/registration$/);
  await registration.expectTotal(total);
  await submitExpectingDue(registration, total);
});

// C2: on 2/18 a deposit added the donation twice. (As in C1, a deposit's
// handling is on what's paid now: #14 expects $585.50 here and $850.63 with
// meals, the full online total less the halves, which charges handling on
// what isn't being paid.)
test('a deposit counts the donation once', async ({ registration }) => {
  await fillRequired(registration);
  await registration.fill(DONATION, '100');
  const total = pricing.full_adult + 100;
  await submitExpectingDue(registration, total);
  expect(online(total)).toBe(1045.50);
  await registration.choosePaymentOption(DEPOSIT);
  await expectDue(registration, deposit(total, pricing.full_adult));
});

test('a deposit with meals counts the donation once', async ({ registration }) => {
  const camper = await fillRequired(registration);
  await chooseMeals(camper, mealsLookup.F);
  await registration.fill(DONATION, '100');
  const total = pricing.full_adult + pricing.meals_adult_full + 100;
  await submitExpectingDue(registration, total);
  expect(online(total)).toBe(1563.13);
  await registration.choosePaymentOption(DEPOSIT);
  await expectDue(registration, deposit(total, pricing.full_adult, pricing.meals_adult_full));
});

// C3: sheet row "Math on email"; Jed's "Due by June 20th: $-0.5". (The
// balance due is in the email: emails.spec.ts, G2.)
test('with no tuition or meals, the deposit is the whole total', async ({ page, registration }) => {
  const camper = await fillRequired(registration);
  await camper.select('Age (at the beginning of camp)', ageLookup[4]);
  await buyBadge(camper);
  await registration.fill(DONATION, '3');
  const total = pricing.name_badge + 3;
  await submitExpectingDue(registration, total);
  await registration.choosePaymentOption(DEPOSIT);
  await expectDue(registration, total);
  await payByCheck(page, registration);
  await expect(page.getByText(`for ${money(total)}`)).toBeVisible();
});

// C4: sheet row "Rounding Error" (Meghan). Camp 1 cleanup crew in an RV, Just
// Dinners and a parking pass: $371, $380.275 online
test('paying by check doesn\'t round the total up', async ({ page, admin, registration }) => {
  const camper = await fillInvited(page, admin, registration, 'cleanup-camp-1');
  await camper.chooseLodging('Camp 1', 'RV', 'RV under 15\' long');
  await chooseMeals(camper, mealsLookup.D);
  await parkingPasses(camper).add();
  const total = pricing.crew_enrollment + pricing.meals_adult_dinners + pricing.crew_parking_pass;
  await registration.expectTotal(total);
  await submitExpectingDue(registration, total);
  expect(online(total)).toBe(380.28);
  await payByCheck(page, registration);
  await expect(page.getByText(`for ${money(total)}`)).toBeVisible();
});

// C5: sheet row "payment" (Mahati); M. Jones 2/20: PayPal hung at $1460.63, a
// half cent before rounding, but not at $943.00
for (const [what, meals, amount] of [['All Meals', mealsLookup.F, '1460.63'], ['no meals', 'No meals', '943.00']]) {
  test(`an adult with ${what} can be sent to PayPal, to the cent`, async ({ registration, payPal }) => {
    const camper = await fillRequired(registration);
    if (meals !== 'No meals') await chooseMeals(camper, meals);
    await registration.submit();
    await registration.expectPaymentStep();
    const shown = await registration.paymentTotal('online');
    const order = await payPal.order(await registration.startOnlinePayment());
    expect(order.amount).toBe(amount);
    expect(order.amount).toBe(shown.toFixed(2));
  });
}

// C7: Madelyn asked whether a full payment is refundable
test('the payment step explains what the deposit covers', async ({ page, registration }) => {
  await fillRequired(registration);
  await registration.submit();
  await registration.expectPaymentStep();
  await expect(page.getByText(/nonrefundable 50% deposit/)).toBeVisible();
  await expect(page.getByText(/balance will be due by June 20/)).toBeVisible();
  await expect(page.getByText(/only applies to tuition and meals/)).toBeVisible();
});

// C6: sheet row "Deposit on confirmation page" (👀, "needs more wordsmithing").
// Today the page gives the amount of this check only.
test.fixme('the finished page tells a deposit payer the balance and its due date', () => {});
