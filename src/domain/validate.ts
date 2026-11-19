import { emptyState } from './engine';
import { IDEA_KINDS, SCHEMA, type Archived, type TellState } from './types';

// The one door every inbound document passes: what is stored on load and any
// backup offered to Restore. A refusal names the problem and the caller
// changes nothing. A wrong type is refused, never coerced.
//
// A document from an earlier Tell (schemas 1–6) is kept whole in the archive
// of a fresh record: this Tell is a different game, so nothing in it is
// reread. An earlier document's own archive is lifted alongside it, so every
// record stays downloadable on its own. Newer documents are refused as newer.

export type Validation = { ok: true; state: TellState; archived?: number } | { ok: false; error: string; newer?: boolean };

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isStr = (x: unknown): x is string => typeof x === 'string';
const text = (x: unknown): x is string => isStr(x) && x.trim().length > 0;
const isInt = (x: unknown): x is number => Number.isInteger(x);
const isTime = (x: unknown) => isStr(x) && !Number.isNaN(Date.parse(x));
const listOf = (x: unknown, check: (v: unknown) => boolean): x is unknown[] => Array.isArray(x) && x.every(check);
const unique = (xs: unknown[]) => new Set(xs).size === xs.length;

const isAnswer = (a: unknown) =>
  text(a) || (typeof a === 'number' && Number.isFinite(a)) || listOf(a, text) || listOf(a, (n) => n === 0 || n === 1);

function playProblem(p: unknown): string | null {
  if (!isObj(p) || !text(p.round) || !isInt(p.v) || p.v < 1 || !isTime(p.at)) return 'is not a play';
  if (!isObj(p.answers) || !Object.values(p.answers).every(isAnswer)) return 'has malformed answers';
  return null;
}

function ideaProblem(i: unknown): string | null {
  if (!isObj(i) || !text(i.round) || !text(i.title) || !text(i.text) || !text(i.original) || !isTime(i.at)) return 'is not a kept idea';
  if (!isStr(i.kind) || !(i.kind in IDEA_KINDS)) return 'has an unknown kind';
  if ((i.by !== undefined && !text(i.by)) || (i.edited !== undefined && !isTime(i.edited))) return 'is malformed';
  return null;
}

const isArchived = (a: unknown): a is Archived => isObj(a) && isInt(a.schema) && isTime(a.at) && isObj(a.doc);

/** A document from an earlier Tell: kept whole, with anything it had archived lifted beside it. */
export function archive(x: Obj, now: Date): TellState {
  const doc = JSON.parse(JSON.stringify(x)) as Obj;
  const earlier = Array.isArray(doc.archive) ? doc.archive.filter(isArchived) : [];
  return { ...emptyState(), archive: [...earlier, { schema: doc.schema as number, at: now.toISOString(), doc }] };
}

function listProblem(xs: unknown, what: string, problem: (x: unknown) => string | null, key?: (x: Obj) => unknown): string | null {
  if (!Array.isArray(xs)) return `the ${what}s are not a list`;
  for (const [n, x] of xs.entries()) {
    const p = problem(x);
    if (p) return `${what} ${n + 1} ${p}`;
  }
  return key === undefined || unique(xs.map((x) => key(x as Obj))) ? null : `two ${what}s are for the same round`;
}

export function validateState(x: unknown, now: Date): Validation {
  const fail = (error: string): Validation => ({ ok: false, error });
  if (!isObj(x)) return fail('it is not a Tell document');
  if (typeof x.schema !== 'number') return fail('it has no schema version');
  if (x.schema > SCHEMA) return { ok: false, error: `it was saved by a newer version of Tell (schema ${x.schema})`, newer: true };
  if (isInt(x.schema) && x.schema >= 1 && x.schema < SCHEMA) return { ok: true, state: archive(x, now), archived: x.schema };
  if (x.schema !== SCHEMA) return fail(`schema ${String(x.schema)} is unknown`);

  const problem =
    listProblem(x.plays, 'play', playProblem) ??
    listProblem(x.book, 'idea', ideaProblem, (i) => i.round) ??
    (listOf(x.skipped, text) && unique(x.skipped) ? null : 'the passed-over rounds are malformed') ??
    (listOf(x.archive, isArchived) ? null : 'the archive is malformed');
  if (problem) return fail(problem);
  return { ok: true, state: x as unknown as TellState };
}
