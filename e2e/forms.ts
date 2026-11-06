import { expect, type CamperSection, type CamphoricAdmin, type ListQuestion, type RegistrationForm } from '@camphoric/camphoric-event-import-tools/e2e';
import type { Page } from '@playwright/test';

import { epaymentHandling } from '../index.ts';

// Helpers the specs share. Ones that know the client's markup belong in
// @camphoric/camphoric-event-import-tools/e2e; these find things by role and
// name only.

export const DONATION = 'Donation to Lark Traditional Arts (Tax Deductible, Dollars)';
export const BADGE = 'I would like to purchase a name badge for $5';
export const MEALS = 'What meals will you purchase?';
export const MEAL_TYPE = 'What types of meals do you want?';
export const AGE = 'Age (at the beginning of camp)';

// The client's money, as its ticker and payment step show it: $1,125.00
export const money = (amount: number) => amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

// An amount paid online: with the event's e-payment handling, to the cent,
// half cents up (testers confirmed $1153.125 → $1153.13)
const handling = Number(epaymentHandling);
export const online = (amount: number) => Math.round(amount * (100 + handling)) / 100;

// The JSON-schema messages testers couldn't make sense of (#14, H)
export const RAW_MESSAGES = [
  'must be integer',
  'must match pattern',
  'must NOT have more than',
  'must NOT have fewer than',
  'must have required property',
  'must be >=',
  'must match format',
];

// Text a template left unfilled (#14, F4)
export const UNFILLED = ['$;', 'NaN', 'undefined', 'null', '{{', '}}'];

/** A registrant email no other test uses, to find the email sent to it. */
export const uniqueEmail = () => `pat.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;

/** Opens the form with one camper (an adult, by default) coming to this session. */
export async function camperFor(registration: RegistrationForm, session: string): Promise<CamperSection> {
  await registration.open();
  const camper = registration.camper(1);
  await camper.select('When will you attend?', session);
  return camper;
}

// Each required answer of a registration with one camper, by the field's label
const REQUIRED: [string, (registration: RegistrationForm, camper: CamperSection) => Promise<void>][] = [
  ['Registrant email', r => r.fill('Registrant email', 'pat@example.com')],
  ['Billing First Name', r => r.fill('Billing First Name', 'Pat')],
  ['Billing Last Name', r => r.fill('Billing Last Name', 'Example')],
  ['Address', r => r.fill('Address', '1 Example Way')],
  ['City', r => r.fill('City', 'Exampleton')],
  ['State or Province', r => r.fill('State or Province', 'CA')],
  ['ZIP code or Postal Code', r => r.fill('ZIP code or Postal Code', '94000')],
  ['Phone Number', r => r.fill('Phone Number', '+1 555 123 5678')],
  ['First name', (_, c) => c.fill('First name', 'Pat')],
  ['Last name', (_, c) => c.fill('Last name', 'Example')],
  ['Gender', (_, c) => c.select('Gender', 'Nonbinary/other')],
  [MEALS, (_, c) => c.select(MEALS, 'No meals')],
  ['Select a camp', async (_, c) => { await c.chooseLodging('Let registrar assign my lodging'); }],
];

// (The session is required too, but it starts as Full camp and can't be
// cleared, so it isn't left out here: validation.spec.ts tests that. The age
// isn't required, and starts as 65 or older.)

/** The labels of the required answers fillRequired gives. */
export const requiredFields = REQUIRED.map(([label]) => label);

/**
 * Gives every required answer for one adult camper (full camp, no meals,
 * lodging assigned by the registrar) on the form already open, except those
 * named in `skip`. Returns the camper.
 */
export async function answerRequired(registration: RegistrationForm, skip: string[] = []): Promise<CamperSection> {
  const camper = registration.camper(1);
  for (const [label, answer] of REQUIRED) {
    if (!skip.includes(label)) await answer(registration, camper);
  }
  return camper;
}

/** Opens the form, then answerRequired. */
export async function fillRequired(registration: RegistrationForm, skip: string[] = []): Promise<CamperSection> {
  await registration.open();
  return answerRequired(registration, skip);
}

/**
 * Opens the form through an invitation to register as this registration type
 * (its `name` in registrationTypes.ts), and gives the required answers.
 */
export async function fillInvited(
  page: Page, admin: CamphoricAdmin, registration: RegistrationForm, type: string,
): Promise<CamperSection> {
  const invitation = await admin.invite(type, { name: 'Pat Example' });
  await page.goto(invitation.registerUrl);
  await expect(page.getByText('You\'re registering as:')).toBeVisible();
  return answerRequired(registration);
}

/** Chooses a meal plan, and a meal type with it. */
export async function chooseMeals(camper: CamperSection, plan: string): Promise<void> {
  await camper.select(MEALS, plan);
  await camper.select(MEAL_TYPE, 'Vegetarian');
}

/** Buys a name badge for the camper, with these pronouns. */
export async function buyBadge(camper: CamperSection, pronouns?: string): Promise<void> {
  await camper.select(BADGE, 'Yes');
  await camper.fill('Name for name badge', 'Pat');
  if (pronouns !== undefined) await camper.fill('Pronouns for name badge', pronouns);
}

/** The camper's parking passes. */
export const parkingPasses = (camper: CamperSection): ListQuestion => camper.list('Parking Passes');

/** Submits, and expects the form to stay on its registration step. */
export async function expectRejected(page: Page, registration: RegistrationForm): Promise<void> {
  // A submission that passes the form's own checks is posted to the server's
  // /register (draft saves go to /register/draft); one that doesn't, isn't
  const posted = page.waitForResponse(
    r => r.request().method() === 'POST' && /\/events\/\d+\/register$/.test(new URL(r.url()).pathname),
    { timeout: 5_000 },
  ).catch(() => null);
  await registration.submit();
  // (Give an accepted submission time to move on to the payment step)
  if (await posted) await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/register\/registration$/);
}

/** Expects none of the raw JSON-schema messages anywhere on the page. */
export async function expectNoRawMessages(page: Page): Promise<void> {
  const text = await page.locator('body').innerText();
  for (const raw of RAW_MESSAGES) expect(text).not.toContain(raw);
}

/** On the payment step: expects this amount due now by check, and with handling online. */
export async function expectDue(registration: RegistrationForm, check: number): Promise<void> {
  // (Polled: the amounts change a moment after a payment option is chosen)
  await expect.poll(() => registration.paymentTotal()).toBe(check);
  await expect.poll(() => registration.paymentTotal('online')).toBe(online(check));
}

/** Submits, and expects the payment step with this amount due by check (and online). */
export async function submitExpectingDue(registration: RegistrationForm, check: number): Promise<void> {
  await registration.submit();
  await registration.expectPaymentStep();
  await expectDue(registration, check);
}

/** With nothing to pay: finishes the registration, and waits for the finished page. */
export async function finishWithNothingDue(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Finish registration' }).click();
  await expect(page).toHaveURL(/\/register\/finished(\?|$)/);
}

/** Pays by check, and waits for the finished page. */
export async function payByCheck(page: Page, registration: RegistrationForm): Promise<void> {
  await registration.payByCheck();
  await expect(page).toHaveURL(/\/register\/finished(\?|$)/);
}
