import { test } from '@camphoric/camphoric-event-import-tools/e2e';

// Registration types, reached through an invitation's link (#14, E). Sources:
// the "Create Special Registration Invitation" test procedure, Meghan's
// "Testing Reg System (crew)" and "More testing" emails and Mahati's guest of
// talent notes. Replaces the fixme "each registration type (crew, kitchen,
// talent, …) changes the fees".
//
// Every test here needs the harness to create an invitation for a
// registration type through the admin API and return its register_url (#14,
// Harness addition 1). The invitation emails' own text is a unit test
// (__tests__/registrationTypes.test.ts).



// E1: each type in registrationTypes.ts
test.fixme('an invitation link opens the form as its type, with a banner naming it', () => {});

// E2: sheet row "Crew enrollment fee". Camp 2 office crew, tent in Area H, no
// meals, no parking pass, name badge: $60, the badge free, the fee listed as
// an enrollment fee
test.fixme('crew pay the enrollment fee, on its own line, not as tuition', () => {});

// E3: Meghan, "no free badges for crew other than office, Instructors, and
// community care". Camp 3 cleanup crew, cabin, no meals, name badge, 50%
// Deposit: $65, the badge not halved
test.fixme('cleanup crew pay for a name badge, in full with a deposit', () => {});

// E4: setup/teardown crew, 12-17, All Meals, name badge: meals at the adult
// price ($505: 12 and up pay adult meal prices, though #14 says $380), badge
// and enrollment fee charged
test.fixme('a minor on setup crew pays for meals, a badge and the fee', () => {});

// E5: bus driver: parking pass, badge and meals $0; office crew: a parking
// pass is $35; a regular camper: $90
test.fixme('free-parking and crew-parking types pay their parking price', () => {});

// E6: kitchen crew (full trade), All Meals, Pay by check finishes. (#14 expects
// $0, but kitchen-full is in crewCamp and pays the $60 enrollment fee, while
// its invitation says Lark is free with a full trade. Decide which.)
test.fixme('a crew type with nothing to pay can finish by check', () => {});

// E7: sheet row "payment" (Mahati): Guest of Talent Staff, one adult, full
// camp, All Meals reaches the payment step, with pricing.talent_guest_discount
// off tuition (camperPricingLogic.ts)
test.fixme('a guest of talent reaches the payment step, discounted', () => {});

// E8: sheet row "Guests allowed". A second guest of talent camper is
// discounted too; one-camper types (crew, talent, management) can't add one.
test.fixme('a guest of talent can add campers; one-camper types can\'t', () => {});
