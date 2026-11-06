import { expect, test } from '@camphoric/camphoric-event-import-tools/e2e';

import { ageLookup, mealsLookup } from '../pricing/camperPricingLogic.ts';
import pricing from '../pricing/pricing.ts';
import {
  BADGE,
  buyBadge,
  camperFor,
  DONATION,
  expectRejected,
  fillRequired,
  parkingPasses,
} from './forms.ts';

// Tuition, meals and extras, as the price ticker adds them up (#14, A and B).
// Sources: the "Meal and Tuition Pricing" test procedure, Jed's "Price
// examination test" email and the Registration Bugs Feb 2026 sheet.

const MEALS = 'What meals will you purchase?';
const AGE = 'Age (at the beginning of camp)';
const SESSION = 'When will you attend?';

type Age = keyof typeof ageLookup;
const adult = (age: Age) => age > 17;
const youth = (age: Age) => age > 4 && age <= 17;
// The meal table's "adult age 12+" and "child ages 0-11" (camperMeals.ts)
const adultMeals = (age: Age) => age > 11;

// Youngest first: the form starts at the oldest, so each pick is a change
const ages = (Object.keys(ageLookup).map(Number) as Age[]).sort((a, b) => a - b);

function tuition(age: Age, session: 'full' | 'half') {
  if (adult(age)) return session === 'full' ? pricing.full_adult : pricing.half_adult;
  if (youth(age)) return session === 'full' ? pricing.full_youth : pricing.half_youth;
  return session === 'full' ? pricing.full_kid : pricing.half_kid;
}

// A1: every age and session, with no meals
for (const session of ['Full camp', 'Half camp - 1st half', 'Half camp - 2nd half']) {
  test(`${session}: each age bracket pays its tuition`, async ({ registration }) => {
    const camper = await camperFor(registration, session);
    await camper.select(MEALS, 'No meals');
    for (const age of ages) {
      await camper.select(AGE, ageLookup[age]);
      await registration.expectTotal(tuition(age, session === 'Full camp' ? 'full' : 'half'));
    }
  });
}

// A2: every full-camp meal plan, at its age's price. Meals are priced by the
// meal table's ages, not tuition's: 12 and up pay the adult price, 0-11 the
// child's. (#14's A2 and A4 say youth meal prices for 5-17; the adult price for
// 12-17 is what's intended.)
test('each meal plan is added at the camper\'s age\'s price', async ({ registration }) => {
  const camper = await camperFor(registration, 'Full camp');
  for (const age of ages) {
    await camper.select(AGE, ageLookup[age]);
    await camper.select(MEALS, mealsLookup.F);
    await registration.expectTotal(tuition(age, 'full')
      + (adultMeals(age) ? pricing.meals_adult_full : pricing.meals_youth_full));
    await camper.select(MEALS, mealsLookup.D);
    await registration.expectTotal(tuition(age, 'full')
      + (adultMeals(age) ? pricing.meals_adult_dinners : pricing.meals_youth_dinners));
  }
});

// A3: replaces the fixme "a half-camp camper is offered the half-camp meal plans"
for (const [session, plan] of [['Half camp - 1st half', mealsLookup.A], ['Half camp - 2nd half', mealsLookup.B]]) {
  test(`${session} is offered its half-camp meal plan`, async ({ registration }) => {
    const camper = await camperFor(registration, session);
    await camper.select(MEALS, plan);
    await registration.expectTotal(pricing.half_adult + pricing.meals_adult_half);
    await camper.select(AGE, ageLookup[11]);
    await registration.expectTotal(pricing.half_youth + pricing.meals_youth_half);
  });
}

// A4: the meal plan stays, repriced for each age
test('changing age keeps the meal plan and reprices both', async ({ registration }) => {
  const camper = await camperFor(registration, 'Full camp');
  await camper.select(MEALS, mealsLookup.D);
  await registration.expectTotal(pricing.full_adult + pricing.meals_adult_dinners);
  await camper.select(AGE, ageLookup[17]);
  await registration.expectTotal(pricing.full_youth + pricing.meals_adult_dinners);
  await camper.select(AGE, ageLookup[11]);
  await registration.expectTotal(pricing.full_youth + pricing.meals_youth_dinners);
  await camper.select(AGE, ageLookup[4]);
  await registration.expectTotal(pricing.full_kid + pricing.meals_youth_dinners);
  await expect(camper.field(MEALS)).toHaveValue(mealsLookup.D);
  await camper.select(MEALS, 'No meals');
  await registration.expectTotal(0);
});

// B1: sheet row "Parking pass cost display"
test('the parking pass text shows its prices', async ({ registration }) => {
  const camper = await camperFor(registration, 'Full camp');
  await expect(camper.message(`pre-purchase parking passes for $${pricing.camper_parking_pass};`)).toBeVisible();
  const atCamp = pricing.camper_parking_pass + pricing.parking_pass_at_camp_extra;
  await expect(camper.message(`at camp, the cost will be $${atCamp}`)).toBeVisible();
  const text = await camper.root.innerText();
  expect(text).not.toMatch(/\$;|\$NaN|\$110/);
});

// B2 ("Misc reg form corner cases" steps 10-12): replaces the fixme "an RV
// parking pass and a parking type change its price" (the price doesn't depend
// on the vehicle)
test('up to 4 parking passes, each charged, and removing them takes them off', async ({ page, registration }) => {
  const camper = await fillRequired(registration);
  const without = pricing.full_adult;
  await registration.expectTotal(without);
  const passes = parkingPasses(camper);
  for (let n = 1; n <= 4; n++) {
    await passes.add();
    await registration.expectTotal(without + n * pricing.camper_parking_pass);
  }
  await expect(camper.root.getByRole('button', { name: 'Add A Parking Pass' })).toHaveCount(0);
  for (let n = 4; n >= 1; n--) await passes.remove(n);
  await registration.expectTotal(without);
  await registration.submit();
  await registration.expectPaymentStep();
  await expect(page).toHaveURL(/\/register\/payment/);
});

// B3: sheet row "Pronoun length"
for (const pronouns of ['they / them', 'x'.repeat(15)]) {
  test(`pronouns "${pronouns}" (${pronouns.length} characters) are accepted`, async ({ registration }) => {
    const camper = await fillRequired(registration);
    await buyBadge(camper, pronouns);
    await registration.expectTotal(pricing.full_adult + pricing.name_badge);
    await registration.submit();
    await registration.expectPaymentStep();
  });
}
// (16 characters are rejected: validation.spec.ts, H2)

// B4: sheet row "Name badge filter"
test('the name badge section warns that joke pronouns will be removed', async ({ registration }) => {
  const camper = await camperFor(registration, 'Full camp');
  await camper.select(BADGE, 'Yes');
  await expect(camper.message('Non-serious entries will be removed')).toBeVisible();
});

// B5: sheet row "Donation should be integer only". (-1 and 1.1 are rejected
// with their message: validation.spec.ts, H1.)
test('a donation can\'t be typed with letters, and adds its dollars', async ({ registration }) => {
  await camperFor(registration, 'Full camp');
  const donation = registration.field(DONATION);
  await donation.pressSequentially('abc');
  await expect(donation).toHaveValue('');
  await donation.fill('50');
  await registration.expectTotal(pricing.full_adult + 50);
});

// B6: after a rejected donation, testers saw Meals reset to All Meals and the
// total change
test('a rejected submission keeps every answer', async ({ page, registration }) => {
  const camper = await fillRequired(registration);
  await buyBadge(camper);
  await parkingPasses(camper).add();
  await registration.fill(DONATION, '3.5');
  const total = pricing.full_adult + pricing.name_badge + pricing.camper_parking_pass + 3.5;
  await registration.expectTotal(total);

  await expectRejected(page, registration);
  await expect(camper.field(MEALS)).toHaveValue('No meals');
  await expect(camper.field(BADGE)).toHaveValue('Yes');
  await expect(camper.field(SESSION)).toHaveValue('Full camp');
  await expect(parkingPasses(camper).items()).toHaveCount(1);
  await expect(registration.field(DONATION)).toHaveValue('$3.5');
  await registration.expectTotal(total);
});
