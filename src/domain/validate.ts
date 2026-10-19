import { emptyState } from './engine';
import { CIRCUMSTANCES, FEATURES, HOW, NEXT, PARTS, SCHEMA, SHAPES, UNSURE, type Archived, type TellState } from './types';

// The one door every inbound document passes: what is stored on load and any
// backup offered to Restore. A refusal names the problem and the caller
// changes nothing. A wrong type is refused, never coerced. Documents from
// earlier versions of Tell are migrated: the original is kept whole in the
// archive, and only the player's own written principles become takeaways.

export type Validation = { ok: true; state: TellState; migrated?: number } | { ok: false; error: string; newer?: boolean };

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isStr = (x: unknown): x is string => typeof x === 'string';
const isInt = (x: unknown): x is number => Number.isInteger(x);
const isBool = (x: unknown) => typeof x === 'boolean';
const isDay = (x: unknown) => isStr(x) && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x));
const isTime = (x: unknown) => isStr(x) && !Number.isNaN(Date.parse(x));
const oneOf = (x: unknown, values: readonly unknown[]) => values.includes(x);
const listOf = (x: unknown, check: (v: unknown) => boolean) => Array.isArray(x) && x.every(check);
const keys = (r: object) => Object.keys(r);
const isOption = (x: unknown) => isObj(x) && isStr(x.id) && !!x.id && isStr(x.text);
const ids = (xs: unknown) => (xs as Obj[]).map((x) => x.id as string);
const unique = (xs: string[]) => new Set(xs).size === xs.length;

/** An episode's shape, as written in content or as snapshotted in a play. Null when it's sound. */
export function episodeProblem(e: unknown): string | null {
  if (!isObj(e)) return 'is not an episode';
  for (const k of ['id', 'title', 'project', 'setup', 'ask', 'reask']) if (!isStr(e[k]) || !(e[k] as string).trim()) return `has no ${k}`;
  if (!isInt(e.v) || !oneOf(e.part, keys(PARTS))) return 'has no version or part';
  if (!listOf(e.options, isOption) || (e.options as unknown[]).length < 2 || (e.options as unknown[]).length > 3) return 'needs two or three options';
  const b = e.beat;
  if (!isObj(b)) return 'has no move';
  const extra: unknown[] = [];
  if (b.kind === 'twist') {
    if (!isStr(b.text) || (b.adds !== undefined && !isOption(b.adds))) return 'has a malformed twist';
    if (b.adds) extra.push(b.adds);
  } else if (b.kind === 'widen' || b.kind === 'cut') {
    if (!isStr(b.prompt) || !listOf(b.items, isOption) || (b.items as unknown[]).length < 3 || (b.items as unknown[]).length > 5) return `has a malformed ${b.kind}`;
    if (b.kind === 'widen') extra.push(...(b.items as unknown[]));
    else if (!unique(ids(b.items))) return 'repeats an item';
  } else if (b.kind === 'peek') {
    const fact = (f: unknown) => isObj(f) && isStr(f.id) && isStr(f.label) && isStr(f.text);
    if (!isStr(b.prompt) || !listOf(b.facts, fact) || (b.facts as unknown[]).length < 3 || !isInt(b.opens) || b.opens < 1 || b.opens >= (b.facts as unknown[]).length) {
      return 'has a malformed Peek';
    }
    if (!unique(ids(b.facts))) return 'repeats a fact';
  } else if (b.kind === 'slide') {
    const steps = b.steps as number[];
    if (!isStr(b.text) || !isStr(b.measure) || !oneOf(b.unit, ['number', 'percent', 'hours', 'days', 'weeks']) || !oneOf(b.rises, ['a', 'b'])) return 'has a malformed Slide';
    if (!listOf(steps, isInt) || steps.length !== 7 || steps.some((n, i) => i > 0 && n <= steps[i - 1])) return 'needs seven rising Slide values';
    if ((e.options as unknown[]).length !== 2) return 'needs two options for a Slide';
    if (b.actual !== undefined && !(isObj(b.actual) && isInt(b.actual.value) && isStr(b.actual.text))) return 'has a malformed Slide reveal';
  } else return 'has an unknown move';
  const all = [...ids(e.options), ...ids(extra)];
  if (!unique(all) || all.includes(UNSURE)) return 'repeats an option id';
  const end = e.ending;
  if (!isObj(end) || !isStr(end.point) || !isStr(end.unknown) || !isStr(end.apply)) return 'has a malformed ending';
  if (!listOf(end.changed, isStr) || !listOf(end.stayed, isStr) || (end.changed as unknown[]).length < 2 || (end.stayed as unknown[]).length < 2) return 'needs at least two readings each way';
  if (!listOf(e.features, (f) => oneOf(f, keys(FEATURES)))) return 'has an unknown feature';
  return null;
}

function playProblem(p: unknown): string | null {
  if (!isObj(p) || !isStr(p.id) || !isStr(p.episode) || !isInt(p.v) || !isTime(p.at) || !isDay(p.day) || !isInt(p.replay) || p.replay < 0) return 'is not a play';
  const shown = episodeProblem(p.shown);
  if (shown) return `shows an episode that ${shown}`;
  const b = (p.shown as Obj).beat as Obj;
  const x = p.beat;
  if (!isObj(x) || x.kind !== b.kind) return 'has an answer that doesn’t fit its episode';
  if (x.kind === 'widen' && !listOf(x.picked, isStr)) return 'has malformed answers';
  if (x.kind === 'cut' && !listOf(x.order, isStr)) return 'has malformed answers';
  if (x.kind === 'peek' && !(listOf(x.opened, (o) => isObj(o) && isInt(o.fact) && isStr(o.lean)) && listOf(x.wouldHave, isInt))) return 'has malformed answers';
  if (x.kind === 'slide') {
    const o = x.outcome;
    if (!listOf(x.asked, (a) => isObj(a) && isInt(a.step) && oneOf(a.pick, ['a', 'b'])) || !isObj(o) || !oneOf(o.kind, ['switch', 'close']) || !isInt(o.at)) return 'has malformed answers';
  }
  if (!isStr(p.first) || !isStr(p.final)) return 'has malformed answers';
  return null;
}

const isRef = (r: unknown) => isObj(r) && oneOf(r.kind, ['takeaway', 'choice']) && isStr(r.id);

function contentProblem(c: Obj): string | null {
  for (const k of ['title', 'situation', 'prompt', 'worth', 'notWorth', 'lean', 'top', 'clearer', 'unresolved']) if (!isStr(c[k])) return `has no ${k}`;
  if (!listOf(c.circumstances, (k) => oneOf(k, keys(CIRCUMSTANCES))) || !listOf(c.parts, (k) => oneOf(k, keys(PARTS))) || !isBool(c.unsure)) return 'has a malformed start';
  if (!listOf(c.options, (o) => isOption(o) && ((o as Obj).shape === undefined || oneOf((o as Obj).shape, keys(SHAPES))))) return 'has malformed options';
  if (!listOf(c.criteria, (x) => isObj(x) && isStr(x.id) && isStr(x.text) && isBool(x.must)) || !listOf(c.ruledOut, isStr)) return 'has malformed priorities';
  const unknown = (u: unknown) =>
    isObj(u) && isStr(u.id) && isStr(u.text) && oneOf(u.kind, ['fact', 'assumption']) && (u.changes === undefined || oneOf(u.changes, ['yes', 'no', 'unsure'])) && (u.how === undefined || oneOf(u.how, keys(HOW)));
  if (!listOf(c.unknowns, unknown)) return 'has malformed unknowns';
  const match = (m: unknown) => isObj(m) && isRef(m.ref) && oneOf(m.answer, ['applies', 'not', 'unsure']) && isStr(m.shown) && isStr(m.why) && isBool(m.manual) && isTime(m.at);
  if (!listOf(c.matches, match)) return 'has malformed examples';
  if (c.next !== null && !(isObj(c.next) && oneOf(c.next.kind, keys(NEXT)) && isStr(c.next.text))) return 'has a malformed next move';
  if (c.expectation !== null && !(isObj(c.expectation) && isStr(c.expectation.text) && (c.expectation.by === '' || isDay(c.expectation.by)))) return 'has a malformed expectation';
  return null;
}

function choiceProblem(c: unknown): string | null {
  if (!isObj(c) || !isStr(c.id) || !isTime(c.created) || !isTime(c.updated) || !isBool(c.draft) || !isStr(c.step)) return 'is not a choice';
  const content = contentProblem(c);
  if (content) return content;
  if (!listOf(c.saves, (s) => isObj(s) && isTime(s.at) && isObj(s.content) && contentProblem(s.content as Obj) === null)) return 'has a malformed save';
  const outcome = (o: unknown) =>
    isObj(o) &&
    isStr(o.id) &&
    isTime(o.at) &&
    oneOf(o.state, ['happened', 'too-early', 'plans-changed']) &&
    isStr(o.expected) &&
    oneOf(o.compared, ['', 'as-expected', 'different', 'partly']) &&
    isStr(o.what) &&
    isStr(o.surprise) &&
    isBool(o.settled) &&
    oneOf(o.lesson, ['none', 'kept', 'revised']) &&
    isStr(o.takeaway);
  if (!listOf(c.outcomes, outcome)) return 'has a malformed outcome';
  return null;
}

function takeawayProblem(t: unknown): string | null {
  if (!isObj(t) || !isStr(t.id) || !isTime(t.at) || !isStr(t.retired)) return 'is not a takeaway';
  const s = t.source;
  const source =
    isObj(s) &&
    ((s.kind === 'play' && isStr(s.play)) ||
      (s.kind === 'choice' && isStr(s.choice) && isInt(s.save)) ||
      (s.kind === 'outcome' && isStr(s.choice) && isStr(s.outcome)) ||
      s.kind === 'own' ||
      (s.kind === 'earlier' && isInt(s.schema)));
  if (!source) return 'has no source';
  if (!listOf(t.versions, (v) => isObj(v) && isTime(v.at) && isStr(v.text)) || (t.versions as unknown[]).length === 0) return 'has no wording';
  if (!listOf(t.features, (f) => oneOf(f, keys(FEATURES)))) return 'has an unknown feature';
  return null;
}

/**
 * A document from Tell 1 or 2, carried into this version. Nothing is dropped:
 * the whole original goes into the archive. Principles from version 2 were
 * the player's own words, so they become takeaways; nothing else is reread.
 */
export function migrate(x: Obj, now: Date): TellState {
  const at = now.toISOString();
  const state = emptyState();
  const doc = JSON.parse(JSON.stringify(x)) as Archived['doc'];
  state.archive = [{ schema: x.schema as number, at, doc }];
  if (x.schema === 2 && Array.isArray(x.principles)) {
    state.takeaways = x.principles.flatMap((p, i) =>
      isObj(p) && isStr(p.text) && p.text.trim()
        ? [{ id: `earlier-${i + 1}`, at: isTime(p.at) ? (p.at as string) : at, source: { kind: 'earlier', schema: 2 }, versions: [{ at: isTime(p.at) ? (p.at as string) : at, text: p.text.trim() }], features: [], retired: '' }]
        : [],
    ) as TellState['takeaways'];
  }
  return state;
}

export function validateState(x: unknown, now: Date): Validation {
  const fail = (error: string): Validation => ({ ok: false, error });
  if (!isObj(x)) return fail('it is not a Tell document');
  if (typeof x.schema !== 'number') return fail('it has no schema version');
  if (x.schema > SCHEMA) return { ok: false, error: `it was saved by a newer version of Tell (schema ${x.schema})`, newer: true };
  if (x.schema === 1 || x.schema === 2) {
    const migrated = validateState(migrate(x, now), now);
    return migrated.ok ? { ...migrated, migrated: x.schema } : migrated;
  }
  if (x.schema !== SCHEMA) return fail(`schema ${String(x.schema)} is unknown`);

  const each = (name: string, list: unknown, problem: (v: unknown) => string | null): string | null => {
    if (!Array.isArray(list)) return `${name}s is not a list`;
    const seen = new Set<string>();
    for (const [i, v] of list.entries()) {
      const p = problem(v);
      if (p) return `${name} ${i + 1} ${p}`;
      const id = (v as Obj).id as string;
      if (seen.has(id)) return `${name} ${i + 1} repeats “${id}”`;
      seen.add(id);
    }
    return null;
  };
  const problem =
    each('play', x.plays, playProblem) ??
    each('choice', x.choices, choiceProblem) ??
    each('takeaway', x.takeaways, takeawayProblem) ??
    (listOf(x.archive, (a) => isObj(a) && isInt(a.schema) && isTime(a.at) && isObj(a.doc)) ? null : 'the archive is malformed');
  if (problem) return fail(problem);
  return { ok: true, state: x as unknown as TellState };
}
