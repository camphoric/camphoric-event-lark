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
 * - every lodging kind the form offers: tents and RVs in each camp, cabins,
 *   registrar's choice, and shared lodging
 * - name badges (with and without pronouns), medical volunteers, campers with
 *   their own email or address, and 0 to 3 parking passes of every kind
 * - donations, comments, payers abroad, and the 50% deposit
 * - names, addresses and comments a CSV report has to quote or escape:
 *   commas, quotes, apostrophes, accents, hyphens and line breaks
 *
 * Each household is a group of fictional characters from a film, show,
 * book, game or actual-play series (no real people), with made-up ages,
 * addresses and emails. Camp 3 Tent Area I is filled on purpose (Jaskier and
 * the Matrix's crew take all 5 spots), so a full area shows when testing.
 * Every other area gets at most 60% of its spots, and none go in Camp 1
 * Tent Area A, which the e2e tests choose.
 *
 * Not here, as the import can't send them: registration types (they need an
 * invitation), promo codes, admin attributes, custom charges, online payment,
 * and lodging only the registrar can assign (off site).
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
const abroad = (street_address: string, city: string, state_or_province: string, zip_code: string, country: string): Address =>
  ({ street_address, city, state_or_province, zip_code, country });

// Meals: all meals, just dinners, or a half's meals, with their type
const F = (type: MealType = 'Non-Vegetarian'): Meals => ({ plan: 'F', type });
const D = (type: MealType = 'Non-Vegetarian'): Meals => ({ plan: 'D', type });
const A = (type: MealType = 'Non-Vegetarian'): Meals => ({ plan: 'A', type });
const B = (type: MealType = 'Non-Vegetarian'): Meals => ({ plan: 'B', type });
const VEG = 'Vegetarian';
const VEGAN = 'Vegan';
const FIRST_HALF = 'Half camp - 1st half';
const SECOND_HALF = 'Half camp - 2nd half';
const CAR = 'Regular car';
const RV_SM = 'RV under 15\' long';
const RV_LG = 'RV 15\'-20\' long';

const C1_TENT_B = ['camp1', 'camp1_tent', 'camp1_tent_area_B'];
const C1_TENT_C = ['camp1', 'camp1_tent', 'camp1_tent_area_C'];
const C1_RV_SM = ['camp1', 'camp1_rv', 'camp1_rv_sm'];
const C1_RV_LG = ['camp1', 'camp1_rv', 'camp1_rv_lg'];
const C1_CABIN = ['camp1', 'camp1_cabin'];
const C2_TENT_D = ['camp2', 'camp2_tent', 'camp2_tent_area_D'];
const C2_TENT_E = ['camp2', 'camp2_tent', 'camp2_tent_area_E'];
const C2_TENT_F = ['camp2', 'camp2_tent', 'camp2_tent_area_F'];
const C2_TENT_G = ['camp2', 'camp2_tent', 'camp2_tent_area_G'];
const C2_TENT_H = ['camp2', 'camp2_tent', 'camp2_tent_area_H'];
const C2_RV_SM = ['camp2', 'camp2_rv', 'camp2_rv_sm'];
const C2_RV_LG = ['camp2', 'camp2_rv', 'camp2_rv_lg'];
const C2_RV_XL = ['camp2', 'camp2_rv', 'camp2_rv_xl'];
const C2_CABIN = ['camp2', 'camp2_cabin'];
const C3_TENT_J = ['camp3', 'camp3_tent', 'camp3_tent_area_J'];
const C3_TENT_K = ['camp3', 'camp3_tent', 'camp3_tent_area_K'];
const C3_TENT_L = ['camp3', 'camp3_tent', 'camp3_tent_area_L'];
const C3_TENT_I = ['camp3', 'camp3_tent', 'camp3_tent_area_I'];
const C3_RV_SM = ['camp3', 'camp3_rv', 'camp3_rv_sm'];
const C3_RV_LG = ['camp3', 'camp3_rv', 'camp3_rv_lg'];
const C3_CABIN = ['camp3', 'camp3_cabin'];
const REGISTRAR = ['reg_choice'];

const households: Household[] = [
  {
    // Star Wars: the Skywalker–Solo family, in a Camp 1 tent
    address: us('1 Lars Homestead Rd', 'Anchorhead', 'AZ', '85001'),
    email: 'skywalker.solo@dontsend.com',
    phone: '+16025550101',
    campers: [
      { first: 'Leia', last: 'Organa', age: 49, gender: 'Woman', meals: F(), lodging: C1_TENT_B,
        sharedWith: 'Skywalker-Solo family', badge: { name: 'General Organa', pronouns: 'she/her' },
        passes: [[CAR, 'Camp 1']] },
      { first: 'Han', last: 'Solo', age: 49, gender: 'Man', meals: F(), lodging: C1_TENT_B,
        sharedWith: 'Skywalker-Solo family' },
      { first: 'Luke', last: 'Skywalker', age: 49, gender: 'Man', meals: F(VEG), lodging: C1_TENT_B,
        sharedWith: 'Skywalker-Solo family', email: 'luke.skywalker@dontsend.com' },
      { first: 'Ben', last: 'Solo', age: 11, gender: 'Man', meals: F(), lodging: C1_TENT_B,
        sharedWith: 'Skywalker-Solo family' },
    ],
  },
  {
    // Star Trek: The Next Generation: the senior staff, in a Camp 1 cabin
    address: us('24 Starfleet Way', 'San Francisco', 'CA', '94129'),
    email: 'enterprise.d@dontsend.com',
    phone: '+14155550102',
    heardFrom: 'Subspace',
    campers: [
      { first: 'Jean-Luc', last: 'Picard', age: 65, gender: 'Man', meals: F(), lodging: C1_CABIN,
        sharedWith: 'Enterprise crew', badge: { name: 'Captain Picard' } },
      { first: 'William', last: 'Riker', age: 49, gender: 'Man', meals: F(), lodging: C1_CABIN, sharedWith: 'Enterprise crew' },
      // No age given
      { first: 'Data', last: 'Soong', gender: 'Man', lodging: C1_CABIN, sharedWith: 'Enterprise crew' },
      { first: 'Worf', last: 'Son of Mogh, House of Martok', age: 49, gender: 'Man', meals: F(), lodging: C1_CABIN,
        sharedWith: 'Enterprise crew' },
      { first: 'Beverly', last: 'Crusher', age: 49, gender: 'Woman', meals: F(VEG), lodging: C1_CABIN,
        sharedWith: 'Enterprise crew', volunteer: { skills: ['Medical', 'Emergency management'], credentials: 'MD, Chief Medical Officer' } },
      { first: 'Wesley', last: 'Crusher', age: 17, gender: 'Man', meals: F(VEG), lodging: C1_CABIN,
        sharedWith: 'Enterprise crew', email: 'wesley.crusher@dontsend.com' },
    ],
  },
  {
    // Avatar: The Last Airbender: Team Avatar, in a Camp 3 tent
    address: us('1 Air Temple Rd', 'Bend', 'OR', '97701'),
    email: 'team.avatar@dontsend.com',
    phone: '+15415550103',
    campers: [
      { first: 'Iroh', last: 'of the Fire Nation', age: 65, gender: 'Man', meals: F(VEG), lodging: C3_TENT_J,
        sharedWith: 'Team Avatar', badge: { name: 'Uncle Iroh' }, passes: [[CAR, 'Camp 3']] },
      { first: 'Aang', last: 'of the Air Nomads', age: 11, gender: 'Man', meals: F(VEGAN), lodging: C3_TENT_J, sharedWith: 'Team Avatar' },
      { first: 'Katara', last: 'of the Southern Water Tribe', age: 17, gender: 'Woman', meals: F(), lodging: C3_TENT_J, sharedWith: 'Team Avatar' },
      { first: 'Sokka', last: 'of the Southern Water Tribe', age: 17, gender: 'Man', meals: F(), lodging: C3_TENT_J, sharedWith: 'Team Avatar' },
      { first: 'Toph', last: 'Beifong', age: 11, gender: 'Woman', meals: F(), lodging: C3_TENT_J, sharedWith: 'Team Avatar' },
      { first: 'Zuko', last: 'of the Fire Nation', age: 17, gender: 'Man', meals: F(), lodging: C3_TENT_J, sharedWith: 'Team Avatar' },
    ],
  },
  {
    // The Legend of Korra: the new Team Avatar, in a Camp 2 RV
    address: us('88 Air Temple Island', 'Republic City', 'WA', '98101'),
    email: 'new.team.avatar@dontsend.com',
    phone: '+12065550104',
    campers: [
      { first: 'Korra', last: 'of the Southern Water Tribe', age: 25, gender: 'Woman', meals: F(), lodging: C2_RV_SM,
        sharedWith: 'Korra, Asami, Mako and Bolin', passes: [[RV_SM, 'Vehicle Camp 2']] },
      { first: 'Asami', last: 'Sato', age: 25, gender: 'Woman', meals: F(), lodging: C2_RV_SM,
        sharedWith: 'Korra, Asami, Mako and Bolin', passes: [[CAR, 'Long Term']] },
      { first: 'Mako', last: 'of Republic City', age: 25, gender: 'Man', meals: D(), lodging: C2_RV_SM, sharedWith: 'Korra, Asami, Mako and Bolin' },
      { first: 'Bolin', last: 'of Republic City', age: 25, gender: 'Man', meals: D(), lodging: C2_RV_SM, sharedWith: 'Korra, Asami, Mako and Bolin' },
    ],
  },
  {
    // Frieren: Beyond Journey's End: Frieren's party, first half only
    address: us('3 Northern Plateau Trl', 'Missoula', 'MT', '59801'),
    email: 'frierens.party@dontsend.com',
    phone: '+14065550105',
    comments: 'Frieren will be looking for grimoires. Please point her at the library, if there is one.',
    campers: [
      { first: 'Frieren', last: 'the Slayer', age: 65, gender: 'Woman', session: FIRST_HALF, meals: A(VEG), lodging: C2_TENT_D,
        sharedWith: 'Frieren\'s party', badge: { name: 'Frieren', pronouns: 'she/her' } },
      { first: 'Fern', last: 'of Heiter\'s Church', age: 17, gender: 'Woman', session: FIRST_HALF, meals: A(), lodging: C2_TENT_D,
        sharedWith: 'Frieren\'s party' },
      { first: 'Stark', last: 'of the Warrior Village', age: 17, gender: 'Man', session: FIRST_HALF, meals: A(), lodging: C2_TENT_D,
        sharedWith: 'Frieren\'s party', passes: [[CAR, 'Short Term']] },
    ],
  },
  {
    // Buffy the Vampire Slayer: the Scooby Gang, in a Camp 2 tent
    address: us('1630 Revello Drive', 'Sunnydale', 'CA', '94008'),
    email: 'scooby.gang@dontsend.com',
    phone: '+18055550106',
    campers: [
      { first: 'Rupert', last: 'Giles', age: 64, gender: 'Man', meals: F(), lodging: C2_TENT_G, sharedWith: 'Scooby Gang',
        passes: [[CAR, 'Camp 2']] },
      { first: 'Buffy', last: 'Summers', age: 25, gender: 'Woman', meals: F(), lodging: C2_TENT_G, sharedWith: 'Scooby Gang',
        badge: { name: 'Buffy', pronouns: 'she/her' } },
      { first: 'Willow', last: 'Rosenberg', age: 25, gender: 'Woman', meals: F(VEGAN), lodging: C2_TENT_G, sharedWith: 'Scooby Gang' },
      { first: 'Xander', last: 'Harris', age: 25, gender: 'Man', meals: F(), lodging: C2_TENT_G, sharedWith: 'Scooby Gang' },
      { first: 'Dawn', last: 'Summers', age: 17, gender: 'Woman', meals: F(VEG), lodging: C2_TENT_G, sharedWith: 'Scooby Gang' },
    ],
  },
  {
    // Game of Thrones: the Starks of Winterfell, in a Camp 1 cabin
    address: us('1 Winterfell Keep', 'Fairbanks', 'AK', '99701'),
    email: 'house.stark@dontsend.com',
    phone: '+19075550107',
    donation: 50,
    campers: [
      { first: 'Eddard', last: 'Stark', age: 64, gender: 'Man', meals: F(), lodging: C1_CABIN, sharedWith: 'House Stark',
        badge: { name: 'Ned' }, passes: [[CAR, 'Camp 1'], [CAR, 'Long Term']] },
      { first: 'Catelyn', last: 'Stark', age: 64, gender: 'Woman', meals: F(), lodging: C1_CABIN, sharedWith: 'House Stark' },
      { first: 'Sansa', last: 'Stark', age: 17, gender: 'Woman', meals: F(), lodging: C1_CABIN, sharedWith: 'House Stark' },
      { first: 'Arya', last: 'Stark', age: 11, gender: 'Woman', meals: F(), lodging: C1_CABIN, sharedWith: 'House Stark' },
      { first: 'Bran', last: 'Stark', age: 11, gender: 'Man', meals: F(VEG), lodging: C1_CABIN, sharedWith: 'House Stark' },
      { first: 'Rickon', last: 'Stark', age: 4, gender: 'Man', meals: F(), lodging: C1_CABIN, sharedWith: 'House Stark' },
    ],
  },
  {
    // Firefly: Serenity's crew, mostly no meals, large RVs, on the 50% deposit
    address: us('5932 Firefly Ln', 'Persephone', 'CA', '94008'),
    email: 'serenity.crew@dontsend.com',
    phone: '+16505550108',
    paymentOption: '50% Deposit',
    campers: [
      { first: 'Malcolm', last: 'Reynolds', age: 49, gender: 'Man', lodging: C2_RV_LG, sharedWith: 'Serenity',
        badge: { name: 'Captain Tightpants' }, passes: [[RV_LG, 'Vehicle Camp 2']] },
      { first: 'Zoë', last: 'Washburne', age: 49, gender: 'Woman', lodging: C2_RV_LG, sharedWith: 'Serenity' },
      { first: 'Hoban', last: 'Washburne', age: 49, gender: 'Man', lodging: C2_RV_LG, sharedWith: 'Serenity',
        badge: { name: 'Hoban "Wash" Washburne', pronouns: 'he/him' } },
      { first: 'Inara', last: 'Serra', age: 49, gender: 'Woman', lodging: C2_RV_XL, sharedWith: 'Inara\'s shuttle',
        passes: [[RV_LG, 'Vehicle Camp 2']] },
      { first: 'Jayne', last: 'Cobb', age: 49, gender: 'Man', meals: F(), lodging: C2_RV_LG, sharedWith: 'Serenity' },
      { first: 'Kaywinnet Lee', last: 'Frye', age: 25, gender: 'Woman', lodging: C2_RV_LG, sharedWith: 'Serenity',
        badge: { name: 'Kaylee' } },
    ],
  },
  {
    // The X-Files: the FBI's X-Files unit; the registrar picks their lodging
    address: us('935 Pennsylvania Ave NW', 'Washington', 'DC', '20535'),
    email: 'x.files@dontsend.com',
    phone: '+12025550109',
    comments: 'The truth is out there.',
    campers: [
      { first: 'Fox', last: 'Mulder', age: 49, gender: 'Man', meals: D(), lodging: REGISTRAR,
        badge: { name: 'Spooky Mulder' }, passes: [[CAR, 'Park Anywhere']] },
      { first: 'Dana', last: 'Scully', age: 49, gender: 'Woman', meals: F(), lodging: REGISTRAR,
        volunteer: { skills: ['Medical'], credentials: 'MD, forensic pathology' }, email: 'dana.scully@dontsend.com' },
      { first: 'Walter', last: 'Skinner', age: 64, gender: 'Man', meals: D(), lodging: REGISTRAR },
    ],
  },
  {
    // The Witcher: Geralt's family, paid for from Poland, in a Camp 3 tent
    address: abroad('Kaer Morhen', 'Kraków', 'Małopolskie', '30-001', 'Poland'),
    email: 'kaer.morhen@dontsend.com',
    phone: '+48125550110',
    campers: [
      { first: 'Geralt', last: 'of Rivia', age: 65, gender: 'Man', meals: F(), lodging: C3_TENT_L, sharedWith: 'Geralt\'s family',
        address: us('12 Roach Stable Rd', 'Healdsburg', 'CA', '95448') },
      { first: 'Yennefer', last: 'of Vengerberg', age: 65, gender: 'Woman', meals: F(VEG), lodging: C3_TENT_L,
        sharedWith: 'Geralt\'s family' },
      { first: 'Cirilla', last: 'Fiona Elen Riannon', age: 17, gender: 'Woman', meals: F(), lodging: C3_TENT_L,
        sharedWith: 'Geralt\'s family', badge: { name: 'Ciri' } },
      { first: 'Julian', last: 'Alfred Pankratz, Viscount de Lettenhove', age: 49, gender: 'Man', meals: F(), lodging: C3_TENT_I,
        badge: { name: 'Jaskier', pronouns: 'he/him' } },
    ],
  },
  {
    // Supernatural: the Winchesters and Castiel; the Impala parks anywhere
    address: us('1 Bunker Rd', 'Lebanon', 'KS', '66952'),
    email: 'winchester.bros@dontsend.com',
    phone: '+17855550111',
    campers: [
      { first: 'John', last: 'Winchester, Sr.', age: 64, gender: 'Man', meals: F(), lodging: C3_TENT_K,
        passes: [[CAR, 'Park Anywhere'], [CAR, 'Short Term'], [CAR, 'Camp 3']] },
      { first: 'Dean', last: 'Winchester', age: 49, gender: 'Man', meals: F(), lodging: C3_TENT_K, sharedWith: 'Sam Winchester',
        badge: { name: 'Dean' } },
      { first: 'Sam', last: 'Winchester', age: 49, gender: 'Man', meals: F(VEG), lodging: C3_TENT_K, sharedWith: 'Dean Winchester' },
      { first: 'Castiel', last: 'Angel of the Lord', age: 65, gender: 'Nonbinary/other', meals: D(), lodging: C3_TENT_K,
        badge: { name: 'Cas', pronouns: 'he/they' } },
    ],
  },
  {
    // Stranger Things: the Party and their parents, in a Camp 3 cabin
    address: us('1 Maple St', 'Hawkins', 'IN', '46201'),
    email: 'hawkins.party@dontsend.com',
    phone: '+13175550112',
    campers: [
      { first: 'Joyce', last: 'Byers', age: 49, gender: 'Woman', meals: F(), lodging: C3_CABIN, sharedWith: 'Hawkins party',
        passes: [[CAR, 'Camp 3']] },
      { first: 'Jim', last: 'Hopper', age: 49, gender: 'Man', meals: F(), lodging: C3_CABIN, sharedWith: 'Hawkins party',
        badge: { name: 'Chief Hopper' } },
      { first: 'Jane', last: 'Hopper', age: 17, gender: 'Woman', meals: F(), lodging: C3_CABIN, sharedWith: 'Hawkins party',
        badge: { name: 'Eleven', pronouns: 'she/her' } },
      { first: 'Mike', last: 'Wheeler', age: 17, gender: 'Man', meals: F(), lodging: C3_CABIN, sharedWith: 'Hawkins party' },
      { first: 'Dustin', last: 'Henderson', age: 17, gender: 'Man', meals: F(), lodging: C3_CABIN, sharedWith: 'Hawkins party' },
      { first: 'Will', last: 'Byers', age: 17, gender: 'Man', meals: F(VEG), lodging: C3_CABIN, sharedWith: 'Hawkins party' },
    ],
  },
  {
    // Stargate SG-1: SG-1, in a Camp 2 tent
    address: us('1 Cheyenne Mountain Complex', 'Colorado Springs', 'CO', '80914'),
    email: 'sg1@dontsend.com',
    phone: '+17195550113',
    campers: [
      { first: 'Jack', last: 'O\'Neill', age: 64, gender: 'Man', meals: F(), lodging: C2_TENT_H, sharedWith: 'SG-1',
        badge: { name: 'Jack O\'Neill', pronouns: 'two Ls' }, passes: [[CAR, 'Camp 2']] },
      { first: 'Samantha', last: 'Carter', age: 49, gender: 'Woman', meals: F(), lodging: C2_TENT_H, sharedWith: 'SG-1',
        volunteer: { skills: ['Emergency management', 'Firefighting'], credentials: 'Lt. Col., USAF; PhD' } },
      { first: 'Daniel', last: 'Jackson', age: 49, gender: 'Man', meals: F(VEG), lodging: C2_TENT_H, sharedWith: 'SG-1' },
      { first: 'Teal\'c', last: 'of Chulak', age: 65, gender: 'Man', meals: F(), lodging: C2_TENT_H, sharedWith: 'SG-1' },
    ],
  },
  {
    // The Boys: the Boys, paid for from London, in a Camp 1 RV
    address: abroad('221 Leman St', 'London', 'Greater London', 'E1 8PY', 'United Kingdom'),
    email: 'the.boys@dontsend.com',
    phone: '+442075550114',
    campers: [
      { first: 'Billy', last: 'Butcher', age: 49, gender: 'Man', meals: F(), lodging: C1_RV_SM, sharedWith: 'The Boys',
        passes: [[RV_SM, 'Vehicle Camp 1']] },
      { first: 'Hughie', last: 'Campbell', age: 25, gender: 'Man', meals: F(), lodging: C1_RV_SM, sharedWith: 'The Boys',
        address: us('300 Vought Tower', 'New York', 'NY', '10001') },
      { first: 'Annie', last: 'January', age: 25, gender: 'Woman', meals: F(VEG), lodging: C1_RV_SM, sharedWith: 'The Boys',
        badge: { name: 'Starlight' } },
      { first: 'Marvin', last: 'Milk', age: 49, gender: 'Man', meals: D(), lodging: C1_RV_SM, sharedWith: 'The Boys',
        badge: { name: 'Mother\'s Milk', pronouns: 'he/him' } },
      { first: 'Serge', last: 'Frenchie', age: 49, gender: 'Man', meals: D(VEG), lodging: C1_RV_SM, sharedWith: 'The Boys' },
      { first: 'Kimiko', last: 'Miyashiro', age: 25, gender: 'Woman', meals: D(), lodging: C1_RV_SM, sharedWith: 'The Boys' },
    ],
  },
  {
    // Babylon 5: the station's command staff and ambassadors, in a Camp 2 cabin
    address: us('5 Babylon Station', 'Tucson', 'AZ', '85701'),
    email: 'babylon5@dontsend.com',
    phone: '+15205550115',
    donation: 250,
    campers: [
      { first: 'John', last: 'Sheridan', age: 49, gender: 'Man', meals: F(), lodging: C2_CABIN, sharedWith: 'Babylon 5' },
      { first: 'Delenn', last: 'of Minbar', age: 49, gender: 'Woman', meals: F(VEGAN), lodging: C2_CABIN, sharedWith: 'Babylon 5',
        badge: { name: 'Ambassador Delenn' } },
      { first: 'Michael', last: 'Garibaldi', age: 49, gender: 'Man', meals: F(), lodging: C2_CABIN, sharedWith: 'Babylon 5' },
      { first: 'Susan', last: 'Ivanova', age: 49, gender: 'Woman', meals: F(), lodging: C2_CABIN, sharedWith: 'Babylon 5' },
      { first: 'G\'Kar', last: 'of Narn', age: 64, gender: 'Man', meals: D(), lodging: C2_CABIN, sharedWith: 'Babylon 5' },
      { first: 'Londo', last: 'Mollari', age: 64, gender: 'Man', meals: D(), lodging: C2_CABIN, sharedWith: 'Babylon 5' },
    ],
  },
  {
    // The Avengers: the original six, in a Camp 1 cabin, with the biggest donation
    address: us('890 Fifth Avenue', 'New York', 'NY', '10021'),
    email: 'avengers.assemble@dontsend.com',
    phone: '+12125550116',
    donation: 10000,
    heardFrom: 'Nick Fury',
    campers: [
      { first: 'Tony', last: 'Stark', age: 49, gender: 'Man', meals: F(), lodging: C1_CABIN, sharedWith: 'Avengers',
        passes: [[CAR, 'Park Anywhere'], [CAR, 'Long Term']] },
      { first: 'Steve', last: 'Rogers', age: 65, gender: 'Man', meals: F(), lodging: C1_CABIN, sharedWith: 'Avengers' },
      { first: 'Natasha', last: 'Romanoff', age: 49, gender: 'Woman', meals: F(), lodging: C1_CABIN, sharedWith: 'Avengers' },
      { first: 'Bruce', last: 'Banner', age: 49, gender: 'Man', meals: F(VEG), lodging: C1_CABIN, sharedWith: 'Avengers',
        volunteer: { skills: ['Medical'], credentials: 'MD, PhD' } },
      { first: 'Thor', last: 'Odinson', age: 65, gender: 'Man', meals: F(), lodging: C1_CABIN, sharedWith: 'Avengers' },
      { first: 'Clint', last: 'Barton', age: 49, gender: 'Man', meals: F(), lodging: C1_CABIN, sharedWith: 'Avengers' },
    ],
  },
  {
    // Harry Potter: the Malfoys, in a large Camp 1 RV
    address: us('1 Malfoy Manor Dr', 'Wiltshire', 'VT', '05001'),
    email: 'malfoy.manor@dontsend.com',
    phone: '+18025550117',
    comments: 'Lucius asks that the Malfoys are not lodged near the Weasleys.',
    campers: [
      { first: 'Lucius', last: 'Malfoy', age: 64, gender: 'Man', meals: F(), lodging: C1_RV_LG, sharedWith: 'Malfoy family',
        passes: [[RV_LG, 'Vehicle Camp 1']] },
      { first: 'Narcissa', last: 'Malfoy', age: 64, gender: 'Woman', meals: F(VEG), lodging: C1_RV_LG, sharedWith: 'Malfoy family' },
      { first: 'Draco', last: 'Malfoy', age: 17, gender: 'Man', meals: F(), lodging: C1_RV_LG, sharedWith: 'Malfoy family' },
    ],
  },
  {
    // Harry Potter: the Weasleys, in a Camp 2 tent
    address: us('1 The Burrow', 'Ottery St Catchpole', 'MA', '01001'),
    email: 'the.burrow@dontsend.com',
    phone: '+14135550118',
    campers: [
      { first: 'Arthur', last: 'Weasley', age: 64, gender: 'Man', meals: F(), lodging: C2_TENT_E, sharedWith: 'Weasley family',
        passes: [[CAR, 'Camp 2']] },
      { first: 'Molly', last: 'Weasley', age: 64, gender: 'Woman', meals: F(), lodging: C2_TENT_E, sharedWith: 'Weasley family' },
      { first: 'Ron', last: 'Weasley', age: 17, gender: 'Man', meals: F(), lodging: C2_TENT_E, sharedWith: 'Weasley family' },
      { first: 'Ginny', last: 'Weasley', age: 11, gender: 'Woman', meals: F(), lodging: C2_TENT_E, sharedWith: 'Weasley family' },
      { first: 'Fred', last: 'Weasley', age: 17, gender: 'Man', meals: F(), lodging: C2_TENT_E, sharedWith: 'Weasley family' },
      { first: 'George', last: 'Weasley', age: 17, gender: 'Man', meals: F(), lodging: C2_TENT_E, sharedWith: 'Weasley family' },
    ],
  },
  {
    // X-Men: the first class; the registrar picks their lodging
    address: us('1407 Graymalkin Ln', 'Salem Center', 'NY', '10560'),
    email: 'xavier.school@dontsend.com',
    phone: '+19145550119',
    campers: [
      { first: 'Charles', last: 'Xavier', age: 65, gender: 'Man', meals: F(), lodging: REGISTRAR, badge: { name: 'Professor X' } },
      { first: 'Jean', last: 'Grey', age: 25, gender: 'Woman', meals: F(), lodging: REGISTRAR },
      { first: 'Scott', last: 'Summers', age: 25, gender: 'Man', meals: F(), lodging: REGISTRAR, badge: { name: 'Cyclops' } },
      { first: 'Ororo', last: 'Munroe', age: 49, gender: 'Woman', meals: F(VEG), lodging: REGISTRAR, badge: { name: 'Storm' } },
      { first: 'James "Logan"', last: 'Howlett', age: 65, gender: 'Man', meals: F(), lodging: REGISTRAR,
        badge: { name: 'Wolverine' }, passes: [[CAR, 'Park Anywhere']] },
      { first: 'Kitty', last: 'Pryde', age: 17, gender: 'Woman', meals: F(VEG), lodging: REGISTRAR },
    ],
  },
  {
    // Jurassic Park: the park's first tour group, in a Camp 3 RV
    address: us('1 Isla Nublar Way', 'Choteau', 'MT', '59422'),
    email: 'isla.nublar@dontsend.com',
    phone: '+14065550120',
    campers: [
      { first: 'Alan', last: 'Grant', age: 49, gender: 'Man', meals: F(), lodging: C3_RV_SM, sharedWith: 'Jurassic Park tour',
        passes: [[RV_SM, 'Vehicle Camp 3']] },
      { first: 'Ellie', last: 'Sattler', age: 49, gender: 'Woman', meals: F(VEG), lodging: C3_RV_SM, sharedWith: 'Jurassic Park tour' },
      { first: 'Ian', last: 'Malcolm', age: 49, gender: 'Man', meals: D(), lodging: C3_RV_SM, sharedWith: 'Jurassic Park tour' },
      { first: 'Lex', last: 'Murphy', age: 17, gender: 'Woman', meals: F(VEG), lodging: C3_RV_SM, sharedWith: 'Jurassic Park tour' },
      { first: 'Tim', last: 'Murphy', age: 11, gender: 'Man', meals: F(), lodging: C3_RV_SM, sharedWith: 'Jurassic Park tour' },
    ],
  },
  {
    // Ghostbusters (Afterlife, Frozen Empire): the Spenglers, second half only, in a Camp 3 tent
    address: us('1 Spengler Farm Rd', 'Summerville', 'OK', '74001'),
    email: 'spengler.farm@dontsend.com',
    phone: '+19185550121',
    campers: [
      { first: 'Callie', last: 'Spengler', age: 49, gender: 'Woman', session: SECOND_HALF, meals: B(), lodging: C3_TENT_L,
        sharedWith: 'Spenglers', passes: [[CAR, 'Camp 3']] },
      { first: 'Gary', last: 'Grooberson', age: 49, gender: 'Man', session: SECOND_HALF, meals: B(), lodging: C3_TENT_L,
        sharedWith: 'Spenglers' },
      { first: 'Trevor', last: 'Spengler', age: 17, gender: 'Man', session: SECOND_HALF, meals: B(), lodging: C3_TENT_L,
        sharedWith: 'Spenglers' },
      { first: 'Phoebe', last: 'Spengler', age: 11, gender: 'Woman', session: SECOND_HALF, meals: B(VEG), lodging: C3_TENT_L,
        sharedWith: 'Spenglers' },
      { first: 'Podcast', last: '(Podcast)', age: 11, gender: 'Man', session: SECOND_HALF, lodging: C3_TENT_L, sharedWith: 'Spenglers' },
    ],
  },
  {
    // The Matrix: the crew of the Nebuchadnezzar, filling Camp 3 Tent Area I with Jaskier
    address: us('101 Zion Way', 'Chicago', 'IL', '60601'),
    email: 'nebuchadnezzar@dontsend.com',
    phone: '+13125550122',
    campers: [
      { first: 'Morpheus', last: 'of Zion', age: 49, gender: 'Man', meals: F(), lodging: C3_TENT_I, sharedWith: 'Nebuchadnezzar' },
      { first: 'Thomas', last: 'Anderson', age: 49, gender: 'Man', meals: F(VEGAN), lodging: C3_TENT_I, sharedWith: 'Nebuchadnezzar',
        badge: { name: 'Neo' } },
      { first: 'Trinity', last: 'of Zion', age: 49, gender: 'Woman', meals: F(), lodging: C3_TENT_I, sharedWith: 'Nebuchadnezzar' },
      { first: 'Niobe', last: 'of Zion', age: 49, gender: 'Woman', meals: D(), lodging: C3_TENT_I },
    ],
  },
  {
    // Young Justice: the Team, in a Camp 2 tent
    address: us('1 Mount Justice', 'Happy Harbor', 'RI', '02840'),
    email: 'the.team@dontsend.com',
    phone: '+14015550123',
    campers: [
      { first: 'Kaldur\'ahm', last: 'of Atlantis', age: 25, gender: 'Man', meals: F(), lodging: C2_TENT_F, sharedWith: 'The Team',
        badge: { name: 'Aqualad' } },
      { first: 'Dick', last: 'Grayson', age: 25, gender: 'Man', meals: F(), lodging: C2_TENT_F, sharedWith: 'The Team',
        badge: { name: 'Nightwing', pronouns: 'he/him' } },
      { first: 'Wally', last: 'West', age: 25, gender: 'Man', meals: F(), lodging: C2_TENT_F, sharedWith: 'The Team' },
      { first: 'M\'gann', last: 'M\'orzz', age: 25, gender: 'Woman', meals: F(VEG), lodging: C2_TENT_F, sharedWith: 'The Team',
        badge: { name: 'Miss Martian' } },
      { first: 'Conner', last: 'Kent', age: 25, gender: 'Man', meals: F(), lodging: C2_TENT_F, sharedWith: 'The Team' },
    ],
  },
  {
    // Adventure Time: the Land of Ooo, in a Camp 1 tent
    address: us('1 Tree Fort Ln', 'Ooo', 'OH', '43001'),
    email: 'tree.fort@dontsend.com',
    phone: '+16145550124',
    campers: [
      { first: 'Finn', last: 'Mertens', age: 17, gender: 'Man', meals: F(), lodging: C1_TENT_C, sharedWith: 'Tree Fort' },
      { first: 'Jake', last: 'the Dog', age: 49, gender: 'Man', meals: F(), lodging: C1_TENT_C, sharedWith: 'Tree Fort' },
      { first: 'Bonnibel', last: 'Bubblegum', age: 65, gender: 'Woman', meals: F(VEGAN), lodging: C1_TENT_C,
        badge: { name: 'Princess Bubblegum', pronouns: 'she/her' } },
      { first: 'Marceline', last: 'Abadeer', age: 65, gender: 'Woman', meals: D(), lodging: C1_TENT_C,
        badge: { name: 'Marceline the Vampire Queen' } },
      { first: 'BMO', last: 'Mertens', age: 4, gender: 'Nonbinary/other', lodging: C1_TENT_C, sharedWith: 'Tree Fort' },
    ],
  },
  {
    // Scott Pilgrim vs. the World: Sex Bob-Omb and friends, paid from Toronto
    address: abroad('1 Casa Loma Ave', 'Toronto', 'ON', 'M5R 1X8', 'Canada'),
    email: 'sex.bob.omb@dontsend.com',
    phone: '+14165550125',
    campers: [
      { first: 'Scott', last: 'Pilgrim', age: 25, gender: 'Man', meals: F(), lodging: C2_RV_SM, sharedWith: 'Sex Bob-Omb',
        passes: [[RV_SM, 'Vehicle Camp 2']] },
      { first: 'Ramona', last: 'Flowers', age: 25, gender: 'Woman', meals: F(VEGAN), lodging: C2_RV_SM, sharedWith: 'Sex Bob-Omb',
        email: 'ramona.flowers@dontsend.com' },
      { first: 'Kim', last: 'Pine', age: 25, gender: 'Woman', meals: F(), lodging: C2_RV_SM, sharedWith: 'Sex Bob-Omb' },
      { first: 'Stephen', last: 'Stills', age: 25, gender: 'Man', meals: F(), lodging: C2_RV_SM, sharedWith: 'Sex Bob-Omb' },
      { first: 'Wallace', last: 'Wells', age: 25, gender: 'Man', meals: D(), lodging: C2_RV_SM,
        badge: { name: 'Wallace "Cool Gay Roommate" Wells', pronouns: 'he/him' } },
    ],
  },
  {
    // Veronica Mars: the Mars family and friends, first half only
    address: us('1 Neptune High Rd', 'Neptune', 'CA', '92651'),
    email: 'mars.investigations@dontsend.com',
    phone: '+19495550126',
    campers: [
      { first: 'Keith', last: 'Mars', age: 49, gender: 'Man', session: FIRST_HALF, meals: A(), lodging: C1_TENT_C,
        passes: [[CAR, 'Short Term']] },
      { first: 'Veronica', last: 'Mars', age: 17, gender: 'Woman', session: FIRST_HALF, meals: A(), lodging: C1_TENT_C,
        sharedWith: 'Keith Mars' },
      { first: 'Wallace', last: 'Fennel', age: 17, gender: 'Man', session: FIRST_HALF, lodging: C1_TENT_C },
      { first: 'Logan', last: 'Echolls', age: 17, gender: 'Man', session: FIRST_HALF, meals: A(VEG), lodging: C1_TENT_C },
    ],
  },
  {
    // Critical Role: Vox Machina, in a Camp 2 cabin
    address: us('1 Whitestone Castle Rd', 'Whitestone', 'WA', '98001'),
    email: 'vox.machina@dontsend.com',
    phone: '+13235550127',
    heardFrom: 'A bard in Emon',
    campers: [
      { first: 'Vex\'ahlia', last: 'de Rolo', age: 25, gender: 'Woman', meals: F(), lodging: C2_CABIN, sharedWith: 'Vox Machina',
        badge: { name: 'Lady Vex\'ahlia, Baroness of Whitestone' } },
      { first: 'Vax\'ildan', last: 'Vessar', age: 25, gender: 'Man', meals: F(), lodging: C2_CABIN, sharedWith: 'Vox Machina' },
      { first: 'Percival', last: 'Fredrickstein von Musel Klossowski de Rolo III', age: 25, gender: 'Man', meals: F(),
        lodging: C2_CABIN, sharedWith: 'Vox Machina', badge: { name: 'Percy' } },
      { first: 'Grog', last: 'Strongjaw', age: 49, gender: 'Man', meals: F(), lodging: C2_CABIN, sharedWith: 'Vox Machina' },
      { first: 'Keyleth', last: 'of the Air Ashari', age: 25, gender: 'Woman', meals: F(VEGAN), lodging: C2_CABIN, sharedWith: 'Vox Machina' },
      { first: 'Pike', last: 'Trickfoot', age: 49, gender: 'Woman', meals: F(VEG), lodging: C2_CABIN, sharedWith: 'Vox Machina',
        volunteer: { skills: ['Medical'], credentials: 'Cleric of the Everlight' } },
      { first: 'Scanlan', last: 'Shorthalt', age: 49, gender: 'Man', meals: F(), lodging: C2_CABIN, sharedWith: 'Vox Machina',
        passes: [[CAR, 'Camp 2']] },
      { first: 'Taryon', last: 'Darrington', age: 25, gender: 'Man', meals: F(), lodging: C2_CABIN, sharedWith: 'Vox Machina' },
    ],
  },
  {
    // Dimension 20: the Fantasy High party (the Bad Kids), in a Camp 3 cabin
    address: us('1 Aguefort Adventuring Academy', 'Elmville', 'OR', '97301'),
    email: 'bad.kids@dontsend.com',
    phone: '+13235550128',
    campers: [
      { first: 'Figueroth', last: 'Faeth', age: 17, gender: 'Woman', meals: F(), lodging: C3_CABIN, sharedWith: 'Bad Kids',
        badge: { name: 'Fig "Baleful Strega" Faeth', pronouns: 'she/her' } },
      { first: 'Gorgug', last: 'Thistlespring', age: 17, gender: 'Man', meals: F(), lodging: C3_CABIN, sharedWith: 'Bad Kids' },
      { first: 'Kristen', last: 'Applebees', age: 17, gender: 'Woman', meals: F(VEG), lodging: C3_CABIN, sharedWith: 'Bad Kids' },
      { first: 'Fabian', last: 'Aramais Seacaster', age: 17, gender: 'Man', meals: F(), lodging: C3_CABIN, sharedWith: 'Bad Kids' },
      { first: 'Riz', last: 'Gukgak', age: 17, gender: 'Man', meals: F(), lodging: C3_CABIN, sharedWith: 'Bad Kids',
        badge: { name: 'The Ball' } },
      { first: 'Adaine', last: 'Abernant', age: 17, gender: 'Woman', meals: F(VEGAN), lodging: C3_CABIN, sharedWith: 'Bad Kids' },
      { first: 'Arthur', last: 'Aguefort', age: 65, gender: 'Man', meals: D(), lodging: C3_CABIN,
        email: 'headmaster.aguefort@dontsend.com', passes: [[CAR, 'Camp 3']] },
    ],
  },
  {
    // Ted Lasso: AFC Richmond's coaches and front office, in a Camp 1 tent
    address: us('1 Nelson Rd', 'Wichita', 'KS', '67202'),
    email: 'afc.richmond@dontsend.com',
    phone: '+13165550129',
    comments: 'The sign over the door says "Believe." We\'d like to camp near it, please.',
    campers: [
      { first: 'Ted', last: 'Lasso', age: 49, gender: 'Man', meals: F(), lodging: C1_TENT_B, sharedWith: 'Lasso family',
        badge: { name: 'Coach Lasso' }, passes: [[CAR, 'Camp 1']] },
      { first: 'Henry', last: 'Lasso', age: 11, gender: 'Man', meals: F(), lodging: C1_TENT_B, sharedWith: 'Lasso family' },
      { first: 'Rebecca', last: 'Welton', age: 49, gender: 'Woman', meals: F(VEG), lodging: C1_TENT_B },
      { first: 'Roy', last: 'Kent', age: 49, gender: 'Man', meals: F(), lodging: C1_TENT_B, sharedWith: 'Keeley Jones' },
      { first: 'Keeley', last: 'Jones', age: 25, gender: 'Woman', meals: F(VEGAN), lodging: C1_TENT_B, sharedWith: 'Roy Kent' },
      { first: 'Coach', last: 'Beard', age: 49, gender: 'Man', meals: D(), lodging: C1_TENT_B },
    ],
  },
  {
    // Spider-Man: the Parkers and friends, in a Camp 2 tent
    address: us('20 Ingram St', 'Queens', 'NY', '11375'),
    email: 'friendly.neighborhood@dontsend.com',
    phone: '+17185550130',
    campers: [
      { first: 'May', last: 'Parker', age: 65, gender: 'Woman', meals: F(), lodging: C2_TENT_G, sharedWith: 'Parkers',
        passes: [[CAR, 'Long Term']] },
      { first: 'Peter', last: 'Parker', age: 25, gender: 'Man', meals: F(), lodging: C2_TENT_G, sharedWith: 'Parkers' },
      { first: 'Mary Jane', last: 'Watson', age: 25, gender: 'Woman', meals: F(VEG), lodging: C2_TENT_G, sharedWith: 'Parkers',
        badge: { name: 'MJ' } },
      { first: 'Miles', last: 'Morales', age: 17, gender: 'Man', meals: F(), lodging: C2_TENT_G },
      { first: 'Gwen', last: 'Stacy', age: 17, gender: 'Woman', meals: F(VEGAN), lodging: C2_TENT_G },
    ],
  },
  {
    // Interview with the Vampire: the coven, second half only, few meals
    address: us('1 Royal St, "The Townhouse"', 'New Orleans', 'LA', '70130'),
    email: 'rue.royale@dontsend.com',
    phone: '+15045550131',
    comments: 'Late arrivals; we prefer evenings.\nNo garlic, please.',
    campers: [
      { first: 'Louis', last: 'de Pointe du Lac', age: 65, gender: 'Man', session: SECOND_HALF, lodging: C3_TENT_J,
        sharedWith: 'Lestat de Lioncourt' },
      { first: 'Lestat', last: 'de Lioncourt', age: 65, gender: 'Man', session: SECOND_HALF, lodging: C3_TENT_J,
        sharedWith: 'Louis de Pointe du Lac', badge: { name: 'Lestat, the Vampire', pronouns: 'he/him' } },
      { first: 'Claudia', last: 'de Pointe du Lac', age: 17, gender: 'Woman', session: SECOND_HALF, meals: B(), lodging: C3_TENT_J },
      { first: 'Armand', last: 'of Paris', age: 65, gender: 'Man', session: SECOND_HALF, lodging: C3_TENT_J },
      { first: 'Daniel', last: 'Molloy', age: 64, gender: 'Man', session: SECOND_HALF, meals: B(), lodging: C3_TENT_J,
        passes: [[CAR, 'Short Term']] },
    ],
  },
  {
    // The Pitt: the Pittsburgh Trauma Medical Center ED, all medical volunteers, in a Camp 2 cabin
    address: us('1 Trauma Center Blvd', 'Pittsburgh', 'PA', '15213'),
    email: 'pttmc.ed@dontsend.com',
    phone: '+14125550132',
    campers: [
      { first: 'Michael', last: 'Robinavitch', age: 49, gender: 'Man', meals: D(), lodging: C2_CABIN,
        badge: { name: 'Dr. Robby' }, volunteer: { skills: ['Medical', 'Emergency management'], credentials: 'MD, attending emergency physician' } },
      { first: 'Dana', last: 'Evans', age: 49, gender: 'Woman', meals: D(), lodging: C2_CABIN,
        volunteer: { skills: ['Medical', 'Counseling/psychiatric'], credentials: 'RN, charge nurse' } },
      { first: 'Cassie', last: 'McKay', age: 25, gender: 'Woman', meals: D(VEG), lodging: C2_CABIN,
        volunteer: { skills: ['Medical'], credentials: 'MD (resident)' } },
      { first: 'Mel', last: 'King', age: 25, gender: 'Woman', meals: D(VEG), lodging: C2_CABIN,
        volunteer: { skills: ['Medical', 'Counseling/psychiatric'], credentials: 'MD (resident)' } },
    ],
  },
  {
    // Inglourious Basterds: the Basterds, in a Camp 1 tent
    address: us('1 Smoky Mountain Rd', 'Maynardville', 'TN', '37807'),
    email: 'the.basterds@dontsend.com',
    phone: '+18655550133',
    campers: [
      { first: 'Aldo', last: 'Raine', age: 49, gender: 'Man', meals: F(), lodging: C1_TENT_C,
        badge: { name: 'Lt. Aldo "the Apache" Raine' }, passes: [[CAR, 'Camp 1']] },
      { first: 'Donny', last: 'Donowitz', age: 25, gender: 'Man', meals: F(), lodging: C1_TENT_C, badge: { name: 'The Bear Jew' } },
      { first: 'Hugo', last: 'Stiglitz', age: 49, gender: 'Man', meals: F(), lodging: C1_TENT_C },
      { first: 'Shosanna', last: 'Dreyfus', age: 25, gender: 'Woman', meals: F(VEG), lodging: C1_TENT_C,
        address: abroad('1 Rue du Cinéma, "Le Gamaar"', 'Paris', 'Île-de-France', '75001', 'France') },
    ],
  },
  {
    // Spider-Noir: Ben Reilly, on his own in a large Camp 3 RV
    address: us('1 Gumshoe Alley', 'New York', 'NY', '10002'),
    email: 'spider.noir@dontsend.com',
    phone: '+12125550134',
    campers: [
      { first: 'Ben', last: 'Reilly', age: 49, gender: 'Man', meals: D(), lodging: C3_RV_LG,
        badge: { name: 'The Spider', pronouns: 'he/him' }, passes: [[RV_LG, 'Vehicle Camp 3'], [CAR, 'Short Term']] },
    ],
  },
  {
    // Delicious in Dungeon: Laios's party, all meals, on the 50% deposit
    address: abroad('1 Golden Kingdom Rd', 'Sapporo', 'Hokkaido', '060-0001', 'Japan'),
    email: 'laios.party@dontsend.com',
    phone: '+81115550135',
    paymentOption: '50% Deposit',
    comments: 'Senshi will cook for the party, but they would like all meals anyway.',
    campers: [
      { first: 'Laios', last: 'Touden', age: 25, gender: 'Man', meals: F(), lodging: C3_RV_SM, sharedWith: 'Laios\'s party',
        address: us('2 Dungeon Entrance Rd', 'Arcata', 'CA', '95521'), passes: [[RV_SM, 'Vehicle Camp 3']] },
      { first: 'Falin', last: 'Touden', age: 25, gender: 'Woman', meals: F(VEG), lodging: C3_RV_SM, sharedWith: 'Laios\'s party' },
      { first: 'Marcille', last: 'Donato', age: 49, gender: 'Woman', meals: F(VEG), lodging: C3_RV_SM, sharedWith: 'Laios\'s party' },
      { first: 'Chilchuck', last: 'Tims', age: 49, gender: 'Man', meals: F(), lodging: C3_RV_SM, sharedWith: 'Laios\'s party' },
      { first: 'Senshi', last: 'of Izganda', age: 65, gender: 'Man', meals: F(), lodging: C3_RV_SM, sharedWith: 'Laios\'s party',
        badge: { name: 'Senshi' } },
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
