// The shape of Tell's content (cards) and of what it records (answers).
// Answers are facts; everything shown on the Map is derived from them.

export type Area = 'world' | 'work';

export const AREAS: Record<Area, { name: string; question: string; record: string }> = {
  world: {
    name: 'The world',
    question: 'Which explanation would you look into first?',
    record: 'The explanation you looked into first',
  },
  work: {
    name: 'Work & projects',
    question: 'Which feels closest to your experience?',
    record: 'What felt closest to your experience',
  },
};

export type LensId =
  | 'incentives'
  | 'power'
  | 'structure'
  | 'perception'
  | 'identity'
  | 'belonging'
  | 'capacity'
  | 'uncertainty';

/**
 * The eight angles. They are the app's editorial labels for kinds of
 * explanation, not measured traits. The order here is the display order
 * everywhere, so the Map never ranks you against yourself.
 */
export const LENSES: { id: LensId; name: string; about: string }[] = [
  { id: 'incentives', name: 'Incentives', about: 'what people stand to gain or lose' },
  { id: 'power', name: 'Power', about: 'who can impose an outcome on others' },
  { id: 'structure', name: 'Structure', about: 'how the situation is set up: rules, routines, surroundings' },
  { id: 'perception', name: 'Perception', about: 'how attention and memory shape what seems true' },
  { id: 'identity', name: 'Identity', about: 'who someone feels they are, or wants to be seen as' },
  { id: 'belonging', name: 'Belonging', about: 'what others will think: status, loyalty, fitting in' },
  { id: 'capacity', name: 'Capacity', about: 'the energy, time and resources available' },
  { id: 'uncertainty', name: 'Uncertainty', about: 'what is not known yet' },
];

export const lensName = (id: LensId) => LENSES.find((l) => l.id === id)!.name;

export interface LensOption {
  /** Unique within its card. Counts never read it; they read the lens snapshot. */
  id: string;
  lens: LensId;
  text: string;
  sees: string;
  misses: string;
}

/** Decode (world scenes) and Mirror (your own experience) rounds. */
export interface LensCard {
  id: string;
  v: number;
  kind: 'decode' | 'mirror';
  area: Area;
  title: string;
  scene: string;
  options: LensOption[];
  /** One closing line the player may keep. */
  line: string;
  /** The matched scene in the other area, offering the same four angles. */
  twin?: string;
}

/** One half of a paired choice: the two halves differ in exactly one detail. */
export interface SwitchCard {
  id: string;
  v: number;
  kind: 'switch';
  area: Area;
  title: string;
  scene: string;
  /** Same ids in both halves, so "did the answer change" is an id comparison. */
  options: { id: string; text: string }[];
  pair: string;
  variant: 'a' | 'b';
}

export type Card = LensCard | SwitchCard;

export interface Pair {
  id: string;
  kind: 'consistency' | 'trade-off';
  title: string;
  /** What differed between the halves, completing "Only one thing differed: …". */
  changed: string;
  /** Shown with the result: describes, never diagnoses. */
  note: string;
}

/** Ways to answer without picking an angle. */
export type Out = 'else' | 'unknown' | 'notme';

export const OUTS: Record<Out, string> = {
  else: 'Something else',
  unknown: 'Not enough to go on',
  notme: 'Doesn’t happen to me',
};

export const OUTS_FOR: Record<Card['kind'], Out[]> = {
  decode: ['else', 'unknown'],
  mirror: ['notme', 'else'],
  switch: [],
};

/**
 * One answered round, snapshotted at the moment of answering: what was shown
 * (in order, with each option's lens), what was picked, and the links to
 * matched scenes and pairs. Editing the deck later never rewrites the past.
 */
export interface Answer {
  card: string;
  v: number;
  kind: Card['kind'];
  area: Area;
  title: string;
  /** ISO timestamp. */
  at: string;
  /** Local calendar day, YYYY-MM-DD. */
  day: string;
  shown: { id: string; lens?: LensId }[];
  pick: string;
  pickText: string;
  twin?: string;
  pair?: string;
  variant?: 'a' | 'b';
}

/** Today's set, fixed when dealt so a reload never swaps cards or reorders options. */
export interface Deal {
  day: string;
  area: Area | 'mix';
  cards: { id: string; order: string[] }[];
}

export interface Kept {
  card: string;
  area: Area;
  title: string;
  line: string;
  at: string;
}

export type Verdict = 'fits' | 'partly' | 'doesnt' | 'unsure';

export const VERDICTS: Record<Verdict, string> = {
  fits: 'Fits',
  partly: 'Partly',
  doesnt: 'Doesn’t fit',
  unsure: 'Not sure',
};

/** The player's view of an observation: a note saved with the counts it was given against. */
export interface Note {
  obs: string;
  verdict: Verdict;
  counts: string;
  at: string;
}

export const SCHEMA = 1;

export interface TellState {
  schema: typeof SCHEMA;
  answers: Answer[];
  deal: Deal | null;
  kept: Kept[];
  disagreed: { card: string; at: string }[];
  notes: Note[];
}
