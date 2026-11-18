import type { DurationLike } from 'luxon';
import { dates, lengthInDays } from './dates.ts';

const dt = (add: DurationLike) => {
  const d = dates.start.plus(add);

  // 'Sat Aug 5th',
  return d.toFormat('EEE MMM d');
};

const regTemplateVars = {
  first_half_camp_start_date_time: `${dt({days: 1})} at 3pm`,
  first_half_camp_end_date_time:   `${dt({days: 5})} at noon`,
  second_half_camp_start_date_time: `${dt({days: 5})} at noon`,
  second_half_camp_end_date_time: `${dt({days: lengthInDays})} at 9am`,

  full_camp_start_date_time: `${dt({days: 1})} at 3pm`,
  full_camp_end_date_time: `${dt({days: lengthInDays})} at 9am`,

  meals_due_date: 'June 20th',

  // Yearly edits for the Camper Info Email (emails/): when a minor's guardian
  // forms are due, when kitchen crew should have heard from the kitchen, and
  // the pre-camp meals sign-up
  guardian_forms_due_date: 'July 22nd',
  kitchen_contact_by_date: 'July 19th',
  precamp_meals_url: 'https://bit.ly/precampmeals25',
};

export default regTemplateVars;
