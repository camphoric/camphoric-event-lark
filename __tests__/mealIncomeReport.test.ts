import { describe, expect, it } from '@jest/globals';
import jsonLogic from 'json-logic-js';

import event from '../index.ts';
import { year } from '../dates.ts';
import pricing from '../pricing/pricing.ts';
import promoCodes, { firstTimeReferrerCode } from '../promoCodes.ts';
import camperPricingLogic, { ageLookup, mealsLookup } from '../pricing/camperPricingLogic.ts';

// Camphoric renders the template (Jinja, on the server), so these tests check
// what it relies on from this package: its meal plans, the pricing variables it
// reads, and which ages it counts at the child price.
const report = event.data.reports.find(r => r.title === 'Admin, meal income');
const template = report?.template ?? '';

// The template's `plans` list: ('All Meals', 'full'), …
const plans = [...template.matchAll(/\('([^']+)', '(full|half|dinners)'\)/g)]
  .map(([, plan, size]) => ({ plan, size }));

const childAges = JSON.parse(
  (template.match(/set child_ages = (\[[^\]]*\])/)?.[1] ?? '[]').replace(/'/g, '"'),
) as string[];

const mealsLogic = camperPricingLogic.find(item => item.var === 'meals')!.exp;
const mealsPrice = (age: string, mealPlan: string) => jsonLogic.apply(
  mealsLogic as jsonLogic.RulesLogic,
  {
    pricing,
    registration: { registration_type: null },
    camper: { age, index: 0, admin_attributes: {}, meals: { meal_plan: mealPlan } },
  },
);

describe('Admin, meal income report', () => {
  it('is a server-rendered CSV report', () => {
    expect(report).toMatchObject({
      output: 'csv',
      variables_source: 'server',
    });
    expect(template).toMatch(/^Meal Plan,Tier,Qty,Unit Price,Total$/m);
    expect(template).toMatch(/^Grand Total,/m);
  });

  it('has a row for every meal plan, and none for no meals', () => {
    expect(plans.map(p => p.plan).sort()).toEqual(Object.values(mealsLookup).sort());
  });

  it.each(Object.values(mealsLookup))('reads the %s prices the camper pricing charges', (plan) => {
    const { size } = plans.find(p => p.plan === plan)!;
    const adult = pricing[`meals_adult_${size}` as keyof typeof pricing];
    const youth = pricing[`meals_youth_${size}` as keyof typeof pricing];

    expect(mealsPrice(ageLookup[49], plan)).toBe(adult);
    expect(mealsPrice(ageLookup[11], plan)).toBe(youth);
  });

  it.each(Object.values(ageLookup))('puts %s campers in the tier they are priced at', (age) => {
    const price = mealsPrice(age, mealsLookup.F);
    const tier = childAges.includes(age) ? 'Child' : 'Adult';

    expect(price).toBe(tier === 'Child' ? pricing.meals_youth_full : pricing.meals_adult_full);
  });

  // Templates can't see which promo code a registration used: the report
  // takes a registration-level promo line with no camper-level one as the
  // referrer's meal discount, so that must be the only registration-scoped code.
  it('can tell the referrer meal discount from other promo codes', () => {
    const registrationScoped = promoCodes.filter(code => code.scope === 'registration');

    expect(registrationScoped).toEqual([promoCodes[1]]);
    expect(registrationScoped[0].code).toBe(firstTimeReferrerCode(year));
    expect(JSON.stringify(registrationScoped[0].pricing_logic)).toContain('"meals"');
  });

  it('counts the ages it puts in the child tier from the camper form', () => {
    expect(childAges.length).toBeGreaterThan(0);
    childAges.forEach(age => expect(Object.values(ageLookup)).toContain(age));
  });
});
