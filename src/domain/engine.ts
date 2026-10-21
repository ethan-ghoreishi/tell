import { LANGUAGE, LANGUAGE_MOVES, QUESTIONS, SCOPE, STRATEGIES, answersText, answersTo, differs, languageMove, results, shapeProblem, type MoveId, type QuestionId, type Shape } from './language';
import { list, plural, shortDate } from './text';
import { SCHEMA, type Answers, type Band, type Choice, type Keyed, type Option, type Play, type ShownLine, type Situation, type Step, type StepAnswer, type TellState } from './types';

// Pure domain logic. Nothing here reads a clock or touches storage: callers
// pass `now` and get new state back. Everything shown about a play is read
// from its snapshot, and everything shown about a kept choice from its own,
// never from today's content. What the Map shows is derived each time.

export const emptyState = (): TellState => ({ schema: SCHEMA, plays: [], choices: [], seen: {}, archive: [] });

const pad = (n: number) => String(n).padStart(2, '0');

/** The local calendar day, YYYY-MM-DD. A day is the player's day, not UTC's. */
export const localDay = (now: Date) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const distinct = (xs: unknown[]) => new Set(xs).size === xs.length;
const isInt = (x: unknown): x is number => Number.isInteger(x);

// ---- Steps: what each answer amounts to ------------------------------------

/** The band a number falls in, with the moves it makes. */
export const bandOf = (bands: Band[], n: number) => bands.find((b) => n <= b.upTo)!;
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

/** The option or band behind one key of a step: its moves, and what it costs and risks. */
export function answerOf(s: Step, key: string): Option | Band {
  const found = s.kind === 'choose' ? offered(s, true).find((o) => o.id === key) : s.bands.find((b) => b.id === key);
  if (!found) throw new Error(`“${s.id}” has no answer “${key}”`);
  return found;
}

/** What one answer amounts to, as a key: the option picked, or the band its number fell in. */
export function keyOf(s: Step, a: StepAnswer): string {
  if (s.kind === 'choose' && a.kind === 'choose') return a.pick;
  if (s.kind === 'uncover' && a.kind === 'uncover') return band(s.bands, spent(s, a.opened));
  if (s.kind === 'allocate' && a.kind === 'allocate') return band(s.bands, a.amounts[s.measure]);
  if (s.kind === 'days' && a.kind === 'days') return band(s.bands, a.day);
  throw new Error('That answer doesn’t fit this step');
}

/** The moves one answer made: asking first, when it asked, then the option or band it chose. */
export function movesOf(s: Step, a: StepAnswer): MoveId[] {
  const own = answerOf(s, keyOf(s, a)).moves;
  return s.kind === 'choose' && a.kind === 'choose' && a.asked && s.ask ? [...s.ask.moves, ...own] : own;
}

/** In the language's own order, each once. */
const inOrder = (ids: string[]) => LANGUAGE_MOVES.map((m) => m.id).filter((id) => ids.includes(id));

/** Every move a story offers. */
export const storyMoves = (s: Situation): MoveId[] =>
  inOrder(s.steps.flatMap((step) => [...keysOf(step).flatMap((k) => answerOf(step, k).moves), ...(step.kind === 'choose' && step.ask ? step.ask.moves : [])]));

export function keyed(text: Keyed, s: Situation, answers: Answers): string {
  if (typeof text === 'string') return text;
  const step = s.steps.find((x) => x.id === text.step)!;
  return text.cases[keyOf(step, answers[step.id])];
}

/** Why these answers aren't what this story asked, or null when they are. One check for recording and loading. */
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

/** Snapshot a finished play. Refuses answers that aren't what the story asked. */
export function recordPlay(state: TellState, situations: Situation[], id: string, answers: Answers, now: Date): TellState {
  const s = situations.find((x) => x.id === id);
  if (!s) throw new Error(`There is no story “${id}”`);
  const problem = answersProblem(s, answers);
  if (problem) throw new Error(`That play ${problem}`);
  const play: Play = {
    id: `p${state.plays.length + 1}-${now.getTime()}`,
    situation: s.id,
    v: s.v,
    language: LANGUAGE,
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
  /** What was done, as fixed sentences filled from the record, each with the moves it made and what it cost and risked in the story. */
  did: { line: string; moves: MoveId[]; costs: string; risks: string }[];
  others: string;
  /** Moves the story offers that this play didn't make. */
  unmade: MoveId[];
}

export function playView(play: Play): PlayView {
  const s = play.shown;
  const did = s.steps.map((step) => {
    const a = play.answers[step.id];
    const { costs, risks } = answerOf(step, keyOf(step, a));
    return { line: stepLine(step, a), moves: movesOf(step, a), costs, risks };
  });
  const made = did.flatMap((d) => d.moves);
  return { closing: keyed(s.ending.closing, s, play.answers), did, others: s.ending.others, unmade: storyMoves(s).filter((m) => !made.includes(m)) };
}

/** The collection: every story, in order, with its plays. Finite and inspectable. */
export const library = (state: TellState, situations: Situation[]) => situations.map((situation) => ({ situation, plays: state.plays.filter((p) => p.situation === situation.id) }));

/** Earlier plays of the same story, so a replay is shown as one. */
export const earlierPlays = (state: TellState, play: Play) => state.plays.filter((p) => p.situation === play.situation && p.at < play.at);

// ---- What the record holds: by move, and by shape ----------------------------
// Listed, never counted or summarised, and never used to choose which moves
// Bring a choice shows. Each read from the plays' own snapshots.

export interface Example {
  play: Play;
  line: string;
}

/** Every move the player has made, in the language's order, with each step that made it, oldest first. */
export function examples(state: TellState): { id: MoveId; examples: Example[] }[] {
  const by = new Map<string, Example[]>();
  for (const play of state.plays) {
    for (const step of play.shown.steps) {
      const a = play.answers[step.id];
      for (const m of movesOf(step, a)) by.set(m, [...(by.get(m) ?? []), { play, line: stepLine(step, a) }]);
    }
  }
  return LANGUAGE_MOVES.flatMap((m) => (by.has(m.id) ? [{ id: m.id, examples: by.get(m.id)! }] : []));
}

export interface Pair {
  base: Play;
  variant: Play;
  /** The questions on which the two steps differ: one, by the stories' rules. */
  differ: QuestionId[];
}

/**
 * A story and its variant, each played: the latest play of each, side by
 * side, read from their own snapshots. Listed, never explained: what the
 * player makes of the difference is theirs.
 */
export function pairs(state: TellState): Pair[] {
  const latest = (id: string) => state.plays.filter((p) => p.situation === id).at(-1);
  const variants = [...new Set(state.plays.filter((p) => p.shown.of).map((p) => p.situation))];
  return variants.flatMap((id) => {
    const variant = latest(id)!;
    const base = latest(variant.shown.of!);
    return base ? [{ base, variant, differ: differs(base.shown.shape, variant.shown.shape) }] : [];
  });
}

/** The steps of played stories whose shape had this answer, by name ("felling the oak"), read from the plays' own snapshots. */
export const playedWith = (state: TellState, q: QuestionId, a: string): string[] => [
  ...new Set(state.plays.filter((p) => answersTo(p.shown.shape, q).includes(a)).map((p) => p.shown.turnsOn)),
];

/** Moves this play made that the player hasn't yet been shown as new. */
export const fresh = (state: TellState, play: Play): MoveId[] => inOrder(playView(play).did.flatMap((d) => d.moves)).filter((m) => !state.seen[m]);

/** Note that these moves have been shown as new. The first sighting is kept. */
export function markSeen(state: TellState, ids: string[], now: Date): TellState {
  const unseen = ids.filter((id) => !state.seen[id]);
  if (!unseen.length) return state;
  return { ...state, seen: { ...state.seen, ...Object.fromEntries(unseen.map((id) => [id, now.toISOString()])) } };
}

// ---- Choices the player brings -------------------------------------------------

/** The results for these answers, every word as shown, to keep with the choice. */
export function shownFor(shape: Shape): ShownLine[] {
  return results(shape).map((l) => ({
    strategy: l.strategy,
    name: STRATEGIES.find((s) => s.id === l.strategy)!.name,
    because: l.because,
    moves: l.moves.map((r) => {
      const m = languageMove(r.id)!;
      return { id: m.id, name: m.name, because: r.because, ...(m.asks ? { asks: m.asks } : {}), is: m.is, costs: m.costs, breaks: m.breaks, like: m.like };
    }),
  }));
}

/** Keep a choice the player brought. Only the answers decide what it shows; the label is never read. */
export function recordChoice(state: TellState, label: string, shape: Shape, now: Date): TellState {
  const problem = shapeProblem(shape, true);
  if (problem) throw new Error(`That choice ${problem}`);
  const choice: Choice = {
    id: `c${state.choices.length + 1}-${now.getTime()}`,
    at: now.toISOString(),
    day: localDay(now),
    language: LANGUAGE,
    label: label.trim(),
    shape: copy(shape),
    shown: shownFor(shape),
    trying: [],
    note: '',
  };
  return { ...state, choices: [...state.choices, choice] };
}

const change = (state: TellState, id: string, f: (c: Choice) => Choice): TellState => ({ ...state, choices: state.choices.map((c) => (c.id === id ? f(c) : c)) });

/** Mark a shown move as one the player is trying, or not. */
export const setTrying = (state: TellState, id: string, move: string, on: boolean) =>
  change(state, id, (c) => ({ ...c, trying: on ? (c.trying.includes(move) ? c.trying : [...c.trying, move]) : c.trying.filter((m) => m !== move) }));

export const setNote = (state: TellState, id: string, note: string) => change(state, id, (c) => ({ ...c, note }));

/** The player's own deletion of one kept choice. */
export const removeChoice = (state: TellState, id: string): TellState => ({ ...state, choices: state.choices.filter((c) => c.id !== id) });

// ---- Plain text: the whole record ------------------------------------------------

const shapeText = (shape: Shape) => QUESTIONS.map((q) => `${q.ask} ${answersText(shape, q.id)}.`);
const name = (id: string) => languageMove(id)?.name ?? id;

/** Everything, as plain text: each kept choice with the moves it showed, and each play with its shape and moves. */
export function recordText(state: TellState): string {
  const out = ['Tell: my record', ''];
  for (const c of state.choices) {
    out.push(`Choice: ${c.label || 'A choice'}, ${shortDate(c.day)}`, ...shapeText(c.shape).map((l) => `  ${l}`));
    for (const l of c.shown) out.push(`  ${l.name} (${l.because.replace(/\.$/, '').replace(/^./, (x) => x.toLowerCase())}): ${l.moves.map((m) => m.name).join(', ')}.`);
    if (c.trying.length) out.push(`  Trying: ${c.trying.map((id) => c.shown.flatMap((l) => l.moves).find((m) => m.id === id)?.name ?? id).join(', ')}.`);
    if (c.note) out.push(`  Note: ${c.note}`);
    out.push('');
  }
  if (state.choices.length) out.push(SCOPE, '');
  for (const p of state.plays) {
    out.push(`${p.shown.title}${p.replay ? ` (replay ${p.replay})` : ''}, ${shortDate(p.day)}`, ...(p.shown.whatIf ? [`  ${p.shown.whatIf}`] : []), `  Unknown: ${p.shown.uncertain}`, `  About ${p.shown.turnsOn}: ${shapeText(p.shown.shape).join(' ')}`);
    for (const step of p.shown.steps) {
      const a = p.answers[step.id];
      const d = answerOf(step, keyOf(step, a));
      const moves = movesOf(step, a);
      out.push(`  ${stepLine(step, a)}${moves.length ? ` Moves: ${moves.map(name).join(', ')}.` : ''} Costs ${d.costs}; risks ${d.risks}.`);
    }
    out.push('');
  }
  return out.join('\n');
}
