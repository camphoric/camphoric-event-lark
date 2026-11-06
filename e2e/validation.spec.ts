import { expect, test } from '@camphoric/camphoric-event-import-tools/e2e';

import pricing from '../pricing/pricing.ts';
import messages from '../registrationErrorMessages.ts';
import {
  buyBadge,
  DONATION,
  expectNoRawMessages,
  expectRejected,
  fillRequired,
  requiredFields,
} from './forms.ts';

// Required fields, and the messages the form gives for wrong answers (#14, D
// and H). Sources: the "Required fields actually Required" and "Misc reg form
// corner cases" test procedures and the Registration Bugs Feb 2026 sheet.

const CREDENTIALS = 'Relevant credentials and certifications';

// The browser checks a required text field itself, before the form does; the
// form checks the rest, with its "required" message (H6)
const CHECKED_BY_FORM = ['Select a camp'];

// Found by D1: the phone widget starts with the country code (+1), which the
// pattern takes, so a registration without a phone number goes through
const NOT_REQUIRED_YET = ['Phone Number'];

// D1: each required answer, left out by itself
for (const field of requiredFields) {
  const it = NOT_REQUIRED_YET.includes(field) ? test.fail : test;
  it(`a registration without "${field}" isn't submitted`, async ({ page, registration }) => {
    const camper = await fillRequired(registration, [field]);
    await expectRejected(page, registration);
    // (Today's gap fails just here; the rest checks how a field is marked)
    if (NOT_REQUIRED_YET.includes(field)) return;
    if (CHECKED_BY_FORM.includes(field)) {
      await expect(camper.message(messages['*'].required).first()).toBeVisible();
      await expectNoRawMessages(page);
    } else {
      const control = registration.field(field).or(camper.field(field)).first();
      await expect(control).toHaveJSProperty('validity.valid', false);
    }
  });
}

// D1, the session: it's required, and starts as Full camp, so deleting its
// text gives the choice back rather than leaving it blank
test('the session can\'t be left blank', async ({ page, registration }) => {
  const camper = await fillRequired(registration);
  const session = camper.field('When will you attend?');
  await session.click();
  await session.press('ControlOrMeta+a');
  await session.press('Backspace');
  await page.keyboard.press('Escape');
  await camper.field('First name').click();
  await expect(session).toHaveValue('Full camp');
  await registration.expectTotal(pricing.full_adult);
});

// D2: a field shown when a box is checked is required too
test('a name badge needs a name', async ({ page, registration }) => {
  const camper = await fillRequired(registration);
  await camper.select('I would like to purchase a name badge for $5', 'Yes');
  await expectRejected(page, registration);
  await expect(camper.field('Name for name badge')).toHaveJSProperty('validity.valid', false);
});

// D2 and H3: sheet row "Required fields" (Skills); Madelyn's page of errors
test('a volunteer must check at least one skill', async ({ page, registration }) => {
  const camper = await fillRequired(registration);
  await camper.select('Willing to help', 'Yes');
  await camper.fill(CREDENTIALS, 'RN');
  await expectRejected(page, registration);
  await expect(camper.message(messages['campers.*.good_samaritan.skills'].minItems).first()).toBeVisible();
  await expectNoRawMessages(page);
});

test('a volunteer must give credentials', async ({ page, registration }) => {
  const camper = await fillRequired(registration);
  await camper.select('Willing to help', 'Yes');
  await camper.check('Medical');
  await expectRejected(page, registration);
  await expect(camper.field(CREDENTIALS)).toHaveJSProperty('validity.valid', false);
});

// D3: nothing optional is needed
test('the required answers alone reach the payment step', async ({ registration }) => {
  await fillRequired(registration);
  await registration.submit();
  await registration.expectPaymentStep();
});

// D4: sheet row "Required fields"
test('the form says what * means', async ({ registration }) => {
  await registration.open();
  await expect(registration.message('* indicates a required field')).toBeVisible();
});

// D5 ("Misc reg form corner cases" steps 2-9)
test('a registration needs a camper', async ({ page, registration }) => {
  await fillRequired(registration);
  await registration.removeCamper(1);
  await expect(page.getByRole('heading', { name: '1st Camper', exact: true })).toHaveCount(0);
  await expectRejected(page, registration);
  await expect(page.getByText(messages.campers.minItems).first()).toBeVisible();
  await expectNoRawMessages(page);

  await page.getByRole('button', { name: 'Add a 1st Camper' }).click();
  const camper = registration.camper(1);
  await camper.fill('First name', 'Pat');
  await camper.fill('Last name', 'Example');
  await camper.select('Gender', 'Nonbinary/other');
  await camper.select('When will you attend?', 'Full camp');
  await camper.select('What meals will you purchase?', 'No meals');
  await camper.chooseLodging('Let registrar assign my lodging');
  await registration.submit();
  await registration.expectPaymentStep();
});

test('a registration has at most 20 campers', async ({ page, registration }) => {
  test.slow();
  await registration.open();
  for (let n = 2; n <= 20; n++) await registration.addCamper();
  await expect(registration.camper(20).root).toBeVisible();
  await expect(page.getByRole('button', { name: /^Add a .* Camper$/ })).toHaveCount(0);
});

// D6: sheet row "Email regex" (👀, "needs broader discussion"). Today the
// registrant's email is checked by Camphoric's own pattern, which refuses this
// address, while a camper's email (format: email) takes it. Whichever is
// decided, both fields must agree, and the registrant's is Camphoric's.
test.fixme('unusual but valid email addresses are accepted for registrant and camper alike', async ({ page, registration }) => {
  const address = '!#$%&\'*+-/=?^_`{|}~@nowhere.org';
  const camper = await fillRequired(registration);
  await registration.fill('Registrant email', address);
  await camper.fill('Camper email', address);
  await registration.submit();
  await registration.expectPaymentStep();
  await expect(page).toHaveURL(/\/register\/payment/);
});

// H1: Jed's donation of 3.50 was "demanding an integer value"
for (const donation of ['1.1', '3.5']) {
  test(`a donation of ${donation} is rejected with a plain message`, async ({ page, registration }) => {
    await fillRequired(registration);
    await registration.fill(DONATION, donation);
    await expectRejected(page, registration);
    await expect(registration.message(messages.lta_donation.type).first()).toBeVisible();
    await expectNoRawMessages(page);
  });
}

// (B5: the field itself turns a negative donation into $0)
test('a negative donation becomes $0', async ({ registration }) => {
  await fillRequired(registration);
  const donation = registration.field(DONATION);
  await donation.fill('-1');
  await donation.blur();
  await expect(donation).toHaveValue('$0');
  await registration.expectTotal(pricing.full_adult);
});

// H2 (and B3): Mahati's pronouns over the limit gave "errors in the name badge field"
test('pronouns of 16 characters are rejected with a plain message', async ({ page, registration }) => {
  const camper = await fillRequired(registration);
  await buyBadge(camper, 'x'.repeat(16));
  await expectRejected(page, registration);
  await expect(camper.message(messages['campers.*.name_badge.pronouns'].maxLength).first()).toBeVisible();
  await expectNoRawMessages(page);
});

// H4 has no e2e test: the phone widget only produces "+" and digits, so the
// pattern's message can't be reached from the form.

// H5: an email address the browser takes but the schema doesn't
test('a malformed registrant email is rejected with a plain message', async ({ page, registration }) => {
  await fillRequired(registration);
  await registration.fill('Registrant email', 'pat@nowhere');
  await expectRejected(page, registration);
  await expect(registration.message(messages.registrant_email.pattern).first()).toBeVisible();
  await expectNoRawMessages(page);
});

test('a malformed camper email is rejected with a plain message', async ({ page, registration }) => {
  const camper = await fillRequired(registration);
  await camper.fill('Camper email', 'pat@nowhere');
  await expectRejected(page, registration);
  await expect(camper.message(messages['campers.*.email'].format).first()).toBeVisible();
  await expectNoRawMessages(page);
});

// H6 and H7: the browser's own check stops a form with a blank required text
// field before the form's validation runs, so neither the event-wide
// "required" message nor the error list at the top shows for an empty form.
// Madelyn's "giant page of errors" couldn't be reproduced.
test.fixme('an empty form lists one plain line per field, in form order', async ({ page, registration }) => {
  await registration.open();
  await registration.submit();
  await expect(page.getByText('Errors')).toBeVisible();
  await expect(page.getByText(/\.campers\[\d+\]/)).toHaveCount(0);
  await expectNoRawMessages(page);
});

