import { list, plural, shortDate } from './text';
import { SCHEMA, type Answers, type Band, type Connection, type Keyed, type Play, type Situation, type Step, type StepAnswer, type TellState } from './types';

// Pure domain logic. Nothing here reads a clock or touches storage: callers
// pass `now` and get new state back. Everything shown about a play is read
// from its snapshot, never from today's content. Connections are derived
// from the plays each time, never stored.

export const emptyState = (): TellState => ({ schema: SCHEMA, plays: [], archive: [] });

const pad = (n: number) => String(n).padStart(2, '0');

/** The local calendar day, YYYY-MM-DD. A day is the player's day, not UTC's. */
export const localDay = (now: Date) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const distinct = (xs: unknown[]) => new Set(xs).size === xs.length;
const isInt = (x: unknown): x is number => Number.isInteger(x);

// ---- Steps: what each answer amounts to ------------------------------------

export const band = (bands: Band[], n: number) => bands.find((b) => n <= b.upTo)!.id;

/** The options a choose step offers once asked: its own, plus the one asking brought. */
export const offered = (s: Extract<Step, { kind: 'choose' }>, asked: boolean) => (asked && s.ask ? [...s.options, s.ask.adds] : s.options);

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

/** One step's answer as a fixed sentence, filled from the record. `brief` keeps only what a connection compares. */
export function stepLine(s: Step, a: StepAnswer, brief = false): string {
  if (s.kind === 'choose' && a.kind === 'choose') {
    return `${a.asked && s.ask ? `${s.ask.did}, then chose` : 'Chose'} “${offered(s, a.asked).find((o) => o.id === a.pick)!.text}”.`;
  }
  if (s.kind === 'uncover' && a.kind === 'uncover') {
    if (!a.opened.length) return 'Decided without spending time finding out.';
    const n = spent(s, a.opened);
    if (brief) return `Spent ${n} of ${plural(s.budget, s.unit[0], s.unit[1])} finding out.`;
    const labels = a.opened.map((id) => `“${s.facts.find((f) => f.id === id)!.label}”`);
    return `Spent ${n} of ${plural(s.budget, s.unit[0], s.unit[1])} finding out: ${list(labels)}.`;
  }
  if (s.kind === 'allocate' && a.kind === 'allocate') {
    const item = s.items.find((i) => i.id === s.measure)!.text;
    if (brief) return `Gave ${a.amounts[s.measure]} of ${plural(s.total, s.unit[0], s.unit[1])} to ${item.charAt(0).toLowerCase()}${item.slice(1)}.`;
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

// ---- Connections: authored, shown only when both sides were played ----------

export interface Found {
  connection: Connection;
  /** The first play of each side, in the connection's order. */
  plays: [Play, Play];
  classes: [string, string];
  note: string;
  /** Lines showing what each side's play chose, at the step the connection compares. */
  chose: [string, string];
  /** Either situation has been played again since. */
  replayed: boolean;
}

/** The class one play falls in for one side of a connection, read from the play's own snapshot. */
export function classOf(side: Connection['sides'][number], play: Play): string {
  const step = play.shown.steps.find((s) => s.id === side.step)!;
  const key = keyOf(step, play.answers[step.id]);
  return Object.entries(side.classes).find(([, keys]) => keys.includes(key))![0];
}

/**
 * Connections whose two situations have both been played, at the version the
 * connection was written for. The first play of each counts: later plays come
 * after the player may have seen how the two compare.
 */
export function found(state: TellState, connections: Connection[]): Found[] {
  return connections.flatMap((connection) => {
    const plays = connection.sides.map((side) => state.plays.find((p) => p.situation === side.situation && p.v === side.v));
    if (!plays[0] || !plays[1]) return [];
    const pair = plays as [Play, Play];
    const classes = connection.sides.map((side, i) => classOf(side, pair[i])) as [string, string];
    const chose = connection.sides.map((side, i) => {
      const step = pair[i].shown.steps.find((s) => s.id === side.step)!;
      return stepLine(step, pair[i].answers[step.id], true);
    }) as [string, string];
    const replayed = connection.sides.some((side) => state.plays.filter((p) => p.situation === side.situation).length > 1);
    return [{ connection, plays: pair, classes, note: connection.notes[classes.join('+')], chose, replayed }];
  });
}

/** The fixed line that keeps a connection from claiming more than the answers show. */
export const limitLine = (c: Connection) =>
  `Your answers show what you chose, not why. These two situations also differ in ${c.differs}, so they can’t show which difference mattered.`;

/** The connection that includes a situation, if any. */
export const connectionOf = (connections: Connection[], situationId: string) => connections.find((c) => c.sides.some((s) => s.situation === situationId));

// ---- Plain text --------------------------------------------------------------

/** Everything, as plain text: for notes, for sharing by choice, or for pasting elsewhere. */
export function recordText(state: TellState, connections: Connection[]): string {
  const out = ['Tell: what I played', ''];
  for (const f of found(state, connections)) {
    out.push(`Connection: ${f.connection.title}`, f.connection.link);
    f.plays.forEach((p, i) => out.push(`  ${p.shown.title}: ${f.chose[i]}`));
    out.push(`  ${f.note}`, `  ${limitLine(f.connection)}`, `  Question: ${f.connection.question}`, '');
  }
  for (const p of state.plays) {
    out.push(`${p.shown.title}${p.replay ? ` (replay ${p.replay})` : ''}, ${shortDate(p.day)}`);
    for (const line of playView(p).did) out.push(`  ${line}`);
    out.push('');
  }
  return out.join('\n');
}
