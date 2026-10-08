import type {
  Answer,
  Area,
  Card,
  Deal,
  LensCard,
  LensId,
  Note,
  Out,
  Pair,
  TellState,
  Verdict,
} from './types';
import { AREAS, LENSES, OUTS, OUTS_FOR, SCHEMA, lensName } from './types';

// Pure domain logic. Nothing here reads a clock or touches storage: callers
// pass `now` and get new state back. Every number the app shows is derived
// from `state.answers`, the snapshot log, never from the current deck.

export const ROUNDS_PER_DAY = 4;
/** Two halves of a pair are dealt at least this many calendar days apart. */
export const PAIR_GAP_DAYS = 2;

export const emptyState = (): TellState => ({
  schema: SCHEMA,
  answers: [],
  deal: null,
  kept: [],
  disagreed: [],
  notes: [],
});

// ---- Calendar ------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, '0');

/** The local calendar day, YYYY-MM-DD. A day is the player's day, not UTC's. */
export const localDay = (now: Date) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const dayNumber = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};

/** Whole calendar days from `from` to `to`; DST cannot skew it. */
export const daysBetween = (from: string, to: string) => dayNumber(to) - dayNumber(from);

// ---- Dealing -------------------------------------------------------------

const linked = (a: Card, b: Card) =>
  (a.kind !== 'switch' && a.twin === b.id) ||
  (b.kind !== 'switch' && b.twin === a.id) ||
  (a.kind === 'switch' && b.kind === 'switch' && a.pair === b.pair);

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Today's set, by a rule the About page states in words:
 * 1. the second half of any pair whose first half is at least two days old;
 * 2. the matched scene of any scene already answered from the other side;
 * 3. new rounds in deck order, alternating The world and Work & projects.
 * Linked rounds (twins, pair halves) never share a day. Unanswered rounds
 * from earlier days simply return to the pool. Option order is shuffled once,
 * here, and stored with the deal.
 */
export function deal(state: TellState, deck: Card[], now: Date, area: Area | 'mix', rand: () => number = Math.random): Deal {
  const day = localDay(now);
  const answeredOn = new Map(state.answers.map((a) => [a.card, a.day]));
  const pool = deck.filter((c) => !answeredOn.has(c.id) && (area === 'mix' || c.area === area));

  const firstHalfDay = (c: Card) => {
    if (c.kind !== 'switch') return undefined;
    const first = deck.find((x) => x.kind === 'switch' && x.pair === c.pair && x.variant === 'a');
    return first && answeredOn.get(first.id);
  };
  const isSecondHalf = (c: Card) => c.kind === 'switch' && c.variant === 'b';
  const pairReady = (c: Card) => {
    const first = firstHalfDay(c);
    return first !== undefined && daysBetween(first, day) >= PAIR_GAP_DAYS;
  };
  const completesTwin = (c: Card) => c.kind !== 'switch' && !!c.twin && answeredOn.has(c.twin);

  const chosen: Card[] = [];
  const fits = (c: Card) => !chosen.includes(c) && !chosen.some((x) => linked(x, c));
  for (const c of [...pool.filter((c) => isSecondHalf(c) && pairReady(c)), ...pool.filter(completesTwin)]) {
    if (chosen.length < ROUNDS_PER_DAY && fits(c)) chosen.push(c);
  }
  // Fresh rounds: the area with fewer rounds so far goes next (The world on a tie).
  const fresh = (a: Area) => pool.filter((c) => c.area === a && !isSecondHalf(c) && !completesTwin(c));
  const queues: Record<Area, Card[]> = { world: fresh('world'), work: fresh('work') };
  const inSet = (a: Area) => chosen.filter((c) => c.area === a).length;
  while (chosen.length < ROUNDS_PER_DAY) {
    const next = (['world', 'work'] as Area[])
      .sort((a, b) => inSet(a) - inSet(b))
      .map((a) => queues[a].find(fits))
      .find(Boolean);
    if (!next) break;
    chosen.push(next);
  }
  return {
    day,
    area,
    cards: chosen.map((c) => ({
      id: c.id,
      // A pair keeps its authored order in both halves, so order can't be what changed.
      order: c.kind === 'switch' ? c.options.map((x) => x.id) : shuffle(c.options.map((x) => x.id), rand),
    })),
  };
}

export const todaysDeal = (state: TellState, now: Date) => (state.deal?.day === localDay(now) ? state.deal : null);

export const isAnswered = (state: TellState, cardId: string) => state.answers.some((a) => a.card === cardId);

/** The first round in today's set not yet answered, or null. */
export function currentRound(state: TellState, deck: Card[], now: Date): { card: Card; order: string[]; index: number } | null {
  const d = todaysDeal(state, now);
  if (!d) return null;
  for (const [index, slot] of d.cards.entries()) {
    const card = deck.find((c) => c.id === slot.id);
    if (card && !isAnswered(state, card.id)) return { card, order: slot.order, index };
  }
  return null;
}

// ---- Recording -----------------------------------------------------------

export function answer(state: TellState, deck: Card[], cardId: string, pick: string, now: Date): TellState {
  const slot = todaysDeal(state, now)?.cards.find((c) => c.id === cardId);
  if (!slot) throw new Error(`“${cardId}” is not in today’s set`);
  if (isAnswered(state, cardId)) throw new Error(`“${cardId}” is already answered`);
  const card = deck.find((c) => c.id === cardId);
  if (!card) throw new Error(`“${cardId}” is not in the deck`);

  const option = card.options.find((o) => o.id === pick);
  const out = (OUTS_FOR[card.kind] as string[]).includes(pick) ? (pick as Out) : undefined;
  if (!option && !out) throw new Error(`“${pick}” is not an answer to “${cardId}”`);

  const shown = slot.order.flatMap((id) => {
    const o = card.options.find((x) => x.id === id);
    if (!o) return [];
    return [card.kind === 'switch' ? { id } : { id, lens: (o as LensCard['options'][number]).lens }];
  });

  const record: Answer = {
    card: card.id,
    v: card.v,
    kind: card.kind,
    area: card.area,
    title: card.title,
    at: now.toISOString(),
    day: localDay(now),
    shown,
    pick,
    pickText: option ? option.text : OUTS[out!],
    ...(card.kind === 'switch' ? { pair: card.pair, variant: card.variant } : card.twin ? { twin: card.twin } : {}),
  };
  return { ...state, answers: [...state.answers, record] };
}

export function toggleKeep(state: TellState, deck: Card[], cardId: string, now: Date): TellState {
  if (state.kept.some((k) => k.card === cardId)) return { ...state, kept: state.kept.filter((k) => k.card !== cardId) };
  const card = deck.find((c) => c.id === cardId);
  if (!card || card.kind === 'switch') return state;
  return { ...state, kept: [...state.kept, { card: card.id, area: card.area, title: card.title, line: card.line, at: now.toISOString() }] };
}

export function toggleDisagree(state: TellState, cardId: string, now: Date): TellState {
  return state.disagreed.some((d) => d.card === cardId)
    ? { ...state, disagreed: state.disagreed.filter((d) => d.card !== cardId) }
    : { ...state, disagreed: [...state.disagreed, { card: cardId, at: now.toISOString() }] };
}

/** A verdict is a note filed with the counts it was given against, never evidence. */
export function addNote(state: TellState, obs: string, verdict: Verdict, counts: string, now: Date): TellState {
  const note: Note = { obs, verdict, counts, at: now.toISOString() };
  return { ...state, notes: [...state.notes, note] };
}

// ---- Counting ------------------------------------------------------------

/** The lens of the option an answer picked, from the answer's own snapshot. */
export const pickedLens = (a: Answer): LensId | undefined => a.shown.find((s) => s.id === a.pick)?.lens;

export interface LensRow {
  lens: LensId;
  offered: number;
  chosen: number;
  rounds: Answer[];
}

/** For each angle: in how many answered rounds of this area it was offered, and how often it was picked. */
export function lensRecord(answers: Answer[], area: Area): LensRow[] {
  return LENSES.map(({ id }) => {
    const rounds = answers.filter((a) => a.area === area && a.shown.some((s) => s.lens === id));
    return { lens: id, offered: rounds.length, chosen: rounds.filter((a) => pickedLens(a) === id).length, rounds };
  });
}

/** Rounds answered in an area without picking an angle, by kind of answer. */
export function outRecord(answers: Answer[], area: Area): { out: Out; label: string; count: number }[] {
  const lensRounds = answers.filter((a) => a.area === area && a.kind !== 'switch');
  return (Object.keys(OUTS) as Out[])
    .map((out) => ({ out, label: OUTS[out], count: lensRounds.filter((a) => a.pick === out).length }))
    .filter((r) => r.count > 0);
}

// ---- Observations --------------------------------------------------------

/** P(X >= k) for X ~ Binomial(n, p), exact. */
export function binomTail(k: number, n: number, p: number): number {
  if (k <= 0) return 1;
  if (k > n) return 0;
  let coefficient = 1;
  let total = 0;
  for (let i = 0; i <= n; i++) {
    if (i > 0) coefficient = (coefficient * (n - i + 1)) / i;
    if (i >= k) total += coefficient * p ** i * (1 - p) ** (n - i);
  }
  return Math.min(1, total);
}

/** Every lens round offers exactly four angles (deck.test.ts), so random picking gives each 1 in 4. */
export const CHANCE = 1 / 4;
/** Eight angles are checked per area, so the bar is raised eightfold (Bonferroni). */
export const ANGLES_CHECKED = LENSES.length;
export const GATE = 0.05;
/**
 * At least this many offers before anything is called out, so the bar is never
 * cleared on a handful of rounds (4 of 4 would clear on chance alone).
 */
export const MIN_OFFERS = 5;

/** Whether `chosen of offered` clears the published bar for an observation. */
export const clearsGate = (chosen: number, offered: number) =>
  offered >= MIN_OFFERS && binomTail(chosen, offered, CHANCE) * ANGLES_CHECKED < GATE;

export interface Observation {
  id: string;
  area: Area;
  lens: LensId;
  chosen: number;
  offered: number;
  rounds: Answer[];
  /** "5 of 6": the counts a note is filed against. */
  counts: string;
  /** Whether the current counts still clear the bar. */
  clears: boolean;
  /** When the bar was first cleared, and at what counts. */
  first: { counts: string; day: string };
}

/**
 * An angle picked far more often than chance would explain. Nothing else
 * becomes an observation: a rarely picked angle is not a blind spot, and a
 * player's verdict never changes whether one is shown.
 *
 * Once an angle has cleared the bar it stays, so nothing the player saw slips
 * away; if later rounds bring it back under, it is marked and shows both counts.
 * Derived by walking the answer log in order, with lensRecord's counting rules.
 */
export function observations(answers: Answer[]): Observation[] {
  const tally = new Map<string, { chosen: number; offered: number }>();
  const firstCleared = new Map<string, { counts: string; day: string }>();
  for (const a of answers) {
    if (a.kind === 'switch') continue;
    const picked = pickedLens(a);
    for (const { lens } of a.shown) {
      if (!lens) continue;
      const id = `lean:${a.area}:${lens}`;
      const t = tally.get(id) ?? { chosen: 0, offered: 0 };
      t.offered += 1;
      if (picked === lens) t.chosen += 1;
      tally.set(id, t);
      if (!firstCleared.has(id) && clearsGate(t.chosen, t.offered)) firstCleared.set(id, { counts: `${t.chosen} of ${t.offered}`, day: a.day });
    }
  }
  return (Object.keys(AREAS) as Area[]).flatMap((area) =>
    lensRecord(answers, area).flatMap((r) => {
      const id = `lean:${area}:${r.lens}`;
      const first = firstCleared.get(id);
      if (!first) return [];
      const counts = `${r.chosen} of ${r.offered}`;
      return [{ id, area, lens: r.lens, chosen: r.chosen, offered: r.offered, rounds: r.rounds, counts, clears: clearsGate(r.chosen, r.offered), first }];
    }),
  );
}

export const latestNote = (state: TellState, obs: string) => state.notes.filter((n) => n.obs === obs).at(-1);

// ---- Matched scenes and pairs --------------------------------------------

export interface MatchedPair {
  world: Answer;
  work: Answer;
  worldLens?: LensId;
  workLens?: LensId;
}

/** Twins answered on both sides, linked by the ids snapshotted in the answers. */
export function matchedPairs(answers: Answer[]): MatchedPair[] {
  const byCard = new Map(answers.map((a) => [a.card, a]));
  return answers.flatMap((world) => {
    const work = world.area === 'world' && world.twin ? byCard.get(world.twin) : undefined;
    return work ? [{ world, work, worldLens: pickedLens(world), workLens: pickedLens(work) }] : [];
  });
}

export interface PairResult {
  pair: Pair;
  first: Answer;
  second?: Answer;
  changed?: boolean;
}

/** Each pair with at least its first half answered; `changed` once both are in. */
export function pairResults(answers: Answer[], pairs: Pair[]): PairResult[] {
  return pairs.flatMap((pair) => {
    const first = answers.find((a) => a.pair === pair.id && a.variant === 'a');
    const second = answers.find((a) => a.pair === pair.id && a.variant === 'b');
    if (!first) return [];
    return [second ? { pair, first, second, changed: first.pick !== second.pick } : { pair, first }];
  });
}

// ---- What a round added --------------------------------------------------

/** The plain-words record of what one answer just added to the map. */
export function deposit(state: TellState, cardId: string): string[] {
  const a = state.answers.find((x) => x.card === cardId);
  if (!a) return [];
  const area = AREAS[a.area].name;
  if (a.kind === 'switch') {
    // The first half says nothing about pairing, so it can't prime the second.
    return a.variant === 'a'
      ? [`Added to ${area}: one choice recorded.`]
      : [`Added to your paired choices: both answers now sit side by side on your map.`];
  }
  const lines: string[] = [];
  const lens = pickedLens(a);
  if (lens) {
    const row = lensRecord(state.answers, a.area).find((r) => r.lens === lens)!;
    lines.push(`Added to ${area}: ${lensName(lens)} has been offered ${row.offered} ${row.offered === 1 ? 'time' : 'times'} and picked ${row.chosen}.`);
  } else {
    const n = state.answers.filter((x) => x.area === a.area && x.pick === a.pick).length;
    lines.push(`Added to ${area}: “${a.pickText}”, ${n} so far.`);
  }
  const twin = a.twin && state.answers.find((x) => x.card === a.twin);
  if (twin) lines.push(`This completes a matched pair with “${twin.title}”.`);
  return lines;
}
