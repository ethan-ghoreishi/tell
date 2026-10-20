import { list, plural, shortDate } from './text';
import { MOVES, SCHEMA, type Answers, type Band, type Connection, type ConnectionSide, type Keyed, type Move, type Option, type Play, type Situation, type Step, type StepAnswer, type TellState } from './types';

// Pure domain logic. Nothing here reads a clock or touches storage: callers
// pass `now` and get new state back. Everything shown about a play is read
// from its snapshot, never from today's content. Connections are derived
// from the plays each time; only whether one has been seen is stored.

export const emptyState = (): TellState => ({ schema: SCHEMA, plays: [], seen: {}, archive: [] });

const pad = (n: number) => String(n).padStart(2, '0');

/** The local calendar day, YYYY-MM-DD. A day is the player's day, not UTC's. */
export const localDay = (now: Date) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const distinct = (xs: unknown[]) => new Set(xs).size === xs.length;
const isInt = (x: unknown): x is number => Number.isInteger(x);

// ---- Steps: what each answer amounts to ------------------------------------

const bandOf = (bands: Band[], n: number) => bands.find((b) => n <= b.upTo)!;
export const band = (bands: Band[], n: number) => bandOf(bands, n).id;

/** The options a choose step offers once asked: its own, plus any asking brought. */
export const offered = (s: Extract<Step, { kind: 'choose' }>, asked: boolean): Option[] => (asked && s.ask?.adds ? [...s.options, s.ask.adds] : s.options);

export const spent = (s: Extract<Step, { kind: 'uncover' }>, opened: string[]) => opened.reduce((n, id) => n + s.facts.find((f) => f.id === id)!.cost, 0);

/** The largest number a step can produce, which its bands must cover. */
export function most(s: Step): number {
  if (s.kind === 'uncover') return s.budget;
  if (s.kind === 'allocate') return s.total;
  if (s.kind === 'days') return s.days.length;
  return 0;
}

/** Every key a step's answer can have: option ids for a choice, band ids otherwise. */
export const keysOf = (s: Step): string[] => (s.kind === 'choose' ? offered(s, true).map((o) => o.id) : s.bands.map((b) => b.id));

/** The move behind one key of a step. */
export function moveOf(s: Step, key: string): Move {
  const found = s.kind === 'choose' ? offered(s, true).find((o) => o.id === key) : s.bands.find((b) => b.id === key);
  if (!found) throw new Error(`“${s.id}” has no answer “${key}”`);
  return found.move;
}

/** What one answer amounts to, as a key: the option picked, or the band its number fell in. */
export function keyOf(s: Step, a: StepAnswer): string {
  if (s.kind === 'choose' && a.kind === 'choose') return a.pick;
  if (s.kind === 'uncover' && a.kind === 'uncover') return band(s.bands, spent(s, a.opened));
  if (s.kind === 'allocate' && a.kind === 'allocate') return band(s.bands, a.amounts[s.measure]);
  if (s.kind === 'days' && a.kind === 'days') return band(s.bands, a.day);
  throw new Error('That answer doesn’t fit this step');
}

export function keyed(text: Keyed, s: Situation, answers: Answers): string {
  if (typeof text === 'string') return text;
  const step = s.steps.find((x) => x.id === text.step)!;
  return text.cases[keyOf(step, answers[step.id])];
}

/** Why these answers aren't what this situation asked, or null when they are. One check for recording and loading. */
export function answersProblem(s: Situation, answers: unknown): string | null {
  if (typeof answers !== 'object' || answers === null || Array.isArray(answers)) return 'has no answers';
  const given = answers as Record<string, Record<string, unknown>>;
  if (Object.keys(given).length !== s.steps.length) return 'answers a different number of steps';
  for (const step of s.steps) {
    const a = given[step.id];
    if (typeof a !== 'object' || a === null || a.kind !== step.kind) return `has no answer for “${step.id}”`;
    if (step.kind === 'choose') {
      if (typeof a.asked !== 'boolean' || (a.asked && !step.ask)) return `asks where “${step.id}” offers nothing to ask`;
      if (!offered(step, a.asked).some((o) => o.id === a.pick)) return `picks something “${step.id}” didn’t offer`;
    }
    if (step.kind === 'uncover') {
      const opened = a.opened as unknown[];
      if (!Array.isArray(opened) || !distinct(opened) || !opened.every((id) => step.facts.some((f) => f.id === id))) return `opens facts “${step.id}” doesn’t have`;
      if (spent(step, opened as string[]) > step.budget) return `spends more than “${step.id}” allows`;
    }
    if (step.kind === 'allocate') {
      const amounts = a.amounts as Record<string, unknown>;
      const ids = step.items.map((i) => i.id);
      if (typeof amounts !== 'object' || amounts === null || Object.keys(amounts).length !== ids.length || !ids.every((id) => isInt(amounts[id]) && (amounts[id] as number) >= 0)) {
        return `shares “${step.id}” among the wrong things`;
      }
      if (ids.reduce((n, id) => n + (amounts[id] as number), 0) !== step.total) return `doesn’t share all of “${step.id}”`;
    }
    if (step.kind === 'days' && !(isInt(a.day) && a.day >= 0 && a.day <= step.days.length)) return `acts on a day “${step.id}” doesn’t have`;
  }
  return null;
}

// ---- Plays -----------------------------------------------------------------

/** Snapshot a finished play. Refuses answers that aren't what the situation asked. */
export function recordPlay(state: TellState, situations: Situation[], id: string, answers: Answers, now: Date): TellState {
  const s = situations.find((x) => x.id === id);
  if (!s) throw new Error(`There is no situation “${id}”`);
  const problem = answersProblem(s, answers);
  if (problem) throw new Error(`That play ${problem}`);
  const play: Play = {
    id: `p${state.plays.length + 1}-${now.getTime()}`,
    situation: s.id,
    v: s.v,
    at: now.toISOString(),
    day: localDay(now),
    replay: state.plays.filter((p) => p.situation === s.id).length,
    shown: copy(s),
    answers: copy(answers),
  };
  return { ...state, plays: [...state.plays, play] };
}

/** One step's answer as a fixed sentence, filled from the record. */
export function stepLine(s: Step, a: StepAnswer): string {
  if (s.kind === 'choose' && a.kind === 'choose') {
    return `${a.asked && s.ask ? `${s.ask.did}, then chose` : 'Chose'} “${offered(s, a.asked).find((o) => o.id === a.pick)!.text}”.`;
  }
  if (s.kind === 'uncover' && a.kind === 'uncover') {
    if (!a.opened.length) return 'Decided without spending time finding out.';
    const labels = a.opened.map((id) => `“${s.facts.find((f) => f.id === id)!.label}”`);
    return `Spent ${spent(s, a.opened)} of ${plural(s.budget, s.unit[0], s.unit[1])} finding out: ${list(labels)}.`;
  }
  if (s.kind === 'allocate' && a.kind === 'allocate') {
    return `${s.items.map((i) => `${i.text}: ${plural(a.amounts[i.id], s.unit[0], s.unit[1])}`).join('. ')}.`;
  }
  if (s.kind === 'days' && a.kind === 'days') {
    return a.day < s.days.length ? `“${s.act}” on ${s.days[a.day].label}.` : `“${s.last}” on ${s.days.at(-1)!.label}.`;
  }
  throw new Error('That answer doesn’t fit this step');
}

export interface PlayView {
  closing: string;
  /** What was done, as fixed sentences filled from the record. */
  did: string[];
  others: string;
}

export function playView(play: Play): PlayView {
  const s = play.shown;
  return {
    closing: keyed(s.ending.closing, s, play.answers),
    did: s.steps.map((step) => stepLine(step, play.answers[step.id])),
    others: s.ending.others,
  };
}

/** The collection: every situation, in order, with its plays. Finite and inspectable. */
export const library = (state: TellState, situations: Situation[]) => situations.map((situation) => ({ situation, plays: state.plays.filter((p) => p.situation === situation.id) }));

/** Earlier plays of the same situation, so a replay is shown as one. */
export const earlierPlays = (state: TellState, play: Play) => state.plays.filter((p) => p.situation === play.situation && p.at < play.at);

// ---- Connections: a distinction between two specific ways through ---------

/** Does this play take a way through that this side of a connection fits? Read from the play's own snapshot. */
export function fits(side: ConnectionSide, play: Play): boolean {
  if (play.situation !== side.situation || play.v !== side.v) return false;
  return Object.entries(side.when).every(([stepId, keys]) => {
    const step = play.shown.steps.find((s) => s.id === stepId);
    return !!step && keys.includes(keyOf(step, play.answers[stepId]));
  });
}

export interface Discovery {
  connection: Connection;
  /** The two plays that first fitted, in the connection's order. */
  plays: [Play, Play];
  /** When it was found: the later of those two plays. */
  at: string;
  /** Later plays that fit it too. */
  also: Play[];
}

const later = (a: Play, b: Play) => (a.at > b.at ? a : b);

/**
 * Every connection the plays so far have found, newest first. Each is
 * anchored to the earliest moment both sides fitted, so a later play can add
 * an example but never change what was found, or when.
 */
export function discoveries(state: TellState, connections: Connection[]): Discovery[] {
  return connections
    .flatMap((connection) => {
      const [a, b] = connection.sides.map((side) => state.plays.filter((p) => fits(side, p)));
      if (!a.length || !b.length) return [];
      const pairs = a.flatMap((pa) => b.map((pb) => [pa, pb] as [Play, Play]));
      const order = ([x, y]: [Play, Play]) => [later(x, y).at, x.at < y.at ? x.at : y.at].join();
      pairs.sort((p, q) => (order(p) < order(q) ? -1 : order(p) > order(q) ? 1 : 0));
      const first = pairs[0];
      const also = [...a, ...b].filter((p) => !first.includes(p)).sort((p, q) => (p.at < q.at ? -1 : 1));
      return [{ connection, plays: first, at: later(...first).at, also }];
    })
    .sort((x, y) => (x.at < y.at ? 1 : x.at > y.at ? -1 : 0));
}

/** Discoveries this play made: it completed them. */
export const madeBy = (found: Discovery[], play: Play) => found.filter((d) => d.plays.includes(play) && d.at === play.at);
/** Discoveries made earlier that this play fits too. */
export const fitsAgain = (found: Discovery[], play: Play) => found.filter((d) => d.also.includes(play));

/** Note that these connections have been seen. The first sighting is kept. */
export function markSeen(state: TellState, ids: string[], now: Date): TellState {
  const fresh = ids.filter((id) => !state.seen[id]);
  if (!fresh.length) return state;
  return { ...state, seen: { ...state.seen, ...Object.fromEntries(fresh.map((id) => [id, now.toISOString()])) } };
}

// ---- Plain text: the record, and what a future Bring a choice would draw on --

const shape = (m: Move) =>
  (Object.keys(MOVES) as (keyof typeof MOVES)[])
    .filter((p) => m[p])
    .map((p) => (MOVES[p] as Record<string, string>)[m[p]!])
    .join('; ');

/** Everything, as plain text: the connections found, and every play with what was uncertain and what each move risked. */
export function recordText(state: TellState, connections: Connection[]): string {
  const out = ['Tell: what I played', ''];
  for (const d of discoveries(state, connections)) {
    const c = d.connection;
    out.push(`Connection: ${c.title}`, `  ${c.says}`);
    d.plays.forEach((p) => out.push(`  ${p.shown.title}: ${playView(p).did.join(' ')}`));
    out.push(`  Where it breaks: ${c.breaks}`, `  To carry: ${c.question}`, '');
  }
  for (const p of state.plays) {
    out.push(`${p.shown.title}${p.replay ? ` (replay ${p.replay})` : ''}, ${shortDate(p.day)}`, `  Unknown: ${p.shown.uncertain}`);
    for (const step of p.shown.steps) {
      const m = moveOf(step, keyOf(step, p.answers[step.id]));
      out.push(`  ${stepLine(step, p.answers[step.id])} It ${shape(m) || 'is one way through'}; costs ${m.costs}; risks ${m.risks}.`);
    }
    out.push('');
  }
  return out.join('\n');
}
