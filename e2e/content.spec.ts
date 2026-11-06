import { expect, test } from '@camphoric/camphoric-event-import-tools/e2e';
import type { Page } from '@playwright/test';

import { year } from '../dates.ts';
import regTemplateVars from '../regTemplateVars.ts';
import { addParkingPass, DONATION, fillRequired, UNFILLED } from './forms.ts';

// The page's text and links (#14, F). Sources: the "Misc reg form info",
// "Checking Links" and "Checking Spelling and Grammar" test procedures and the
// Registration Bugs Feb 2026 sheet.

const text = (page: Page) => page.locator('body').innerText();

// The form with every optional section open: a badge, a volunteer, a parking
// pass, a second camper's address
async function openEverything(page: Page, registration: Parameters<typeof fillRequired>[0]) {
  const camper = await fillRequired(registration);
  await camper.select('I would like to purchase a name badge for $5', 'Yes');
  await camper.select('Willing to help', 'Yes');
  await addParkingPass(camper).click();
  await camper.check('This camper\'s address is different than the billing address');
  return camper;
}

// F1 (the browser tab's title is Camphoric's, not the event's)
test('the page shows this camp\'s year', async ({ page, registration }) => {
  await registration.open();
  await expect(page.getByRole('heading', { name: `Lark Camp ${year} Registration` })).toBeVisible();
});

// F2
test('the camp\'s dates are given', async ({ registration }) => {
  const camper = registration.camper(1);
  await registration.open();
  const v = regTemplateVars;
  await expect(camper.message(`Full camp begins ${v.full_camp_start_date_time}, and ends ${v.full_camp_end_date_time}.`))
    .toBeVisible();
  await expect(camper.message(`First half camp begins ${v.first_half_camp_start_date_time}, and ends ${v.first_half_camp_end_date_time}.`))
    .toBeVisible();
  await expect(camper.message(`Second half camp begins ${v.second_half_camp_start_date_time}, and ends ${v.second_half_camp_end_date_time}.`))
    .toBeVisible();
});

// F2's address and phone: the payment step doesn't show them; the finished
// page does, as the template writes the number (707-397-5275)
test('the finished page gives the address for checks and a phone number', async ({ page, registration }) => {
  await fillRequired(registration);
  await registration.submit();
  await registration.expectPaymentStep();
  await registration.payByCheck();
  await expect(page).toHaveURL(/\/register\/finished$/);
  const finished = await text(page);
  expect(finished).toContain('PO Box 1724');
  expect(finished).toContain('Mendocino, CA 95460');
  expect(finished).toContain('707-397-5275');
});

// F3: sheet rows "Typo on reg" and "Typo on form"
test('fixed typos stay fixed', async ({ page, registration }) => {
  await openEverything(page, registration);
  const form = await text(page);
  for (const typo of ['Zipcode', 'busses', 'paid .', 'counceling', 'Relevent']) expect(form).not.toContain(typo);
  for (const word of ['ZIP code', 'buses', 'Counseling', 'Relevant']) expect(form).toContain(word);
});

// F4: on the form, the payment step and the finished page
test('no template value is left unfilled', async ({ page, registration }) => {
  const camper = await openEverything(page, registration);
  const check = async () => {
    const shown = await text(page);
    for (const unfilled of UNFILLED) expect(shown, `"${unfilled}" on ${page.url()}`).not.toContain(unfilled);
  };
  await check();
  // (Back to answers that go through)
  await camper.field('This camper\'s address is different than the billing address').uncheck();
  await camper.select('Willing to help', 'No');
  await camper.fill('Name for name badge', 'Pat');
  await registration.fill(DONATION, '20');
  await registration.submit();
  await registration.expectPaymentStep();
  await check();
  await registration.payByCheck();
  await expect(page).toHaveURL(/\/register\/finished$/);
  await check();
});

// Found while writing these (a Camphoric client gap: a number field's
// description isn't rendered as markdown): the donation's description is shown as text, so
// its link reads "[https://www.larkcamp.org/](https://www.larkcamp.org/)"
test.fail('the donation description shows its link, not markdown', async ({ registration }) => {
  await registration.open();
  await expect(registration.message(/\]\(https?:/)).toHaveCount(0);
});

// F5, sheet row "Broken LInk": the name badge sample is this camp year's. It
// fails from August, when the form moves to next year, until that year's
// design is posted and camperSchema.ts links it.
test.fail('the name badge sample is this year\'s design', async ({ registration }) => {
  const camper = await fillRequired(registration);
  await camper.select('I would like to purchase a name badge for $5', 'Yes');
  await expect(camper.root.getByRole('link', { name: 'sample of the design here' }))
    .toHaveAttribute('href', new RegExp(`LarkBadge${year}_`));
});

// F5: sheet rows "Broken LInk" and the Camp 3 map
test('the form\'s links are this year\'s and mail the registrar', async ({ page, registration }) => {
  await openEverything(page, registration);
  const hrefs = await page.locator('a[href]').evaluateAll(links => links.map(a => (a as unknown as { href: string }).href));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    expect(href).not.toMatch(/2025/);
    if (href.startsWith('mailto:')) expect(href).toBe('mailto:registration@larkcamp.org');
  }
});

test('the form\'s larkcamp.org links answer', async ({ page, registration, request }) => {
  test.skip(!!process.env.CI, 'reaches larkcamp.org: run it locally');
  await openEverything(page, registration);
  const hrefs = await page.locator('a[href*="larkcamp.org"]')
    .evaluateAll(links => links.map(a => (a as unknown as { href: string }).href));
  for (const href of new Set(hrefs)) {
    const response = await request.head(href);
    expect(response.status(), href).toBe(200);
  }
});

// F5, ⚠️ decide first: the donation text links to the home page (Madelyn
// expected the donate page); the Terms link at the top is still
// http://www.larkcamp.org/campterms.html, though the one above "Continue to
// payment" is a Google Doc (sheet row "Typo on terms", 👀)
test.fixme('the donation link goes to the donate page', () => {});
test.fixme('both Terms links go to the current terms', () => {});
