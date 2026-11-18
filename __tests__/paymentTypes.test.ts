import { describe, expect, it } from '@jest/globals';
import { BUILT_IN_PAYMENT_TYPES } from '@camphoric/camphoric-event-import-spec';

import event from '../index.ts';

// The event's own payment types (#24), offered beside the built-in ones when a
// registrar records a payment
const types = event.data.event.payment_types ?? [];

describe('the payment types', () => {
  it('add Zelle and FCP Credit', () => {
    expect(types.map(t => t.value)).toEqual(['Zelle', 'FCP Credit']);
  });

  // Camphoric refuses a value a built-in type has, or one two types share,
  // ignoring case
  it('reuse no built-in type and no other type', () => {
    const values = types.map(t => t.value.toLowerCase());
    for (const builtIn of BUILT_IN_PAYMENT_TYPES) expect(values).not.toContain(builtIn.toLowerCase());
    expect(new Set(values).size).toBe(values.length);
  });
});
