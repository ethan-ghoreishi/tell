import type { TellState } from './types';
import { LENSES, SCHEMA } from './types';

// The one door every inbound document passes: what is stored on load, and any
// file offered to Import. A refusal names the problem and the caller changes
// nothing. Absent optional fields are fine; a wrong type is refused, never coerced.

export type Validation = { ok: true; state: TellState } | { ok: false; error: string; newer?: boolean };

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isStr = (x: unknown): x is string => typeof x === 'string';
const isDay = (x: unknown) => isStr(x) && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x));
const isTime = (x: unknown) => isStr(x) && !Number.isNaN(Date.parse(x));
const LENS_IDS = new Set<unknown>(LENSES.map((l) => l.id));
const oneOf = (x: unknown, values: unknown[]) => values.includes(x);
const optional = (x: unknown, check: (v: unknown) => boolean) => x === undefined || check(x);

function answerProblem(a: unknown): string | null {
  if (!isObj(a)) return 'is not a record';
  if (!isStr(a.card) || !a.card) return 'has no card id';
  if (typeof a.v !== 'number') return 'has no card version';
  if (!oneOf(a.kind, ['decode', 'mirror', 'switch'])) return 'has an unknown kind';
  if (!oneOf(a.area, ['world', 'work'])) return 'has an unknown area';
  if (!isStr(a.title)) return 'has no title';
  if (!isTime(a.at)) return 'has no valid time';
  if (!isDay(a.day)) return 'has no valid day';
  if (!Array.isArray(a.shown) || a.shown.length === 0) return 'has no record of what was shown';
  for (const s of a.shown) {
    if (!isObj(s) || !isStr(s.id) || !optional(s.lens, (l) => LENS_IDS.has(l))) return 'has a malformed shown option';
  }
  if (!isStr(a.pick) || !isStr(a.pickText)) return 'has no pick';
  if (!optional(a.twin, isStr) || !optional(a.pair, isStr) || !optional(a.variant, (v) => oneOf(v, ['a', 'b']))) {
    return 'has a malformed link';
  }
  return null;
}

export function validateState(x: unknown): Validation {
  const fail = (error: string): Validation => ({ ok: false, error });
  if (!isObj(x)) return fail('it is not a Tell document');
  if (typeof x.schema !== 'number') return fail('it has no schema version');
  if (x.schema > SCHEMA) return { ok: false, error: `it was saved by a newer version of Tell (schema ${x.schema})`, newer: true };
  if (x.schema !== SCHEMA) return fail(`schema ${String(x.schema)} is unknown`);

  if (!Array.isArray(x.answers)) return fail('answers is not a list');
  const seen = new Set<string>();
  for (const [i, a] of x.answers.entries()) {
    const problem = answerProblem(a);
    if (problem) return fail(`answer ${i + 1} ${problem}`);
    const card = (a as Obj).card as string;
    if (seen.has(card)) return fail(`answer ${i + 1} repeats round “${card}”`);
    seen.add(card);
  }

  const d = x.deal;
  if (d !== null) {
    if (!isObj(d) || !isDay(d.day) || !oneOf(d.area, ['world', 'work', 'mix']) || !Array.isArray(d.cards)) {
      return fail('today’s set is malformed');
    }
    for (const c of d.cards) {
      if (!isObj(c) || !isStr(c.id) || !Array.isArray(c.order) || !c.order.every(isStr)) return fail('a round in today’s set is malformed');
    }
  }

  if (!Array.isArray(x.kept)) return fail('kept lines is not a list');
  for (const k of x.kept) {
    if (!isObj(k) || !isStr(k.card) || !oneOf(k.area, ['world', 'work']) || !isStr(k.title) || !isStr(k.line) || !isTime(k.at)) {
      return fail('a kept line is malformed');
    }
  }
  if (!Array.isArray(x.disagreed)) return fail('disagreements is not a list');
  for (const r of x.disagreed) {
    if (!isObj(r) || !isStr(r.card) || !isTime(r.at)) return fail('a disagreement is malformed');
  }
  if (!Array.isArray(x.notes)) return fail('notes is not a list');
  for (const n of x.notes) {
    if (!isObj(n) || !isStr(n.obs) || !oneOf(n.verdict, ['fits', 'partly', 'doesnt', 'unsure']) || !isStr(n.counts) || !isTime(n.at)) {
      return fail('a note is malformed');
    }
  }
  return { ok: true, state: x as unknown as TellState };
}
