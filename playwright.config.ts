import { defineEventE2EConfig } from '@camphoric/camphoric-event-import-tools/e2e';

// The registration form's end-to-end tests (e2e/), against a throwaway
// Camphoric with this event imported: see README.md
export default defineEventE2EConfig({
  globalSetup: './e2e/global-setup.ts',
  // The harness runs one test at a time, but these share nothing a parallel
  // test could change: each makes its own registration, with its own email
  // and invitation. 4 workers, as many as GitHub's runners have CPUs, take
  // the suite from about 15 minutes to under 6.
  workers: 4,
});
