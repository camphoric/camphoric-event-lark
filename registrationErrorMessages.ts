import type { RegistrationErrorMessages } from '@camphoric/camphoric-event-import-spec';

// The form's own validation messages, in place of the raw JSON-schema ones
// ("must be integer", "must match pattern …") that testers couldn't make sense
// of: { field path: { validation keyword: message } }, with "*" for an array
// index and the path "*" for the event-wide default of a keyword. A required
// field's path is the missing field's own.
export default {
  // Jed: a donation of 3.50 was "demanding an integer value"
  'lta_donation': {
    type: 'Please enter a whole number of dollars, e.g. 25.',
    minimum: 'Please enter a whole number of dollars, e.g. 25.',
  },
  // Mahati: pronouns over the limit gave "errors in the name badge field"
  'campers.*.name_badge.pronouns': {
    maxLength: 'Pronouns can be at most 15 characters.',
  },
  // Madelyn: volunteering without credentials gave a page of errors
  'campers.*.good_samaritan.credentials': {
    required: 'Please list your credentials.',
  },
  'campers.*.good_samaritan.skills': {
    required: 'Please check at least one skill.',
    minItems: 'Please check at least one skill.',
  },
  'payment.payer_number': {
    pattern: 'Enter your phone number with country code, digits only, e.g. +17075551234.',
  },
  // (Camphoric checks the registrant's email with a pattern, too)
  'registrant_email': {
    format: 'Please enter a valid email address.',
    pattern: 'Please enter a valid email address.',
  },
  'campers.*.email': {
    format: 'Please enter a valid email address.',
  },
  // Removing the only camper gave "Camper Information: Please choose at least 1"
  'campers': {
    minItems: 'Please add at least one camper.',
  },
  '*': {
    required: 'This field is required.',
  },
} satisfies RegistrationErrorMessages;
