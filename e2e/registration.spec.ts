import type { PromoCode } from '@camphoric/camphoric-event-import-spec';
import { expect, test, type CamperSection, type RegistrationForm } from '@camphoric/camphoric-event-import-tools/e2e';
import type { Page } from '@playwright/test';

import event from '../index.ts';
import promoCodes from '../promoCodes.ts';

const [firstTime, referrer] = promoCodes;

// The registration form, as a registrant fills it in. Every test shares the one
// imported event (see README.md), so a completed registration stays.

// Opens the form with one camper (an adult, by default) coming to this session
async function camperFor(registration: RegistrationForm, session: string): Promise<CamperSection> {
  await registration.open();
  const camper = registration.camper(1);
  await camper.select('When will you attend?', session);
  return camper;
}

test('the form opens under the event\'s name', async ({ page, registration }) => {
  await registration.open();
  await expect(page.getByRole('heading', { name: `${event.data.event.name} Registration` })).toBeVisible();
});

// From pricing.ts: $920 for full camp, $710 for half
test('an adult\'s tuition depends on the session', async ({ registration }) => {
  const camper = await camperFor(registration, 'Full camp');
  await registration.expectTotal(920);
  await camper.select('When will you attend?', 'Half camp - 1st half');
  await registration.expectTotal(710);
});

// Youth (5-17) pay $658 for full camp; under-5s pay no tuition
test('tuition depends on age', async ({ registration }) => {
  const camper = await camperFor(registration, 'Full camp');
  await camper.select('Age (at the beginning of camp)', '12-17 years old');
  await registration.expectTotal(658);
  await camper.select('Age (at the beginning of camp)', '0-4 years old');
  await registration.expectTotal(0);
});

test('a meal plan is added to the tuition', async ({ registration }) => {
  const camper = await camperFor(registration, 'Full camp');
  await camper.select('What meals will you purchase?', 'All Meals');
  await registration.expectTotal(920 + 505);
  await camper.select('What meals will you purchase?', 'Just Dinners');
  await registration.expectTotal(920 + 276);
});

test('a parking pass and a name badge are added', async ({ registration }) => {
  const camper = await camperFor(registration, 'Full camp');
  await camper.root.getByRole('button', { name: 'Add A Parking Pass' }).click();
  await registration.expectTotal(920 + 90);
  await camper.select('I would like to purchase a name badge for $5', 'Yes');
  await registration.expectTotal(920 + 90 + 5);
});

test('a donation is added to the total', async ({ registration }) => {
  await camperFor(registration, 'Full camp');
  await registration.fill('Donation to Lark Traditional Arts (Tax Deductible, Dollars)', '50');
  await registration.expectTotal(970);
});

// Registrants choose a camp, a kind of lodging and, for a tent, an area; the
// camp assigns the spot or cabin itself
test('lodging is chosen by camp, kind and tent area, not spot or cabin', async ({ registration }) => {
  await registration.open();
  const camper = registration.camper(1);
  const [camps, kinds] = await camper.chooseLodging('Camp 1', 'Tent', 'Area A');
  expect(camps).toEqual(['Camp 1', 'Camp 2', 'Camp 3', 'Let registrar assign my lodging']);
  expect(kinds).toEqual(expect.arrayContaining(['Tent', 'Cabin', 'RV']));
  await expect(camper.lodgingLevels()).toHaveCount(3);
  // (Another camp: choosing the camp already chosen would clear it)
  await camper.chooseLodging('Camp 2', 'Cabin');
  await expect(camper.lodgingLevels()).toHaveCount(2);
  await camper.chooseLodging('Let registrar assign my lodging');
  await expect(camper.lodgingLevels()).toHaveCount(1);
});

test('a registration missing required answers isn\'t submitted', async ({ page, registration }) => {
  await registration.open();
  await registration.submit();
  await expect(registration.camper(1).field('First name')).toHaveJSProperty('validity.valueMissing', true);
  await expect(page).toHaveURL(/\/register\/registration$/);
});

test('a registration goes through, paying by check', async ({ page, registration }) => {
  await registration.open();
  await registration.fill('Registrant email', 'pat@example.com');
  await registration.fill('Billing First Name', 'Pat');
  await registration.fill('Billing Last Name', 'Example');
  await registration.fill('Address', '1 Example Way');
  await registration.fill('City', 'Exampleton');
  await registration.fill('State or Province', 'CA');
  await registration.fill('ZIP code or Postal Code', '94000');
  await registration.fill('Phone Number', '+1 555 123 5678');
  const camper = registration.camper(1);
  await camper.fill('First name', 'Pat');
  await camper.fill('Last name', 'Example');
  await camper.select('Gender', 'Nonbinary/other');
  await camper.select('When will you attend?', 'Full camp');
  await camper.select('What meals will you purchase?', 'No meals');
  await camper.chooseLodging('Let registrar assign my lodging');
  await registration.expectTotal(920);

  await registration.submit();
  await registration.expectPaymentStep();
  await registration.payByCheck();
  await expect(page).toHaveURL(/\/register\/finished$/);
});

// Enters a promo code above "Continue to payment" and applies it
async function applyPromoCode(page: Page, promo: PromoCode) {
  await page.getByLabel('Promo code', { exact: true }).fill(promo.code);
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByText(`Applied: ${promo.label}`)).toBeVisible();
}

// From promoCodes.ts: $100 off each camper's tuition
test('the first-time camper code takes $100 off each camper', async ({ page, registration }) => {
  await camperFor(registration, 'Full camp');
  const youth = await registration.addCamper();
  await youth.select('When will you attend?', 'Full camp');
  await youth.select('Age (at the beginning of camp)', '12-17 years old');
  await registration.expectTotal(920 + 658);
  await applyPromoCode(page, firstTime);
  await registration.expectTotal(920 + 658 - 2 * 100);
});

// An under-5 pays no tuition, so their meals aren't discounted
test('the first-time camper code comes off tuition only', async ({ page, registration }) => {
  await camperFor(registration, 'Full camp');
  const child = await registration.addCamper();
  await child.select('When will you attend?', 'Full camp');
  await child.select('Age (at the beginning of camp)', '0-4 years old');
  await child.select('What meals will you purchase?', 'All Meals');
  await registration.expectTotal(920 + 380);
  await applyPromoCode(page, firstTime);
  await registration.expectTotal(920 + 380 - 100);
});

// From promoCodes.ts: $75 off the registration's meals, once
test('the referrer code takes $75 off the meals, once for the registration', async ({ page, registration }) => {
  const camper = await camperFor(registration, 'Full camp');
  await camper.select('What meals will you purchase?', 'All Meals');
  const youth = await registration.addCamper();
  await youth.select('When will you attend?', 'Full camp');
  await youth.select('Age (at the beginning of camp)', '12-17 years old');
  await youth.select('What meals will you purchase?', 'All Meals');
  await registration.expectTotal(920 + 505 + 658 + 505);
  await applyPromoCode(page, referrer);
  await registration.expectTotal(920 + 505 + 658 + 505 - 75);
});

test('the referrer code takes nothing off without meals', async ({ page, registration }) => {
  const camper = await camperFor(registration, 'Full camp');
  await camper.select('What meals will you purchase?', 'No meals');
  await applyPromoCode(page, referrer);
  await registration.expectTotal(920);
});

// Next, the behaviour particular to this camp:
test.fixme('each registration type (crew, kitchen, talent, …) changes the fees', () => {});
test.fixme('a half-camp camper is offered the half-camp meal plans', () => {});
test.fixme('an RV parking pass and a parking type change its price', () => {});
