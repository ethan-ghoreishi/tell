// The shape of Tell's situations, connections and what it records. A play is
// a snapshot: it copies the situation it showed, so nothing shown later
// depends on today's content. Connections are derived from plays, never stored;
// only which ones the player has seen is.

/**
 * The backbone. Every answer a situation offers (an option, or a band of a
 * number) is described as a move, in the four parts of a choice under
 * uncertainty: the action (can it be taken back?), the uncertainty (what does
 * it do about what isn't known?), the future options (what does it leave
 * possible?) and the consequences (what it costs for sure, what it risks).
 * Connections may only group answers the model describes the same way, and
 * may only claim what the model says (`situations.test.ts`).
 */
export const MOVES = {
  action: {
    final: 'can’t be taken back',
    undoable: 'can be taken back cheaply',
    'undoable-at-a-price': 'can be taken back, at a price',
    holds: 'does nothing yet',
  },
  uncertainty: {
    'looks-first': 'finds out first, at a price',
    'goes-without': 'goes on what is already known',
    tests: 'finds out by doing it',
    'waits-for-news': 'waits for news that will come in time',
    'before-news': 'moves before news that was coming',
    'news-after': 'commits before news that can only come after',
  },
  future: {
    closes: 'closes something for good',
    'keeps-open': 'keeps things open, at a price',
    guards: 'guards against the worst, at a price',
    'keeps-by-using': 'keeps something possible by using it',
    'lets-it-fade': 'lets something fade',
  },
} as const;

export type Part = keyof typeof MOVES;
export type Shape = { [P in Part]?: keyof (typeof MOVES)[P] };

export interface Move extends Shape {
  /** Consequences: what the move costs for sure. */
  costs: string;
  /** Consequences: what it risks if things go the other way. */
  risks: string;
}

export interface Option {
  id: string;
  text: string;
  /** What it costs or means, shown under the option. */
  detail?: string;
  move: Move;
}

/** Ranges of a number: a value belongs to the first band whose `upTo` it doesn't exceed. */
export interface Band {
  id: string;
  upTo: number;
  move: Move;
}

/** Words that depend on an earlier answer, keyed by the option picked or the band a number fell in. */
export type Keyed = string | { step: string; cases: Record<string, string> };

/** [one, many]: "week", "weeks". */
export type Unit = [string, string];

/** Asking someone before choosing. It may bring another option, or only an answer. */
export interface Ask {
  label: string;
  /** The same, in the past tense, for the record. */
  did: string;
  answer: string;
  adds?: Option;
}

export type Step =
  /** Pick one. Words before it can follow from an earlier answer. */
  | { kind: 'choose'; id: string; before?: Keyed; prompt: string; options: Option[]; ask?: Ask }
  /** Find things out from a budget that can't buy everything; stop whenever you like. */
  | { kind: 'uncover'; id: string; prompt: string; budget: number; unit: Unit; facts: { id: string; label: string; cost: number; text: string }[]; bands: Band[] }
  /** Share something scarce. The last item takes whatever is left. `measure` names the item the bands count. */
  | { kind: 'allocate'; id: string; prompt: string; total: number; unit: Unit; items: { id: string; text: string; detail?: string }[]; measure: string; bands: Band[] }
  /** Day by day, act or wait, as news arrives. Waiting past the last day is an answer too. */
  | { kind: 'days'; id: string; days: { label: string; text: string }[]; act: string; wait: string; last: string; bands: Band[] };

export type StepAnswer =
  | { kind: 'choose'; pick: string; asked: boolean }
  | { kind: 'uncover'; opened: string[] }
  | { kind: 'allocate'; amounts: Record<string, number> }
  /** The day acted on; days.length means waited past the last. */
  | { kind: 'days'; day: number };

export type Answers = Record<string, StepAnswer>;

/** A real-world fact a situation rests on, and where it was checked. */
export interface Real {
  fact: string;
  sources: { name: string; url: string }[];
}

export interface Situation {
  id: string;
  v: number;
  title: string;
  /** Where it happens: "A village green". */
  place: string;
  /** One line for the collection. */
  hook: string;
  setup: string;
  /** What isn't known, in one line: kept with every play for a future Bring a choice. */
  uncertain: string;
  steps: Step[];
  ending: {
    /** How the story closes, by the path taken. */
    closing: Keyed;
    /** Other reasonable ways through, so no answer reads as the right one. */
    others: string;
  };
  /** Facts from the real world, with sources, and what the story invents. */
  real?: { facts: Real[]; invented: string };
}

/** One side of a connection: a situation, and the answers it fits. */
export interface ConnectionSide {
  situation: string;
  /** The version the connection was written for; plays of other versions don't count. */
  v: number;
  /** For each named step, the answer keys this side fits. Steps not named don't matter to it. */
  when: Record<string, string[]>;
  /** What the model must say about every answer this side fits. */
  claims: Shape;
}

/** An authored distinction between two specific ways through two situations. */
export interface Connection {
  id: string;
  /** The distinction, short. */
  title: string;
  sides: [ConnectionSide, ConnectionSide];
  /** One or two sentences about the moves themselves, shown first. Never about the player. */
  says: string;
  /** Where the comparison stops holding. */
  breaks: string;
  /** A question to carry to a real choice. */
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
export const EARLIER: Record<number, string> = {
  1: 'the first version of Tell',
  2: 'Tell’s choice-experiments version',
  3: 'Tell 2.0 (the choice workshop)',
  4: 'Tell 3.0',
};
export const earlierName = (schema: number) => EARLIER[schema] ?? `an earlier version of Tell (schema ${schema})`;

/** A document from an earlier version of Tell, kept exactly as it was. */
export interface Archived {
  schema: number;
  at: string;
  doc: Record<string, unknown>;
}

export const SCHEMA = 5;

export interface TellState {
  schema: typeof SCHEMA;
  plays: Play[];
  /** Connection id → when the player first saw it. */
  seen: Record<string, string>;
  archive: Archived[];
}
