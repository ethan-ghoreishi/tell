// The shape of Tell's situations, connections and what it records. A play is
// a snapshot: it copies the situation it showed, so nothing shown later
// depends on today's content. Connections are derived, never stored.

/**
 * The hidden model every situation is written against: what you can do and
 * undo, what you can find out and when, and what waiting does to what's
 * possible. Money, time and audience are ingredients of a story, never things
 * Tell measures a person on.
 */
export const MODEL = {
  undo: { name: 'The way back', values: { none: 'none', costly: 'at a price', cheap: 'cheap' } },
  news: { name: 'Finding out', values: { buy: 'bought before acting', comes: 'arrives while you can still act', act: 'comes from acting', after: 'arrives after you commit' } },
  waiting: { name: 'Waiting', values: { risks: 'raises the risk', holds: 'keeps options, at a price', erodes: 'wears an option away' } },
} as const;

export type Field = keyof typeof MODEL;
export type Structure = { [F in Field]: keyof (typeof MODEL)[F]['values'] };

export interface Option {
  id: string;
  text: string;
  /** What it costs or means, shown under the option when plans are compared. */
  detail?: string;
}

/** Ranges of a number: a value belongs to the first band whose `upTo` it doesn't exceed. */
export interface Band {
  id: string;
  upTo: number;
}

/** Words that depend on an earlier answer, keyed by the option picked or the band a number fell in. */
export type Keyed = string | { step: string; cases: Record<string, string> };

/** [one, many]: "week", "weeks". */
export type Unit = [string, string];

export type Step =
  /** Pick one. Asking can bring another option; words before it can follow from an earlier answer. */
  | { kind: 'choose'; id: string; before?: Keyed; prompt: string; options: Option[]; ask?: { label: string; did: string; answer: string; adds: Option } }
  /** Find things out from a budget; stop whenever you like. */
  | { kind: 'uncover'; id: string; prompt: string; budget: number; unit: Unit; facts: { id: string; label: string; cost: number; text: string }[]; bands: Band[] }
  /** Share something scarce. The last item takes whatever is left. `measure` names the item the bands count. */
  | { kind: 'allocate'; id: string; prompt: string; total: number; unit: Unit; items: Option[]; measure: string; bands: Band[] }
  /** Day by day, act or wait, as news arrives. Waiting past the last day is an answer too. */
  | { kind: 'days'; id: string; days: { label: string; text: string }[]; act: string; wait: string; last: string; bands: Band[] };

export type StepAnswer =
  | { kind: 'choose'; pick: string; asked: boolean }
  | { kind: 'uncover'; opened: string[] }
  | { kind: 'allocate'; amounts: Record<string, number> }
  /** The day acted on; days.length means waited past the last. */
  | { kind: 'days'; day: number };

export type Answers = Record<string, StepAnswer>;

export interface Situation {
  id: string;
  v: number;
  title: string;
  /** Where it happens: "A village green". */
  place: string;
  /** One line for the collection. */
  hook: string;
  setup: string;
  steps: Step[];
  ending: {
    /** How the story closes, by the path taken. */
    closing: Keyed;
    /** Other reasonable ways through, so no answer reads as the right one. */
    others: string;
  };
  structure: Structure;
}

/** How one situation's answers are grouped for a connection: class id → keys of one step. */
export interface ConnectionSide {
  situation: string;
  /** The version the connection was written for; plays of other versions don't count. */
  v: number;
  step: string;
  classes: Record<string, string[]>;
}

/** An authored relationship between two situations that differ on one field of the model. */
export interface Connection {
  id: string;
  title: string;
  on: Field;
  sides: [ConnectionSide, ConnectionSide];
  /** What connects them. */
  link: string;
  /** Other ways the two differ, so no answer can be read as showing why. */
  differs: string;
  /** For each combination of classes, "a+b": what the combination brings out. */
  notes: Record<string, string>;
  /** A question to take to other choices. */
  question: string;
}

// ---- Records ---------------------------------------------------------------

export interface Play {
  id: string;
  situation: string;
  v: number;
  at: string;
  day: string;
  /** Earlier plays of the same situation: 0 the first time. */
  replay: number;
  /** The situation as it was shown. */
  shown: Situation;
  answers: Answers;
}

/** Earlier versions of Tell, by the schema they saved. */
export const EARLIER: Record<number, string> = { 1: 'the first version of Tell', 2: 'Tell’s choice-experiments version', 3: 'Tell 2.0 (the choice workshop)' };
export const earlierName = (schema: number) => EARLIER[schema] ?? `an earlier version of Tell (schema ${schema})`;

/** A document from an earlier version of Tell, kept exactly as it was. */
export interface Archived {
  schema: number;
  at: string;
  doc: Record<string, unknown>;
}

export const SCHEMA = 4;

export interface TellState {
  schema: typeof SCHEMA;
  plays: Play[];
  archive: Archived[];
}
