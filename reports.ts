import fs from 'fs';

import type { Report } from '@camphoric/camphoric-event-import-spec';

import { packagePath } from './packagePath.ts';

function readFile(filename: string): string {
  const fullPathFilename = packagePath('reports', filename);

  return fs.readFileSync(fullPathFilename).toString();
}

// Every report renders on the server from Camphoric's variables (DR-41). Its
// category groups it with related reports in the admin's report list. Each
// title is unique: the import tools after 2.2.0 update an event's report of
// the same title, so two with one title would be imported into one.
const reports: Report[] = [
  {
    category: 'Campers',
    title: 'Parking Exceptions',
    output: 'csv',
    template: readFile('Campers--Parking-Exceptions.j2'),
  },
  {
    category: 'Kitchen',
    title: 'Meal Location Exceptions',
    output: 'csv',
    template: readFile('Kitchen--Meal-Location-Exceptions.j2'),
  },
  {
    category: 'Crew',
    title: 'Clean, C2&3',
    output: 'csv',
    template: readFile('Crew--Clean--C2-3.j2'),
  },
  {
    category: 'Crew',
    title: 'Special Invites',
    output: 'csv',
    template: readFile('Crew--Special-Invites.j2'),
  },
  {
    category: 'Campers',
    title: 'Lodging by Lodging',
    output: 'csv',
    template: readFile('Campers--Lodging-by-Lodging.j2'),
  },
  {
    category: 'Kitchen',
    title: 'All Meal Tickets',
    output: 'csv',
    template: readFile('Kitchen--All-Meal-Tickets.j2'),
  },
  {
    category: 'Registration',
    title: 'All reg workers',
    output: 'csv',
    template: readFile('Registration--All-reg-workers.j2'),
  },
  {
    category: 'Campers',
    title: 'NOT Checked In',
    output: 'csv',
    template: readFile('Campers--NOT-Checked-In.j2'),
  },
  {
    category: 'Campers',
    title: 'By Reg Date',
    output: 'csv',
    template: readFile('Campers--By-Reg-Date.j2'),
  },
  {
    category: 'Crew',
    title: 'Kitchen, w/ Lodging',
    output: 'csv',
    template: readFile('Crew--Kitchen--w--Lodging.j2'),
  },
  {
    category: 'Kitchen',
    title: 'Meal Totals',
    output: 'csv',
    template: readFile('Kitchen--Meal-Totals.j2'),
  },
  {
    category: 'Admin',
    title: 'Meal income',
    output: 'csv',
    template: readFile('Admin--Meal-Income.j2'),
  },
  {
    category: 'Admin',
    title: 'Non-meal income',
    output: 'csv',
    template: readFile('Admin--Non-Meal-Income.j2'),
  },
  {
    category: 'Admin',
    title: 'All payments',
    output: 'csv',
    template: readFile('Admin--All-Payments.j2'),
  },
  {
    category: 'Campers',
    title: 'Lodging by Alpha',
    output: 'csv',
    template: readFile('Campers--Lodging-by-Alpha.j2'),
  },
  {
    category: 'Crew',
    title: 'Managers and Others',
    output: 'csv',
    template: readFile('Crew--Managers-and-Others.j2'),
  },
  {
    category: 'Admin',
    title: 'Donations',
    output: 'csv',
    template: readFile('Donation-Report---Lark.j2'),
  },
  {
    category: 'Campers',
    title: 'Confirmation Email Info',
    output: 'csv',
    template: readFile('Campers--Confirmation-Email-Info.j2'),
  },
  {
    category: 'Campers',
    title: 'Email List for All Campers',
    output: 'md',
    template: readFile('Campers--Email-List-for-All-Campers.j2'),
  },
  {
    category: 'Crew',
    title: 'Clean, C1',
    output: 'csv',
    template: readFile('Crew--Clean--C1.j2'),
  },
  {
    category: 'Campers',
    title: 'By Zip Code (For Carpool)',
    output: 'csv',
    template: readFile('Campers--By-Zip-Code--For-Carpool-.j2'),
  },
  {
    category: 'Registration',
    title: 'Values for July Email',
    output: 'csv',
    template: readFile('Registration--Values-for-July-Email.j2'),
  },
  {
    category: 'Crew',
    title: 'Camper Email List by Crew',
    output: 'md',
    template: readFile('Crew--Camper-Email-List-by-Crew.j2'),
  },
  {
    category: 'Campers',
    title: 'Parking Passes',
    output: 'csv',
    template: readFile('Campers--Parking-Passes.j2'),
  },
  {
    category: 'Campers',
    title: 'Registration Payments',
    output: 'csv',
    template: readFile('Campers--Registration-Payments.j2'),
  },
  {
    category: 'Crew',
    title: 'Community Care',
    output: 'csv',
    template: readFile('Crew--Community-Care.j2'),
  },
  {
    category: 'Registration',
    title: 'Late Arrivals',
    output: 'md',
    template: readFile('Registration--Late-Arrivals.j2'),
  },
  {
    category: 'Campers',
    title: 'Early Arrivals',
    output: 'csv',
    template: readFile('Campers--Early-Arrivals.j2'),
  },
  {
    category: 'Registration',
    title: 'PayPal Invoices',
    output: 'csv',
    template: readFile('Registration--PayPal-Invoices.j2'),
  },
  {
    category: 'Campers',
    title: 'Name Badges',
    output: 'csv',
    template: readFile('Campers--Name-Badges.j2'),
  },
  {
    category: 'Campers',
    title: 'Registration Volunteers',
    output: 'csv',
    template: readFile('Campers--Registration-Volunteers.j2'),
  },
  {
    category: 'Campers',
    title: 'Half Campers',
    output: 'csv',
    template: readFile('Campers--Half-Campers.j2'),
  },
  {
    category: 'Registration',
    title: 'Early Arrivals Check-in',
    output: 'csv',
    template: readFile('Registration--Early-Arrivals.j2'),
  },
  {
    category: 'Community Care',
    title: 'Campers',
    output: 'csv',
    template: readFile('Community-Care--Campers.j2'),
  },
  {
    category: 'Crew',
    title: 'Setup and Teardown',
    output: 'csv',
    template: readFile('Crew--Setup-and-Teardown.j2'),
  },
  {
    category: 'Campers',
    title: 'All Camp 3',
    output: 'csv',
    template: readFile('Campers--All-Camp-3.j2'),
  },
  {
    category: 'Registration',
    title: 'First Half Arrivals',
    output: 'csv',
    template: readFile('Registration--First-Half-Arrivals.j2'),
  },
  {
    category: 'Crew',
    title: 'Office, Camp 1',
    output: 'csv',
    template: readFile('Crew--Office--Camp-1.j2'),
  },
  {
    category: 'Registration',
    title: 'Second Half Arrivals',
    output: 'csv',
    template: readFile('Registration--Second-Half-Arrivals.j2'),
  },
  {
    category: 'Campers',
    title: 'Minors',
    output: 'csv',
    template: readFile('Campers--Minors.j2'),
  },
  {
    category: 'Crew',
    title: 'Office, Camp 3',
    output: 'csv',
    template: readFile('Crew--Office--Camp-3.j2'),
  },
  {
    category: 'Campers',
    title: 'Tent Tags',
    output: 'csv',
    template: readFile('Campers--Tent-Tags.j2'),
  },
  {
    category: 'Admin',
    title: 'MWCA Final Report',
    output: 'md',
    template: readFile('MWCA-Final-Report.j2'),
  },
  {
    category: 'Kitchen',
    title: 'No Meal Ticket',
    output: 'csv',
    template: readFile('Kitchen--No-Meal-Ticket.j2'),
  },
  {
    category: 'Crew',
    title: 'Office, Camp 2',
    output: 'csv',
    template: readFile('Crew--Office--Camp-2.j2'),
  },
  {
    category: 'Campers',
    title: 'All Campers',
    output: 'csv',
    template: readFile('All-Campers.j2'),
  },
];

export default reports.map((report): Report => ({ ...report, variables_source: 'server' }));
