import { describe, expect, it } from '@jest/globals';

import camperSchema from '../camperSchema.ts';
import event from '../index.ts';
import registrationErrorMessages from '../registrationErrorMessages.ts';
import registrationSchema from '../registrationSchema.ts';

type Schema = Record<string, unknown>;

// The fields a schema has, its dependencies' too (a field shown when a box is
// checked), by name
function fields(schema: Schema): Record<string, Schema> {
  const own = (schema.properties ?? {}) as Record<string, Schema>;
  const branches = Object.values((schema.dependencies ?? {}) as Record<string, { oneOf?: Schema[] }>)
    .flatMap(d => d.oneOf ?? [])
    .map(branch => (branch.properties ?? {}) as Record<string, Schema>);
  return Object.assign({}, ...branches, own);
}

// The form's fields as Camphoric serves them: it adds registrant_email and
// campers around the event's registration and camper schemas
const form: Schema = {
  properties: {
    ...registrationSchema.properties,
    registrant_email: { type: 'string', format: 'email', pattern: '', maxLength: 254 },
    campers: { type: 'array', minItems: 1, maxItems: 20, items: camperSchema },
  },
};

// The schema at a message's path ("campers.*.name_badge.pronouns"), if any
function at(path: string): Schema | undefined {
  let schema: Schema | undefined = form;
  for (const segment of path.split('.')) {
    if (!schema) return undefined;
    schema = segment === '*' ? schema.items as Schema | undefined : fields(schema)[segment];
  }
  return schema;
}

// A message for a field (or keyword) that doesn't exist would never be shown
describe('the registration error messages', () => {
  it('are part of the event', () => {
    expect(event.data.event.registration_error_messages).toBe(registrationErrorMessages);
  });

  const fieldRules = Object.entries(registrationErrorMessages).filter(([path]) => path !== '*');

  it.each(fieldRules)('are for a field the form has: %s', (path, rules) => {
    const schema = at(path);
    expect(schema).toBeDefined();
    // Each keyword, other than required, is one the field's schema checks
    for (const keyword of Object.keys(rules).filter(k => k !== 'required')) {
      expect(schema).toHaveProperty(keyword);
    }
  });
});
