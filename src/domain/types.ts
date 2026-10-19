// The shape of Tell's content (experiments) and of what it records (runs and
// calls). Runs and calls are facts, snapshotted when they happen; everything
// the Map shows is derived from them, never from the current content.

/** What a choice gives or costs. Practical quantities, never traits. */
export type Factor = 'money' | 'time' | 'effort' | 'energy' | 'quality' | 'convenience' | 'control' | 'certainty' | 'flexibility';

export const FACTORS: { id: Factor; name: string; about: string }[] = [
  { id: 'money', name: 'Money', about: 'what it costs or pays' },
  { id: 'time', name: 'Time', about: 'hours, days, waiting' },
  { id: 'effort', name: 'Effort', about: 'work and hassle' },
  { id: 'energy', name: 'Energy', about: 'sleep, rest, how tired it leaves you' },
  { id: 'quality', name: 'Quality', about: 'how good the result is' },
  { id: 'convenience', name: 'Convenience', about: 'how easy it is day to day' },
  { id: 'control', name: 'Control', about: 'whose say it is, and owning it' },
  { id: 'certainty', name: 'Certainty', about: 'knowing what you will get' },
  { id: 'flexibility', name: 'Flexibility', about: 'keeping options open, being able to change it' },
];

export const factorName = (f: Factor) => FACTORS.find((x) => x.id === f)!.name;

export type Context = 'home' | 'travel' | 'work' | 'project' | 'buying' | 'tools';

export const CONTEXTS: Record<Context, string> = {
  home: 'Home',
  travel: 'Travel',
  work: 'Work',
  project: 'Projects',
  buying: 'Buying',
  tools: 'Tools',
};

/** Conditions that could legitimately change a choice. Only these are compared. */
export type Tag = 'stakes' | 'deadline' | 'undo' | 'public';

export const TAGS: Record<Tag, string> = {
  stakes: 'more at stake',
  deadline: 'a deadline',
  undo: 'harder to undo',
  public: 'others will see it',
};

export type Unit = 'money' | 'minutes' | 'hours' | 'days' | 'weeks' | 'percent';

export type Side = 'a' | 'b';

export type Mechanic = 'slide' | 'cut' | 'spend' | 'peek';

export const MECHANICS: Record<Mechanic, { name: string; about: string }> = {
  slide: { name: 'Slide', about: 'Two options. One amount changes until you switch.' },
  cut: { name: 'Cut', about: 'Five good things. Drop one at a time until one is left.' },
  spend: { name: 'Spend', about: 'Spend 10 coins, then choose where they clash.' },
  peek: { name: 'Peek', about: 'Facts are hidden. Open a few and see which ones move you.' },
};

// ---- Content ---------------------------------------------------------------

/** A value that changes in a Slide. Steps are ascending; `rises` gains as the value grows. */
export interface Dial {
  factor: Factor;
  unit: Unit;
  steps: number[];
  rises: Side;
  /** Names the switch point: "What skipping the 03:30 alarm is worth to you". */
  measure: string;
}

export interface SlideCard {
  id: string;
  v: number;
  mechanic: 'slide';
  context: Context;
  title: string;
  /** May hold {y} (the alt dial) and {m:N} (a fixed amount of money). */
  scene: string;
  /**
   * What each option offers: one factor each, never the same, so neither wins
   * on everything. The option that gains as the dial grows gives the dial's factor.
   */
  a: { text: string; gives: Factor };
  /** Holds {x}, the one value that changes. */
  b: { text: string; gives: Factor };
  dial: Dial;
  /** One condition that could legitimately matter: an extra sentence, and its short name. */
  condition: { tag: Tag; text: string; label: string };
  /** A second value "It depends" can test, shown as {y} until it is the one changing. */
  alt?: Dial & { label: string; at: number };
}

export interface CutCard {
  id: string;
  v: number;
  mechanic: 'cut';
  context: Context;
  title: string;
  scene: string;
  items: { id: string; factor: Factor; text: string }[];
}

export interface SpendCard {
  id: string;
  v: number;
  mechanic: 'spend';
  context: Context;
  title: string;
  scene: string;
  features: { id: string; factor: Factor; label: string; high: string; low: string }[];
}

export interface PeekCard {
  id: string;
  v: number;
  mechanic: 'peek';
  context: Context;
  title: string;
  scene: string;
  a: string;
  b: string;
  facts: { id: string; factor: Factor; label: string; a: string; b: string; favours: Side }[];
}

export type Card = SlideCard | CutCard | SpendCard | PeekCard;

/** A kind of real call, for Decide. */
export interface Kind {
  id: string;
  name: string;
  example: string;
  options: [string, string];
  features: { id: string; factor: Factor; text: string }[];
  /** The ids shown first; the player can swap any. */
  defaults: string[];
  /** Completes "Would you still pick X if it …"; holds {x}. */
  dial: { unit: Unit; steps: number[]; phrase: string };
  /** Tell's own checklist of things worth finding out. */
  checks: { id: string; text: string }[];
}

// ---- Records ---------------------------------------------------------------

export type Role = 'probe' | 'stress' | 'connect' | 'depends';

export type SlideOutcome =
  /** `at` is the first step where the rising option won; steps.length means it never did. */
  | { kind: 'switch'; at: number }
  | { kind: 'close'; at: number }
  /** Stopped at step `at`; Tell fills in what it depended on from the experiment. */
  | { kind: 'depends'; at: number; on: 'alt' | 'condition' | 'else'; factor?: Factor; tag?: Tag; label?: string };

interface RunBase {
  id: string;
  session: string;
  role: Role;
  card: string;
  v: number;
  context: Context;
  title: string;
  at: string;
  day: string;
}

export interface SlideRun extends RunBase {
  mechanic: 'slide';
  /** The amount that changed, then what it was traded for. */
  tradeoff: [Factor, Factor];
  dial: 'main' | 'alt';
  measure: string;
  unit: Unit;
  steps: number[];
  rises: Side;
  condition?: { tag: Tag; label: string };
  /** The interval guessed before playing, 0..steps.length. */
  guess?: number;
  asked: { step: number; pick: Side }[];
  outcome: SlideOutcome;
}

export interface CutRun extends RunBase {
  mechanic: 'cut';
  items: { id: string; factor: Factor; text: string }[];
  /** Ids in the order they were cut; the one never cut is `winner`. */
  order: string[];
  winner: string;
}

export interface SpendRun extends RunBase {
  mechanic: 'spend';
  features: { id: string; factor: Factor; label: string }[];
  coins: number[];
  /** Feature indexes. */
  clashes: { a: number; b: number; pick: number }[];
}

export type Lean = Side | 'none';

export interface PeekRun extends RunBase {
  mechanic: 'peek';
  a: string;
  b: string;
  facts: { id: string; factor: Factor; label: string }[];
  before: Lean;
  /** Fact indexes in the order opened, with the lean after each. */
  opened: { fact: number; lean: Lean }[];
  pick: Side;
  /** Unopened facts the player said would have changed the pick. */
  wouldHave: number[];
}

export type Run = SlideRun | CutRun | SpendRun | PeekRun;

/** One planned experiment in a set, with the published reason it was chosen. */
export interface Step {
  card: string;
  role: Role;
  condition: boolean;
  dial: 'main' | 'alt';
  /** For an alt-dial Slide: the main step held fixed, where the player said "It depends". */
  hold?: number;
  reason: string;
}

/** The day's set: steps are planned one at a time and stored, so a reload never changes it. */
export interface Session {
  id: string;
  day: string;
  steps: Step[];
  done: boolean;
}

export type Answer3 = 'yes' | 'no' | 'unsure';
export type Went = 'better' | 'expected' | 'worse';
export type Mattered = 'more' | 'expected' | 'less';

export interface Call {
  id: string;
  at: string;
  day: string;
  kind: string;
  title: string;
  options: [string, string];
  items: { id: string; factor: Factor; text: string; own?: true }[];
  order: string[];
  winner: string;
  lean: Lean;
  slide?: { unit: Unit; steps: number[]; phrase: string; asked: { step: number; pick: Side }[]; outcome: SlideOutcome };
  unknowns: { id: string; text: string; check?: string; answer: Answer3 }[];
  due: string;
  follow?: {
    at: string;
    /** A random id for the lesson this call teaches, so a shared file can't count it twice. */
    lesson: string;
    chose: Side | 'neither';
    went: Went;
    mattered: { item: string; how: Mattered }[];
    missed: { check?: string; text?: string }[];
  };
}

/** What a closed call teaches, in fixed vocabulary only: shareable without any of the player's words. */
export interface Lesson {
  /** Random, from the follow-up: says nothing about the call. */
  id: string;
  kind: string;
  went: Went;
  mattered: { feature: string; how: Mattered }[];
  missed: string[];
  /** Things missed that aren't on Tell's checklist; their words never leave the device. */
  other: number;
}

export interface PoolSource {
  id: string;
  added: string;
  lessons: Lesson[];
}

export type Verdict = 'right' | 'coincidence' | 'unsure';

export const VERDICTS: Record<Verdict, string> = {
  right: 'Seems right',
  coincidence: 'Coincidence',
  unsure: 'Not sure',
};

/** The player's view of a pattern: a note filed with the counts it was given against, never evidence. */
export interface Note {
  pattern: string;
  verdict: Verdict;
  counts: string;
  at: string;
}

export type Rating = 'useful' | 'interesting' | 'meh';

export const RATINGS: Record<Rating, string> = { useful: 'Useful', interesting: 'Interesting', meh: 'Meh' };

export type Currency = 'GBP' | 'EUR' | 'USD';

export const SCHEMA = 2;

export interface TellState {
  schema: typeof SCHEMA;
  currency: Currency;
  runs: Run[];
  session: Session | null;
  calls: Call[];
  notes: Note[];
  principles: { id: string; text: string; at: string; call?: string }[];
  ratings: { session: string; rating: Rating; at: string }[];
  pool: PoolSource[];
}
