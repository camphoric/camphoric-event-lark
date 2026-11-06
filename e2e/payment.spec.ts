import { expect, test } from '@camphoric/camphoric-event-import-tools/e2e';

import { ageLookup, mealsLookup } from '../pricing/camperPricingLogic.ts';
import pricing from '../pricing/pricing.ts';
import { addParkingPass, buyBadge, DONATION, fillRequired, money, paymentOption, payByCheckFor } from './forms.ts';

// The payment step: full payment or a 50% deposit, by check (#14, C). Sources:
// the "Payment" test procedure, the "donation mis-calculated" thread and the
// Registration Bugs Feb 2026 sheet.
//
// The deposit (registrationDepositSchema.ts) halves only tuition and meals;
// parking, the badge and the donation are paid in full.
//
// The e2e event has no online payment (index.ts enables PayPal, and with it
// the 2.5% handling, only with PAYPAL_CLIENT_ID), so these pay by check, and
// the totals have no handling. The tests that need handling or PayPal are
// fixmes below.

const FULL = 'Full Payment';
const DEPOSIT = '50% Deposit';
const deposit = (total: number, tuition: number, meals = 0) => total - tuition / 2 - meals / 2;

// C1, by check: the "Payment" procedure's registration
test('the payment procedure\'s registration: full payment and deposit', async ({ page, registration }) => {
  const camper = await fillRequired(registration);
  await addParkingPass(camper).click();
  await addParkingPass(camper).click();
  await buyBadge(camper);
  await registration.fill(DONATION, '20');
  const total = pricing.full_adult + 2 * pricing.camper_parking_pass + pricing.name_badge + 20;
  await registration.expectTotal(total);

  await registration.submit();
  await registration.expectPaymentStep();
  await expect(paymentOption(page, FULL, total)).toBeVisible();
  await expect(paymentOption(page, DEPOSIT, deposit(total, pricing.full_adult))).toBeVisible();
  await expect(payByCheckFor(page, total)).toBeVisible();
  await registration.choosePaymentOption(DEPOSIT);
  await expect(payByCheckFor(page, deposit(total, pricing.full_adult))).toBeVisible();
});

// C2: on 2/18 a deposit added the donation twice
test('a deposit counts the donation once', async ({ page, registration }) => {
  await fillRequired(registration);
  await registration.fill(DONATION, '100');
  const total = pricing.full_adult + 100;
  await registration.submit();
  await registration.expectPaymentStep();
  await expect(paymentOption(page, FULL, total)).toBeVisible();
  await expect(paymentOption(page, DEPOSIT, deposit(total, pricing.full_adult))).toBeVisible();
});

test('a deposit with meals counts the donation once', async ({ page, registration }) => {
  const camper = await fillRequired(registration);
  await camper.select('What meals will you purchase?', mealsLookup.F);
  await camper.select('What types of meals do you want?', 'Vegetarian');
  await registration.fill(DONATION, '100');
  const total = pricing.full_adult + pricing.meals_adult_full + 100;
  await registration.submit();
  await registration.expectPaymentStep();
  await expect(paymentOption(page, FULL, total)).toBeVisible();
  await expect(paymentOption(page, DEPOSIT, deposit(total, pricing.full_adult, pricing.meals_adult_full)))
    .toBeVisible();
});

// C3: sheet row "Math on email"; Jed's "Due by June 20th: $-0.5". (The
// balance due is in the email: emails.spec.ts, G2.)
test('with no tuition or meals, the deposit is the whole total', async ({ page, registration }) => {
  const camper = await fillRequired(registration);
  await camper.select('Age (at the beginning of camp)', ageLookup[4]);
  await buyBadge(camper);
  await registration.fill(DONATION, '3');
  const total = pricing.name_badge + 3;
  await registration.submit();
  await registration.expectPaymentStep();
  await expect(paymentOption(page, DEPOSIT, total)).toBeVisible();
  await registration.choosePaymentOption(DEPOSIT);
  await registration.payByCheck();
  await expect(page).toHaveURL(/\/register\/finished$/);
  await expect(page.getByText(`for ${money(total)}`)).toBeVisible();
});

// C7: Madelyn asked whether a full payment is refundable
test('the payment step explains what the deposit covers', async ({ page, registration }) => {
  await fillRequired(registration);
  await registration.submit();
  await registration.expectPaymentStep();
  await expect(page.getByText(/nonrefundable 50% deposit/)).toBeVisible();
  await expect(page.getByText(/balance will be due by June 20/)).toBeVisible();
  await expect(page.getByText(/only applies to tuition and meals/)).toBeVisible();
});

// C1 with handling: $943.00, +2 passes $1127.50, +badge $1132.63, +$20
// $1153.13; by check $1125.00; browser Back $1153.13 again; deposit $693.13.
// C2 with handling: $1045.50 / $585.50, and with All Meals $1563.13 / $850.63.
test.fixme('e-payment handling is added online and not by check', () => {
  // Needs an e2e event with online payment (PAYPAL_CLIENT_ID) and the harness's
  // paymentTotal() (#14, Harness addition 3)
});

// C4: sheet row "Rounding Error" (Meghan): e.g. Camp 1 cleaning crew in an RV,
// Just Dinners, a parking pass, whose handled total ends in a half cent
test.fixme('paying by check doesn\'t round the total up', () => {
  // Needs handling (above) and an invitation (Harness addition 1)
});

// C5: sheet row "payment" (Mahati); M. Jones 2/20: PayPal hangs at $1460.63
// but not $943.00, and on 2/22 still failed after the fix. Write this first.
test.fixme('every total, half cents included, can be sent to PayPal', () => {
  // Needs PayPal in the e2e event, and the order amount read from the
  // order-create request (Harness addition 3): two decimals, equal to the total
});

// C6: sheet row "Deposit on confirmation page" (👀, "needs more wordsmithing").
// Today the page gives the amount of this check only.
test.fixme('the finished page tells a deposit payer the balance and its due date', () => {});
