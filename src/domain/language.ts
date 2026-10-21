import { list } from './text';

// Tell's language for choices under uncertainty: four questions that read the
// shape of a step, and fifteen named moves for what makes it hard. Written
// once, the same for everyone, and assembled by rule. Nothing here reads the
// player's record: `results` depends on the answers alone (tested).
//
// The questions read the influence-diagram structure of a choice (Howard &
// Matheson): whether the commitment can be reversed (Arrow & Fisher; Dixit &
// Pindyck), whether what matters is known before it (Howard 1966), what
// putting it off does (the option to defer), and how bad the worst case is.
// The moves are the familiar ways of acting on each: real options (defer,
// stage, switch, abandon), risk treatment, creating alternatives, signposts.
//
// Every move starts as a proposal: it counts as established only once real
// choices show it in use (PILOT.md). Bump LANGUAGE when a meaning changes;
// every play and kept choice records the version it used.

export const LANGUAGE = 1;

export const NOT_SURE = 'notsure';
export const NONE = 'none';

export interface Answer {
  id: string;
  text: string;
  /** A moment from the stories with this answer, or an everyday one where no story has it yet. */
  like?: string;
  /** The answer inside a sentence: "Because you said it can’t be undone." */
  said: string;
}

export interface Question {
  id: QuestionId;
  ask: string;
  /** Tap all that fit. */
  multi?: boolean;
  /** When the moves this question reads are worth anything. Never about the player. */
  principle: string;
  answers: Answer[];
}

export type QuestionId = 'undo' | 'know' | 'wait' | 'bad';

/** Answers to the four questions about one step. `know` may hold several; Not sure and None of these stand alone. */
export interface Shape {
  undo: string;
  know: string[];
  wait: string;
  bad: string;
}

export const QUESTIONS: Question[] = [
  {
    id: 'undo',
    ask: 'If you take it, can it be undone?',
    principle: 'A way back is worth something only when the step would be hard to undo.',
    answers: [
      { id: 'easily', text: 'Easily', like: 'twelve loaves on a shelf', said: 'it’s easily undone' },
      { id: 'cost', text: 'Yes, at a cost', like: 'a lease with a break fee', said: 'undoing it would cost something' },
      { id: 'no', text: 'No', like: 'felling the oak, or picking the grapes', said: 'it can’t be undone' },
    ],
  },
  {
    id: 'know',
    ask: 'When will you know whether it was right?',
    multi: true,
    principle: 'Finding out first is worth something only if it could change the step, and comes before the step must be taken.',
    answers: [
      { id: 'check', text: 'Before, by checking or asking', like: 'the oak’s trunk, scanned', said: 'there’s something to check or ask first' },
      { id: 'wait', text: 'In time, by waiting', like: 'the vineyard’s forecast, each morning', said: 'news will come in time' },
      { id: 'after', text: 'Only once it’s done', like: 'the film’s reels, back on Thursday', said: 'it will only show once it’s done' },
      { id: 'never', text: 'Maybe never', like: 'how the road not taken would have gone', said: 'it may never be known' },
    ],
  },
  {
    id: 'wait',
    ask: 'If you wait, what happens?',
    principle: 'Waiting is worth its cost only if something useful arrives while you wait.',
    answers: [
      { id: 'nothing', text: 'Not much', like: 'the new loaf, which could go on the shelf any Saturday', said: 'waiting changes little' },
      { id: 'closes', text: 'The chance goes', like: 'the buyer’s offer for the boat, good until Friday, or old seed, fewer sprouting each spring', said: 'waiting lets the chance go' },
      { id: 'risk', text: 'The risk grows', like: 'the leaning oak, with the storms coming', said: 'waiting raises the risk' },
      { id: 'better', text: 'Better, but riskier', like: 'grapes left on the vine before a storm', said: 'waiting makes it better but riskier' },
    ],
  },
  {
    id: 'bad',
    ask: 'If it goes badly, how bad?',
    principle: 'Limiting the harm is worth its price only when the bad case would be hard to recover from.',
    answers: [
      { id: 'over', text: 'Something to get over', like: 'loaves coming home unsold', said: 'it’s something to get over' },
      { id: 'hard', text: 'Hard to recover from', like: 'a fault in the film’s only good take', said: 'it would be hard to recover from' },
    ],
  },
];

export type StrategyId = 'find' | 'soften' | 'open' | 'harm' | 'another' | 'settle';

/** Grouped by the difficulty they deal with, in a fixed order. `about` is the question whose hard answers call for it. */
export const STRATEGIES: { id: StrategyId; name: string; about?: QuestionId }[] = [
  { id: 'find', name: 'Find out first', about: 'know' },
  { id: 'soften', name: 'Soften the step', about: 'undo' },
  { id: 'open', name: 'Keep it open', about: 'wait' },
  { id: 'harm', name: 'Limit the harm', about: 'bad' },
  { id: 'another', name: 'Find another way' },
  { id: 'settle', name: 'Settle it' },
];

export type MoveId =
  | 'look'
  | 'wait-for-it'
  | 'small'
  | 'undoable'
  | 'split'
  | 'hold'
  | 'more-time'
  | 'hand-over'
  | 'by-using'
  | 'guard'
  | 'spare'
  | 'another'
  | 'commit'
  | 'rule-out'
  | 'tripwire';

export interface LanguageMove {
  id: MoveId;
  name: string;
  strategy: StrategyId;
  /** The answers it fits: every named question must have one of these. None named: always possible. */
  fits: Partial<Record<QuestionId, string[]>>;
  /** What the four questions can't read, put as a question rather than a claim. */
  asks?: string;
  /** What it is, described, never urged. */
  is: string;
  /** Its price. No move is free. */
  costs: string;
  /** Where it stops working. */
  breaks: string;
  /** An everyday instance. */
  like: string;
}

export const LANGUAGE_MOVES: LanguageMove[] = [
  {
    id: 'look',
    name: 'Look first',
    strategy: 'find',
    fits: { know: ['check'] },
    is: 'Checking or asking before the step.',
    costs: 'The time or money the checking takes, while the chance waits.',
    breaks: 'When what can be checked describes only how things are now: what people say isn’t what they’ll do.',
    like: 'asking people who have done it',
  },
  {
    id: 'wait-for-it',
    name: 'Wait for it',
    strategy: 'find',
    fits: { know: ['wait'] },
    is: 'Holding off while the news arrives.',
    costs: 'Whatever the wait costs in the meantime.',
    breaks: 'When the risk grows faster than the news comes.',
    like: 'hearing back from the second offer before answering the first',
  },
  {
    id: 'small',
    name: 'Try it small',
    strategy: 'find',
    fits: { know: ['after'] },
    asks: 'Could part of it go first, and be stopped?',
    is: 'Taking a small part first, to learn from it.',
    costs: 'The time the small version takes, and what it leaves undone.',
    breaks: 'When the small part can’t be stopped either, or can’t show what the whole would.',
    like: 'a month’s trial before a year’s contract',
  },
  {
    id: 'undoable',
    name: 'Make it undoable',
    strategy: 'soften',
    fits: { undo: ['no', 'cost'] },
    asks: 'Is there a version with an easier way back?',
    is: 'A version of the step that is easier to reverse.',
    costs: 'Whatever the way back costs: a fee, a trial’s limits, a longer route.',
    breaks: 'When the way back costs nearly as much as the step.',
    like: 'renting before buying',
  },
  {
    id: 'split',
    name: 'Split it',
    strategy: 'soften',
    fits: { undo: ['no', 'cost'], know: ['after', 'never'] },
    asks: 'Could some of it go each way?',
    is: 'Putting part on each path, so no single outcome is everything.',
    costs: 'Some of the best case, whichever way it goes.',
    breaks: 'When half of each is worth less than all of one.',
    like: 'keeping two days a week of the old work',
  },
  {
    id: 'hold',
    name: 'Hold it open',
    strategy: 'open',
    fits: { wait: ['closes', 'risk'] },
    is: 'Paying to keep the chance while waiting.',
    costs: 'What holding costs each week, needed or not.',
    breaks: 'When nothing will be learned while it’s held.',
    like: 'a deposit that keeps a place',
  },
  {
    id: 'more-time',
    name: 'Ask for more time',
    strategy: 'open',
    fits: { wait: ['closes'] },
    asks: 'Does someone else set the deadline?',
    is: 'Asking whoever set the clock to move it.',
    costs: 'Some goodwill, and sometimes the offer.',
    breaks: 'When asking costs the offer itself.',
    like: 'a week more before answering an offer',
  },
  {
    id: 'hand-over',
    name: 'Hand it over',
    strategy: 'open',
    fits: { wait: ['closes'] },
    asks: 'Could someone else keep it going for now?',
    is: 'Letting someone else hold it for a while.',
    costs: 'What they do with it while it’s theirs.',
    breaks: 'When they change what they hold.',
    like: 'a friend subletting the flat for a year',
  },
  {
    id: 'by-using',
    name: 'Keep it by using',
    strategy: 'open',
    fits: { wait: ['closes'] },
    asks: 'Is using it what keeps it alive?',
    is: 'Using a little of it, so it doesn’t fade.',
    costs: 'Whatever the use takes from something else.',
    breaks: 'When a little use isn’t enough to keep it.',
    like: 'playing an instrument once a week so the skill stays',
  },
  {
    id: 'guard',
    name: 'Guard',
    strategy: 'harm',
    fits: { bad: ['hard'] },
    is: 'Making the bad case less likely, or less bad.',
    costs: 'The guard’s price, paid even if the bad case never comes.',
    breaks: 'When the guard is itself for good, or brings its own risk.',
    like: 'insurance, or a fence round the danger',
  },
  {
    id: 'spare',
    name: 'Buy a spare',
    strategy: 'harm',
    fits: { bad: ['hard'], know: ['after', 'never'] },
    asks: 'Is there a second chance to buy now?',
    is: 'Something to fall back on, got before the point of no return.',
    costs: 'The spare’s price, needed or not.',
    breaks: 'When the spare shares the fault.',
    like: 'a backup copy, kept somewhere else',
  },
  {
    id: 'another',
    name: 'Make another option',
    strategy: 'another',
    fits: {},
    asks: 'Is there a way through nobody has named yet?',
    is: 'Looking for a way that isn’t on the list.',
    costs: 'The time spent looking, while the others wait.',
    breaks: 'When looking costs the chance there is.',
    like: 'asking who else could use it',
  },
  {
    id: 'commit',
    name: 'Commit',
    strategy: 'settle',
    fits: {},
    is: 'Taking the step now, on what is known.',
    costs: 'Anything waiting would have taught, and any way back.',
    breaks: 'When the answer was already on its way.',
    like: 'signing today',
  },
  {
    id: 'rule-out',
    name: 'Rule it out',
    strategy: 'settle',
    fits: {},
    is: 'Deciding against it for good, and letting the question go.',
    costs: 'Whatever the step would have brought.',
    breaks: 'When the chance won’t come again, and there’s no other like it.',
    like: 'telling the buyer no, and meaning it',
  },
  {
    id: 'tripwire',
    name: 'Set a tripwire',
    strategy: 'settle',
    fits: { wait: ['closes', 'risk', 'better'] },
    asks: 'What would need to happen, and by when?',
    is: 'Deciding now what would mean acting, or stopping, later.',
    costs: 'A rule that may fire at the wrong moment.',
    breaks: 'When it watches the wrong signal.',
    like: 'if it isn’t paying by March, it stops',
  },
];

export const SCOPE =
  'These moves are about not knowing, and about steps that are hard to undo. Where a choice is hard because of wanting two things at once, someone else’s plans, a habit or a duty, they cover only part of it.';
export const OUTSIDE = 'The four questions don’t seem to describe this choice, so only the moves that are always possible are shown.';
export const PARTLY = 'Some of the questions don’t describe this choice, so these moves cover only part of it.';

export const question = (id: QuestionId) => QUESTIONS.find((q) => q.id === id)!;
export const languageMove = (id: string) => LANGUAGE_MOVES.find((m) => m.id === id);
const said = (q: QuestionId, a: string) => question(q).answers.find((x) => x.id === a)!.said;

/** The answers given to one question, always as a list. */
export const answersTo = (shape: Shape, q: QuestionId): string[] => (q === 'know' ? shape.know : [shape[q]]);

/** An answer's words, the two escapes included. */
export const answerText = (q: QuestionId, a: string) => (a === NOT_SURE ? 'Not sure' : a === NONE ? 'None of these' : question(q).answers.find((x) => x.id === a)!.text);

/** The answers given to one question, as one phrase: "Before, by checking or asking; only once it’s done". */
export const answersText = (shape: Shape, q: QuestionId) =>
  answersTo(shape, q)
    .map((a, i) => (i ? answerText(q, a).replace(/^./, (c) => c.toLowerCase()) : answerText(q, a)))
    .join('; ');

/**
 * Why these aren't answers to the four questions, or null when they are. A
 * story's shape is always definite; a choice may say Not sure or None of
 * these, each standing alone.
 */
export function shapeProblem(x: unknown, escapes: boolean): string | null {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return 'has no answers';
  const s = x as Record<string, unknown>;
  if (Object.keys(s).length !== QUESTIONS.length) return 'answers questions Tell doesn’t ask';
  for (const q of QUESTIONS) {
    const ok = [...q.answers.map((a) => a.id), ...(escapes ? [NOT_SURE, NONE] : [])];
    const a = q.multi ? s[q.id] : typeof s[q.id] === 'string' ? [s[q.id]] : null;
    if (!Array.isArray(a) || !a.length || new Set(a).size !== a.length || !a.every((v) => ok.includes(v as string))) return `doesn’t answer “${q.ask}”`;
    if (a.length > 1 && a.some((v) => v === NOT_SURE || v === NONE)) return `mixes Not sure or None of these with other answers to “${q.ask}”`;
  }
  return null;
}

export interface MoveResult {
  id: MoveId;
  /** Derived from the answers: "Because …", "If …", or "Always possible." */
  because: string;
}

export interface ResultLine {
  strategy: StrategyId;
  because: string;
  moves: MoveResult[];
}

/** The answers that make a move fit (`sure`), and the questions left open by Not sure that it would need (`unsure`). Null when it doesn't fit. */
function fit(m: LanguageMove, shape: Shape): { sure: [QuestionId, string][]; unsure: [QuestionId, string[]][] } | null {
  const sure: [QuestionId, string][] = [];
  const unsure: [QuestionId, string[]][] = [];
  for (const [q, wanted] of Object.entries(m.fits) as [QuestionId, string[]][]) {
    const a = answersTo(shape, q);
    if (a.includes(NOT_SURE)) unsure.push([q, wanted]);
    else {
      const hit = a.filter((x) => wanted.includes(x));
      if (!hit.length) return null;
      sure.push(...hit.map((x): [QuestionId, string] => [q, x]));
    }
  }
  return { sure, unsure };
}

/** "waiting lets the chance go or waiting raises the risk" → "waiting lets the chance go or raises the risk". */
function either(xs: string[]) {
  const first = xs[0].split(' ')[0];
  return xs.length > 1 && xs.every((x) => x.startsWith(`${first} `)) ? `${first} ${list(xs.map((x) => x.slice(first.length + 1)), 'or')}` : list(xs, 'or');
}

const because = (sure: [QuestionId, string][], unsure: [QuestionId, string[]][]) => {
  if (!sure.length && !unsure.length) return 'Always possible.';
  const ifs = unsure.map(([q, wanted]) => either(wanted.map((w) => said(q, w))));
  const parts = [sure.length ? `Because you said ${list(sure.map(([q, a]) => said(q, a)))}` : '', ifs.length ? `${sure.length ? 'and if' : 'If'} ${ifs.join(', and if ')}` : ''];
  return `${parts.filter(Boolean).join(', ')}.`;
};

/** Why a move fits these answers ("Because …", "If …", "Always possible."), or null when it doesn't. */
export function fitOf(m: LanguageMove, shape: Shape): string | null {
  const f = fit(m, shape);
  return f && because(f.sure, f.unsure);
}

/**
 * The moves that fit these answers, one line per strategy, in a fixed order.
 * The answers are all it reads: the same answers always give the same moves.
 * Settle it is always there, because a choice can always be settled. A
 * strategy's line cites only the answers to its own question that made one of
 * its moves fit.
 */
export function results(shape: Shape): ResultLine[] {
  return STRATEGIES.flatMap((s) => {
    const fitting = LANGUAGE_MOVES.filter((m) => m.strategy === s.id).flatMap((m) => {
      const f = fit(m, shape);
      return f ? [{ m, f }] : [];
    });
    if (!fitting.length) return [];
    const own = <T>(xs: [QuestionId, T][]) => xs.filter(([q]) => q === s.about);
    const sure = [...new Map(fitting.flatMap(({ f }) => own(f.sure)).map((x) => [x[1], x])).values()];
    const unsure = fitting.some(({ f }) => own(f.unsure).length) ? [[s.about!, [...new Set(fitting.flatMap(({ f }) => own(f.unsure).flatMap(([, w]) => w)))]] as [QuestionId, string[]]] : [];
    return [{ strategy: s.id, because: because(sure, unsure), moves: fitting.map(({ m, f }) => ({ id: m.id, because: because(f.sure, f.unsure) })) }];
  });
}

/** Every question answered None of these: the questions don't describe this choice. */
export const outside = (shape: Shape) => QUESTIONS.every((q) => answersTo(shape, q.id).includes(NONE));

/** Some, but not all, answered None of these: the moves cover only part of the choice. */
export const partly = (shape: Shape) => !outside(shape) && QUESTIONS.some((q) => answersTo(shape, q.id).includes(NONE));
