import { describe, expect, it } from '@jest/globals';

import { year } from '../dates.ts';
import pricing from '../pricing/pricing.ts';
import { crewCamp } from '../pricing/pricingLists.ts';
import registrationTypes from '../registrationTypes.ts';

const enrollmentFee = `non-refundable enrollment fee of $${pricing.crew_enrollment}`;
const mentionsFee = (name: string) =>
  registrationTypes.find(t => t.name === name)?.invitation_email_template.includes(enrollmentFee);

// Open question: full-trade kitchen crew are in crewCamp, so they're charged
// the fee, but their invitation says Lark is free with a full trade (and #14's
// E6 expects them to owe $0). Either the invitation or crewCamp is wrong.
const UNDECIDED = ['kitchen-full'];

// Sheet row "Problem w/ Invite emails": a stray "false" in invitations (#14, G5)
describe.each(registrationTypes.map(t => [t.name, t] as const))('the %s invitation email', (name, type) => {
  it('has no value left unfilled', () => {
    expect(type.invitation_email_template).not.toMatch(/\bfalse\b|\bundefined\b|\bNaN\b|\$\{/);
    expect(type.invitation_email_subject).not.toMatch(/\bfalse\b|\bundefined\b|\bNaN\b/);
  });

  // The kitchen invitations named Lark Camp 2024 long after
  it('names no camp year but this one', () => {
    for (const named of type.invitation_email_template.match(/Lark Camp (\d{4})/g) ?? []) {
      expect(named).toBe(`Lark Camp ${year}`);
    }
  });

  if (!UNDECIDED.includes(name)) {
    it(`mentions the enrollment fee ${crewCamp.includes(name) ? 'as crew' : 'only for crew'}`, () => {
      expect(mentionsFee(name)).toBe(crewCamp.includes(name));
    });
  }
});

describe.each(UNDECIDED)('the %s invitation email', (name) => {
  it.failing('mentions the enrollment fee its crew pay', () => {
    expect(mentionsFee(name)).toBe(crewCamp.includes(name));
  });
});
