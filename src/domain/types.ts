// What Tell is made of: rounds (content, written once, in src/content/) and
// the player's record (plays, the Book). Content and data never mix: the
// record names rounds by id and copies only what a kept idea needs to keep
// its meaning if the round later changes.

// ---- Content ---------------------------------------------------------------

export const TOPICS = ['Science', 'Reasoning', 'Philosophy', 'Art', 'History', 'Culture', 'Language', 'Economics', 'Wisdom'] as const;
export type Topic = (typeof TOPICS)[number];

/** What sort of thing a round is, so a thought experiment never passes for history. */
export const FORMS = ['Puzzle', 'Thought experiment', 'True story', 'Dilemma', 'Myth check', 'Timeline'] as const;
export type Form = (typeof FORMS)[number];

/** How sure a claim is. Shown beside it, so fact, dispute and story stay apart. */
export const STATUSES = { established: 'Established', disputed: 'Disputed', interpretation: 'Interpretation', tradition: 'Tradition or legend', hypothetical: 'Hypothetical' } as const;
export type Status = keyof typeof STATUSES;

export interface Source {
  name: string;
  url: string;
}

/** A factual or interpretive claim the round makes, how sure it is, and where it was checked. */
export interface Claim {
  text: string;
  status: Status;
  sources: Source[];
}

/** One way a reveal can be read; for questions with more than one serious answer. */
export interface View {
  who: string;
  view: string;
}

/**
 * Text is plain: paragraphs split on blank lines, *emphasis* for titles of
 * works and the odd stressed word. Nothing else.
 */
interface Beat {
  id: string;
  /** What the player needs before answering. */
  setup?: string;
  prompt: string;
  /** Shown after answering. */
  reveal: string;
  views?: View[];
}

export interface Option {
  id: string;
  text: string;
  /** Shown first when this option is picked: a reply to that answer in particular. */
  reply?: string;
}

export type Step =
  /** Pick one. `answer` when one is right; without it, a question with no single answer. */
  | (Beat & { kind: 'choose'; options: Option[]; answer?: string })
  /** A number on a slider; `answer` is shown against the guess. */
  | (Beat & { kind: 'estimate'; min: number; max: number; step: number; answer: number; unit: string })
  /** Put items in order. Written in the right order; shown scrambled. `detail` is revealed with it. */
  | (Beat & { kind: 'order'; items: { id: string; text: string; detail: string }[]; first: string; last: string })
  /** A quick series of calls between two labels. `answer` is the label's index where one is right. */
  | (Beat & { kind: 'quickfire'; labels: [string, string]; items: { id: string; text: string; answer?: 0 | 1; note: string }[] });

export type StepKind = Step['kind'];

export const IDEA_KINDS = { question: 'A question to keep', model: 'A way to think', saying: 'A saying', insight: 'An insight' } as const;
export type IdeaKind = keyof typeof IDEA_KINDS;

export interface Takeaway {
  kind: IdeaKind;
  text: string;
  /** A saying's author and where it can be read: never an invented attribution. */
  by?: string;
  source?: Source;
}

export const RELATIONS = ['supports', 'challenges', 'qualifies', 'reinterprets'] as const;
export type Relation = (typeof RELATIONS)[number];

/** "This round's idea <how> the idea of <to>", with why, in words that read from either end. */
export interface Link {
  to: string;
  how: Relation;
  note: string;
}

export interface Round {
  /** Never reused for different content. */
  id: string;
  /** Bumped when the meaning changes. */
  v: number;
  title: string;
  topic: Topic;
  form: Form;
  /** One line for the list of rounds; gives nothing away. */
  hook: string;
  steps: Step[];
  takeaway: Takeaway;
  links: Link[];
  claims: Claim[];
  /** What the round invents or simplifies, if anything. */
  note?: string;
  /** When its claims were last checked against their sources (YYYY-MM-DD). */
  checked: string;
}

// ---- Records ---------------------------------------------------------------

/** choose: option id; estimate: number; order: item ids as placed; quickfire: label index per item. */
export type Answer = string | number | string[] | number[];

export interface Play {
  round: string;
  v: number;
  at: string;
  answers: Record<string, Answer>;
}

/** An idea kept in the Book: the player's words, and the round's as they were when kept. */
export interface Idea {
  round: string;
  title: string;
  kind: IdeaKind;
  /** What the Book shows: the takeaway, or the player's edit of it. */
  text: string;
  /** The takeaway as the round put it when kept. */
  original: string;
  by?: string;
  at: string;
  edited?: string;
}

/** Earlier versions of Tell, by the schema they saved. */
export const EARLIER: Record<number, string> = {
  1: 'the first version of Tell',
  2: 'Tell’s choice-experiments version',
  3: 'Tell 2.0',
  4: 'Tell 3.0',
  5: 'Tell 3.1',
  6: 'Tell 4',
};
export const earlierName = (schema: number) => EARLIER[schema] ?? `an earlier version of Tell (schema ${schema})`;

/** A document from an earlier version of Tell, kept exactly as it was. */
export interface Archived {
  schema: number;
  at: string;
  doc: Record<string, unknown>;
}

export const SCHEMA = 7;

export interface TellState {
  schema: typeof SCHEMA;
  plays: Play[];
  book: Idea[];
  /** Rounds passed over in Play, so the next one comes up instead; they come back once the rest are played. */
  skipped: string[];
  archive: Archived[];
}
