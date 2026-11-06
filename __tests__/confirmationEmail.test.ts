import { describe, expect, it } from '@jest/globals';

import { confirmation_email_template as template } from '../confirmationEmailTemplate.ts';

// The confirmation email's fixed text (#14, G4). What it says about a
// registration is an e2e test, once the harness can read sent mail.
describe('the confirmation email', () => {
  // Sheet row "Confirmation email"
  it('says meals need to be "ordered"', () => {
    expect(template.replace(/\s+/g, ' '))
      .toContain('If you have not yet ordered meals then they also need to be ordered before June 20th');
  });

  it('ends no sentence twice', () => {
    expect(template).not.toMatch(/[^.]\.\.(\s|$)/);
  });
});
