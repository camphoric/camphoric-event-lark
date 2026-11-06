import { createHash } from 'node:crypto';

import type { PromoCode } from '@camphoric/camphoric-event-import-spec';

import { year } from './dates.ts';

// Each year's codes end with the first 4 characters of the year's MD5 sum, so
// they're new every year and can't be guessed from the year alone
export const yearSuffix = (campYear: number) =>
  createHash('md5').update(String(campYear)).digest('hex').slice(0, 4);

export const firstTimeCode = (campYear: number) => `lc${campYear}FirstTime${yearSuffix(campYear)}`;
export const firstTimeReferrerCode = (campYear: number) => `lc${campYear}FTReferrer${yearSuffix(campYear)}`;

// Promo codes: Camphoric works out each one's discount, a positive amount,
// after every other price line, and never takes more than the total it comes
// off (so a camper who owes less than the discount owes nothing)
export default [
  {
    label: 'First-time camper',
    code: firstTimeCode(year),
    // $100 off each camper's total
    pricing_logic: { var: 'pricing.first_time_camper_discount' },
    scope: 'camper',
  },
  {
    label: 'First-time camper referrer',
    code: firstTimeReferrerCode(year),
    // $75 off the registration's meals (all its campers' together), or the
    // meals' whole cost when they come to less
    pricing_logic: {
      min: [{ var: 'pricing.first_time_referrer_meals_discount' }, { var: ['meals', 0] }],
    },
    scope: 'registration',
  },
] satisfies PromoCode[];
