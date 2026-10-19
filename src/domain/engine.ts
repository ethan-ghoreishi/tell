import { capitalise, interval, plural, shortInterval, value } from './text';
import {
  CONTEXTS,
  FACTORS,
  MECHANICS,
  SCHEMA,
  TAGS,
  factorName,
  type Answer3,
  type Call,
  type Card,
  type Currency,
  type CutRun,
  type Factor,
  type Kind,
  type Lean,
  type Lesson,
  type Mechanic,
  type Mattered,
  type PeekRun,
  type Rating,
  type Run,
  type Session,
  type Side,
  type SlideCard,
  type SlideOutcome,
  type SlideRun,
  type Step,
  type Tag,
  type TellState,
  type Verdict,
  type Went,
} from './types';

// Pure domain logic. Nothing here reads a clock or touches storage: callers
// pass `now` and get new state back. Every number the app shows is derived
// from the run and call snapshots, never from the current content.

/** Experiments in a set, not counting ones added by "It depends". */
export const SET_SIZE = 3;
/** A result can be retested once it is this old. */
export const RETEST_DAYS = 21;
/** A repeated choice is shown once it happened at least this often… */
export const REPEAT_MIN = 3;
/** …and in at least this share of the chances it had. */
export const REPEAT_SHARE = 0.75;
/** Two Slide results count as different only this many intervals apart. */
export const CHANGE_GAP = 2;
/** Shared lessons show an item only once this many shared calls report it. */
export const POOL_MIN = 3;
export const COINS = 10;
export const PEEKS = 3;
/** The probe's mechanic rotates; Slide, the signature, comes every other set. */
export const ROTATION: Mechanic[] = ['slide', 'cut', 'slide', 'peek', 'slide', 'spend'];

export const emptyState = (): TellState => ({
  schema: SCHEMA,
  currency: 'GBP',
  runs: [],
  session: null,
  calls: [],
  notes: [],
  principles: [],
  ratings: [],
  pool: [],
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

export const addDays = (day: string, n: number) => new Date((dayNumber(day) + n) * 86_400_000).toISOString().slice(0, 10);

// ---- Experiments -----------------------------------------------------------

const isSlide = (c: Card | undefined): c is SlideCard => c?.mechanic === 'slide';
const find = (cards: Card[], id: string) => cards.find((c) => c.id === id);

/** What a Slide trades: the amount that changes, then what it is traded for. */
export const tradeoffOf = (c: SlideCard): [Factor, Factor] => [c.dial.factor, (c.dial.rises === 'a' ? c.b : c.a).gives];
const key = (t: [Factor, Factor]) => t.join('/');
export const tradeoffName = (t: [Factor, Factor]) => `${factorName(t[0])} for ${factorName(t[1]).toLowerCase()}`;

/** The factors an experiment touches. */
export const factorsOf = (c: Card): Factor[] =>
  c.mechanic === 'slide'
    ? tradeoffOf(c)
    : c.mechanic === 'cut'
      ? c.items.map((i) => i.factor)
      : c.mechanic === 'spend'
        ? c.features.map((f) => f.factor)
        : c.facts.map((f) => f.factor);

/** Item and fact order rotates by one each time a mechanic is played, so no position is favoured. */
export function rotation(state: TellState, mechanic: Mechanic): number {
  return state.runs.filter((r) => r.mechanic === mechanic).length % 5;
}
export const rotate = <T>(items: T[], by: number): T[] => [...items.slice(by), ...items.slice(0, by)];

// ---- Slide: the adjusting-amount procedure --------------------------------

/**
 * Halving over the steps. `at` is the first step where the rising option wins,
 * somewhere in lo..hi (hi = steps.length means it never does). Seven steps
 * are settled in three choices.
 */
export function bracket(n: number, rises: Side, asked: { step: number; pick: Side }[]): { lo: number; hi: number } {
  let lo = 0;
  let hi = n;
  for (const a of asked) {
    if (a.pick === rises) hi = Math.min(hi, a.step);
    else lo = Math.max(lo, a.step + 1);
  }
  return { lo, hi };
}

/** The next step to ask, or null when the switch point is settled. */
export function nextAsk(n: number, rises: Side, asked: { step: number; pick: Side }[]): number | null {
  const { lo, hi } = bracket(n, rises, asked);
  return lo < hi ? Math.floor((lo + hi) / 2) : null;
}

/** The dial a step plays, and the value held fixed on the other one. */
export function slideSetup(card: SlideCard, step: Pick<Step, 'dial' | 'hold'>) {
  if (step.dial === 'alt' && card.alt) {
    const { factor, unit, steps, rises, measure } = card.alt;
    const dial = { factor, unit, steps, rises, measure };
    const other: Side = rises === 'a' ? 'b' : 'a';
    return { dial, tradeoff: [card.alt.factor, card[other].gives] as [Factor, Factor], x: card.dial.steps[step.hold ?? 3], y: undefined };
  }
  return { dial: card.dial, tradeoff: tradeoffOf(card), x: undefined, y: card.alt ? card.alt.steps[card.alt.at] : undefined };
}

export function slideRange(run: Pick<SlideRun, 'steps' | 'unit' | 'outcome'>, currency: Currency): string {
  const o = run.outcome;
  if (o.kind === 'close') return `about ${value(run.unit, run.steps[o.at], currency)}`;
  if (o.kind === 'switch') return interval(run.steps, run.unit, o.at, currency);
  return 'it depends';
}

/** A Slide's result for a table cell. */
export function slideShort(run: Pick<SlideRun, 'steps' | 'unit' | 'outcome'>, currency: Currency): string {
  const o = run.outcome;
  if (o.kind === 'close') return `≈ ${value(run.unit, run.steps[o.at], currency)}`;
  if (o.kind === 'switch') return shortInterval(run.steps, run.unit, o.at, currency);
  return 'it depends';
}

const dependsWhat = (o: Extract<SlideOutcome, { kind: 'depends' }>) =>
  o.on === 'else' ? 'something else' : (o.label ?? (o.factor ? factorName(o.factor).toLowerCase() : TAGS[o.tag!]));

/** Whether a Slide's guess landed on its result. */
export function guessMatched(run: SlideRun): boolean | undefined {
  if (run.guess === undefined || run.outcome.kind === 'depends') return undefined;
  return run.outcome.kind === 'switch' ? run.guess === run.outcome.at : run.guess === run.outcome.at || run.guess === run.outcome.at + 1;
}

// ---- Spend: clashes test the stated order link by link --------------------

/** Features ranked by coins (ties keep their order), then each adjacent pair clashes. */
export function clashPairs(coins: number[]): { a: number; b: number }[] {
  const ranked = coins.map((c, i) => ({ c, i })).sort((x, y) => y.c - x.c || x.i - y.i);
  return ranked.slice(1).map((r, k) => ({ a: ranked[k].i, b: r.i }));
}

// ---- Sets: one a day, planned one step at a time ---------------------------

export const todaysSession = (state: TellState, now: Date): Session | null =>
  state.session?.day === localDay(now) ? state.session : null;

const runOf = (state: TellState, session: Session, index: number) => state.runs.find((r) => r.id === `${session.id}-${index}`);

/** The first step of today's set not yet played, or null. */
export function currentStep(state: TellState, now: Date): { step: Step; index: number } | null {
  const s = todaysSession(state, now);
  if (!s || s.done) return null;
  const index = s.steps.findIndex((_, i) => !runOf(state, s, i));
  return index === -1 ? null : { step: s.steps[index], index };
}

/** Latest main-dial run per (experiment, with condition?). */
function cells(runs: Run[]) {
  const latest = new Map<string, Run>();
  for (const r of runs) {
    if (r.mechanic === 'slide' && r.dial !== 'main') continue;
    latest.set(`${r.card}:${r.mechanic === 'slide' && r.condition ? 1 : 0}`, r);
  }
  return latest;
}

const openEnded = (r: SlideRun) => r.outcome.kind === 'depends' || (r.outcome.kind === 'switch' && (r.outcome.at === 0 || r.outcome.at === r.steps.length));

interface Pick_ {
  card: Card;
  condition: boolean;
  reason: string;
}

/** The probe for a mechanic, by the published tiers. */
function probeFor(state: TellState, cards: Card[], mechanic: Mechanic, today: string, exclude: Set<string>): Pick_ | null {
  const played = cells(state.runs);
  const pool = cards.filter((c) => c.mechanic === mechanic && !exclude.has(c.id));
  const unplayed = pool.filter((c) => !played.has(`${c.id}:0`));
  const due = pool.filter((c) => {
    const r = played.get(`${c.id}:0`);
    return r && daysBetween(r.day, today) >= RETEST_DAYS;
  });
  const retest = (c: Card | undefined): Pick_ | null =>
    c ? { card: c, condition: false, reason: `You last played this ${daysBetween(played.get(`${c.id}:0`)!.day, today)} days ago. A retest shows whether your answer has moved.` } : null;

  if (mechanic !== 'slide') {
    const c = unplayed[0];
    const first = !state.runs.some((r) => r.mechanic === mechanic);
    if (c) return { card: c, condition: false, reason: first ? `You haven’t played a ${MECHANICS[mechanic].name} yet.` : `The next ${MECHANICS[mechanic].name} you haven’t played.` };
    return retest(due[0]);
  }

  const slides = unplayed.filter(isSlide);
  const slideRuns = state.runs.filter((r): r is SlideRun => r.mechanic === 'slide' && r.dial === 'main');

  // 1. Something an open call depends on.
  for (const call of state.calls.filter((c) => !c.follow)) {
    const kept = call.items.filter((i) => i.id === call.winner || i.id === call.order.at(-1)).map((i) => i.factor);
    const c = slides.find((s) => tradeoffOf(s).some((f) => kept.includes(f)));
    if (c) {
      const f = tradeoffOf(c).find((x) => kept.includes(x))!;
      return { card: c, condition: false, reason: `Your open call “${call.title}” protects ${factorName(f).toLowerCase()}. This puts a price on it.` };
    }
  }
  // 2. A condition that changed an answer once, checked in another setting.
  const once = [...changeTags(state.runs)].filter(([, n]) => n === 1).map(([t]) => t);
  const check = slides.find((s) => once.includes(s.condition.tag));
  if (check) return { card: check, condition: false, reason: `Having ${TAGS[check.condition.tag]} changed one of your answers. This checks it in another setting.` };
  // 3. A trade-off never tested.
  const tested = new Set(slideRuns.map((r) => key(r.tradeoff)));
  const untested = slides.find((s) => !tested.has(key(tradeoffOf(s))));
  if (untested) return { card: untested, condition: false, reason: `You haven’t tested ${tradeoffName(tradeoffOf(untested)).toLowerCase()} yet.` };
  // 4. A trade-off whose latest result was open-ended.
  const latest = new Map(slideRuns.map((r) => [key(r.tradeoff), r]));
  const loose = slides.find((s) => {
    const r = latest.get(key(tradeoffOf(s)));
    return r && openEnded(r);
  });
  if (loose) return { card: loose, condition: false, reason: `Your last ${tradeoffName(tradeoffOf(loose)).toLowerCase()} result was open-ended. This tries it in another setting.` };
  // 5. A result due for a retest. 6. Anything not played yet.
  const dueSlide = retest(due[0]);
  if (dueSlide) return dueSlide;
  const next = slides[0];
  return next ? { card: next, condition: false, reason: 'The next Slide in Tell’s list.' } : null;
}

function probe(state: TellState, cards: Card[], today: string): Pick_ | null {
  const done = state.runs.filter((r) => r.role === 'probe').length;
  for (let i = 0; i < ROTATION.length; i++) {
    const p = probeFor(state, cards, ROTATION[(done + i) % ROTATION.length], today, new Set());
    if (p) return p;
  }
  return null;
}

/** The factor a non-Slide probe surfaced, for the stress-test to price. */
function surfaced(run: Run): { factor: Factor; why: string } | null {
  if (run.mechanic === 'cut') {
    const f = run.items.find((i) => i.id === run.winner)!.factor;
    return { factor: f, why: `You kept ${factorName(f).toLowerCase()} to the end.` };
  }
  if (run.mechanic === 'peek') {
    const moved = movedFacts(run)[0] ?? run.opened[0]?.fact;
    if (moved === undefined) return null;
    const f = run.facts[moved].factor;
    return { factor: f, why: `A fact about ${factorName(f).toLowerCase()} ${movedFacts(run).length ? 'moved your lean' : 'was the first you opened'}.` };
  }
  if (run.mechanic === 'spend') {
    const rev = run.clashes.find((c) => run.coins[c.a] > run.coins[c.b] && c.pick === c.b);
    const i = rev ? rev.b : run.coins.indexOf(Math.max(...run.coins));
    const f = run.features[i].factor;
    return { factor: f, why: rev ? `Your choices favoured ${factorName(f).toLowerCase()} over your coins.` : `You spent most on ${factorName(f).toLowerCase()}.` };
  }
  return null;
}

function stress(state: TellState, cards: Card[], session: Session, today: string): Pick_ | null {
  const used = new Set(session.steps.map((s) => s.card));
  const first = runOf(state, session, 0)!;
  if (first.mechanic === 'slide') {
    const c = find(cards, first.card);
    const doneWith = session.steps.some((s, i) => s.card === first.card && s.condition && runOf(state, session, i));
    if (isSlide(c) && !first.condition && !doneWith) return { card: c, condition: true, reason: `The same choice, with one thing changed: ${c.condition.label}.` };
  } else {
    const s = surfaced(first);
    if (s) {
      const played = cells(state.runs);
      const pricing = cards.filter((c): c is SlideCard => isSlide(c) && !used.has(c.id) && tradeoffOf(c).includes(s.factor));
      const pending = pricing.find((c) => played.has(`${c.id}:0`) && !played.has(`${c.id}:1`));
      if (pending) return { card: pending, condition: true, reason: `${s.why} This puts a price on it, with ${pending.condition.label}.` };
      const fresh = pricing.find((c) => !played.has(`${c.id}:0`));
      if (fresh) return { card: fresh, condition: false, reason: `${s.why} This puts a price on it.` };
    }
  }
  return probeFor(state, cards, 'slide', today, used);
}

function connect(state: TellState, cards: Card[], session: Session, today: string): Pick_ | null {
  const used = new Set(session.steps.map((s) => s.card));
  const last = session.steps.map((_, i) => runOf(state, session, i)).filter((r): r is SlideRun => r?.mechanic === 'slide' && r.dial === 'main').at(-1);
  if (last) {
    const played = cells(state.runs);
    const same = cards.filter((c): c is SlideCard => isSlide(c) && !used.has(c.id) && key(tradeoffOf(c)) === key(last.tradeoff) && c.context !== last.context);
    const fresh = same.find((c) => !played.has(`${c.id}:0`));
    const due = same.find((c) => daysBetween(played.get(`${c.id}:0`)?.day ?? today, today) >= RETEST_DAYS);
    const c = fresh ?? due;
    if (c) return { card: c, condition: false, reason: `The same trade-off in ${CONTEXTS[c.context].toLowerCase()} instead of ${CONTEXTS[last.context].toLowerCase()}.` };
  }
  return probeFor(state, cards, 'slide', today, used);
}

const asStep = (p: Pick_, role: Step['role']): Step => ({ card: p.card.id, role, condition: p.condition, dial: 'main', reason: p.reason });

/** Whether today's set can start, and why not. */
export function setStatus(state: TellState, cards: Card[], now: Date): 'ready' | 'playing' | 'done' | 'empty' {
  const s = todaysSession(state, now);
  if (s) return s.done ? 'done' : 'playing';
  return probe(state, cards, localDay(now)) ? 'ready' : 'empty';
}

/** Start today's set: the probe is planned now, the rest as each experiment ends. */
export function startSet(state: TellState, cards: Card[], now: Date): TellState {
  const day = localDay(now);
  if (todaysSession(state, now)) throw new Error('Today’s set has already started');
  const p = probe(state, cards, day);
  if (!p) throw new Error('Nothing is ready to play');
  return { ...state, session: { id: day, day, steps: [asStep(p, 'probe')], done: false } };
}

function planNext(state: TellState, cards: Card[], session: Session, today: string): Step | null {
  const normal = session.steps.filter((s) => s.role !== 'depends').length;
  if (normal >= SET_SIZE) return null;
  const p = normal === 1 ? stress(state, cards, session, today) : connect(state, cards, session, today);
  return p ? asStep(p, normal === 1 ? 'stress' : 'connect') : null;
}

// ---- Recording ------------------------------------------------------------

export type Play =
  | { mechanic: 'slide'; guess?: number; asked: { step: number; pick: Side }[]; outcome: SlideOutcome }
  | { mechanic: 'cut'; order: string[] }
  | { mechanic: 'spend'; coins: number[]; clashes: { a: number; b: number; pick: number }[] }
  | { mechanic: 'peek'; before: Lean; opened: { fact: number; lean: Lean }[]; pick: Side; wouldHave: number[] };

/** Snapshot one finished experiment from what was shown and answered, then plan the next step. */
export function record(state: TellState, cards: Card[], play: Play, now: Date): TellState {
  const current = currentStep(state, now);
  if (!current) throw new Error('No experiment is waiting in today’s set');
  const session = state.session!;
  const { step, index } = current;
  const c = find(cards, step.card);
  if (!c || c.mechanic !== play.mechanic) throw new Error(`“${step.card}” is not a ${play.mechanic}`);
  const base = { id: `${session.id}-${index}`, session: session.id, role: step.role, card: c.id, v: c.v, context: c.context, title: c.title, at: now.toISOString(), day: localDay(now) };
  const by = rotation(state, c.mechanic);
  let run: Run;

  if (c.mechanic === 'slide' && play.mechanic === 'slide') {
    const { dial, tradeoff } = slideSetup(c, step);
    const n = dial.steps.length;
    // The record must be the halving it claims to be.
    play.asked.forEach((a, i) => {
      if (a.step !== nextAsk(n, dial.rises, play.asked.slice(0, i))) throw new Error('The Slide’s answers are out of order');
    });
    let o = play.outcome;
    if (o.kind === 'switch' && (nextAsk(n, dial.rises, play.asked) !== null || o.at !== bracket(n, dial.rises, play.asked).lo)) throw new Error('The Slide is not settled');
    if (o.kind !== 'switch' && nextAsk(n, dial.rises, play.asked) !== o.at) throw new Error('A Slide can only stop at the step being asked');
    if (o.kind === 'depends') {
      // What it depended on comes from the experiment, never from the caller.
      if (o.on === 'alt' && (!c.alt || step.dial === 'alt')) throw new Error('This Slide has nothing else to slide');
      if (o.on === 'condition' && step.condition) throw new Error('The condition is already on');
      o =
        o.on === 'alt'
          ? { kind: 'depends', at: o.at, on: 'alt', factor: c.alt!.factor, label: c.alt!.label }
          : o.on === 'condition'
            ? { kind: 'depends', at: o.at, on: 'condition', tag: c.condition.tag, label: c.condition.label }
            : { kind: 'depends', at: o.at, on: 'else' };
    }
    if (play.guess !== undefined && (play.guess < 0 || play.guess > n)) throw new Error('The guess is out of range');
    run = {
      ...base,
      mechanic: 'slide',
      tradeoff,
      dial: step.dial,
      measure: dial.measure,
      unit: dial.unit,
      steps: dial.steps,
      rises: dial.rises,
      ...(step.condition ? { condition: { tag: c.condition.tag, label: c.condition.label } } : {}),
      ...(play.guess !== undefined ? { guess: play.guess } : {}),
      asked: play.asked,
      outcome: o,
    };
  } else if (c.mechanic === 'cut' && play.mechanic === 'cut') {
    const items = rotate(c.items, by);
    const ids = items.map((i) => i.id);
    if (play.order.length !== 4 || new Set(play.order).size !== 4 || !play.order.every((id) => ids.includes(id))) throw new Error('A Cut drops four of its five');
    run = { ...base, mechanic: 'cut', items, order: play.order, winner: ids.find((id) => !play.order.includes(id))! };
  } else if (c.mechanic === 'spend' && play.mechanic === 'spend') {
    const { coins, clashes } = play;
    if (coins.length !== 5 || coins.some((x) => !Number.isInteger(x) || x < 0) || coins.reduce((a, b) => a + b, 0) !== COINS) throw new Error('Spend all 10 coins');
    const pairs = clashPairs(coins);
    if (clashes.length !== pairs.length || clashes.some((x, i) => x.a !== pairs[i].a || x.b !== pairs[i].b || (x.pick !== x.a && x.pick !== x.b))) throw new Error('The clashes don’t match the coins');
    run = { ...base, mechanic: 'spend', features: c.features.map(({ id, factor, label }) => ({ id, factor, label })), coins, clashes };
  } else if (c.mechanic === 'peek' && play.mechanic === 'peek') {
    const facts = rotate(c.facts, by).map(({ id, factor, label }) => ({ id, factor, label }));
    const opened = play.opened.map((o) => o.fact);
    if (opened.length > PEEKS || new Set(opened).size !== opened.length || opened.some((f) => f < 0 || f > 4)) throw new Error('Open at most three different facts');
    if (play.wouldHave.some((f) => opened.includes(f) || f < 0 || f > 4)) throw new Error('Only unopened facts can be marked');
    run = { ...base, mechanic: 'peek', a: c.a, b: c.b, facts, before: play.before, opened: play.opened, pick: play.pick, wouldHave: play.wouldHave };
  } else {
    throw new Error('That play doesn’t fit this experiment');
  }

  const runs = [...state.runs, run];
  const steps = [...session.steps];
  const next = { ...state, runs };
  // "It depends" on something testable: test it next, inside this set.
  if (run.mechanic === 'slide' && run.outcome.kind === 'depends' && step.role !== 'depends' && run.outcome.on !== 'else') {
    const alt = run.outcome.on === 'alt';
    steps.splice(index + 1, 0, {
      card: c.id,
      role: 'depends',
      condition: alt ? step.condition : true,
      dial: alt ? 'alt' : 'main',
      ...(alt ? { hold: run.outcome.at } : {}),
      reason: `You said it depends on ${alt ? (c as SlideCard).alt!.label : (c as SlideCard).condition.label}. This tests it.`,
    });
    return { ...next, session: { ...session, steps } };
  }
  const planned = planNext(next, cards, { ...session, steps }, localDay(now));
  return { ...next, session: { ...session, steps: planned ? [...steps, planned] : steps, done: !planned } };
}

// ---- What a run shows ------------------------------------------------------

/** Peek facts (indexes) whose opening changed the lean. */
export function movedFacts(run: PeekRun): number[] {
  let lean = run.before;
  return run.opened.flatMap((o) => {
    const moved = o.lean !== lean;
    lean = o.lean;
    return moved ? [o.fact] : [];
  });
}

const list = (xs: string[]) => (xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export interface Result {
  headline: string;
  lines: string[];
}

/** Every finished experiment yields a result, by construction. */
export function runResult(run: Run, currency: Currency): Result {
  if (run.mechanic === 'slide') {
    const o = run.outcome;
    const lines: string[] = [];
    if (run.guess !== undefined && o.kind !== 'depends') {
      lines.push(`You guessed ${interval(run.steps, run.unit, run.guess, currency)}.${guessMatched(run) ? ' Your choices landed there.' : ''}`);
    }
    if (o.kind === 'depends') return { headline: `It depended on ${dependsWhat(o)}.`, lines };
    if (o.kind === 'switch' && o.at === run.steps.length) {
      return { headline: `${run.measure}: ${slideRange(run, currency)}.`, lines: ['Within the range tested, the amount didn’t move your answer.', ...lines] };
    }
    if (o.kind === 'close') return { headline: `${run.measure}: ${slideRange(run, currency)}.`, lines: ['Too close to call there, so that’s about where you switch.', ...lines] };
    return { headline: `${run.measure}: ${slideRange(run, currency)}.`, lines };
  }
  if (run.mechanic === 'cut') {
    const text = (id: string) => run.items.find((i) => i.id === id)!.text;
    return {
      headline: `Last one standing: ${lower(text(run.winner))}.`,
      lines: [`First to go: ${lower(text(run.order[0]))}. Then ${list(run.order.slice(1).map((id) => lower(text(id))))}.`],
    };
  }
  if (run.mechanic === 'spend') {
    const label = (i: number) => lower(run.features[i].label);
    const differ = run.clashes.filter((c) => run.coins[c.a] !== run.coins[c.b]);
    const agree = differ.filter((c) => c.pick === c.a);
    const lines = run.clashes.map((c) => {
      const other = c.pick === c.a ? c.b : c.a;
      if (run.coins[c.a] === run.coins[c.b]) return `Same coins on ${label(c.a)} and ${label(c.b)}: you chose ${label(c.pick)}.`;
      if (c.pick === c.a) return `${capitalise(label(c.a))} (${plural(run.coins[c.a], 'coin')}) over ${label(c.b)} (${run.coins[c.b]}), as your coins said.`;
      return `You gave ${label(other)} ${plural(run.coins[other], 'coin')} and ${label(c.pick)} ${run.coins[c.pick]}, but chose ${label(c.pick)} when they clashed.`;
    });
    if (differ.length === 0) return { headline: `Your coins were tied, so your choices set the order: ${run.clashes.map((c) => label(c.pick)).join(', then ')}.`, lines };
    return { headline: `Your coins and your choices agreed in ${agree.length} of ${plural(differ.length, 'clash', 'clashes')} where the coins differed.`, lines };
  }
  const moved = movedFacts(run).map((i) => lower(run.facts[i].label));
  const unopened = run.facts.map((_, i) => i).filter((i) => !run.opened.some((o) => o.fact === i));
  const would = run.wouldHave.map((i) => lower(run.facts[i].label));
  const n = run.opened.length;
  const headline =
    n === 0
      ? 'You chose without opening a fact.'
      : moved.length === 0
        ? `None of the ${plural(n, 'fact')} you opened moved your lean.`
        : `Of the ${plural(n, 'fact')} you opened, ${moved.length === 1 ? 'only ' : ''}${list(moved)} moved your lean.`;
  const lines = [
    ...(n ? [`You opened ${lower(run.facts[run.opened[0].fact].label)} first.`] : []),
    would.length
      ? `Of the ${plural(unopened.length, 'fact')} you didn’t open, ${list(would)} would have changed your pick.`
      : `None of the ${plural(unopened.length, 'fact')} you didn’t open would have changed your pick.`,
  ];
  return { headline, lines };
}

// ---- Patterns: repeated choices and context changes ------------------------

export interface Pattern {
  id: string;
  kind: 'repeat' | 'change';
  text: string;
  counts: string;
  /** A repeat that no longer meets the rule stays on the Map, marked. */
  holds: boolean;
  first: { counts: string; day: string };
  runs: Run[];
  tag?: Tag;
}

const meets = (k: number, n: number) => k >= REPEAT_MIN && k >= REPEAT_SHARE * n;

/** Slide position for comparing two results: a close call sits between intervals. */
const position = (o: SlideOutcome) => (o.kind === 'switch' ? o.at : o.kind === 'close' ? o.at + 0.5 : null);

function changes(runs: Run[]): { card: string; base: SlideRun; cond: SlideRun }[] {
  const slides = runs.filter((r): r is SlideRun => r.mechanic === 'slide' && r.dial === 'main' && position(r.outcome) !== null);
  const out: { card: string; base: SlideRun; cond: SlideRun }[] = [];
  for (const id of new Set(slides.map((r) => r.card))) {
    const mine = slides.filter((r) => r.card === id);
    // The first run with the condition, against the nearest run without it: fixed once found.
    const cond = mine.find((r) => r.condition);
    if (!cond) continue;
    const before = mine.filter((r) => !r.condition && r.at <= cond.at).at(-1);
    const base = before ?? mine.find((r) => !r.condition);
    if (!base) continue;
    if (Math.abs(position(base.outcome)! - position(cond.outcome)!) >= CHANGE_GAP) out.push({ card: id, base, cond });
  }
  return out;
}

function changeTags(runs: Run[]): Map<Tag, number> {
  const m = new Map<Tag, number>();
  for (const c of changes(runs)) m.set(c.cond.condition!.tag, (m.get(c.cond.condition!.tag) ?? 0) + 1);
  return m;
}

/**
 * Patterns are derived by walking the log in order. A repeated choice is shown
 * once it meets the rule and stays, marked if later rounds bring it under. A
 * context change compares a Slide with and without its condition.
 */
export function patterns(runs: Run[], currency: Currency): Pattern[] {
  type Tally = { k: number; n: number; runs: Run[]; first?: { counts: string; day: string }; text: (k: number, n: number) => string };
  const tallies = new Map<string, Tally>();
  const dependsRuns: Run[] = [];
  const bump = (id: string, hit: boolean, run: Run, text: Tally['text']) => {
    const t = tallies.get(id) ?? { k: 0, n: 0, runs: [], text };
    t.n += 1;
    if (hit) t.k += 1;
    t.runs.push(run);
    if (!t.first && meets(t.k, t.n)) t.first = { counts: `${t.k} of ${t.n}`, day: run.day };
    tallies.set(id, t);
  };
  for (const r of runs) {
    if (r.mechanic === 'cut') {
      const lastTwo = [r.winner, r.order.at(-1)];
      for (const item of r.items) {
        const name = factorName(item.factor);
        bump(`kept:${item.factor}`, lastTwo.includes(item.id), r, (k, n) => `${name} made your final two in ${k} of ${plural(n, 'Cut')}.`);
        bump(`first:${item.factor}`, r.order[0] === item.id, r, (k, n) => `${name} was the first thing you cut in ${k} of ${plural(n, 'Cut')}.`);
      }
    } else if (r.mechanic === 'peek') {
      const moved = movedFacts(r);
      for (const o of r.opened) {
        const f = r.facts[o.fact].factor;
        bump(`moved:${f}`, moved.includes(o.fact), r, (k, n) => `Facts about ${factorName(f).toLowerCase()} moved your lean ${k} of the ${plural(n, 'time')} you opened one.`);
      }
    } else if (r.mechanic === 'slide' && r.outcome.kind === 'depends') {
      // Out of every "It depends" so far: how many depended on the same thing.
      const what = r.outcome.on === 'else' ? 'else' : (r.outcome.factor ?? r.outcome.tag!);
      const label = what === 'else' ? 'something else' : r.outcome.factor ? factorName(r.outcome.factor).toLowerCase() : TAGS[r.outcome.tag!];
      const id = `depends:${what}`;
      if (!tallies.has(id)) {
        tallies.set(id, { k: 0, n: dependsRuns.length, runs: [...dependsRuns], text: (k, n) => `When it depended, it depended on ${label}: ${k} of ${plural(n, 'time')}.` });
      }
      dependsRuns.push(r);
      for (const [tid, t] of tallies) {
        if (tid.startsWith('depends:')) bump(tid, tid === id, r, t.text);
      }
    }
  }
  const repeats: Pattern[] = [...tallies.entries()].flatMap(([id, t]) =>
    t.first ? [{ id, kind: 'repeat' as const, text: t.text(t.k, t.n), counts: `${t.k} of ${t.n}`, holds: meets(t.k, t.n), first: t.first, runs: t.runs }] : [],
  );
  const changed: Pattern[] = changes(runs).map(({ card, base, cond }) => ({
    id: `change:${card}`,
    kind: 'change',
    text: `${cond.measure}: ${slideRange(base, currency)}. With ${cond.condition!.label}: ${slideRange(cond, currency)}.`,
    counts: `${slideRange(base, currency)} / ${slideRange(cond, currency)}`,
    holds: true,
    first: { counts: '', day: cond.day },
    runs: [base, cond],
    tag: cond.condition!.tag,
  }));
  return [...changed, ...repeats];
}

// ---- The Map ---------------------------------------------------------------

export interface ChartCell {
  card: string;
  title: string;
  context: Card['context'];
  base?: SlideRun;
  cond?: SlideRun;
  label?: string;
  runs: SlideRun[];
}

/** Each trade-off with its Slides: the latest result with and without the condition, and every run. */
export function chart(runs: Run[], cards: Card[]): { tradeoff: [Factor, Factor]; cells: ChartCell[] }[] {
  const slideRuns = runs.filter((r): r is SlideRun => r.mechanic === 'slide');
  const rows = new Map<string, { tradeoff: [Factor, Factor]; cells: Map<string, ChartCell> }>();
  const row = (t: [Factor, Factor]) => rows.get(key(t)) ?? rows.set(key(t), { tradeoff: t, cells: new Map() }).get(key(t))!;
  for (const c of cards.filter(isSlide)) row(tradeoffOf(c)).cells.set(c.id, { card: c.id, title: c.title, context: c.context, label: c.condition.label, runs: [] });
  for (const r of slideRuns.filter((r) => r.dial === 'main')) {
    const cell = row(r.tradeoff).cells.get(r.card) ?? row(r.tradeoff).cells.set(r.card, { card: r.card, title: r.title, context: r.context, runs: [] }).get(r.card)!;
    if (r.condition) {
      cell.cond = r;
      cell.label = r.condition.label;
    } else cell.base = r;
  }
  for (const r of slideRuns) {
    for (const { cells } of rows.values()) cells.get(r.card)?.runs.push(r);
  }
  return [...rows.values()].map((r) => ({ tradeoff: r.tradeoff, cells: [...r.cells.values()] }));
}

/** How much of Tell's design has a result: each Slide with and without its condition, and each other experiment. */
export function charted(runs: Run[], cards: Card[]): { done: number; total: number } {
  const played = cells(runs);
  const all = cards.flatMap((c) => (c.mechanic === 'slide' ? [`${c.id}:0`, `${c.id}:1`] : [`${c.id}:0`]));
  return { done: all.filter((k) => played.has(k)).length, total: all.length };
}

/** Per factor, across Cuts: made the final two, and cut first, out of the Cuts that offered it. */
export function protectedRecord(runs: Run[]) {
  const cuts = runs.filter((r): r is CutRun => r.mechanic === 'cut');
  return FACTORS.map(({ id }) => {
    const offered = cuts.filter((r) => r.items.some((i) => i.factor === id));
    const itemOf = (r: CutRun) => r.items.find((i) => i.factor === id)!.id;
    return {
      factor: id,
      offered: offered.length,
      kept: offered.filter((r) => [r.winner, r.order.at(-1)].includes(itemOf(r))).length,
      first: offered.filter((r) => r.order[0] === itemOf(r)).length,
      runs: offered,
    };
  }).filter((r) => r.offered > 0);
}

/** Per factor, across Peeks: how often a fact moved the lean when opened, and unopened facts that would have changed the pick. */
export function movesRecord(runs: Run[]) {
  const peeks = runs.filter((r): r is PeekRun => r.mechanic === 'peek');
  return FACTORS.map(({ id }) => {
    let opened = 0;
    let moved = 0;
    let would = 0;
    for (const r of peeks) {
      const m = movedFacts(r);
      for (const o of r.opened) if (r.facts[o.fact].factor === id) (opened++, m.includes(o.fact) && moved++);
      for (const i of r.wouldHave) if (r.facts[i].factor === id) would++;
    }
    return { factor: id, opened, moved, would };
  }).filter((r) => r.opened > 0 || r.would > 0);
}

export function guessRecord(runs: Run[]): { matched: number; of: number } {
  const judged = runs.filter((r): r is SlideRun => r.mechanic === 'slide').map(guessMatched).filter((m) => m !== undefined);
  return { matched: judged.filter(Boolean).length, of: judged.length };
}

/** Same trade-off, other contexts: the latest results to set beside this one. */
export function sameTradeoff(runs: Run[], run: SlideRun): SlideRun[] {
  const latest = new Map<string, SlideRun>();
  for (const r of runs) {
    if (r.mechanic === 'slide' && r.dial === 'main' && !r.condition && r.card !== run.card && key(r.tradeoff) === key(run.tradeoff) && r.at < run.at) latest.set(r.card, r);
  }
  return [...latest.values()];
}

/** Earlier runs of the same experiment and condition. */
export const earlier = (runs: Run[], run: Run) =>
  runs.filter(
    (r) =>
      r.card === run.card &&
      r.at < run.at &&
      (r.mechanic !== 'slide' || run.mechanic !== 'slide' || (r.dial === run.dial && !!r.condition === !!run.condition)),
  );

// ---- Notes, principles, ratings, currency ----------------------------------

/** A verdict is a note filed with the counts it was given against, never evidence. */
export function addNote(state: TellState, pattern: string, verdict: Verdict, counts: string, now: Date): TellState {
  return { ...state, notes: [...state.notes, { pattern, verdict, counts, at: now.toISOString() }] };
}
export const latestNote = (state: TellState, pattern: string) => state.notes.filter((n) => n.pattern === pattern).at(-1);

export function addPrinciple(state: TellState, text: string, now: Date, call?: string): TellState {
  const t = text.trim();
  if (!t) return state;
  const id = `p-${state.principles.length + 1}-${now.getTime()}`;
  return { ...state, principles: [...state.principles, { id, text: t, at: now.toISOString(), ...(call ? { call } : {}) }] };
}
export const removePrinciple = (state: TellState, id: string): TellState => ({ ...state, principles: state.principles.filter((p) => p.id !== id) });

export function rate(state: TellState, session: string, rating: Rating, now: Date): TellState {
  return { ...state, ratings: [...state.ratings.filter((r) => r.session !== session), { session, rating, at: now.toISOString() }] };
}

export function ratingRecord(state: TellState): { good: number; of: number } {
  return { good: state.ratings.filter((r) => r.rating !== 'meh').length, of: state.ratings.length };
}

/** For each experiment: how the sets it was in were rated. Content quality, for whoever writes the experiments. */
export function ratingsByCard(state: TellState): Map<string, Record<Rating, number>> {
  const out = new Map<string, Record<Rating, number>>();
  for (const r of state.ratings) {
    for (const id of new Set(state.runs.filter((x) => x.session === r.session).map((x) => x.card))) {
      const t = out.get(id) ?? { useful: 0, interesting: 0, meh: 0 };
      t[r.rating] += 1;
      out.set(id, t);
    }
  }
  return out;
}

export const setCurrency = (state: TellState, currency: Currency): TellState => ({ ...state, currency });

// ---- Calls -----------------------------------------------------------------

export type CallDraft = Omit<Call, 'id' | 'at' | 'day' | 'due' | 'follow'>;

export function addCall(state: TellState, draft: CallDraft, dueInDays: number, now: Date): TellState {
  const day = localDay(now);
  const call: Call = { ...draft, id: `c-${state.calls.length + 1}-${now.getTime()}`, at: now.toISOString(), day, due: addDays(day, dueInDays) };
  return { ...state, calls: [...state.calls, call] };
}

export function followUp(state: TellState, id: string, follow: Omit<NonNullable<Call['follow']>, 'at'>, now: Date): TellState {
  const call = state.calls.find((c) => c.id === id);
  if (!call) throw new Error('That call doesn’t exist');
  if (call.follow) throw new Error('That call is already closed');
  return { ...state, calls: state.calls.map((c) => (c.id === id ? { ...c, follow: { ...follow, at: now.toISOString() } } : c)) };
}

export const dueCalls = (state: TellState, now: Date) => state.calls.filter((c) => !c.follow && c.due <= localDay(now));

const other = (s: Side): Side => (s === 'a' ? 'b' : 'a');

/** The call's Slide, in words. Picks are "a" for staying with the lean and "b" for switching. */
export function callSlideText(call: Call, currency: Currency): string | null {
  const s = call.slide;
  if (!s || call.lean === 'none') return null;
  const lean = call.options[call.lean === 'a' ? 0 : 1];
  const away = call.options[other(call.lean) === 'a' ? 0 : 1];
  const v = (i: number) => s.phrase.replace('{x}', value(s.unit, s.steps[i], currency));
  const o = s.outcome;
  if (o.kind === 'close') return `If ${lean} ${v(o.at)}, it would be too close to call.`;
  if (o.kind !== 'switch') return null;
  if (o.at === 0) return `Even if ${lean} ${v(0)}, you’d switch to ${away}.`;
  if (o.at === s.steps.length) return `You’d still pick ${lean} even if it ${v(s.steps.length - 1)}.`;
  return `You’d still pick ${lean} if it ${v(o.at - 1)}, but not if it ${v(o.at)}.`;
}

export function callSummary(call: Call, currency: Currency): string[] {
  const text = (id: string) => call.items.find((i) => i.id === id)!.text;
  const lines = [`What matters most here: ${lower(text(call.winner))}, then ${lower(text(call.order.at(-1)!))}. First to go: ${lower(text(call.order[0]))}.`];
  const lean = call.lean === 'none' ? null : call.options[call.lean === 'a' ? 0 : 1];
  lines.push(lean ? `You’re leaning towards ${lean}.` : 'It’s too close to call between them.');
  const slide = callSlideText(call, currency);
  if (slide) lines.push(slide);
  const would = call.unknowns.filter((u) => u.answer === 'yes').map((u) => lower(u.text));
  const wouldnt = call.unknowns.filter((u) => u.answer === 'no').map((u) => lower(u.text));
  const unsure = call.unknowns.filter((u) => u.answer === 'unsure').map((u) => lower(u.text));
  if (would.length) lines.push(`Could change your pick, so worth finding out: ${list(would)}.`);
  if (wouldnt.length) lines.push(`Wouldn’t change it, so you can skip: ${list(wouldnt)}.`);
  if (unsure.length) lines.push(`Not sure yet: ${list(unsure)}.`);
  return lines;
}

/** A plain-text brief for the player's own AI. Built only from the call. */
export function brief(call: Call, kindName: string, currency: Currency): string {
  return [
    `A decision I’m making: ${call.title} (${kindName.toLowerCase()}).`,
    `Option A: ${call.options[0]}. Option B: ${call.options[1]}.`,
    ...callSummary(call, currency),
    '',
    'This comes from my answers to small choices in Tell, not fixed preferences. Help me find out the things that could change my pick, and question my reasoning, without deciding for me.',
  ].join('\n');
}

// ---- Lessons: what closed calls teach, in fixed vocabulary only -----------

export function lessonOf(call: Call): Lesson | null {
  const f = call.follow;
  if (!f) return null;
  const feature = (item: string) => call.items.find((i) => i.id === item);
  return {
    id: f.lesson,
    kind: call.kind,
    went: f.went,
    mattered: f.mattered.flatMap((m) => {
      const i = feature(m.item);
      return i && !i.own ? [{ feature: i.id, how: m.how }] : [];
    }),
    missed: f.missed.flatMap((m) => (m.check ? [m.check] : [])),
    other: f.missed.filter((m) => !m.check).length,
  };
}

export const myLessons = (state: TellState): Lesson[] => state.calls.flatMap((c) => lessonOf(c) ?? []);

/** The file shared with someone else: the lessons and nothing more. */
export const lessonsFile = (state: TellState) => JSON.stringify({ tell: 'lessons', v: 1, lessons: myLessons(state) }, null, 2);

/** A short content hash (FNV-1a) so the same file isn't counted twice. */
export function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, '0');
}

/** Add someone's lessons: only ones not already here, and never your own coming back. */
export function addPool(
  state: TellState,
  lessons: Lesson[],
  now: Date,
): { ok: true; state: TellState; added: number; skipped: number } | { ok: false; error: string } {
  if (lessons.length === 0) return { ok: false, error: 'That file has no lessons in it.' };
  const known = new Set([...state.pool.flatMap((p) => p.lessons.map((l) => l.id)), ...myLessons(state).map((l) => l.id)]);
  const fresh = lessons.filter((l, i) => !known.has(l.id) && lessons.findIndex((x) => x.id === l.id) === i);
  if (fresh.length === 0) return { ok: false, error: 'Those lessons are already here.' };
  const source = { id: hash(JSON.stringify(fresh)), added: localDay(now), lessons: fresh };
  return { ok: true, state: { ...state, pool: [...state.pool, source] }, added: fresh.length, skipped: lessons.length - fresh.length };
}

export interface Noticed {
  /** Things that mattered more than expected, and things not considered, from your own closed calls. */
  mine: { calls: number; more: { id: string; count: number }[]; missed: { id: string; count: number }[]; typed: string[] };
  /** The same from shared lessons, only where at least POOL_MIN shared calls agree. */
  shared: { calls: number; more: { id: string; count: number }[]; missed: { id: string; count: number }[]; below: number; other: number };
}

function tallyLessons(lessons: Lesson[]) {
  const more = new Map<string, number>();
  const missed = new Map<string, number>();
  for (const l of lessons) {
    for (const m of l.mattered) if (m.how === 'more') more.set(m.feature, (more.get(m.feature) ?? 0) + 1);
    for (const c of new Set(l.missed)) missed.set(c, (missed.get(c) ?? 0) + 1);
  }
  const sorted = (m: Map<string, number>) => [...m.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count);
  return { more: sorted(more), missed: sorted(missed) };
}

export function noticed(state: TellState, kindId: string): Noticed {
  const mineCalls = state.calls.filter((c) => c.kind === kindId && c.follow);
  const mine = tallyLessons(mineCalls.map((c) => lessonOf(c)!));
  const pool = state.pool.flatMap((p) => p.lessons).filter((l) => l.kind === kindId);
  const shared = tallyLessons(pool);
  const keep = (xs: { id: string; count: number }[]) => xs.filter((x) => x.count >= POOL_MIN);
  return {
    mine: { calls: mineCalls.length, ...mine, typed: mineCalls.flatMap((c) => c.follow!.missed.flatMap((m) => (m.text ? [m.text] : []))) },
    shared: {
      calls: pool.length,
      more: keep(shared.more),
      missed: keep(shared.missed),
      below: [...shared.more, ...shared.missed].filter((x) => x.count < POOL_MIN).length,
      other: pool.reduce((n, l) => n + l.other, 0),
    },
  };
}

/** What a lesson says, in words, for previewing a shared file. */
export function lessonText(l: Lesson, k: Kind | undefined): string {
  const feature = (id: string) => lower(k?.features.find((f) => f.id === id)?.text ?? id);
  const check = (id: string) => lower(k?.checks.find((c) => c.id === id)?.text ?? id);
  const went = { better: 'better than expected', expected: 'as expected', worse: 'worse than expected' }[l.went];
  const parts = [`${k?.name ?? l.kind}: went ${went}`];
  const more = l.mattered.filter((m) => m.how === 'more').map((m) => feature(m.feature));
  const less = l.mattered.filter((m) => m.how === 'less').map((m) => feature(m.feature));
  if (more.length) parts.push(`mattered more: ${list(more)}`);
  if (less.length) parts.push(`mattered less: ${list(less)}`);
  if (l.missed.length) parts.push(`hadn’t considered: ${list(l.missed.map(check))}`);
  if (l.other) parts.push(`${plural(l.other, 'other thing')} not on Tell’s list`);
  return `${parts.join('; ')}.`;
}

export const WENT: Record<Went, string> = { better: 'Better than expected', expected: 'As expected', worse: 'Worse than expected' };
export const MATTERED: Record<Mattered, string> = { more: 'More', expected: 'As expected', less: 'Less' };
export const ANSWER3: Record<Answer3, string> = { yes: 'Yes', no: 'No', unsure: 'Not sure' };
