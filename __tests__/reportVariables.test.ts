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
// - `x.pricing.name`, `x.pricing['name']`, `(x.pricing or {}).name`,
//   `x.pricing.get('name')`, `'name' in x.pricing`, and the same for
//   `attributes` and `admin_attributes` (the first name only)
// - a variable set to one of these (`{% set p = camper.pricing %}`, then
//   `p.name`), anywhere in that template
// - dotted names in filter arguments (`sort(attribute='attributes.last_name')`)
// Comments are skipped.
// `x` says whose names they must be: a camper's (`camper`, `c`, …) or a
// registration's (`registration`, `reg`, `camper.registration`;
// `registration.campers[0]` is a camper); when it's
// something else (a filter argument, `row.data`), either's will do. A name
// built at render time (`pricing[key]`), or reached another way
// (`namespace(p=camper.pricing)`, `camper['pricing']`), isn't checked.

const settings = event.data.event;

type Owner = 'camper' | 'registration' | 'either';
type Kind = 'pricing' | 'event pricing' | 'event pricing prefix' | 'attributes' | 'admin_attributes';
type Use = { kind: Kind, owner: Owner, name: string };

const CAMPERS = new Set(['camper', 'c', 'tent_tag_holder', 'pass_holder']);
const REGISTRATIONS = new Set(['registration', 'reg']);

// Whose fields `x.pricing` / `x.attributes` are, from the last name in `x`
function ownerOf(path: string): Owner | 'event' {
  const segment = path.split('.').filter(Boolean).pop() ?? '';
  const last = segment.replace(/\[-?\d+\]$/, '');
  if (last === 'campers' && segment !== last) return 'camper';
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
// Lines Camphoric adds to pricing results itself (it hides `overridden` and
// `campers` from templates)
const SERVER_LINES = ['promo', 'total'];
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
// A path, which may index a list (registration.campers[0], [-1])
const PATH = String.raw`([A-Za-z_](?:[\w.]|\[-?\d+\])*)`;
const KIND = '(pricing|admin_attributes|attributes)';
// `x.pricing`, `(x.pricing or {})`
const DICT = String.raw`${PATH}\.${KIND}(?:\s+or\s+\{\}\s*\))?`;

// Whose names `x.<kind>` holds
function kindOf(kind: OwnedKind, path: string): [Kind, Owner] {
  const owner = ownerOf(path);
  if (owner !== 'event') return [kind, owner];
  return kind === 'pricing' ? ['event pricing', 'either'] : [kind, 'either'];
}

function uses(raw: string): Use[] {
  // Comments can name a field that's gone ({# was camper.pricing.old #})
  const template = raw.replace(/\{#[\s\S]*?#\}/g, '');
  const found: Use[] = [];
  const push = ([kind, owner]: [Kind, Owner], name: string | undefined) => {
    if (name) found.push({ kind, owner, name });
  };
  // Where `dict` (a path, or an alias) is a dict of `kind`: `.name`,
  // `['name']`, `.get('name')` and `'name' in …`
  const readsOf = (dict: string, kindOwner: [Kind, Owner]) => {
    for (const match of template.matchAll(new RegExp(`${dict}${NAME}`, 'g'))) {
      push(kindOwner, match[match.length - 2] ?? match[match.length - 1]);
    }
    for (const match of template.matchAll(new RegExp(String.raw`${dict}\.get\(\s*['"]([^'"]+)['"]`, 'g'))) {
      push(kindOwner, match[match.length - 1]);
    }
  };

  for (const match of template.matchAll(new RegExp(String.raw`${DICT}${NAME}`, 'g'))) {
    push(kindOf(match[2] as OwnedKind, match[1]), match[3] ?? match[4]);
  }
  for (const match of template.matchAll(new RegExp(String.raw`${DICT}\.get\(\s*['"]([^'"]+)['"]`, 'g'))) {
    push(kindOf(match[2] as OwnedKind, match[1]), match[3]);
  }
  for (const match of template.matchAll(new RegExp(String.raw`['"](\w+)['"]\s+(?:not\s+)?in\s+\(?\s*${PATH}\.${KIND}\b(?!\s*(?:or\s+\{\}\s*\)\s*)?[.\[])`, 'g'))) {
    push(kindOf(match[3] as OwnedKind, match[2]), match[1]);
  }
  // event.pricing['meals_adult_' ~ size]: some event pricing name starts so
  for (const match of template.matchAll(/\bevent\.pricing\[\s*['"](\w+)['"]\s*~/g)) {
    push(['event pricing prefix', 'either'], match[1]);
  }
  // {% set p = camper.pricing %}, `… or {}`, `… | default({})`: p's names,
  // anywhere in the template (so don't reuse the name for something else)
  const aliases = template.matchAll(new RegExp(
    String.raw`\bset\s+(\w+)\s*=\s*\(?\s*${PATH}\.${KIND}\s*(?:or\s*\{\}\s*\)?|\|\s*default\(\s*\{\}\s*\))?\s*-?%`, 'g'));
  for (const [, alias, path, kind] of aliases) {
    const kindOwner = kindOf(kind as OwnedKind, path);
    readsOf(String.raw`(?<![\w.])${alias}`, kindOwner);
    for (const match of template.matchAll(new RegExp(String.raw`['"](\w+)['"]\s+(?:not\s+)?in\s+${alias}\b(?!\s*[.\[])`, 'g'))) {
      push(kindOwner, match[1]);
    }
  }
  // Filter arguments: sort(attribute='attributes.last_name,…'), sum(attribute='pricing.meals')
  for (const [, argument] of template.matchAll(/['"]([\w.,\s]+)['"]/g)) {
    for (const path of argument.split(',').map(part => part.trim())) {
      const match = /^(?:([\w.]*)\.)?(pricing|attributes|admin_attributes)\.(\w+)/.exec(path);
      if (match) push(kindOf(match[2] as OwnedKind, match[1] ?? ''), match[3]);
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
  'By Zip Code (For Carpool)': ['camper attributes: phone'], // #22
  'Confirmation Email Info': ['camper admin_attributes: meal_assignment'], // #23
  'Parking Exceptions': ['registration admin_attributes: parking_exception'], // #21
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
    const nonMeal = reports.find(report => report.title === 'Non-meal income');
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
    expect(unknownIn('{{ campers | sum(attribute="event.pricing.full_adult") }}')).toHaveLength(0);
  });

  it('check `in`, `.get()`, `or {}`, list indexes, and aliases of any kind', () => {
    expect(unknownIn('{% if \'promos\' in camper.pricing %}{% endif %}')).toHaveLength(1);
    expect(unknownIn('{% if \'promo\' in camper.pricing %}{% endif %}')).toHaveLength(0);
    expect(unknownIn('{% if \'guardian_nam\' in camper.admin_attributes %}{% endif %}')).toHaveLength(1);
    expect(unknownIn('{{ camper.attributes.get(\'phon\') }}')).toHaveLength(1);
    expect(unknownIn('{{ (camper.attributes or {}).phon }}')).toHaveLength(1);
    expect(unknownIn('{{ registration.campers[0].pricing.mealz }}')).toHaveLength(1);
    expect(unknownIn('{% set a = camper.attributes %}{{ a.phon }}')).toHaveLength(1);
    expect(unknownIn('{{ registration.campers[-1].pricing.mealz }}')).toHaveLength(1);
    // `in` a value inside a field isn't a field name
    expect(uses('{% if \'Medical\' in camper.attributes.good_samaritan.skills %}{% endif %}')
      .filter(use => use.name === 'Medical')).toEqual([]);
    expect(uses('{% if \'Medical\' in (camper.attributes or {}).good_samaritan %}{% endif %}')
      .filter(use => use.name === 'Medical')).toEqual([]);
    expect(uses('{% set a = camper.attributes %}{% if \'Medical\' in a.good_samaritan.skills %}{% endif %}')
      .filter(use => use.name === 'Medical')).toEqual([]);
  });

  it('skip comments and hidden pricing lines', () => {
    expect(uses('{# was camper.pricing.oldname #}')).toEqual([]);
    // Camphoric hides `overridden` from templates
    expect(unknownIn('{{ camper.pricing.overridden }}')).toHaveLength(1);
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
