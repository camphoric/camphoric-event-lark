import { describe, expect, it } from '@jest/globals';
import jsonLogic from 'json-logic-js';

import event from '../index.ts';

// Lark's refund policy (#29): $150 for each cancelled camper, plus PayPal's
// fees on the registration's payments. Camphoric (v0.19.0) works the logic out
// when a camper is cancelled, with `paypal_fees` (what PayPal kept on the
// registration's payments, 0 for a check) and `first_cancellation` (true
// until a cancellation fee has been kept on the registration).
const logic = event.data.event.cancellation_fee;

const fee = (data: { paypal_fees: number, first_cancellation: boolean }) =>
  jsonLogic.apply(logic as jsonLogic.RulesLogic, data);

describe('the cancellation fee', () => {
  it('is set on the event', () => {
    expect(logic).toEqual({
      '+': [150, { if: [{ var: 'first_cancellation' }, { var: 'paypal_fees' }, 0] }],
    });
  });

  it('is $150 plus the PayPal fees for the first camper cancelled', () => {
    // A family pays $1,000 by PayPal, and PayPal keeps $29.30
    expect(fee({ paypal_fees: 29.3, first_cancellation: true })).toBeCloseTo(179.3, 2);
  });

  it('is $150 for each camper after, as the PayPal fees were kept once', () => {
    expect(fee({ paypal_fees: 29.3, first_cancellation: false })).toBe(150);
  });

  it('is $150 for a registration paid by check', () => {
    expect(fee({ paypal_fees: 0, first_cancellation: true })).toBe(150);
    expect(fee({ paypal_fees: 0, first_cancellation: false })).toBe(150);
  });
});
