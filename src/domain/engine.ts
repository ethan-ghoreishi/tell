import { START } from './episodes';
import { list, lower, shortDate, value } from './text';
import {
  CIRCUMSTANCES,
  FEATURES,
  HOW,
  NEXT,
  PART_ORDER,
  PARTS,
  SCHEMA,
  UNSURE,
  type BeatAnswer,
  type Choice,
  type ChoiceContent,
  type Episode,
  type Feature,
  type FlowStep,
  type Match,
  type Option,
  type Outcome,
  type Answer,
  type Play,
  type Ref,
  type Side,
  type Source,
  type Takeaway,
  type TellState,
  type Unit,
} from './types';

// Pure domain logic. Nothing here reads a clock or touches storage: callers
// pass `now` and get new state back. Everything shown about the past is read
// from snapshots (plays, saves, outcomes, match texts), never from today's
// content, so revising one thing never rewrites the evidence for another.

export const emptyState = (): TellState => ({ schema: SCHEMA, plays: [], choices: [], takeaways: [], archive: [] });

const pad = (n: number) => String(n).padStart(2, '0');

/** The local calendar day, YYYY-MM-DD. A day is the player's day, not UTC's. */
export const localDay = (now: Date) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x));

/** The next free id like "o3" in a list that uses ids like "o1", "o2". */
export const freshId = (prefix: string, items: { id: string }[]) =>
  `${prefix}${Math.max(0, ...items.map((i) => Number(i.id.slice(prefix.length)) || 0)) + 1}`;

// ---- Slide: one value changes, halving the gap each time ------------------

/**
 * `at` is the first step where the rising option wins, somewhere in lo..hi
 * (hi = steps.length means it never does). Seven steps settle in three choices.
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

/** The next step to ask, or null once the switch point is settled. */
export function nextAsk(n: number, rises: Side, asked: { step: number; pick: Side }[]): number | null {
  const { lo, hi } = bracket(n, rises, asked);
  return lo < hi ? Math.floor((lo + hi) / 2) : null;
}

// ---- Plays: hypothetical answers to invented stories ----------------------

export interface PlayAnswers {
  first: Answer;
  beat: BeatAnswer;
  final: Answer;
}

type Shown = Play['shown'];

/** The options on offer at the second question: a twist or a widen can add some. */
export function secondOptions(e: Shown, beat: BeatAnswer): Option[] {
  if (e.beat.kind === 'twist' && e.beat.adds) return [...e.options, e.beat.adds];
  if (e.beat.kind === 'widen' && beat.kind === 'widen') return [...e.options, ...e.beat.items.filter((i) => beat.picked.includes(i.id))];
  return e.options;
}

const distinct = (xs: unknown[]) => new Set(xs).size === xs.length;

/** Snapshot a finished play. Refuses answers that aren't what the episode asked. */
export function recordPlay(state: TellState, episodes: Episode[], id: string, a: PlayAnswers, now: Date): TellState {
  const e = episodes.find((x) => x.id === id);
  if (!e) throw new Error(`There is no episode “${id}”`);
  const ids = (os: Option[]) => [...os.map((o) => o.id), UNSURE];
  if (!ids(e.options).includes(a.first)) throw new Error('The first answer isn’t one of the options');
  const b = e.beat;
  const x = a.beat;
  if (b.kind !== x.kind) throw new Error('That answer doesn’t fit this episode');
  if (b.kind === 'cut' && x.kind === 'cut') {
    const items = b.items.map((i) => i.id);
    if (x.order.length !== items.length - 1 || !distinct(x.order) || !x.order.every((o) => items.includes(o))) throw new Error('A Cut drops all but one');
  }
  if (b.kind === 'widen' && x.kind === 'widen') {
    if (!distinct(x.picked) || !x.picked.every((p) => b.items.some((i) => i.id === p))) throw new Error('Those aren’t the options on offer');
  }
  if (b.kind === 'peek' && x.kind === 'peek') {
    const facts = x.opened.map((o) => o.fact);
    const inRange = (f: number) => Number.isInteger(f) && f >= 0 && f < b.facts.length;
    if (facts.length > b.opens || !distinct(facts) || !facts.every(inRange)) throw new Error(`Open at most ${b.opens} different facts`);
    if (!x.opened.every((o) => ids(e.options).includes(o.lean))) throw new Error('A lean isn’t one of the options');
    if (!distinct(x.wouldHave) || !x.wouldHave.every((f) => inRange(f) && !facts.includes(f))) throw new Error('Only facts left closed can be marked');
  }
  if (b.kind === 'slide' && x.kind === 'slide') {
    const n = b.steps.length;
    // The record must be the halving it claims to be.
    x.asked.forEach((q, i) => {
      if (q.step !== nextAsk(n, b.rises, x.asked.slice(0, i))) throw new Error('The Slide’s answers are out of order');
    });
    const o = x.outcome;
    if (o.kind === 'switch' && (nextAsk(n, b.rises, x.asked) !== null || o.at !== bracket(n, b.rises, x.asked).lo)) throw new Error('The Slide isn’t settled');
    if (o.kind === 'close' && nextAsk(n, b.rises, x.asked) !== o.at) throw new Error('A Slide can only stop at the step being asked');
  }
  if (!ids(secondOptions(e, x)).includes(a.final)) throw new Error('The second answer isn’t one of the options');

  const { rationale: _, ...shown } = e;
  const play: Play = {
    id: `p${state.plays.length + 1}-${now.getTime()}`,
    episode: e.id,
    v: e.v,
    at: now.toISOString(),
    day: localDay(now),
    replay: state.plays.filter((p) => p.episode === e.id).length,
    shown: copy(shown),
    first: a.first,
    beat: copy(a.beat),
    final: a.final,
  };
  return { ...state, plays: [...state.plays, play] };
}

/** Any option's words, including ones added by the episode's move. */
export function optionText(e: Shown, id: Answer): string {
  if (id === UNSURE) return 'Not sure';
  const extra = e.beat.kind === 'twist' && e.beat.adds ? [e.beat.adds] : e.beat.kind === 'widen' ? e.beat.items : [];
  return [...e.options, ...extra].find((o) => o.id === id)?.text ?? id;
}

/** The interval a Slide settled, in words, from its value list. */
export function slideLine(steps: number[], unit: Unit, o: Extract<BeatAnswer, { kind: 'slide' }>['outcome']) {
  const v = (i: number) => value(unit, steps[i]);
  if (o.kind === 'close') return `about ${v(o.at)}`;
  if (o.at <= 0) return `${v(0)} or fewer`;
  if (o.at >= steps.length) return `more than ${v(steps.length - 1)}`;
  return `between ${v(o.at - 1)} and ${v(o.at)}`;
}

/** Which side a Slide's own line points to at a value, or null when the line can't say. */
export function lineSays(steps: number[], rises: Side, o: Extract<BeatAnswer, { kind: 'slide' }>['outcome'], x: number): Side | null {
  const other: Side = rises === 'a' ? 'b' : 'a';
  if (o.kind === 'close') return x === steps[o.at] ? null : x > steps[o.at] ? rises : other;
  if (o.at < steps.length && x >= steps[o.at]) return rises;
  if (o.at > 0 && x <= steps[o.at - 1]) return other;
  return null;
}

export interface PlayView {
  point: string;
  /** What was answered, as fixed sentences filled from the record. */
  observed: string[];
  /** Possible readings, authored, chosen by whether the answer changed. */
  readings: string[];
  unknown: string;
  apply: string;
  changed: boolean;
}

export function playView(play: Play): PlayView {
  const e = play.shown;
  const say = (id: Answer) => (id === UNSURE ? 'not sure yet' : `“${optionText(e, id)}”`);
  const changed = play.first !== play.final;
  const observed = [`First answer: ${say(play.first)}.`];
  const b = e.beat;
  const x = play.beat;
  if (b.kind === 'twist' && b.adds) observed.push(`A new option appeared: “${b.adds.text}”.`);
  if (b.kind === 'widen' && x.kind === 'widen') {
    observed.push(x.picked.length ? `Of the other options, you’d seriously consider ${list(x.picked.map(say))}.` : 'You wouldn’t seriously consider any of the other options.');
  }
  if (b.kind === 'cut' && x.kind === 'cut') {
    const text = (id: string) => `“${b.items.find((i) => i.id === id)!.text}”`;
    const kept = b.items.find((i) => !x.order.includes(i.id))!.id;
    observed.push(`Last one standing: ${text(kept)}. First to go: ${text(x.order[0])}.`);
  }
  if (b.kind === 'peek' && x.kind === 'peek') {
    const label = (f: number) => lower(b.facts[f].label);
    if (x.opened.length === 0) observed.push('You chose without opening a fact.');
    else {
      observed.push(`You opened ${list(x.opened.map((o) => label(o.fact)))}.`);
      let lean = play.first;
      const moved = x.opened.flatMap((o) => {
        const m = o.lean !== lean;
        lean = o.lean;
        return m ? [label(o.fact)] : [];
      });
      observed.push(moved.length ? `Your lean moved after ${list(moved)}.` : 'None of them moved your lean.');
    }
    const closed = b.facts.length - x.opened.length;
    if (closed > 0) {
      observed.push(
        x.wouldHave.length
          ? `Of the facts you left closed, you said ${list(x.wouldHave.map(label))} would have changed your answer.`
          : 'You said none of the facts you left closed would have changed your answer.',
      );
    }
  }
  if (b.kind === 'slide' && x.kind === 'slide') {
    observed.push(`${b.measure}: ${slideLine(b.steps, b.unit, x.outcome)}.`);
    if (b.actual) {
      const says = lineSays(b.steps, b.rises, x.outcome, b.actual.value);
      const side = (s: Side) => e.options[s === 'a' ? 0 : 1].id;
      observed.push(
        says === null
          ? `The story’s number was ${value(b.unit, b.actual.value)}, which falls where your line doesn’t say either way.`
          : `The story’s number was ${value(b.unit, b.actual.value)}. By your line, that points to ${say(side(says))}.` +
              (play.final === UNSURE ? '' : play.final === side(says) ? ' Your second answer followed it.' : ' Your second answer went the other way.'),
      );
    }
  }
  observed.push(`Second answer: ${say(play.final)}${changed ? '.' : ', the same as your first.'}`);
  return { point: e.ending.point, observed, readings: changed ? e.ending.changed : e.ending.stayed, unknown: e.ending.unknown, apply: e.ending.apply, changed };
}

/** Earlier plays of the same episode, so a replay is shown as one. */
export const earlierPlays = (state: TellState, play: Play) => state.plays.filter((p) => p.episode === play.episode && p.at < play.at);

/** The library: every episode, in order, with its plays. Finite and inspectable. */
export const library = (state: TellState, episodes: Episode[]) => episodes.map((episode) => ({ episode, plays: state.plays.filter((p) => p.episode === episode.id) }));

/** What to offer next: the recommended start, then the next unplayed episode. Null once all are played. */
export function suggestion(state: TellState, episodes: Episode[]): { episode: Episode; reason: string } | null {
  const played = new Set(state.plays.map((p) => p.episode));
  const start = episodes.find((e) => e.id === START);
  if (start && !played.has(start.id)) return { episode: start, reason: 'Start here' };
  const next = episodes.find((e) => !played.has(e.id));
  return next ? { episode: next, reason: 'Not played yet' } : null;
}

// ---- Takeaways: interpretations the player chose to keep -------------------

export const wording = (t: Takeaway) => t.versions.at(-1)!.text;

function sourceExists(state: TellState, s: Source): boolean {
  if (s.kind === 'play') return state.plays.some((p) => p.id === s.play);
  if (s.kind === 'choice') return !!state.choices.find((c) => c.id === s.choice)?.saves[s.save];
  if (s.kind === 'outcome') return !!state.choices.find((c) => c.id === s.choice)?.outcomes.some((o) => o.id === s.outcome);
  return true;
}

/** The features a takeaway carries for matching, from its source as it was. */
function featuresOf(state: TellState, s: Source): Feature[] {
  if (s.kind === 'play') return [...state.plays.find((p) => p.id === s.play)!.shown.features];
  const c = s.kind === 'choice' || s.kind === 'outcome' ? state.choices.find((x) => x.id === s.choice)! : null;
  if (s.kind === 'choice') return choiceFeatures(c!.saves[s.save].content);
  if (s.kind === 'outcome' && c && c.saves.length) return choiceFeatures(c.saves.at(-1)!.content);
  return [];
}

export function keep(state: TellState, id: string, text: string, source: Source, now: Date): TellState {
  const t = text.trim();
  if (!t) throw new Error('A takeaway needs words');
  if (state.takeaways.some((x) => x.id === id)) throw new Error('That takeaway already exists');
  if (!sourceExists(state, source)) throw new Error('A takeaway must point at something that exists');
  const at = now.toISOString();
  return { ...state, takeaways: [...state.takeaways, { id, at, source, versions: [{ at, text: t }], features: featuresOf(state, source), retired: '' }] };
}

const changeTakeaway = (state: TellState, id: string, f: (t: Takeaway) => Takeaway): TellState => {
  if (!state.takeaways.some((t) => t.id === id)) throw new Error('That takeaway doesn’t exist');
  return { ...state, takeaways: state.takeaways.map((t) => (t.id === id ? f(t) : t)) };
};

/** A revision adds a wording; the earlier ones, and the evidence, stay. */
export const revise = (state: TellState, id: string, text: string, now: Date): TellState =>
  changeTakeaway(state, id, (t) => {
    const next = text.trim();
    return !next || next === wording(t) ? t : { ...t, versions: [...t.versions, { at: now.toISOString(), text: next }] };
  });

export const retire = (state: TellState, id: string, now: Date) => changeTakeaway(state, id, (t) => ({ ...t, retired: now.toISOString() }));
export const restore = (state: TellState, id: string) => changeTakeaway(state, id, (t) => ({ ...t, retired: '' }));

/** Where a takeaway came from, labelled by kind of record. */
export function sourceLabel(state: TellState, s: Source): string {
  if (s.kind === 'play') {
    const p = state.plays.find((x) => x.id === s.play);
    return p ? `From an invented story, “${p.shown.title}”, ${shortDate(p.day)}${p.replay ? ` (replay ${p.replay})` : ''}` : 'From an invented story';
  }
  if (s.kind === 'choice' || s.kind === 'outcome') {
    const c = state.choices.find((x) => x.id === s.choice);
    const title = c?.saves.at(-1)?.content.title ?? c?.title ?? 'a choice';
    if (s.kind === 'choice') return `From your choice “${title}”, as saved ${c?.saves[s.save] ? shortDate(c.saves[s.save].at) : ''}`.trim();
    const o = c?.outcomes.find((x) => x.id === s.outcome);
    return `From what happened with “${title}”${o ? `, ${shortDate(o.at)}` : ''}`;
  }
  if (s.kind === 'earlier') return 'Written by you in an earlier version of Tell';
  return 'Written by you';
}

// ---- Choices: what the player says about a real choice --------------------

export const emptyContent = (): ChoiceContent => ({
  title: '',
  situation: '',
  circumstances: [],
  parts: [],
  unsure: false,
  prompt: '',
  worth: '',
  notWorth: '',
  options: [],
  lean: '',
  criteria: [],
  top: '',
  ruledOut: [],
  unknowns: [],
  matches: [],
  clearer: '',
  unresolved: '',
  next: null,
  expectation: null,
});

const CONTENT_KEYS = Object.keys(emptyContent()) as (keyof ChoiceContent)[];

export const contentOf = (c: Choice): ChoiceContent => copy(Object.fromEntries(CONTENT_KEYS.map((k) => [k, c[k]])) as unknown as ChoiceContent);

export function createChoice(state: TellState, id: string, now: Date, init: Partial<ChoiceContent> = {}): TellState {
  if (state.choices.some((c) => c.id === id)) throw new Error('That choice already exists');
  const at = now.toISOString();
  const choice: Choice = { ...emptyContent(), ...copy(init), id, created: at, updated: at, draft: true, step: 'start', saves: [], outcomes: [] };
  return { ...state, choices: [...state.choices, choice] };
}

const changeChoice = (state: TellState, id: string, f: (c: Choice) => Choice): TellState => {
  if (!state.choices.some((c) => c.id === id)) throw new Error('That choice doesn’t exist');
  return { ...state, choices: state.choices.map((c) => (c.id === id ? f(c) : c)) };
};

/** Edit a draft: a choice being written or revised. Saved words change only through a new save. */
export const editChoice = (state: TellState, id: string, patch: Partial<ChoiceContent> & { step?: FlowStep }, now: Date): TellState =>
  changeChoice(state, id, (c) => {
    if (!c.draft) throw new Error('Revise a saved choice before editing it');
    return { ...c, ...copy(patch), updated: now.toISOString() };
  });

/** Save adds a snapshot; earlier saves stay as they were. */
export const saveChoice = (state: TellState, id: string, now: Date): TellState =>
  changeChoice(state, id, (c) => {
    if (!c.title.trim()) throw new Error('A choice needs a title');
    const at = now.toISOString();
    return { ...c, draft: false, updated: at, saves: [...c.saves, { at, content: contentOf(c) }] };
  });

export const reviseChoice = (state: TellState, id: string, now: Date): TellState =>
  changeChoice(state, id, (c) => ({ ...c, draft: true, step: 'summary', updated: now.toISOString() }));

/** Throw away a draft: one never saved goes; one being revised goes back to its last save. */
export function discardDraft(state: TellState, id: string): TellState {
  const c = state.choices.find((x) => x.id === id);
  if (!c?.draft) throw new Error('Only a draft can be discarded');
  if (!c.saves.length) return { ...state, choices: state.choices.filter((x) => x.id !== id) };
  return changeChoice(state, id, (x) => ({ ...x, ...copy(x.saves.at(-1)!.content), draft: false }));
}

/** A choice is current until the player says it's settled. */
export const isCurrent = (c: Choice) => c.draft || !c.outcomes.at(-1)?.settled;

/** The steps of Bring a choice: only the parts that feel unresolved, all four when unsure. */
export function flowSteps(content: ChoiceContent, examples: boolean): FlowStep[] {
  const parts = content.unsure ? PART_ORDER : PART_ORDER.filter((p) => content.parts.includes(p));
  return ['start', 'unresolved', ...parts, ...(examples ? (['examples'] as const) : []), 'summary'];
}

/** A summary built mechanically from the player's own words, for them to edit. */
export function draftSummary(c: ChoiceContent): { clearer: string; unresolved: string } {
  const clearer: string[] = [];
  const unresolved: string[] = [];
  const looked = (p: (typeof PART_ORDER)[number]) => c.unsure || c.parts.includes(p);
  if (c.worth.trim()) clearer.push(`Worth it if: ${c.worth.trim()}`);
  if (c.notWorth.trim()) clearer.push(`Not worth it if: ${c.notWorth.trim()}`);
  if (looked('purpose') && !c.worth.trim()) unresolved.push('What would make it worthwhile.');
  const option = (o: ChoiceContent['options'][number]) =>
    `${o.text}${c.lean === o.id ? ' (leaning)' : ''}${c.ruledOut.includes(o.id) ? ' (ruled out by a must)' : ''}`;
  if (c.options.length) clearer.push(`Options: ${c.options.map(option).join('; ')}`);
  if (looked('possibilities') && c.options.length === 0) unresolved.push('What the options are.');
  if (c.options.length > 1 && !c.lean) unresolved.push('No lean yet between the options.');
  const musts = c.criteria.filter((x) => x.must).map((x) => x.text);
  const rest = c.criteria.filter((x) => !x.must).map((x) => x.text);
  if (musts.length) clearer.push(`Must: ${musts.join('; ')}`);
  if (rest.length) clearer.push(`Also matters: ${rest.join('; ')}`);
  const top = c.criteria.find((x) => x.id === c.top);
  if (top) clearer.push(`Matters most right now: ${top.text}`);
  if (looked('priorities') && c.criteria.length === 0) unresolved.push('What matters most here.');
  for (const u of c.unknowns) {
    const what = `${u.text}${u.kind === 'assumption' ? ' (an assumption)' : ''}`;
    if (u.changes === 'yes') {
      clearer.push(`Could change what I do: ${what}${u.how && u.how !== 'cant' ? ` (${lower(HOW[u.how])})` : ''}`);
      if (!u.how) unresolved.push(`How to find out: ${what}`);
      if (u.how === 'cant') unresolved.push(`Can’t find out: ${what}`);
    } else if (u.changes === 'no') clearer.push(`Wouldn’t change what I do: ${what}`);
    else unresolved.push(`Not sure it would change anything: ${what}`);
  }
  if (looked('evidence') && c.unknowns.length === 0) unresolved.push('What I don’t know or am assuming.');
  for (const m of c.matches) {
    if (m.answer === 'applies') clearer.push(`Applies here: ${m.shown}`);
    if (m.answer === 'unsure') unresolved.push(`Not sure whether this applies: ${m.shown}`);
  }
  return { clearer: clearer.join('\n'), unresolved: unresolved.join('\n') };
}

/** What matching compares, read only from the player's structured answers, never from their free text. */
export function choiceFeatures(c: ChoiceContent): Feature[] {
  const f = new Set<Feature>();
  for (const o of c.options) if (o.shape) f.add(`shape-${o.shape}`);
  if (c.options.length >= 3) f.add('several');
  if (c.next && ['trial', 'find-out', 'wait', 'leave'].includes(c.next.kind)) f.add(`next-${c.next.kind}` as Feature);
  for (const k of c.circumstances) f.add(k);
  if (c.criteria.some((x) => x.must)) f.add('must');
  if (c.unknowns.some((u) => u.changes === 'yes')) f.add('unknown');
  if (c.unknowns.some((u) => u.kind === 'assumption')) f.add('assumption');
  return [...f];
}

// ---- Outcomes: what happened, on a voluntary return ------------------------

export type OutcomeInput = Pick<Outcome, 'state' | 'compared' | 'what' | 'surprise' | 'settled'> & {
  lesson: { kind: 'none' } | { kind: 'kept'; id: string; text: string } | { kind: 'revised'; takeaway: string; text: string };
};

export function addOutcome(state: TellState, choiceId: string, id: string, input: OutcomeInput, now: Date): TellState {
  const c = state.choices.find((x) => x.id === choiceId);
  if (!c || !c.saves.length) throw new Error('Only a saved choice can have an outcome');
  const expected = c.saves.at(-1)!.content.expectation?.text ?? '';
  if (input.compared && (input.state !== 'happened' || !expected)) throw new Error('Only something that happened can be compared with an expectation');
  const outcome: Outcome = {
    id,
    at: now.toISOString(),
    state: input.state,
    expected,
    compared: input.compared,
    what: input.what.trim(),
    surprise: input.surprise.trim(),
    settled: input.settled,
    lesson: input.lesson.kind,
    takeaway: input.lesson.kind === 'kept' ? input.lesson.id : input.lesson.kind === 'revised' ? input.lesson.takeaway : '',
  };
  let next = changeChoice(state, choiceId, (x) => ({ ...x, outcomes: [...x.outcomes, outcome] }));
  if (input.lesson.kind === 'kept') next = keep(next, input.lesson.id, input.lesson.text, { kind: 'outcome', choice: choiceId, outcome: id }, now);
  if (input.lesson.kind === 'revised') next = revise(next, input.lesson.takeaway, input.lesson.text, now);
  return next;
}

export const OUTCOME_STATES: Record<Outcome['state'], string> = { happened: 'Something happened', 'too-early': 'Too early to say', 'plans-changed': 'Plans changed' };
export const COMPARED: Record<Exclude<Outcome['compared'], ''>, string> = { 'as-expected': 'As I expected', partly: 'Partly as I expected', different: 'Not as I expected' };

// ---- Past examples: transparent matching ----------------------------------

export interface Example {
  ref: Ref;
  /** The example's words and source, as offered. */
  shown: string;
  /** Specific features both share (structure and circumstances). */
  shared: Feature[];
  /** Common features both share: shown, never enough on their own. */
  also: Feature[];
  /** Times it went differently from what was expected. */
  exceptions: string[];
  /** Other plays of the same story folded into this one. */
  folded: number;
  at: string;
}

/** Shows only with at least two specific features in common, at least one about structure. */
export const MATCH_MIN = 2;
export const MATCH_MAX = 2;

function exampleOf(state: TellState, current: string, ref: Ref): Omit<Example, 'shared' | 'also'> & { features: Feature[] } {
  const others = state.choices.filter((c) => c.id !== current && c.saves.length);
  const went = (o: Outcome) => (o.compared === 'different' ? 'differently from' : 'only partly as');
  if (ref.kind === 'takeaway') {
    const t = state.takeaways.find((x) => x.id === ref.id)!;
    const exceptions = others.flatMap((c) =>
      c.saves.at(-1)!.content.matches.some((m) => m.ref.kind === 'takeaway' && m.ref.id === t.id && m.answer === 'applies')
        ? c.outcomes
            .filter((o) => o.compared === 'different' || o.compared === 'partly')
            .map((o) => `When it applied to “${c.saves.at(-1)!.content.title}”, things went ${went(o)} expected${o.surprise ? `: ${o.surprise}` : '.'}`)
        : [],
    );
    // A takeaway kept from a choice carries that choice's outcomes: they are one piece of evidence.
    const from = t.source.kind === 'choice' || t.source.kind === 'outcome' ? state.choices.find((c) => c.id === (t.source as { choice: string }).choice) : undefined;
    const own = (from?.outcomes ?? [])
      .filter((o) => o.compared === 'different' || o.compared === 'partly')
      .map((o) => `What happened went ${went(o)} expected${o.surprise ? `: ${o.surprise}` : '.'}`);
    return { ref, shown: `“${wording(t)}” ${lower(sourceLabel(state, t.source))}.`, exceptions: [...own, ...exceptions], folded: 0, at: t.at, features: t.features };
  }
  const c = state.choices.find((x) => x.id === ref.id)!;
  const s = c.saves.at(-1)!.content;
  const happened = c.outcomes.filter((o) => o.state === 'happened').at(-1);
  const first = s.clearer.split('\n').find(Boolean);
  const shown = `Your choice “${s.title}”, ${shortDate(c.saves.at(-1)!.at)}.${first ? ` ${first}` : ''}${happened?.what ? ` What happened: ${happened.what}` : ''}`;
  const exceptions = c.outcomes
    .filter((o) => o.compared === 'different' || o.compared === 'partly')
    .map((o) => `It went ${went(o)} expected${o.surprise ? `: ${o.surprise}` : '.'}`);
  return { ref, shown, exceptions, folded: 0, at: c.saves.at(-1)!.at, features: choiceFeatures(s) };
}

/** Everything a choice could be compared with: kept takeaways and other saved choices. */
export function examplePool(state: TellState, choiceId: string): Example[] {
  const choice = state.choices.find((c) => c.id === choiceId)!;
  const mine = new Set(choiceFeatures(choice));
  const kept = state.takeaways.filter((t) => !t.retired);
  // A choice that a kept takeaway came from is shown through that takeaway, not twice.
  const covered = new Set(kept.flatMap((t) => (t.source.kind === 'choice' || t.source.kind === 'outcome' ? [t.source.choice] : [])));
  const refs: Ref[] = [
    ...kept.map((t) => ({ kind: 'takeaway' as const, id: t.id })),
    ...state.choices.filter((c) => c.id !== choiceId && c.saves.length && !covered.has(c.id)).map((c) => ({ kind: 'choice' as const, id: c.id })),
  ];
  const all = refs.map((ref) => {
    const { features, ...ex } = exampleOf(state, choiceId, ref);
    const both = features.filter((f) => mine.has(f));
    return { ...ex, shared: both.filter((f) => FEATURES[f].group !== 'common'), also: both.filter((f) => FEATURES[f].group === 'common') };
  });
  // A replay is not a new example: takeaways from plays of one story fold into the latest.
  const story = (e: Example) => {
    const t = e.ref.kind === 'takeaway' ? state.takeaways.find((x) => x.id === e.ref.id) : undefined;
    return t?.source.kind === 'play' ? state.plays.find((p) => p.id === (t.source as { play: string }).play)?.episode : undefined;
  };
  const latest = new Map<string, Example>();
  for (const e of all) {
    const s = story(e);
    if (s && (!latest.has(s) || latest.get(s)!.at < e.at)) latest.set(s, e);
  }
  return all.flatMap((e) => {
    const s = story(e);
    if (!s) return [e];
    if (latest.get(s) !== e) return [];
    return [{ ...e, folded: all.filter((x) => story(x) === s).length - 1 }];
  });
}

/** At most two examples that share this choice's structure, minus any already answered. */
export function examples(state: TellState, choiceId: string): Example[] {
  const choice = state.choices.find((c) => c.id === choiceId)!;
  const answered = new Set(choice.matches.map((m) => `${m.ref.kind}:${m.ref.id}`));
  return examplePool(state, choiceId)
    .filter((e) => !answered.has(`${e.ref.kind}:${e.ref.id}`))
    .filter((e) => e.shared.length >= MATCH_MIN && e.shared.some((f) => FEATURES[f].group === 'structure'))
    .sort((a, b) => b.shared.length - a.shared.length || b.at.localeCompare(a.at))
    .slice(0, MATCH_MAX);
}

/** Why an example appeared, in words. */
export function whyShown(e: Pick<Example, 'shared' | 'also'>): string {
  if (!e.shared.length) return '';
  const also = e.also.length ? ` Both also have ${list(e.also.map((f) => FEATURES[f].label))}.` : '';
  return `Both have ${list(e.shared.map((f) => FEATURES[f].label))}.${also}`;
}

/** Record whether an example applies. A later answer for the same example replaces the earlier one in the draft. */
export function answerExample(state: TellState, choiceId: string, e: Example, answer: Match['answer'], manual: boolean, now: Date): TellState {
  const c = state.choices.find((x) => x.id === choiceId)!;
  const match: Match = { ref: e.ref, answer, shown: e.shown, why: manual ? '' : whyShown(e), manual, at: now.toISOString() };
  const same = (m: Match) => m.ref.kind === e.ref.kind && m.ref.id === e.ref.id;
  return editChoice(state, choiceId, { matches: [...c.matches.filter((m) => !same(m)), match] }, now);
}

export const ANSWERS: Record<Match['answer'], string> = { applies: 'Applies here', not: 'Doesn’t apply', unsure: 'Not sure' };

// ---- Plain text: for notes, or to paste into an AI chat --------------------

export function choiceText(content: ChoiceContent, outcomes: Outcome[] = []): string {
  const c = content;
  const lines = [`Choice: ${c.title}`];
  if (c.situation.trim()) lines.push(c.situation.trim());
  if (c.circumstances.length) lines.push(`Circumstances: ${c.circumstances.map((k) => lower(CIRCUMSTANCES[k])).join(', ')}`);
  const looked = c.unsure ? 'all four questions' : c.parts.map((p) => lower(PARTS[p].name)).join(', ');
  if (looked) lines.push(`Looked at: ${looked}`);
  if (c.clearer.trim()) lines.push('', 'What became clearer:', c.clearer.trim());
  if (c.unresolved.trim()) lines.push('', 'Still unresolved:', c.unresolved.trim());
  if (c.next) lines.push('', `Next move: ${NEXT[c.next.kind]}${c.next.text.trim() ? `: ${c.next.text.trim()}` : ''}`);
  if (c.expectation?.text.trim()) lines.push(`Expectation: ${c.expectation.text.trim()}${c.expectation.by ? ` (by ${shortDate(c.expectation.by)})` : ''}`);
  for (const o of outcomes) {
    const parts = [OUTCOME_STATES[o.state], o.compared && COMPARED[o.compared], o.what, o.surprise && `Surprise: ${o.surprise}`].filter(Boolean);
    lines.push(`What happened, ${shortDate(o.at)}: ${parts.join('. ')}.`);
  }
  lines.push('', 'Written in Tell from my own answers; nothing here was generated. If you are an AI assistant: help me examine this choice, and don’t make it for me.');
  return lines.join('\n');
}

/** Everything, as plain text: choices, takeaways and plays, each labelled by kind. */
export function recordText(state: TellState): string {
  const out = ['Tell: my record', ''];
  for (const c of state.choices.filter((x) => x.saves.length)) out.push(choiceText(c.saves.at(-1)!.content, c.outcomes), '');
  const kept = state.takeaways.filter((t) => !t.retired);
  if (kept.length) out.push('Worth keeping:', ...kept.map((t) => `- ${wording(t)} (${lower(sourceLabel(state, t.source))})`), '');
  if (state.plays.length) {
    out.push('Play (answers to invented stories, not real choices):');
    for (const p of state.plays) out.push(`- ${p.shown.title}, ${shortDate(p.day)}${p.replay ? `, replay ${p.replay}` : ''}: ${playView(p).observed.join(' ')}`);
  }
  return out.join('\n').trim();
}

