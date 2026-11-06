import { createHash } from 'node:crypto';

import type { PromoCode } from '@camphoric/camphoric-event-import-spec';

import { year } from './dates.ts';

// Each year's codes end with the first 4 characters of the year's MD5 sum, so
// they're new every year. They aren't secret: anyone with this package (it's
// public) can work them out for any year.
export const yearSuffix = (campYear: number) =>
  createHash('md5').update(String(campYear)).digest('hex').slice(0, 4);

export const firstTimeCode = (campYear: number) => `lc${campYear}FirstTime${yearSuffix(campYear)}`;
export const firstTimeReferrerCode = (campYear: number) => `lc${campYear}FTReferrer${yearSuffix(campYear)}`;

// Up to `amount` off one price line: never more than the line, and never
// below nothing
const upTo = (amount: string, line: string) => ({
  max: [0, { min: [{ var: amount }, { var: [line, 0] }] }],
});

// Promo codes: Camphoric works out each one's discount after every other price
// line (and never takes more than the total it comes off)
export default [
  {
    label: 'First-time camper',
    code: firstTimeCode(year),
    // $100 off each camper's tuition, or the whole tuition when it's less
    pricing_logic: upTo('pricing.first_time_camper_discount', 'tuition'),
    scope: 'camper',
  },
  {
    label: 'First-time camper referrer',
    code: firstTimeReferrerCode(year),
    // $75 off the registration's meals (all its campers' together), or the
    // meals' whole cost when they come to less
    pricing_logic: upTo('pricing.first_time_referrer_meals_discount', 'meals'),
    scope: 'registration',
  },
] satisfies PromoCode[];
