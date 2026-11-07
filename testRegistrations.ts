import type { LodgingLookup, SampleRegistration } from '@camphoric/camphoric-event-import-spec';
import { mealsLookup, ageLookup } from './pricing/camperPricingLogic.ts';

/*
 * Sample registrations, posted when the event is imported with its samples
 * (the importer's loadTestRegs, as the e2e tests' global setup does). They go
 * through Camphoric's registration API like a real one, so the server checks
 * each against the form and prices it, and every report then renders against
 * them: they're a smoke test of the form, the pricing and the reports. So
 * they cover as much of the form as they can:
 *
 * - every age group (and a camper who didn't give one), every gender
 * - full camp and each half, every meal plan each allows, every meal type
 * - every lodging kind the form offers: tents and RVs in each camp,
 *   registrar's choice, and shared lodging
 * - name badges (with and without pronouns), medical volunteers, campers with
 *   their own email or address, and 0 to 3 parking passes of each kind
 * - donations, comments, a payer abroad, and the 50% deposit
 * - names a CSV report has to quote or escape: commas, quotes, apostrophes,
 *   accents and hyphens
 *
 * The people are made up. Each lodging area gets at most a few of them, so
 * the e2e tests can still choose it (they pick Camp 1 Tent Area A).
 *
 * Not here, as the import can't send them: registration types (they need an
 * invitation), promo codes, admin attributes, custom charges, online payment,
 * and lodging only the registrar can assign (off site, cabins).
 */

type Gender = 'Man' | 'Woman' | 'Nonbinary/other';
type Session = 'Full camp' | 'Half camp - 1st half' | 'Half camp - 2nd half';
type MealType = 'Non-Vegetarian' | 'Vegetarian' | 'Vegan';
// A meal plan (F and D for full camp, A and B for each half) and its type
type Meals = { plan: keyof typeof mealsLookup, type: MealType };
type VehicleType = 'Regular car' | 'RV under 15\' long' | 'RV 15\'-20\' long';
type PassType = 'Long Term' | 'Vehicle Camp 1' | 'Vehicle Camp 2' | 'Vehicle Camp 3' | 'Short Term'
  | 'Camp 1' | 'Camp 2' | 'Camp 3' | 'Park Anywhere';

interface Address {
  street_address: string,
  city: string,
  state_or_province: string,
  zip_code: string,
  country: string,
}

interface Camper {
  first: string,
  last: string,
  age?: keyof typeof ageLookup,
  gender: Gender,
  session?: Session,
  meals?: Meals,
  // The lodging keys chosen, from the camp down (lodgings.ts)
  lodging: string[],
  sharedWith?: string,
  email?: string,
  badge?: { name: string, pronouns?: string },
  volunteer?: { skills: string[], credentials: string },
  address?: Address,
  passes?: [VehicleType, PassType][],
}

interface Household {
  address: Address,
  email: string,
  phone: string,
  donation?: number,
  heardFrom?: string,
  comments?: string,
  paymentOption?: string,
  campers: Camper[],
}

const us = (street_address: string, city: string, state_or_province: string, zip_code: string): Address =>
  ({ street_address, city, state_or_province, zip_code, country: 'United States' });

const C1_TENT_A = ['camp1', 'camp1_tent', 'camp1_tent_area_A'];
const C1_TENT_B = ['camp1', 'camp1_tent', 'camp1_tent_area_B'];
const C1_TENT_C = ['camp1', 'camp1_tent', 'camp1_tent_area_C'];
const C1_RV_SM = ['camp1', 'camp1_rv', 'camp1_rv_sm'];
const C1_RV_LG = ['camp1', 'camp1_rv', 'camp1_rv_lg'];
const C2_TENT_D = ['camp2', 'camp2_tent', 'camp2_tent_area_D'];
const C2_TENT_F = ['camp2', 'camp2_tent', 'camp2_tent_area_F'];
const C2_TENT_H = ['camp2', 'camp2_tent', 'camp2_tent_area_H'];
const C2_RV_SM = ['camp2', 'camp2_rv', 'camp2_rv_sm'];
const C2_RV_LG = ['camp2', 'camp2_rv', 'camp2_rv_lg'];
const C2_RV_XL = ['camp2', 'camp2_rv', 'camp2_rv_xl'];
const C3_TENT_I = ['camp3', 'camp3_tent', 'camp3_tent_area_I'];
const C3_TENT_K = ['camp3', 'camp3_tent', 'camp3_tent_area_K'];
const C3_TENT_L = ['camp3', 'camp3_tent', 'camp3_tent_area_L'];
const C3_RV_SM = ['camp3', 'camp3_rv', 'camp3_rv_sm'];
const C3_RV_LG = ['camp3', 'camp3_rv', 'camp3_rv_lg'];
const REGISTRAR = ['reg_choice'];

const households: Household[] = [
  {
    // A couple in a tent, all meals, one car
    address: us('1234 Easy St', 'Berkeley', 'CA', '94703'),
    email: 'robin.ash@dontsend.com',
    phone: '+15105550101',
    campers: [
      { first: 'Robin', last: 'Ash', age: 64, gender: 'Man', meals: { plan: 'F', type: 'Non-Vegetarian' },
        lodging: C1_TENT_A, sharedWith: 'Jordan Ash', passes: [['Regular car', 'Camp 1']] },
      { first: 'Jordan', last: 'Ash', age: 64, gender: 'Woman', meals: { plan: 'F', type: 'Non-Vegetarian' },
        lodging: C1_TENT_A, sharedWith: 'Robin Ash' },
    ],
  },
  {
    // A family: two adults, a teen and two children, badges and a donation
    address: us('5678 Hard St', 'Napa', 'CA', '94558'),
    email: 'the.okafors@dontsend.com',
    phone: '+17075550102',
    donation: 100,
    heardFrom: 'A friend',
    campers: [
      { first: 'Ada', last: 'Okafor', age: 49, gender: 'Woman', meals: { plan: 'F', type: 'Vegetarian' },
        lodging: C1_TENT_B, sharedWith: 'Okafor family', badge: { name: 'Ada', pronouns: 'she/her' },
        passes: [['Regular car', 'Camp 1']] },
      { first: 'Chidi', last: 'Okafor', age: 49, gender: 'Man', meals: { plan: 'F', type: 'Non-Vegetarian' },
        lodging: C1_TENT_B, sharedWith: 'Okafor family', badge: { name: 'Chidi' } },
      { first: 'Nneka', last: 'Okafor', age: 17, gender: 'Woman', meals: { plan: 'F', type: 'Vegetarian' },
        lodging: C1_TENT_B, sharedWith: 'Okafor family', email: 'nneka.okafor@dontsend.com' },
      { first: 'Emeka', last: 'Okafor', age: 11, gender: 'Man', meals: { plan: 'F', type: 'Vegetarian' },
        lodging: C1_TENT_B, sharedWith: 'Okafor family' },
      { first: 'Zara', last: 'Okafor', age: 4, gender: 'Woman', meals: { plan: 'F', type: 'Vegetarian' },
        lodging: C1_TENT_B, sharedWith: 'Okafor family' },
    ],
  },
  {
    // Housemates in an RV, mixed meal plans, two vehicles
    address: us('1630 Revello Drive', 'Sunnydale', 'CA', '94008'),
    email: 'revello.house@dontsend.com',
    phone: '+14155550103',
    campers: [
      { first: 'Sam', last: 'Reyes', age: 25, gender: 'Nonbinary/other', meals: { plan: 'D', type: 'Vegan' },
        lodging: C2_RV_SM, sharedWith: 'Revello house', badge: { name: 'Sam', pronouns: 'they/them' },
        passes: [['RV under 15\' long', 'Vehicle Camp 2'], ['Regular car', 'Long Term']] },
      { first: 'Lee', last: 'Park', age: 25, gender: 'Man', meals: { plan: 'F', type: 'Vegan' },
        lodging: C2_RV_SM, sharedWith: 'Revello house' },
      { first: 'Mira', last: 'Castellanos', age: 49, gender: 'Woman', meals: { plan: 'D', type: 'Non-Vegetarian' },
        lodging: C2_RV_SM, sharedWith: 'Revello house', email: 'mira.c@dontsend.com' },
    ],
  },
  {
    // A big group with no meals in a large RV, on the 50% deposit
    address: us('5932 Firefly Ln', 'Verse', 'CA', '94008'),
    email: 'serenity.crew@dontsend.com',
    phone: '+16505550104',
    paymentOption: '50% Deposit',
    campers: [
      { first: 'Mal', last: 'Rey', age: 49, gender: 'Man', lodging: C2_RV_LG, sharedWith: 'Rey group',
        passes: [['RV 15\'-20\' long', 'Vehicle Camp 2']] },
      { first: 'Zoe', last: 'Washburn', age: 49, gender: 'Woman', lodging: C2_RV_LG, sharedWith: 'Rey group' },
      { first: 'Hoban', last: 'Washburn', age: 49, gender: 'Man', lodging: C2_RV_LG, sharedWith: 'Rey group' },
      { first: 'Kaylee', last: 'Frye', age: 25, gender: 'Woman', lodging: C2_RV_LG, sharedWith: 'Rey group' },
    ],
  },
  {
    // Names a CSV report must quote: a comma, a quote, an apostrophe, accents
    address: us('77 "Sunset" Blvd, Apt 4', 'Los Angeles', 'CA', '90028'),
    email: 'obrien.garcia@dontsend.com',
    phone: '+13105550105',
    comments: 'Please put us near the "quiet" end, if you can.\nThanks, both of us.',
    campers: [
      { first: 'Siobhán', last: 'O\'Brien', age: 64, gender: 'Woman', meals: { plan: 'F', type: 'Vegetarian' },
        lodging: C1_TENT_C, sharedWith: 'José García-López', badge: { name: 'Siobhán "Shiv" O\'Brien', pronouns: 'she/her' } },
      { first: 'José', last: 'García-López', age: 65, gender: 'Man', meals: { plan: 'F', type: 'Non-Vegetarian' },
        lodging: C1_TENT_C, sharedWith: 'Siobhán O\'Brien', passes: [['Regular car', 'Park Anywhere']] },
      { first: 'Henry', last: 'Smith, Jr.', age: 65, gender: 'Man', meals: { plan: 'D', type: 'Non-Vegetarian' },
        lodging: C1_TENT_C },
    ],
  },
  {
    // First half only, with half-camp meals and a short-term pass
    address: us('12 Harbor Rd', 'Mendocino', 'CA', '95460'),
    email: 'first.half@dontsend.com',
    phone: '+17075550106',
    campers: [
      { first: 'Ines', last: 'Moreau', age: 49, gender: 'Woman', session: 'Half camp - 1st half',
        meals: { plan: 'A', type: 'Vegetarian' }, lodging: C2_TENT_D,
        passes: [['Regular car', 'Short Term']] },
      { first: 'Theo', last: 'Moreau', age: 11, gender: 'Man', session: 'Half camp - 1st half',
        meals: { plan: 'A', type: 'Non-Vegetarian' }, lodging: C2_TENT_D,
        sharedWith: 'Ines Moreau' },
    ],
  },
  {
    // Second half only, one with half-camp meals and one without
    address: us('400 Pine St', 'Seattle', 'WA', '98101'),
    email: 'second.half@dontsend.com',
    phone: '+12065550107',
    donation: 25,
    campers: [
      { first: 'Kenji', last: 'Watanabe', age: 64, gender: 'Man', session: 'Half camp - 2nd half',
        meals: { plan: 'B', type: 'Non-Vegetarian' }, lodging: C3_TENT_I,
        passes: [['Regular car', 'Camp 3']] },
      { first: 'Aiko', last: 'Watanabe', age: 64, gender: 'Woman', session: 'Half camp - 2nd half',
        lodging: C3_TENT_I, sharedWith: 'Kenji Watanabe' },
    ],
  },
  {
    // Medical volunteers in a Camp 3 RV, with their own addresses
    address: us('9 Elm Ct', 'Portland', 'OR', '97205'),
    email: 'rn.volunteers@dontsend.com',
    phone: '+15035550108',
    campers: [
      { first: 'Priya', last: 'Nair', age: 49, gender: 'Woman', meals: { plan: 'F', type: 'Vegan' }, lodging: C3_RV_SM,
        volunteer: { skills: ['Medical', 'Emergency management'], credentials: 'RN, ACLS' },
        passes: [['RV under 15\' long', 'Vehicle Camp 3']] },
      { first: 'Marcus', last: 'Bell', age: 49, gender: 'Man', meals: { plan: 'F', type: 'Vegan' }, lodging: C3_RV_SM,
        sharedWith: 'Priya Nair', volunteer: { skills: ['Counseling/psychiatric'], credentials: 'LCSW' },
        address: us('31 Oak Ave', 'Eugene', 'OR', '97401') },
    ],
  },
  {
    // A payer abroad, paying for a camper at another address in Camp 3
    address: { street_address: '200 Rue Sainte-Catherine', city: 'Montréal', state_or_province: 'QC',
      zip_code: 'H2X 1L1', country: 'Canada' },
    email: 'canada.payer@dontsend.com',
    phone: '+15145550109',
    donation: 10000,
    heardFrom: 'Lark Camp website',
    campers: [
      { first: 'Élodie', last: 'Tremblay', age: 25, gender: 'Woman', meals: { plan: 'D', type: 'Vegetarian' },
        lodging: C3_TENT_K, email: 'elodie.t@dontsend.com', badge: { name: 'Élodie' },
        address: us('88 College Ave', 'Santa Rosa', 'CA', '95401') },
    ],
  },
  {
    // Registrar assigns the lodging; a camper who didn't give an age
    address: us('15 Main St', 'Ukiah', 'CA', '95482'),
    email: 'any.lodging@dontsend.com',
    phone: '+17075550110',
    campers: [
      { first: 'Dana', last: 'Whitfield', gender: 'Nonbinary/other', meals: { plan: 'F', type: 'Non-Vegetarian' },
        lodging: REGISTRAR, badge: { name: 'Dana W.', pronouns: 'any' } },
      { first: 'Quinn', last: 'Whitfield', age: 17, gender: 'Nonbinary/other', lodging: REGISTRAR },
    ],
  },
  {
    // Dinners only, three parking passes
    address: us('3 Ridge Rd', 'Fort Bragg', 'CA', '95437'),
    email: 'offsite@dontsend.com',
    phone: '+17075550111',
    campers: [
      { first: 'Gus', last: 'Lindqvist', age: 65, gender: 'Man', meals: { plan: 'D', type: 'Non-Vegetarian' },
        lodging: C2_TENT_F, passes: [['Regular car', 'Long Term'], ['Regular car', 'Short Term'], ['Regular car', 'Camp 2']] },
    ],
  },
  {
    // Large and extra-large RVs in Camps 1 and 2
    address: us('1 RV Way', 'Sacramento', 'CA', '95814'),
    email: 'rv.folks@dontsend.com',
    phone: '+19165550112',
    campers: [
      { first: 'Bea', last: 'Novak', age: 64, gender: 'Woman', meals: { plan: 'F', type: 'Non-Vegetarian' },
        lodging: C1_RV_LG, passes: [['RV 15\'-20\' long', 'Vehicle Camp 1']] },
      { first: 'Otto', last: 'Novak', age: 65, gender: 'Man', meals: { plan: 'F', type: 'Non-Vegetarian' },
        lodging: C2_RV_XL, passes: [['RV 15\'-20\' long', 'Vehicle Camp 2']] },
      { first: 'Ruth', last: 'Novak', age: 64, gender: 'Woman', lodging: C1_RV_SM,
        passes: [['RV under 15\' long', 'Vehicle Camp 1']] },
    ],
  },
  {
    // Young adults spread over the camps
    address: us('500 University Ave', 'Palo Alto', 'CA', '94301'),
    email: 'students@dontsend.com',
    phone: '+16505550113',
    campers: [
      { first: 'Tomás', last: 'Silva', age: 25, gender: 'Man', meals: { plan: 'F', type: 'Vegan' }, lodging: C2_TENT_F },
      { first: 'Hana', last: 'Kim', age: 25, gender: 'Woman', meals: { plan: 'F', type: 'Vegetarian' },
        lodging: C2_TENT_H, badge: { name: 'Hana', pronouns: 'she/they' } },
      { first: 'Ola', last: 'Adeyemi', age: 17, gender: 'Woman', meals: { plan: 'D', type: 'Vegan' }, lodging: C3_TENT_L },
      { first: 'Finn', last: 'Byrne', age: 49, gender: 'Man', lodging: C3_RV_LG,
        passes: [['RV 15\'-20\' long', 'Vehicle Camp 3']] },
    ],
  },
];

const mealsOf = (camper: Camper) => (camper.meals
  ? { meal_plan: mealsLookup[camper.meals.plan], meal_type: camper.meals.type }
  : { meal_plan: 'No meals' });

function makeRegistration(household: Household, lodgingMap: LodgingLookup): SampleRegistration {
  const [payer] = household.campers;
  return {
    formData: {
      payment: {
        payer_billing_address: household.address,
        payer_first_name: payer.first,
        payer_last_name: payer.last,
        payer_number: household.phone,
      },
      campers: household.campers.map(camper => ({
        first_name: camper.first,
        last_name: camper.last,
        ...(camper.age ? { age: ageLookup[camper.age] } : {}),
        gender: camper.gender,
        ...(camper.email ? { email: camper.email } : {}),
        session: camper.session ?? 'Full camp',
        meals: mealsOf(camper),
        name_badge: camper.badge ? { purchase: true, ...camper.badge } : { purchase: false },
        good_samaritan: camper.volunteer ? { volunteer: true, ...camper.volunteer } : { volunteer: false },
        address_different_than_payer: Boolean(camper.address),
        ...(camper.address ? { camper_address: camper.address } : {}),
        parking_passes: (camper.passes ?? []).map(([vehicle_type, pass_type]) => ({ vehicle_type, pass_type })),
        lodging: {
          lodging_requested: {
            choices: camper.lodging.map(key => lodgingMap[key].id),
            id: lodgingMap[camper.lodging[camper.lodging.length - 1]].id,
            name: 'Something',
          },
          ...(camper.sharedWith ? { lodging_shared: true, lodging_shared_with: camper.sharedWith } : {}),
        },
      })),
      registrant_email: household.email,
      ...(household.donation ? { lta_donation: household.donation } : {}),
      ...(household.heardFrom ? { how_did_you_hear: household.heardFrom } : {}),
      ...(household.comments ? { comments: household.comments } : {}),
    },
    // The server prices each registration itself; this is only what a client
    // would report
    pricingResults: {
      campers: household.campers.map(() => ({ tuition: 0, meals: 0, total: 0 })),
      total: 0,
    },
    ...(household.paymentOption ? { paymentData: { paymentOption: household.paymentOption } } : {}),
  };
}

export default function makeRegistrations(lodgingMap: LodgingLookup): SampleRegistration[] {
  return households.map(household => makeRegistration(household, lodgingMap));
}
