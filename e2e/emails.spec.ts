import { test } from '@camphoric/camphoric-event-import-tools/e2e';

// The confirmation email a completed registration sends (#14, G). Every test
// here needs the harness to read the mail the throwaway server sent, by
// recipient (#14, Harness addition 2). The fixed text (G4) and the invitation
// emails (G5) are unit tests: __tests__/confirmationEmail.test.ts and
// __tests__/registrationTypes.test.ts.

// G1: sheet row "Math on email"; Meghan's emails. After payment.spec.ts's C1
// with Full Payment: tuition, 2 parking passes, badge, donation, handling and
// the total, money always to two decimals ($32.50, not 32.5)
test.fixme('the confirmation email lists what was chosen, to the cent', () => {});

// G2: after C2 with 50% Deposit: "Amount you are paying now" is the payment
// step's, "Due by June 20th" is the total less that and never negative, "Your
// total" is the full total
test.fixme('the confirmation email\'s deposit breakdown adds up', () => {});

// G3: Meghan, bus driver. A $0 parking pass is listed, and the email doesn't
// say "You have not purchased a parking pass". (Also needs invitations,
// Harness addition 1.)
test.fixme('a free parking pass isn\'t reported as not purchased', () => {});

