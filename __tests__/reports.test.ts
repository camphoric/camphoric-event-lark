import { describe, expect, it } from '@jest/globals';

import reports from '../reports.ts';

// The admin's report list groups reports by category (camphoric/camphoric#992),
// so a title no longer starts with one ("Campers, Minors" is "Minors" in
// Campers). The import tools after 2.2.0 update an event's report of the same
// title, by title alone: two reports with one title, even in different
// categories, would be imported into one when the event is imported again.

describe('reports', () => {
  it('each have a category', () => {
    expect(reports.filter(report => !report.category).map(report => report.title)).toEqual([]);
  });

  it('each have their own title', () => {
    const titles = reports.map(report => report.title);
    expect(titles.filter((title, i) => titles.indexOf(title) !== i)).toEqual([]);
  });

  it('don\'t repeat the category in the title', () => {
    expect(reports.filter(report => report.title.startsWith(`${report.category},`))
      .map(report => report.title)).toEqual([]);
  });
});
