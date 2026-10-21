import { answersProblem, emptyState, keysOf, most } from './engine';
import { LANGUAGE, languageMove, shapeProblem } from './language';
import { SCHEMA, type Situation, type TellState } from './types';

// The one door every inbound document passes: what is stored on load and any
// backup offered to Restore. A refusal names the problem and the caller
// changes nothing. A wrong type is refused, never coerced. A document from an
// earlier version of Tell is kept whole in the archive; this version asks
// different questions, so nothing in it is reread. Records written with a
// newer language are refused as newer, like a newer schema.

export type Validation = { ok: true; state: TellState; archived?: number } | { ok: false; error: string; newer?: boolean };

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isStr = (x: unknown): x is string => typeof x === 'string';
const text = (x: unknown) => isStr(x) && x.trim().length > 0;
const isInt = (x: unknown): x is number => Number.isInteger(x);
const isDay = (x: unknown) => isStr(x) && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x));
const isTime = (x: unknown) => isStr(x) && !Number.isNaN(Date.parse(x));
const listOf = (x: unknown, check: (v: unknown) => boolean) => Array.isArray(x) && x.every(check);
const unique = (xs: string[]) => new Set(xs).size === xs.length;
/** Moves of the language, each once. */
const isMoves = (x: unknown) => listOf(x, (id) => isStr(id) && !!languageMove(id)) && unique(x as string[]) && (x as unknown[]).length <= 3;
/** An answer described in the language: its moves, and what it costs and risks. */
const isDescribed = (x: Obj) => isMoves(x.moves) && text(x.costs) && text(x.risks);
const isItem = (x: unknown) => isObj(x) && text(x.id) && text(x.text) && (x.detail === undefined || text(x.detail));
const isOption = (x: unknown) => isItem(x) && isDescribed(x as Obj);
const isBands = (x: unknown) => listOf(x, (b) => isObj(b) && text(b.id) && isInt(b.upTo) && isDescribed(b)) && (x as unknown[]).length >= 1;
const isLink = (x: unknown) => isObj(x) && text(x.name) && isStr(x.url) && /^https:\/\//.test(x.url);

/** A story's shape, as written in content or as snapshotted in a play. Null when it's sound. */
export function situationProblem(x: unknown): string | null {
  if (!isObj(x)) return 'is not a story';
  for (const k of ['id', 'title', 'place', 'hook', 'setup', 'uncertain', 'turnsOn']) if (!text(x[k])) return `has no ${k}`;
  if (!isInt(x.v) || x.v < 1) return 'has no version';
  const shape = shapeProblem(x.shape, false);
  if (shape) return `has a shape that ${shape}`;
  const real = x.real;
  if (real !== undefined && !(isObj(real) && text(real.invented) && listOf(real.facts, (f) => isObj(f) && text(f.fact) && listOf(f.sources, isLink) && (f.sources as unknown[]).length > 0))) {
    return 'has malformed sources';
  }
  if (!listOf(x.steps, isObj) || (x.steps as unknown[]).length === 0) return 'has no steps';
  const steps = x.steps as Obj[];
  if (!unique(steps.map((s) => s.id as string)) || !steps.every((s) => text(s.id))) return 'repeats a step';
  for (const [i, s] of steps.entries()) {
    const p = stepProblem(s);
    if (p) return `step “${String(s.id)}” ${p}`;
    if (s.kind === 'choose' && s.before !== undefined) {
      const k = keyedProblem(s.before, steps.slice(0, i));
      if (k) return `step “${String(s.id)}” ${k}`;
    }
  }
  const end = x.ending;
  if (!isObj(end) || !text(end.others)) return 'has no ending';
  const k = keyedProblem(end.closing, steps);
  return k ? `closing ${k}` : null;
}

function stepProblem(s: Obj): string | null {
  const numeric = () => {
    if (!isBands(s.bands)) return 'has no bands, each described in the language';
    const bands = s.bands as { id: string; upTo: number }[];
    if (!unique(bands.map((b) => b.id)) || bands.some((b, i) => i > 0 && b.upTo <= bands[i - 1].upTo) || bands[0].upTo < 0) return 'has bands out of order';
    // Every number the step can produce falls in a band.
    if (bands.at(-1)!.upTo < most(s as never)) return 'has bands that miss its largest answer';
    return null;
  };
  const unit = (u: unknown) => listOf(u, text) && (u as unknown[]).length === 2;
  if (s.kind === 'choose') {
    if (!text(s.prompt) || !listOf(s.options, isOption) || (s.options as unknown[]).length < 2 || (s.options as unknown[]).length > 4) return 'needs two to four options, each described in the language';
    const ask = s.ask;
    if (ask !== undefined && !(isObj(ask) && text(ask.label) && text(ask.did) && text(ask.answer) && isMoves(ask.moves) && (ask.adds === undefined || isOption(ask.adds)))) return 'has a malformed ask';
    const ids = [...(s.options as Obj[]), ...(isObj(ask) && ask.adds ? [ask.adds as Obj] : [])].map((o) => o.id as string);
    return unique(ids) ? null : 'repeats an option';
  }
  if (s.kind === 'uncover') {
    const fact = (f: unknown) => isObj(f) && text(f.id) && text(f.label) && text(f.text) && isInt(f.cost) && f.cost >= 1;
    if (!text(s.prompt) || !isInt(s.budget) || s.budget < 1 || !unit(s.unit) || !listOf(s.facts, fact) || (s.facts as unknown[]).length < 2) return 'is a malformed uncover';
    if (!unique((s.facts as Obj[]).map((f) => f.id as string))) return 'repeats a fact';
    // A budget that buys everything leaves nothing to choose.
    if ((s.facts as Obj[]).reduce((n, f) => n + (f.cost as number), 0) <= s.budget) return 'can open every fact';
    return numeric();
  }
  if (s.kind === 'allocate') {
    if (!text(s.prompt) || !isInt(s.total) || s.total < 1 || !unit(s.unit) || !listOf(s.items, isItem) || (s.items as unknown[]).length < 2) return 'is a malformed allocate';
    if (!unique((s.items as Obj[]).map((i) => i.id as string)) || !(s.items as Obj[]).some((i) => i.id === s.measure)) return 'measures an item it doesn’t have';
    return numeric();
  }
  if (s.kind === 'days') {
    const day = (d: unknown) => isObj(d) && text(d.label) && text(d.text);
    if (!listOf(s.days, day) || (s.days as unknown[]).length < 2 || !text(s.act) || !text(s.wait) || !text(s.last)) return 'is a malformed days';
    return numeric();
  }
  return 'has an unknown kind';
}

/** Keyed words must follow an earlier step and cover every answer it can have. */
function keyedProblem(k: unknown, earlier: Obj[]): string | null {
  if (text(k)) return null;
  if (!isObj(k) || !isObj(k.cases)) return 'has malformed words';
  const step = earlier.find((s) => s.id === k.step);
  if (!step) return `follows a step that doesn’t come before it (“${String(k.step)}”)`;
  const keys = keysOf(step as never);
  const cases = k.cases as Obj;
  if (Object.keys(cases).length !== keys.length || !keys.every((key) => text(cases[key]))) return `doesn’t cover every answer to “${String(k.step)}”`;
  return null;
}

function playProblem(p: unknown): string | null {
  if (!isObj(p) || !text(p.id) || !text(p.situation) || !isInt(p.v) || !isInt(p.language) || p.language < 1 || !isTime(p.at) || !isDay(p.day) || !isInt(p.replay) || p.replay < 0) return 'is not a play';
  const shown = situationProblem(p.shown);
  if (shown) return `shows a story that ${shown}`;
  const s = p.shown as unknown as Situation;
  if (s.id !== p.situation || s.v !== p.v) return 'shows a different story from the one it names';
  return answersProblem(s, p.answers);
}

const isShownMove = (m: unknown) => isObj(m) && ['id', 'name', 'because', 'is', 'costs', 'breaks', 'like'].every((k) => text(m[k])) && (m.asks === undefined || text(m.asks));
const isShownLine = (l: unknown) => isObj(l) && text(l.strategy) && text(l.name) && text(l.because) && listOf(l.moves, isShownMove) && (l.moves as unknown[]).length > 0;

function choiceProblem(c: unknown): string | null {
  if (!isObj(c) || !text(c.id) || !isTime(c.at) || !isDay(c.day) || !isInt(c.language) || c.language < 1 || !isStr(c.label) || !isStr(c.note)) return 'is not a kept choice';
  const shape = shapeProblem(c.shape, true);
  if (shape) return shape;
  if (!listOf(c.shown, isShownLine) || !(c.shown as unknown[]).length) return 'shows no moves';
  const ids = (c.shown as { moves: { id: string }[] }[]).flatMap((l) => l.moves.map((m) => m.id));
  if (!listOf(c.trying, isStr) || !unique(c.trying as string[]) || !(c.trying as string[]).every((id) => ids.includes(id))) return 'marks a move it didn’t show';
  return null;
}

/** A document from an earlier Tell: kept whole, untouched, in a fresh record. */
export function archive(x: Obj, now: Date): TellState {
  return { ...emptyState(), archive: [{ schema: x.schema as number, at: now.toISOString(), doc: JSON.parse(JSON.stringify(x)) }] };
}

/** Records, each checked, ids unique; or why not. A record from a newer language is refused as newer. */
function recordsProblem(xs: unknown, what: string, problem: (x: unknown) => string | null): Validation | null {
  if (!Array.isArray(xs)) return { ok: false, error: `${what}s is not a list` };
  const ids = new Set<string>();
  for (const [i, x] of xs.entries()) {
    if (isObj(x) && isInt(x.language) && x.language > LANGUAGE) return { ok: false, error: `${what} ${i + 1} was written by a newer version of Tell (language ${x.language})`, newer: true };
    const p = problem(x);
    if (p) return { ok: false, error: `${what} ${i + 1} ${p}` };
    const id = (x as Obj).id as string;
    if (ids.has(id)) return { ok: false, error: `${what} ${i + 1} repeats “${id}”` };
    ids.add(id);
  }
  return null;
}

export function validateState(x: unknown, now: Date): Validation {
  const fail = (error: string): Validation => ({ ok: false, error });
  if (!isObj(x)) return fail('it is not a Tell document');
  if (typeof x.schema !== 'number') return fail('it has no schema version');
  if (x.schema > SCHEMA) return { ok: false, error: `it was saved by a newer version of Tell (schema ${x.schema})`, newer: true };
  if (isInt(x.schema) && x.schema >= 1 && x.schema < SCHEMA) return { ok: true, state: archive(x, now), archived: x.schema };
  if (x.schema !== SCHEMA) return fail(`schema ${String(x.schema)} is unknown`);

  const records = recordsProblem(x.plays, 'play', playProblem) ?? recordsProblem(x.choices, 'choice', choiceProblem);
  if (records) return records;
  if (!isObj(x.seen) || !Object.keys(x.seen).every((id) => !!languageMove(id)) || !Object.values(x.seen).every(isTime)) return fail('what has been seen is malformed');
  if (!listOf(x.archive, (a) => isObj(a) && isInt(a.schema) && isTime(a.at) && isObj(a.doc))) return fail('the archive is malformed');
  return { ok: true, state: x as unknown as TellState };
}
