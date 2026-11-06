import { expect, test } from '@camphoric/camphoric-event-import-tools/e2e';

import { ageLookup, mealsLookup } from '../pricing/camperPricingLogic.ts';
import pricing from '../pricing/pricing.ts';
import registrationTypes from '../registrationTypes.ts';
import {
  AGE,
  buyBadge,
  chooseMeals,
  fillInvited,
  finishWithNothingDue,
  parkingPasses,
  submitExpectingDue,
} from './forms.ts';

// Registration types, reached through an invitation's link (#14, E). Sources:
// the "Create Special Registration Invitation" test procedure, Meghan's
// "Testing Reg System (crew)" and "More testing" emails and Mahati's guest of
// talent notes. The invitation emails' own text is a unit test
// (__tests__/registrationTypes.test.ts).

// E1
for (const type of registrationTypes) {
  test(`an invitation link opens the form as ${type.label}`, async ({ page, admin }) => {
    const invitation = await admin.invite(type.name, { name: 'Pat Example' });
    await page.goto(invitation.registerUrl);
    await expect(page.getByText(`You're registering as: ${type.label}.`)).toBeVisible();
  });
}

// E2: sheet row "Crew enrollment fee". Camp 2 office crew, no meals, no
// parking pass, a badge: the fee only, and as an enrollment fee
test('crew pay the enrollment fee, on its own line, not as tuition', async ({ page, admin, registration }) => {
  const camper = await fillInvited(page, admin, registration, 'office-camp-2');
  await buyBadge(camper);
  await registration.expectTotal(pricing.crew_enrollment);
  await submitExpectingDue(registration, pricing.crew_enrollment);
  await expect(page.getByText('Crew Enrollment Fee', { exact: true })).toBeVisible();
  await expect(page.getByText('Tuition', { exact: true })).toHaveCount(0);
});

// E3: Meghan, "no free badges for crew other than office, Instructors, and
// community care". Camp 3 cleanup crew, no meals, a badge, 50% Deposit: $65,
// nothing halved
test('cleanup crew pay for a name badge, in full with a deposit', async ({ page, admin, registration }) => {
  const camper = await fillInvited(page, admin, registration, 'cleanup-camp-3');
  await buyBadge(camper);
  const total = pricing.crew_enrollment + pricing.name_badge;
  await submitExpectingDue(registration, total);
  await registration.choosePaymentOption('50% Deposit');
  await expect.poll(() => registration.paymentTotal()).toBe(total);
});

// E4: setup/teardown crew, 12-17, All Meals, a badge: the meals at the adult
// price (12 and up pay it, though #14 says $380), the badge and the fee
test('a minor on setup crew pays for meals, a badge and the fee', async ({ page, admin, registration }) => {
  const camper = await fillInvited(page, admin, registration, 'setup-teardown');
  await camper.select(AGE, ageLookup[17]);
  await chooseMeals(camper, mealsLookup.F);
  await buyBadge(camper);
  await registration.expectTotal(pricing.crew_enrollment + pricing.meals_adult_full + pricing.name_badge);
});

// E5: a bus driver's parking pass, badge and meals are free; office crew pay
// the crew parking price. (A regular camper's: pricing.spec.ts.)
test('a bus driver\'s parking, badge and meals are free', async ({ page, admin, registration }) => {
  const camper = await fillInvited(page, admin, registration, 'bus-driver');
  await chooseMeals(camper, mealsLookup.F);
  await buyBadge(camper);
  await parkingPasses(camper).add();
  await registration.expectTotal(0);
});

test('office crew park at the crew price', async ({ page, admin, registration }) => {
  const camper = await fillInvited(page, admin, registration, 'office-camp-1');
  await parkingPasses(camper).add();
  await registration.expectTotal(pricing.crew_enrollment + pricing.crew_parking_pass);
});

// E6: the invitation says "If you do not have a payment amount due, select
// “pay by check”", but with nothing due the payment step offers "Finish
// registration" instead
test('a registration with nothing to pay can be finished', async ({ page, admin, registration }) => {
  const camper = await fillInvited(page, admin, registration, 'bus-driver');
  await chooseMeals(camper, mealsLookup.F);
  await registration.expectTotal(0);
  await registration.submit();
  await registration.expectPaymentStep();
  await finishWithNothingDue(page);
});

// E6, full-trade kitchen crew: #14 expects $0, but kitchen-full is in crewCamp
// and pays the $60 enrollment fee, while its invitation says Lark is free with
// a full trade (#16). This pins today's charge (meals are free) until that's
// decided.
test('full-trade kitchen crew pay only the enrollment fee', async ({ page, admin, registration }) => {
  const camper = await fillInvited(page, admin, registration, 'kitchen-full');
  await chooseMeals(camper, mealsLookup.F);
  await registration.expectTotal(pricing.crew_enrollment);
});

// E7: sheet row "payment" (Mahati), "Not able to progress to payment page in
// the GoT scenario". Guest of Talent Staff, an adult, full camp, All Meals:
// tuition less pricing.talent_guest_discount (40%)
const guestTuition = pricing.full_adult * (1 + pricing.talent_guest_discount);

test('a guest of talent reaches the payment step, discounted', async ({ page, admin, registration }) => {
  const camper = await fillInvited(page, admin, registration, 'talent-guest');
  await chooseMeals(camper, mealsLookup.F);
  await submitExpectingDue(registration, guestTuition + pricing.meals_adult_full);
});

// E8: sheet row "Guests allowed": a guest of talent may bring campers, each
// discounted; a one-camper type (crew, talent, management) can't add one
test('a guest of talent can add campers, each discounted', async ({ page, admin, registration }) => {
  await fillInvited(page, admin, registration, 'talent-guest');
  const second = await registration.addCamper();
  await second.select('When will you attend?', 'Full camp');
  await registration.expectTotal(2 * guestTuition);
});

for (const type of ['office-camp-2', 'talent']) {
  test(`${type} can't add a camper`, async ({ page, admin, registration }) => {
    await fillInvited(page, admin, registration, type);
    await expect(registration.camper(1).root).toBeVisible();
    await expect(page.getByRole('button', { name: /^Add a .* Camper$/ })).toHaveCount(0);
  });
}
