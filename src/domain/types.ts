import type { MoveId, Shape } from './language';

// The shape of Tell's stories and of what it records. A play is a snapshot:
// it copies the story it showed, so nothing shown later depends on today's
// content. A kept choice is a snapshot too: the answers given and the moves
// shown. Everything the Map shows is derived from these; only which moves the
// player has been shown as new is stored besides.

/**
 * Every answer a story offers is described in Tell's language (language.ts):
 * the moves it makes, and its consequences in the story's own terms, what it
 * costs for sure and what it risks. No answer is free. An answer that holds
 * off without doing anything (not looking first, leaving the seed in a
 * drawer) makes no move, and still costs and risks something.
 */
interface Described {
  moves: MoveId[];
  costs: string;
  risks: string;
}

export interface Option extends Described {
  id: string;
  text: string;
  /** What it costs or means, shown under the option. */
  detail?: string;
}

/** Ranges of a number: a value belongs to the first band whose `upTo` it doesn't exceed. */
export interface Band extends Described {
  id: string;
  upTo: number;
}

/** Words that depend on an earlier answer, keyed by the option picked or the band a number fell in. */
export type Keyed = string | { step: string; cases: Record<string, string> };

/** [one, many]: "week", "weeks". */
export type Unit = [string, string];

/** Asking someone before choosing. It may bring another option, or only an answer. Asking is itself a move. */
export interface Ask {
  label: string;
  /** The same, in the past tense, for the record. */
  did: string;
  answer: string;
  moves: MoveId[];
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

/** A real-world fact a story rests on, and where it was checked. */
export interface Real {
  fact: string;
  sources: { name: string; url: string }[];
}

export interface Situation {
  id: string;
  v: number;
  /**
   * A variant names the story it varies (`of`), and the one thing that differs,
   * as the question its base's ending asks: "What if the forecasts stopped?".
   * Its step is the same, and its shape differs from the base's on one question.
   */
  of?: string;
  whatIf?: string;
  title: string;
  /** Where it happens: "A village green". */
  place: string;
  /** One line for the collection. */
  hook: string;
  setup: string;
  /** What isn't known, in one line. */
  uncertain: string;
  /** The step the story turns on, which the four questions are about: "felling the oak". */
  turnsOn: string;
  /** How the four questions read that step. */
  shape: Shape;
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

// ---- Records ---------------------------------------------------------------

export interface Play {
  id: string;
  situation: string;
  v: number;
  /** The version of the language the story was described in. */
  language: number;
  at: string;
  day: string;
  /** Earlier plays of the same story: 0 the first time. */
  replay: number;
  /** The story as it was shown. */
  shown: Situation;
  answers: Answers;
}

/** A move as Bring a choice showed it, with the reason it fitted. */
export interface ShownMove {
  id: string;
  name: string;
  because: string;
  asks?: string;
  is: string;
  costs: string;
  breaks: string;
  like: string;
}

export interface ShownLine {
  strategy: string;
  name: string;
  because: string;
  moves: ShownMove[];
}

/** A real choice the player brought and chose to keep. Tell never reads the label or the note. */
export interface Choice {
  id: string;
  at: string;
  day: string;
  language: number;
  /** The player's own words for the step, or nothing. */
  label: string;
  shape: Shape;
  /** The moves as they were shown, so a kept choice always reads as it did. */
  shown: ShownLine[];
  /** Moves the player marked as ones they're trying. */
  trying: string[];
  /** Anything the player wants kept with it. */
  note: string;
}

/** Earlier versions of Tell, by the schema they saved. */
export const EARLIER: Record<number, string> = {
  1: 'the first version of Tell',
  2: 'Tell’s choice-experiments version',
  3: 'Tell 2.0 (the choice workshop)',
  4: 'Tell 3.0',
  5: 'Tell 3.1',
};
export const earlierName = (schema: number) => EARLIER[schema] ?? `an earlier version of Tell (schema ${schema})`;

/** A document from an earlier version of Tell, kept exactly as it was. */
export interface Archived {
  schema: number;
  at: string;
  doc: Record<string, unknown>;
}

export const SCHEMA = 6;

export interface TellState {
  schema: typeof SCHEMA;
  plays: Play[];
  choices: Choice[];
  /** Move id → when an ending first showed it as new. */
  seen: Record<string, string>;
  archive: Archived[];
}
