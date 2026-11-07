import { describe, expect, it } from '@jest/globals';

import event from '../index.ts';

// The names every report template reads from pricing results, form answers and
// admin attributes exist in this event. Camphoric warns about a field its own
// objects don't have (e2e/reports.spec.ts fails on those warnings), but these
// are plain dicts: a missing key renders blank with no warning, so a renamed
// pricing variable or form question would quietly empty a report's column
// (camphoric/camphoric#994 asks the server to warn on these too).
//
// The templates are read as text, not parsed. What's checked:
// - `x.pricing.name`, `x.pricing['name']`, `(x.pricing or {}).name`
// - a variable set to a pricing result (`{% set p = camper.pricing %}`, then
//   `p.name`), anywhere in that template
// - `x.attributes.name`, `x.admin_attributes.name` (the first name only)
// - dotted names in filter arguments (`sort(attribute='attributes.last_name')`)
// `x` says whose names they must be: a camper's (`camper`, `c`, …) or a
// registration's (`registration`, `reg`, `camper.registration`); when it's
// something else (a filter argument, `row.data`), either's will do. A name
// built at render time (`pricing[key]`) isn't checked.

const settings = event.data.event;

type Owner = 'camper' | 'registration' | 'either';
type Kind = 'pricing' | 'event pricing' | 'event pricing prefix' | 'attributes' | 'admin_attributes';
type Use = { kind: Kind, owner: Owner, name: string };

const CAMPERS = new Set(['camper', 'c', 'tent_tag_holder', 'pass_holder']);
const REGISTRATIONS = new Set(['registration', 'reg']);

// Whose fields `x.pricing` / `x.attributes` are, from the last name in `x`
function ownerOf(path: string): Owner | 'event' {
  const last = path.split('.').filter(Boolean).pop() ?? '';
  if (last === 'event') return 'event';
  if (CAMPERS.has(last)) return 'camper';
  if (REGISTRATIONS.has(last)) return 'registration';
  return 'either';
}

// A form's top-level questions: its properties, and those its dependencies,
// allOf/oneOf/anyOf and if/then/else add. Not the fields inside a question's
// own object (an address's zip_code).
function questionNames(schema: unknown, names = new Set<string>()): Set<string> {
  if (Array.isArray(schema)) {
    schema.forEach(item => questionNames(item, names));
    return names;
  }
  if (!schema || typeof schema !== 'object') return names;
  const node = schema as Record<string, unknown>;
  Object.keys((node.properties as object | undefined) ?? {}).forEach(name => names.add(name));
  for (const key of ['allOf', 'oneOf', 'anyOf', 'if', 'then', 'else']) questionNames(node[key], names);
  Object.values((node.dependencies as object | undefined) ?? {}).forEach(value => questionNames(value, names));
  return names;
}

const varsOf = (logic: { var: string }[] | undefined) => (logic ?? []).map(item => item.var);
// Lines Camphoric adds to pricing results itself
const SERVER_LINES = ['promo', 'total', 'overridden'];
const camperPricing = new Set([...varsOf(settings.camper_pricing_logic), ...SERVER_LINES]);
// A registration's results also sum its campers'
const registrationPricing = new Set([
  ...varsOf(settings.registration_pricing_logic), ...camperPricing,
]);
const camperAnswers = questionNames(settings.camper_schema);
const registrationAnswers = questionNames(settings.registration_schema);
const camperAdmin = new Set(Object.keys(settings.camper_admin_schema ?? {}));
const registrationAdmin = new Set(Object.keys(settings.registration_admin_schema ?? {}));
const eventPricing = new Set(Object.keys(settings.pricing ?? {}));

type OwnedKind = 'pricing' | 'attributes' | 'admin_attributes';
const NAMES: Record<OwnedKind, Record<'camper' | 'registration', Set<string>>> = {
  pricing: { camper: camperPricing, registration: registrationPricing },
  attributes: { camper: camperAnswers, registration: registrationAnswers },
  admin_attributes: { camper: camperAdmin, registration: registrationAdmin },
};

// `.name` or `['name']`, but not a method call (`.items()`, `.get(…)`)
const NAME = String.raw`(?:\.([A-Za-z_]\w*)\b(?!\s*\()|\[\s*['"]([^'"]+)['"]\s*\])`;
const PATH = String.raw`([A-Za-z_][\w.]*)`;

function uses(template: string): Use[] {
  const found: Use[] = [];
  const add = (kind: Kind, owner: Owner, match: RegExpMatchArray, at: number) => {
    const name = match[at] ?? match[at + 1];
    if (name) found.push({ kind, owner, name });
  };
  const pricingKind = (owner: Owner | 'event'): [Kind, Owner] =>
    owner === 'event' ? ['event pricing', 'either'] : ['pricing', owner];

  for (const match of template.matchAll(new RegExp(String.raw`${PATH}\.pricing${NAME}`, 'g'))) {
    add(...pricingKind(ownerOf(match[1])), match, 2);
  }
  for (const match of template.matchAll(new RegExp(String.raw`${PATH}\.pricing\s+or\s+\{\}\s*\)${NAME}`, 'g'))) {
    add(...pricingKind(ownerOf(match[1])), match, 2);
  }
  // event.pricing['meals_adult_' ~ size]: some event pricing name starts so
  for (const match of template.matchAll(/\bevent\.pricing\[\s*['"](\w+)['"]\s*~/g)) {
    found.push({ kind: 'event pricing prefix', owner: 'either', name: match[1] });
  }
  // {% set p = camper.pricing %}, `… or {}`, `… | default({})`
  const aliases = template.matchAll(new RegExp(
    String.raw`\bset\s+(\w+)\s*=\s*\(?\s*${PATH}\.pricing\s*(?:or\s*\{\}\s*\)?|\|\s*default\(\s*\{\}\s*\))?\s*-?%`, 'g'));
  for (const [, alias, path] of aliases) {
    const [kind, owner] = pricingKind(ownerOf(path));
    for (const match of template.matchAll(new RegExp(String.raw`(?<![\w.])${alias}${NAME}`, 'g'))) {
      add(kind, owner, match, 1);
    }
  }
  for (const match of template.matchAll(new RegExp(String.raw`${PATH}\.(admin_attributes|attributes)${NAME}`, 'g'))) {
    const owner = ownerOf(match[1]);
    add(match[2] as Kind, owner === 'event' ? 'either' : owner, match, 3);
  }
  // Filter arguments: sort(attribute='attributes.last_name,…'), sum(attribute='pricing.meals')
  for (const [, argument] of template.matchAll(/['"]([\w.,\s]+)['"]/g)) {
    for (const path of argument.split(',').map(part => part.trim())) {
      const match = /^(?:[\w.]*\.)?(pricing|attributes|admin_attributes)\.(\w+)/.exec(path);
      if (match) found.push({ kind: match[1] as Kind, owner: 'either', name: match[2] });
    }
  }
  return found;
}

function known({ kind, owner, name }: Use): boolean {
  if (kind === 'event pricing') return eventPricing.has(name);
  if (kind === 'event pricing prefix') return [...eventPricing].some(known => known.startsWith(name));
  const names = NAMES[kind];
  return owner === 'either'
    ? names.camper.has(name) || names.registration.has(name)
    : names[owner].has(name);
}

const unknownIn = (template: string) => uses(template).filter(use => !known(use));

const reports = event.data.reports.map(report => ({ ...report, uses: uses(report.template) }));

// Names already known to be missing, each with a TODO in its template and an
// issue to fix it. Fixing one fails the test until it's taken off this list.
const knownMissing: Record<string, string[]> = {
  'Campers, By Zip Code (For Carpool)': ['camper attributes: phone'], // #22
  'Campers, Confirmation Email Info': ['camper admin_attributes: meal_assignment'], // #23
  'Campers, Parking Exceptions': ['registration admin_attributes: parking_exception'], // #21
};

const describeUse = ({ kind, owner, name }: Use) =>
  `${owner === 'either' ? '' : `${owner} `}${kind}: ${name}`;

describe('report templates', () => {
  it('are found by reading the templates', () => {
    // So a pattern that stops matching can't pass every report unnoticed
    const all = reports.flatMap(report => report.uses);
    for (const kind of ['pricing', 'event pricing prefix', 'attributes', 'admin_attributes'] as const) {
      expect(all.some(use => use.kind === kind)).toBe(true);
    }
    // A variable set to a pricing result ({% set p = camper.pricing %})
    const nonMeal = reports.find(report => report.title === 'Admin, non-meal income');
    expect(nonMeal?.uses).toContainEqual({ kind: 'pricing', owner: 'camper', name: 'tuition' });
  });

  it('check a camper\'s names and a registration\'s apart', () => {
    expect(unknownIn('{{ camper.pricing.donation }}')).toHaveLength(1);
    expect(unknownIn('{{ registration.pricing.donation }}')).toHaveLength(0);
    expect(unknownIn('{{ camper.attributes.lta_donation }}')).toHaveLength(1);
  });

  it('check only a form\'s top-level questions', () => {
    expect(unknownIn('{{ camper.attributes.zip_code }}')).toHaveLength(1);
    expect(unknownIn('{{ camper.attributes.camper_address.zip_code }}')).toHaveLength(0);
  });

  it('check filter arguments, aliases and method calls', () => {
    expect(unknownIn('{{ campers | sum(attribute=\'pricing.mealz\') }}')).toHaveLength(1);
    expect(unknownIn('{% set p = camper.pricing | default({}) %}{{ p.badge }}')).toHaveLength(1);
    expect(unknownIn('{% set ep = event.pricing %}{{ ep.full_adult }}')).toHaveLength(0);
    expect(uses('{% for k, v in camper.pricing.items() %}{% endfor %}')).toEqual([]);
  });

  it('list only reports this event has as known to be missing names', () => {
    const titles = reports.map(report => report.title);
    expect(Object.keys(knownMissing).filter(title => !titles.includes(title))).toEqual([]);
  });

  it.each(reports.map(report => [report.title, report] as const))(
    '"%s" reads only names this event has',
    (_title, report) => {
      const unknown = report.uses.filter(use => !known(use)).map(describeUse);
      expect([...new Set(unknown)]).toEqual(knownMissing[report.title] ?? []);
    },
  );
});
