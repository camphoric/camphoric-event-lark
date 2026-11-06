import { expect, test, type CamperSection, type RegistrationForm } from '@camphoric/camphoric-event-import-tools/e2e';
import type { Locator, Page } from '@playwright/test';

// Helpers the specs share. Ones that know the client's markup belong in
// @camphoric/camphoric-event-import-tools/e2e (#14, "Harness additions"); these
// find things by role and name only.

export const DONATION = 'Donation to Lark Traditional Arts (Tax Deductible, Dollars)';
export const BADGE = 'I would like to purchase a name badge for $5';

// The client's money, as its ticker and payment step show it: $1,125.00
export const money = (amount: number) => amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

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
  ['What meals will you purchase?', (_, c) => c.select('What meals will you purchase?', 'No meals')],
  ['Select a camp', async (_, c) => { await c.chooseLodging('Let registrar assign my lodging'); }],
];

// (The session is required too, but it starts as Full camp and can't be
// cleared, so it isn't left out here: validation.spec.ts tests that. The age
// isn't required, and starts as 65 or older.)

/** The labels of the required answers fillRequired gives. */
export const requiredFields = REQUIRED.map(([label]) => label);

/**
 * Opens the form and gives every required answer for one adult camper
 * (full camp, no meals, lodging assigned by the registrar), except those
 * named in `skip`. Returns the camper.
 */
export async function fillRequired(registration: RegistrationForm, skip: string[] = []): Promise<CamperSection> {
  await registration.open();
  const camper = registration.camper(1);
  for (const [label, answer] of REQUIRED) {
    if (!skip.includes(label)) await answer(registration, camper);
  }
  return camper;
}

/** Buys a name badge for the camper, with these pronouns. */
export async function buyBadge(camper: CamperSection, pronouns?: string): Promise<void> {
  await camper.select(BADGE, 'Yes');
  await camper.fill('Name for name badge', 'Pat');
  if (pronouns !== undefined) await camper.fill('Pronouns for name badge', pronouns);
}

/** The camper's "Add A Parking Pass" button. */
export const addParkingPass = (camper: CamperSection): Locator =>
  camper.root.getByRole('button', { name: 'Add A Parking Pass' });

/**
 * The camper's parking passes' "Remove" buttons. (The camper's own Remove
 * button is in its section too. This knows rjsf's ids, so it belongs in the
 * harness: #14, Harness addition 4.)
 */
export const removeParkingPass = (camper: CamperSection): Locator =>
  camper.root.getByRole('button', { name: 'Remove', exact: true }).and(camper.root.locator('[id*="_parking_passes_"]'));

/**
 * Submits, and expects the form to stay on its registration step. A
 * submission the server throttles also stays, so it skips the test rather than
 * passing it (or, in a test.fail, failing it): camphoric/camphoric#985.
 */
export async function expectRejected(page: Page, registration: RegistrationForm): Promise<void> {
  // A submission that passes the form's own checks is posted to the server's
  // /register (draft saves go to /register/draft); one that doesn't, isn't
  const posted = page.waitForResponse(
    r => r.request().method() === 'POST' && /\/events\/\d+\/register$/.test(new URL(r.url()).pathname),
    { timeout: 5_000 },
  ).catch(() => null);
  await registration.submit();
  const response = await posted;
  test.skip(response?.status() === 429, 'the server throttled the submission (camphoric/camphoric#985)');
  // (Give an accepted submission time to move on to the payment step)
  if (response) await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/register\/registration$/);
}

/** Expects none of the raw JSON-schema messages anywhere on the page. */
export async function expectNoRawMessages(page: Page): Promise<void> {
  const text = await page.locator('body').innerText();
  for (const raw of RAW_MESSAGES) expect(text).not.toContain(raw);
}

/** The payment step's line for a payment option ("Full Payment: $1,125.00"). */
export const paymentOption = (page: Page, title: string, amount: number): Locator =>
  page.getByText(`${title}: ${money(amount)}`, { exact: true });

/** The payment step's pay-by-check button, for this amount. */
export const payByCheckFor = (page: Page, amount: number): Locator =>
  page.getByRole('button', { name: `Pay ${money(amount)} by check` });
