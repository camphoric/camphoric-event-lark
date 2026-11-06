import { describe, expect, it } from '@jest/globals';
import jsonLogic from 'json-logic-js';

import event from '../index.ts';
import { year } from '../dates.ts';
import pricing from '../pricing/pricing.ts';
import promoCodes, { firstTimeCode, firstTimeReferrerCode, yearSuffix } from '../promoCodes.ts';

const [firstTime, referrer] = promoCodes;

// A promo code's discount, before Camphoric caps it at the total it comes off
const discount = (logic: unknown, lines: Record<string, unknown> = {}) =>
  jsonLogic.apply(logic as jsonLogic.RulesLogic, { pricing, ...lines });

describe('promo codes', () => {
  it('are part of the event', () => {
    expect(event.data.promo_codes).toBe(promoCodes);
  });

  describe('codes', () => {
    // md5('2027') = '9f62b862…'
    it('end with the first 4 characters of the year\'s MD5 sum', () => {
      expect(yearSuffix(2027)).toBe('9f62');
      expect(firstTimeCode(2027)).toBe('lc2027FirstTime9f62');
      expect(firstTimeReferrerCode(2027)).toBe('lc2027FTReferrer9f62');
    });

    it('are this camp\'s year\'s', () => {
      expect(firstTime.code).toBe(firstTimeCode(year));
      expect(referrer.code).toBe(firstTimeReferrerCode(year));
    });

    it('change each year', () => {
      expect(firstTimeCode(2028)).not.toBe(firstTimeCode(2027));
      expect(firstTimeReferrerCode(2028)).not.toBe(firstTimeReferrerCode(2027));
    });
  });

  describe('first-time camper', () => {
    it('is worked out for each camper', () => {
      expect(firstTime.scope).toBe('camper');
    });

    it('takes $100 off the tuition', () => {
      expect(discount(firstTime.pricing_logic, { tuition: 920, meals: 505, total: 1425 })).toBe(100);
    });

    it('takes no more than the tuition, whatever else the camper owes', () => {
      expect(discount(firstTime.pricing_logic, { tuition: 60, meals: 505, total: 565 })).toBe(60);
      expect(discount(firstTime.pricing_logic, { tuition: 0, meals: 380, total: 380 })).toBe(0);
    });

    it('never goes below nothing', () => {
      expect(discount(firstTime.pricing_logic, { tuition: -50, total: 0 })).toBe(0);
      expect(discount(firstTime.pricing_logic, { total: 920 })).toBe(0);
    });
  });

  describe('first-time camper referrer', () => {
    it('is worked out once for the registration', () => {
      expect(referrer.scope).toBe('registration');
    });

    it('takes $75 off the meals', () => {
      expect(discount(referrer.pricing_logic, { meals: 505 + 380, total: 2000 })).toBe(75);
    });

    it('takes no more than the meals cost', () => {
      expect(discount(referrer.pricing_logic, { meals: 50, total: 970 })).toBe(50);
    });

    it('takes nothing without meals', () => {
      expect(discount(referrer.pricing_logic, { meals: 0, total: 920 })).toBe(0);
      expect(discount(referrer.pricing_logic, { total: 920 })).toBe(0);
    });
  });
});
