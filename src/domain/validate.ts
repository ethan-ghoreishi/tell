import type { Lesson, TellState } from './types';
import { FACTORS, SCHEMA, TAGS } from './types';

// The one door every inbound document passes: what is stored on load, any
// backup offered to Restore, and any lessons file someone shares. A refusal
// names the problem and the caller changes nothing. Absent optional fields
// are fine; a wrong type is refused, never coerced.

export type Validation = { ok: true; state: TellState } | { ok: false; error: string; newer?: boolean };

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isStr = (x: unknown): x is string => typeof x === 'string';
const isInt = (x: unknown): x is number => Number.isInteger(x);
const isDay = (x: unknown) => isStr(x) && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x));
const isTime = (x: unknown) => isStr(x) && !Number.isNaN(Date.parse(x));
const oneOf = (x: unknown, values: readonly unknown[]) => values.includes(x);
const optional = (x: unknown, check: (v: unknown) => boolean) => x === undefined || check(x);
const listOf = (x: unknown, check: (v: unknown) => boolean) => Array.isArray(x) && x.every(check);

const FACTOR_IDS = FACTORS.map((f) => f.id);
const TAG_IDS = Object.keys(TAGS);
const SIDES = ['a', 'b'];
const LEANS = ['a', 'b', 'none'];
const isFactor = (x: unknown) => oneOf(x, FACTOR_IDS);
const isAsked = (x: unknown) => isObj(x) && isInt(x.step) && oneOf(x.pick, SIDES);

function outcomeProblem(o: unknown): string | null {
  if (!isObj(o) || !isInt(o.at)) return 'has no outcome';
  if (o.kind === 'switch' || o.kind === 'close') return null;
  if (o.kind !== 'depends' || !oneOf(o.on, ['alt', 'condition', 'else'])) return 'has an unknown outcome';
  if (!optional(o.factor, isFactor) || !optional(o.tag, (t) => oneOf(t, TAG_IDS)) || !optional(o.label, isStr)) return 'has a malformed “it depends”';
  return null;
}

function runProblem(r: unknown): string | null {
  if (!isObj(r)) return 'is not a record';
  for (const k of ['id', 'session', 'card', 'title']) if (!isStr(r[k]) || !r[k]) return `has no ${k}`;
  if (!isInt(r.v)) return 'has no version';
  if (!oneOf(r.role, ['probe', 'stress', 'connect', 'depends'])) return 'has an unknown role';
  if (!isStr(r.context)) return 'has no context';
  if (!isTime(r.at) || !isDay(r.day)) return 'has no valid time';
  if (r.mechanic === 'slide') {
    if (!Array.isArray(r.tradeoff) || r.tradeoff.length !== 2 || !r.tradeoff.every(isFactor)) return 'has a malformed trade-off';
    if (!oneOf(r.dial, ['main', 'alt']) || !isStr(r.measure) || !isStr(r.unit) || !listOf(r.steps, isInt) || !oneOf(r.rises, SIDES)) return 'has a malformed dial';
    if (!optional(r.condition, (c) => isObj(c) && oneOf(c.tag, TAG_IDS) && isStr(c.label))) return 'has a malformed condition';
    if (!optional(r.guess, isInt) || !listOf(r.asked, isAsked)) return 'has malformed answers';
    return outcomeProblem(r.outcome);
  }
  const item = (x: unknown) => isObj(x) && isStr(x.id) && isFactor(x.factor) && (isStr(x.text) || isStr(x.label));
  if (r.mechanic === 'cut') {
    if (!listOf(r.items, item) || !listOf(r.order, isStr) || !isStr(r.winner)) return 'has a malformed Cut';
    return null;
  }
  if (r.mechanic === 'spend') {
    const clash = (c: unknown) => isObj(c) && isInt(c.a) && isInt(c.b) && isInt(c.pick);
    if (!listOf(r.features, item) || !listOf(r.coins, isInt) || !listOf(r.clashes, clash)) return 'has a malformed Spend';
    return null;
  }
  if (r.mechanic === 'peek') {
    const opened = (o: unknown) => isObj(o) && isInt(o.fact) && oneOf(o.lean, LEANS);
    if (!isStr(r.a) || !isStr(r.b) || !listOf(r.facts, item) || !oneOf(r.before, LEANS) || !listOf(r.opened, opened) || !oneOf(r.pick, SIDES) || !listOf(r.wouldHave, isInt)) {
      return 'has a malformed Peek';
    }
    return null;
  }
  return 'has an unknown mechanic';
}

function callProblem(c: unknown): string | null {
  if (!isObj(c)) return 'is not a record';
  for (const k of ['id', 'kind', 'title', 'winner']) if (!isStr(c[k])) return `has no ${k}`;
  if (!isTime(c.at) || !isDay(c.day) || !isDay(c.due)) return 'has no valid dates';
  if (!listOf(c.options, isStr) || (c.options as unknown[]).length !== 2) return 'needs two options';
  if (!listOf(c.items, (i) => isObj(i) && isStr(i.id) && isFactor(i.factor) && isStr(i.text) && optional(i.own, (o) => o === true))) return 'has malformed items';
  if (!listOf(c.order, isStr) || !oneOf(c.lean, LEANS)) return 'has a malformed Cut or lean';
  if (!optional(c.slide, (s) => isObj(s) && isStr(s.unit) && listOf(s.steps, isInt) && isStr(s.phrase) && listOf(s.asked, isAsked) && outcomeProblem(s.outcome) === null)) {
    return 'has a malformed Slide';
  }
  if (!listOf(c.unknowns, (u) => isObj(u) && isStr(u.id) && isStr(u.text) && optional(u.check, isStr) && oneOf(u.answer, ['yes', 'no', 'unsure']))) return 'has malformed unknowns';
  const f = c.follow;
  if (f !== undefined) {
    if (!isObj(f) || !isTime(f.at) || !isStr(f.lesson) || !oneOf(f.chose, ['a', 'b', 'neither']) || !oneOf(f.went, ['better', 'expected', 'worse'])) return 'has a malformed follow-up';
    if (!listOf(f.mattered, (m) => isObj(m) && isStr(m.item) && oneOf(m.how, ['more', 'expected', 'less']))) return 'has a malformed follow-up';
    if (!listOf(f.missed, (m) => isObj(m) && optional(m.check, isStr) && optional(m.text, isStr))) return 'has a malformed follow-up';
  }
  return null;
}

function lessonProblem(l: unknown): string | null {
  if (!isObj(l) || !isStr(l.id) || !isStr(l.kind) || !oneOf(l.went, ['better', 'expected', 'worse'])) return 'is not a lesson';
  if (!listOf(l.mattered, (m) => isObj(m) && isStr(m.feature) && oneOf(m.how, ['more', 'expected', 'less']))) return 'has malformed factors';
  if (!listOf(l.missed, isStr) || !isInt(l.other) || (l.other as number) < 0) return 'has malformed checks';
  // Lessons carry only fixed vocabulary: anything longer than an id is someone's words.
  const ids = [l.id, l.kind, ...(l.mattered as Obj[]).map((m) => m.feature), ...(l.missed as string[])] as string[];
  if (ids.some((id) => !/^[a-z0-9-]{1,40}$/.test(id))) return 'holds text that isn’t one of Tell’s ids';
  return null;
}

export function validateState(x: unknown): Validation {
  const fail = (error: string): Validation => ({ ok: false, error });
  if (!isObj(x)) return fail('it is not a Tell document');
  if (typeof x.schema !== 'number') return fail('it has no schema version');
  if (x.schema > SCHEMA) return { ok: false, error: `it was saved by a newer version of Tell (schema ${x.schema})`, newer: true };
  if (x.schema === 1) return fail('it was saved by the first version of Tell, whose rounds were retired in version 2. Download it to keep it');
  if (x.schema !== SCHEMA) return fail(`schema ${String(x.schema)} is unknown`);
  if (!oneOf(x.currency, ['GBP', 'EUR', 'USD'])) return fail('the currency is unknown');

  if (!Array.isArray(x.runs)) return fail('runs is not a list');
  const ids = new Set<string>();
  for (const [i, r] of x.runs.entries()) {
    const problem = runProblem(r);
    if (problem) return fail(`experiment ${i + 1} ${problem}`);
    const id = (r as Obj).id as string;
    if (ids.has(id)) return fail(`experiment ${i + 1} repeats “${id}”`);
    ids.add(id);
  }
  const s = x.session;
  if (s !== null) {
    const step = (p: unknown) =>
      isObj(p) && isStr(p.card) && oneOf(p.role, ['probe', 'stress', 'connect', 'depends']) && typeof p.condition === 'boolean' && oneOf(p.dial, ['main', 'alt']) && optional(p.hold, isInt) && isStr(p.reason);
    if (!isObj(s) || !isStr(s.id) || !isDay(s.day) || !listOf(s.steps, step) || typeof s.done !== 'boolean') return fail('today’s set is malformed');
  }
  if (!Array.isArray(x.calls)) return fail('calls is not a list');
  for (const [i, c] of x.calls.entries()) {
    const problem = callProblem(c);
    if (problem) return fail(`call ${i + 1} ${problem}`);
  }
  if (!listOf(x.notes, (n) => isObj(n) && isStr(n.pattern) && oneOf(n.verdict, ['right', 'coincidence', 'unsure']) && isStr(n.counts) && isTime(n.at))) return fail('a note is malformed');
  if (!listOf(x.principles, (p) => isObj(p) && isStr(p.id) && isStr(p.text) && isTime(p.at) && optional(p.call, isStr))) return fail('a principle is malformed');
  if (!listOf(x.ratings, (r) => isObj(r) && isStr(r.session) && oneOf(r.rating, ['useful', 'interesting', 'meh']) && isTime(r.at))) return fail('a rating is malformed');
  if (!Array.isArray(x.pool)) return fail('shared lessons is not a list');
  for (const p of x.pool) {
    if (!isObj(p) || !isStr(p.id) || !isDay(p.added) || !Array.isArray(p.lessons) || p.lessons.some((l) => lessonProblem(l))) return fail('a shared lessons file is malformed');
  }
  return { ok: true, state: x as unknown as TellState };
}

/** A lessons file someone shared: the same strictness as everything else that comes in. */
export function readLessons(text: string): { ok: true; lessons: Lesson[] } | { ok: false; error: string } {
  let x: unknown;
  try {
    x = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not readable JSON.' };
  }
  if (!isObj(x) || x.tell !== 'lessons') return { ok: false, error: 'That isn’t a Tell lessons file.' };
  if (x.v !== 1) return { ok: false, error: 'That lessons file was made by a newer version of Tell.' };
  if (!Array.isArray(x.lessons)) return { ok: false, error: 'That lessons file has no lessons.' };
  for (const [i, l] of x.lessons.entries()) {
    const problem = lessonProblem(l);
    if (problem) return { ok: false, error: `Lesson ${i + 1} ${problem}.` };
  }
  return { ok: true, lessons: x.lessons as Lesson[] };
}
