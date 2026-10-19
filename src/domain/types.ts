// The shape of Tell's episodes and of what it records. Four kinds of record
// stay separate: Play (answers to invented stories), choices (what the player
// said about a real choice), takeaways (interpretations the player chose to
// keep) and outcomes (what the player reported happened). Records are
// snapshots: nothing shown later depends on today's content.

export type Unit = 'number' | 'percent' | 'hours' | 'days' | 'weeks';
export type Side = 'a' | 'b';

/** The four questions episodes and choices are built around. */
export type Part = 'purpose' | 'possibilities' | 'priorities' | 'evidence';

export const PARTS: Record<Part, { name: string; question: string; unresolved: string }> = {
  purpose: { name: 'Purpose', question: 'What outcome would make this worthwhile?', unresolved: 'What I’m really trying to get out of it' },
  possibilities: { name: 'Possibilities', question: 'Are these the right options?', unresolved: 'Whether these are the right options' },
  priorities: { name: 'Priorities', question: 'What matters when good things conflict?', unresolved: 'What matters most when things pull against each other' },
  evidence: { name: 'Evidence', question: 'What could change what you’d do?', unresolved: 'Something I don’t know, or am assuming' },
};
export const PART_ORDER: Part[] = ['purpose', 'possibilities', 'priorities', 'evidence'];

/** Kinds of option people often leave out. A choice records which ones it has. */
export type Shape = 'smaller' | 'combine' | 'wait' | 'keep' | 'ask';

export const SHAPES: Record<Shape, string> = {
  smaller: 'A smaller version, or a trial first',
  combine: 'Some of both',
  wait: 'Wait until something specific happens',
  keep: 'Keep things as they are',
  ask: 'Ask someone, or hand it over',
};

export type NextKind = 'decide' | 'trial' | 'find-out' | 'wait' | 'leave' | 'stop';

export const NEXT: Record<NextKind, string> = {
  decide: 'Decide now',
  trial: 'Try something small',
  'find-out': 'Find something out',
  wait: 'Wait',
  leave: 'Leave it for now',
  stop: 'Stop here without deciding',
};

export type Circumstance = 'deadline' | 'undo' | 'public' | 'others' | 'stakes';

export const CIRCUMSTANCES: Record<Circumstance, string> = {
  deadline: 'A deadline',
  undo: 'Hard to undo',
  public: 'Others will see it',
  others: 'Others depend on it',
  stakes: 'Your own money or name at stake',
};

/**
 * What matching compares. Structure and circumstances can make a match;
 * "common" features are so frequent that they are shown but never count.
 */
export type Feature =
  | 'shape-smaller'
  | 'shape-combine'
  | 'shape-wait'
  | 'shape-keep'
  | 'shape-ask'
  | 'several'
  | 'find-trial'
  | 'find-ask'
  | 'find-wait'
  | 'deadline'
  | 'undo'
  | 'public'
  | 'others'
  | 'stakes'
  | 'assumption'
  | 'must'
  | 'unknown';

export const FEATURES: Record<Feature, { label: string; group: 'structure' | 'circumstance' | 'common' }> = {
  'shape-smaller': { label: 'a smaller version or a trial among the options', group: 'structure' },
  'shape-combine': { label: 'an option that combines others', group: 'structure' },
  'shape-wait': { label: 'waiting among the options', group: 'structure' },
  'shape-keep': { label: 'keeping things as they are among the options', group: 'structure' },
  'shape-ask': { label: 'asking someone among the options', group: 'structure' },
  several: { label: 'three or more options', group: 'structure' },
  'find-trial': { label: 'an unknown that a small trial could answer', group: 'structure' },
  'find-ask': { label: 'an unknown that asking or looking up could answer', group: 'structure' },
  'find-wait': { label: 'an unknown that only time will answer', group: 'structure' },
  deadline: { label: 'a deadline', group: 'circumstance' },
  undo: { label: 'something hard to undo', group: 'circumstance' },
  public: { label: 'others seeing it', group: 'circumstance' },
  others: { label: 'others depending on it', group: 'circumstance' },
  stakes: { label: 'your own money or name at stake', group: 'circumstance' },
  must: { label: 'a must-have', group: 'common' },
  unknown: { label: 'an unknown that could change things', group: 'common' },
  assumption: { label: 'an assumption marked as one', group: 'structure' },
};

// ---- Episodes --------------------------------------------------------------

export interface Option {
  id: string;
  text: string;
}

/** The one move in the middle of an episode, between the first answer and the second. */
export type Beat =
  /** A reveal or a change of context; it may bring a new option. */
  | { kind: 'twist'; text: string; adds?: Option }
  /** Other options to consider; the ones picked join the second question. */
  | { kind: 'widen'; prompt: string; items: Option[] }
  /** Good things dropped one at a time until one is left. */
  | { kind: 'cut'; prompt: string; items: Option[] }
  /** Hidden facts, opened one at a time, with the lean after each. */
  | { kind: 'peek'; prompt: string; opens: number; facts: { id: string; label: string; text: string }[] }
  /** One value changes until the answer switches; then the story's value is shown. */
  | { kind: 'slide'; text: string; unit: Unit; steps: number[]; rises: Side; measure: string; actual?: { value: number; text: string } };

export interface Episode {
  id: string;
  v: number;
  part: Part;
  title: string;
  /** The kind of project, for the library: "A house concert". */
  project: string;
  setup: string;
  ask: string;
  options: Option[];
  beat: Beat;
  reask: string;
  ending: {
    /** The distinction the story turns on. */
    point: string;
    /** Possible readings when the second answer differs from the first. */
    changed: string[];
    /** Possible readings when it is the same. */
    stayed: string[];
    /** When the second answer is an option the move added (a twist's new option, or one picked to consider). */
    added?: string[];
    /** For a Slide with a revealed value: the second answer followed the player's own line, or went against it. */
    followed?: string[];
    against?: string[];
    unknown: string;
    /** A question to take to a real choice. */
    apply: string;
  };
  features: Feature[];
  /** Editorial notes: why the episode exists and what it can't show. Shown in the app. */
  rationale: { distinction: string; alternatives: string; limits: string; relevance: string };
}

// ---- Records ---------------------------------------------------------------

/** An option id, or 'unsure'. */
export type Answer = string;
export const UNSURE = 'unsure';

export type SlideOutcome =
  /** `at` is the first step where the rising option won; steps.length means it never did. */
  { kind: 'switch'; at: number } | { kind: 'close'; at: number };

export type BeatAnswer =
  | { kind: 'twist' }
  | { kind: 'widen'; picked: string[] }
  | { kind: 'cut'; order: string[] }
  | { kind: 'peek'; opened: { fact: number; lean: Answer }[]; wouldHave: number[] }
  | { kind: 'slide'; asked: { step: number; pick: Side }[]; outcome: SlideOutcome };

/** One play of an episode: hypothetical answers to an invented story. */
export interface Play {
  id: string;
  episode: string;
  v: number;
  at: string;
  day: string;
  /** Earlier plays of the same episode: 0 the first time. A replay is never a new example. */
  replay: number;
  /** The episode as it was shown. */
  shown: Omit<Episode, 'rationale'>;
  first: Answer;
  beat: BeatAnswer;
  final: Answer;
}

export interface ChoiceOption {
  id: string;
  text: string;
  shape?: Shape;
}

export type Changes = 'yes' | 'no' | 'unsure';
export type How = 'ask' | 'look' | 'try' | 'wait' | 'cant';

export const CHANGES: Record<Changes, string> = { yes: 'Yes', no: 'No', unsure: 'Not sure' };
export const HOW: Record<How, string> = {
  ask: 'Ask someone',
  look: 'Look it up',
  try: 'Try something small',
  wait: 'Wait and see',
  cant: 'Can’t find out',
};

export type Ref = { kind: 'takeaway' | 'choice'; id: string };

/** A past example offered during a choice, as it was shown, and the player's answer. */
export interface Match {
  ref: Ref;
  answer: 'applies' | 'not' | 'unsure';
  /** The example's words and source when it was offered. */
  shown: string;
  /** Why it appeared; empty when the player picked it themselves. */
  why: string;
  manual: boolean;
  at: string;
}

/** Everything the player says about a real choice. A save snapshots it. */
export interface ChoiceContent {
  title: string;
  situation: string;
  circumstances: Circumstance[];
  /** What feels unresolved; `unsure` means look at all four. */
  parts: Part[];
  unsure: boolean;
  /** A question carried over from an episode, or empty. */
  prompt: string;
  worth: string;
  notWorth: string;
  options: ChoiceOption[];
  /** An option id, or empty for no lean. */
  lean: string;
  criteria: { id: string; text: string; must: boolean }[];
  /** The criterion that matters most right now, or empty. */
  top: string;
  /** Options a must-have rules out. */
  ruledOut: string[];
  unknowns: { id: string; text: string; kind: 'fact' | 'assumption'; changes?: Changes; how?: How }[];
  matches: Match[];
  clearer: string;
  unresolved: string;
  next: { kind: NextKind; text: string } | null;
  /** Recorded when the player plans to act or test something. `by` is a day, or empty. */
  expectation: { text: string; by: string } | null;
}

export type FlowStep = 'start' | 'unresolved' | Part | 'examples' | 'summary';

export interface Outcome {
  id: string;
  at: string;
  state: 'happened' | 'too-early' | 'plans-changed';
  /** The expectation as it stood when this was reported. */
  expected: string;
  compared: 'as-expected' | 'different' | 'partly' | '';
  what: string;
  surprise: string;
  settled: boolean;
  lesson: 'none' | 'kept' | 'revised';
  takeaway: string;
}

export interface Choice extends ChoiceContent {
  id: string;
  created: string;
  updated: string;
  /** Being written or revised. */
  draft: boolean;
  step: FlowStep;
  /** Append-only: what was saved, each time. */
  saves: { at: string; content: ChoiceContent }[];
  outcomes: Outcome[];
}

export type Source =
  | { kind: 'play'; play: string }
  | { kind: 'choice'; choice: string; save: number }
  | { kind: 'outcome'; choice: string; outcome: string }
  | { kind: 'own' }
  | { kind: 'earlier'; schema: number };

/** An interpretation the player chose to keep. Revising adds a version; the first stays. */
export interface Takeaway {
  id: string;
  at: string;
  source: Source;
  versions: { at: string; text: string }[];
  features: Feature[];
  /** When it was retired, or empty. */
  retired: string;
}

/** Earlier versions of Tell, by the schema they saved. */
export const EARLIER: Record<number, string> = { 1: 'the first version of Tell', 2: 'Tell’s choice-experiments version' };
export const earlierName = (schema: number) => EARLIER[schema] ?? `an earlier version of Tell (schema ${schema})`;

/** A document from an earlier version of Tell, kept exactly as it was. */
export interface Archived {
  schema: number;
  at: string;
  doc: Record<string, unknown>;
}

export const SCHEMA = 3;

export interface TellState {
  schema: typeof SCHEMA;
  plays: Play[];
  choices: Choice[];
  takeaways: Takeaway[];
  archive: Archived[];
}
