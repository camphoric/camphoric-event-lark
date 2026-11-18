import { describe, expect, it } from '@jest/globals';

import event from '../index.ts';
import emails from '../emails.ts';
import regTemplateVars from '../regTemplateVars.ts';

// Lark Camp's group emails (#8). Whether each renders for the sample
// registrations is checked on the server: e2e/groupEmails.spec.ts.
const byName = (name: string) => emails.find(email => email.name === name);

// The template vars an email reads, as `event.template_vars.x` or through a
// `vars` alias of it
const templateVarsIn = (text: string) =>
  [...text.matchAll(/\b(?:event\.template_vars|vars)\.([a-z_]+)/g)].map(match => match[1]);

describe('the group emails', () => {
  it('are part of the event', () => {
    expect(event.data.email_templates).toBe(emails);
  });

  it('are the four Lark Camp sends, each with a name of its own', () => {
    expect(emails.map(email => email.name)).toEqual([
      'Camper COVID reminder (send Wed Evening)',
      'Camper Info Email',
      'Good Samaritan July',
      'Registered Camper Info Letter',
    ]);
  });

  it('go to campers', () => {
    for (const email of emails) expect(email.recipient_source).toBe('campers');
  });

  it('reach only volunteers with the Good Samaritan email', () => {
    expect(byName('Good Samaritan July')?.filter).toEqual({
      rules: [{ field: 'camper.attributes.good_samaritan.volunteer', op: 'is_true' }],
    });
    for (const email of emails.filter(e => e.name !== 'Good Samaritan July')) {
      expect(email.filter).toBeUndefined();
    }
  });

  describe.each(emails.map(email => [email.name, email] as const))('%s', (_name, email) => {
    it('has a subject and a body', () => {
      expect(email.subject.trim()).not.toBe('');
      expect(email.body.trim()).not.toBe('');
    });

    // The server renders a missing one as blank, without a warning
    it('reads only template vars the event has', () => {
      for (const name of templateVarsIn(email.subject + email.body)) {
        expect(Object.keys(regTemplateVars)).toContain(name);
      }
    });

    // Markdown is rendered safely, so raw HTML would be dropped from the email
    it('uses no raw HTML', () => {
      expect(email.body).not.toMatch(/<\/?(div|span|p|br|strong|em|u)\b/i);
    });

    // Blade, not Jinja, left over from lark-camp-admin-tool
    it('has no Blade left in it', () => {
      expect(email.subject + email.body).not.toMatch(/\$[a-z_]+|@(php|if|endif|forelse|empty|endforelse)\b/);
    });
  });
});
