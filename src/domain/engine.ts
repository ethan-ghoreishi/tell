import { SCHEMA, type Answer, type Idea, type Relation, type Round, type Step, type TellState } from './types';

// Pure transitions on the player's record, and what Play and the Book derive
// from it. Every function takes the content it needs and an explicit `now`.
// Nothing here describes the player: plays decide only which round comes up
// next, and which connections can be shown without giving a round away.

export const emptyState = (): TellState => ({ schema: SCHEMA, plays: [], book: [], skipped: [], archive: [] });

export const hasPlayed = (s: TellState, id: string) => s.plays.some((p) => p.round === id);
export const ideaOf = (s: TellState, id: string) => s.book.find((i) => i.round === id);
export const lastPlay = (s: TellState, id: string) => s.plays.filter((p) => p.round === id).at(-1);

/**
 * The round Play offers next: the first, in the collection's order, not yet
 * played or passed over; then the passed-over ones; null once all are played.
 * `except` is the round on screen, so moving on never offers it again.
 */
export function nextUp(s: TellState, rounds: Round[], except?: string): Round | null {
  const fresh = rounds.filter((r) => r.id !== except && !hasPlayed(s, r.id));
  return fresh.find((r) => !s.skipped.includes(r.id)) ?? fresh[0] ?? null;
}

export const skip = (s: TellState, id: string): TellState => (s.skipped.includes(id) ? s : { ...s, skipped: [...s.skipped, id] });

/** Why an answer can't belong to a step, or null. The one check, used when recording. */
export function answerProblem(step: Step, a: unknown): string | null {
  switch (step.kind) {
    case 'choose':
      return typeof a === 'string' && step.options.some((o) => o.id === a) ? null : 'is not one of the options';
    case 'estimate':
      return typeof a === 'number' && Number.isFinite(a) && a >= step.min && a <= step.max ? null : 'is outside the range';
    case 'order': {
      const ids = step.items.map((i) => i.id);
      return Array.isArray(a) && a.length === ids.length && ids.every((id) => a.includes(id)) ? null : 'does not place every item once';
    }
    case 'quickfire':
      return Array.isArray(a) && a.length === step.items.length && a.every((x) => x === 0 || x === 1) ? null : 'does not answer every item';
  }
}

/** A finished round. Answers are checked in full; a bad one is a bug, never stored. */
export function recordPlay(s: TellState, round: Round, answers: Record<string, Answer>, now: Date): TellState {
  for (const step of round.steps) {
    const p = answerProblem(step, answers[step.id]);
    if (p) throw new Error(`${round.id}/${step.id}: the answer ${p}`);
  }
  const kept = Object.fromEntries(round.steps.map((st) => [st.id, answers[st.id]]));
  return {
    ...s,
    plays: [...s.plays, { round: round.id, v: round.v, at: now.toISOString(), answers: kept }],
    skipped: s.skipped.filter((id) => id !== round.id),
  };
}

const tidy = (text: string) => text.trim().replace(/\s+/g, ' ');

/** Keep a round's idea, in its own words or the player's. Keeping it again changes nothing. */
export function keep(s: TellState, round: Round, now: Date, text?: string): TellState {
  if (ideaOf(s, round.id)) return s;
  const { kind, text: original, by } = round.takeaway;
  const mine = text === undefined ? original : tidy(text);
  if (!mine) return s;
  const idea: Idea = { round: round.id, title: round.title, kind, text: mine, original, at: now.toISOString(), ...(by && { by }), ...(mine !== original && { edited: now.toISOString() }) };
  return { ...s, book: [...s.book, idea] };
}

/** The player's wording. Empty text changes nothing; the original's wording clears the edit. */
export function editIdea(s: TellState, id: string, text: string, now: Date): TellState {
  const idea = ideaOf(s, id);
  const mine = tidy(text);
  if (!idea || !mine || mine === idea.text) return s;
  const { edited: _, ...rest } = idea;
  const next: Idea = mine === idea.original ? { ...rest, text: mine } : { ...rest, text: mine, edited: now.toISOString() };
  return { ...s, book: s.book.map((i) => (i.round === id ? next : i)) };
}

export const removeIdea = (s: TellState, id: string): TellState => (ideaOf(s, id) ? { ...s, book: s.book.filter((i) => i.round !== id) } : s);

/** Newest first. */
export const bookOrder = (s: TellState) => [...s.book].reverse();

export interface Connection {
  other: Round;
  how: Relation;
  note: string;
  /** True when the link is written on this round ("this idea challenges that one"); false when on the other. */
  outward: boolean;
  kept?: Idea;
  played: boolean;
}

const PASSIVE: Record<Relation, string> = { supports: 'supported by', challenges: 'challenged by', qualifies: 'qualified by', reinterprets: 'reinterpreted by' };

/** How a connection reads from this end: "Challenges", "Challenged by". */
export const relationWord = (c: Pick<Connection, 'how' | 'outward'>) => {
  const w = c.outward ? c.how : PASSIVE[c.how];
  return w[0].toUpperCase() + w.slice(1);
};

/** Every link between a round and others, from either end, with what the player has of the other end. Kept first, then played, then the rest. */
export function connections(s: TellState, rounds: Round[], id: string): Connection[] {
  const me = rounds.find((r) => r.id === id);
  const all: Connection[] = [];
  for (const r of rounds) {
    if (r.id === id) continue;
    const out = me?.links.find((l) => l.to === r.id);
    const back = r.links.find((l) => l.to === id);
    const link = out ?? back;
    if (link) all.push({ other: r, how: link.how, note: link.note, outward: !!out, kept: ideaOf(s, r.id), played: hasPlayed(s, r.id) });
  }
  const rank = (c: Connection) => (c.kept ? 0 : c.played ? 1 : 2);
  return all.sort((a, b) => rank(a) - rank(b));
}

/** Ideas whose words, round, topic or author contain every word of the query. */
export function search(ideas: Idea[], rounds: Round[], query: string): Idea[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return ideas;
  return ideas.filter((i) => {
    const r = rounds.find((x) => x.id === i.round);
    const hay = [i.text, i.original, i.title, i.by, r?.topic, r?.form].join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

/**
 * The order an order step's items are shown in: fixed, so a replay looks the
 * same, and never the answer. Items are written in the right order.
 */
export function scrambled<T extends { id: string }>(items: T[]): T[] {
  const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const out = [...items].sort((a, b) => hash(a.id) - hash(b.id));
  return out.every((x, i) => x === items[i]) ? out.reverse() : out;
}

/** "2%", "250,000 stadia". */
export function amount(n: number, unit: string): string {
  const num = n.toLocaleString('en-GB');
  return /^[%°]/.test(unit) ? `${num}${unit}` : `${num} ${unit}`;
}

/** The Book as plain text, to read or print anywhere. */
export function bookText(s: TellState, rounds: Round[]): string {
  const lines = ['My Book, from Tell', ''];
  for (const i of bookOrder(s)) {
    const r = rounds.find((x) => x.id === i.round);
    lines.push(i.text);
    if (i.by) lines.push(`— ${i.by}`);
    if (i.edited) lines.push(`(Edited. The round put it: ${i.original})`);
    lines.push(`From “${i.title}”${r ? `, ${r.topic}` : ''}, kept ${i.at.slice(0, 10)}.`);
    for (const c of connections(s, rounds, i.round).filter((c) => c.kept)) lines.push(`  ${relationWord(c)} “${c.other.title}”: ${c.note}`);
    lines.push('');
  }
  if (!s.book.length) lines.push('Nothing kept yet.');
  return lines.join('\n');
}
