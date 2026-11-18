import fs from 'fs';

import type { GroupEmail } from '@camphoric/camphoric-event-import-spec';

import { packagePath } from './packagePath.ts';

function readFile(filename: string): string {
  return fs.readFileSync(packagePath('emails', filename)).toString();
}

// The registrar's own address, for the emails that came from it in
// lark-camp-admin-tool; the others use the event's sender
const registration = 'registration@larkcamp.org';

// Lark Camp's group emails (SPEC §8.9), each sent to campers (#8), converted
// from lark-camp-admin-tool's Blade templates. Each is matched to the event's
// saved group email by its name, so renaming one imports it as a new email.
// Their yearly dates and links are the event's template vars
// (regTemplateVars.ts).
const emails: GroupEmail[] = [
  {
    name: 'Camper COVID reminder (send Wed Evening)',
    subject: 'Lark is in the air! And that’s not the only thing… take your COVID test now!',
    body: readFile('Camper-COVID-Reminder.j2'),
    from_email: registration,
    recipient_source: 'campers',
  },
  {
    name: 'Camper Info Email',
    subject: 'Lark Camp {{ event.start | date(\'%Y\') }} info for {{ camper.attributes.first_name }} {{ camper.attributes.last_name }}',
    body: readFile('Camper-Info-Email.j2'),
    from_email: registration,
    recipient_source: 'campers',
  },
  {
    name: 'Good Samaritan July',
    subject: 'Lark Camp medical and mental health response team info',
    body: readFile('Good-Samaritan-July.j2'),
    recipient_source: 'campers',
    // Only the campers who volunteered (camperSchema.ts's good_samaritan)
    filter: { rules: [{ field: 'camper.attributes.good_samaritan.volunteer', op: 'is_true' }] },
  },
  {
    name: 'Registered Camper Info Letter',
    subject: 'Welcome to Lark Camp {{ event.start | date(\'%Y\') }}!',
    body: readFile('Registered-Camper-Info-Letter.j2'),
    recipient_source: 'campers',
  },
];

export default emails;
