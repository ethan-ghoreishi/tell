import { emptyState, recordPlay } from '../src/domain/engine';
import { NONE, NOT_SURE, QUESTIONS, type Shape } from '../src/domain/language';
import { SITUATIONS } from '../src/domain/situations';
import type { Answers, TellState } from '../src/domain/types';

// One way through every story, using every kind of step, for tests that need
// real records rather than hand-written ones; and every set of answers Bring
// a choice can be given.

export const SAMPLE: Record<string, Answers> = {
  oak: { look: { kind: 'uncover', opened: ['scan'] }, act: { kind: 'choose', pick: 'crown', asked: false } },
  harvest: { pick: { kind: 'days', day: 2 } },
  boat: { keep: { kind: 'choose', pick: 'club', asked: true } },
  loaf: { plan: { kind: 'choose', pick: 'shelf', asked: false }, next: { kind: 'choose', pick: 'weekly', asked: false } },
  take: { light: { kind: 'choose', pick: 'again', asked: true } },
  beans: { rows: { kind: 'allocate', amounts: { old: 2, usual: 8 } } },
};

/** Every story played once, an hour apart from `start`. */
export function everything(start: Date): TellState {
  return SITUATIONS.reduce((s, x, i) => recordPlay(s, SITUATIONS, x.id, SAMPLE[x.id], new Date(start.getTime() + i * 3_600_000)), emptyState());
}

/** Every set of answers to the four questions: each answer, Not sure and None of these, and every non-empty set for the one that takes several. */
export function allShapes(): Shape[] {
  const one = (id: string) => [...QUESTIONS.find((q) => q.id === id)!.answers.map((a) => a.id), NOT_SURE, NONE];
  const many = QUESTIONS.find((q) => q.multi)!.answers.map((a) => a.id);
  const sets = [...many.reduce<string[][]>((all, k) => [...all, ...all.map((s) => [...s, k])], [[]]).filter((s) => s.length), [NOT_SURE], [NONE]];
  return one('undo').flatMap((undo) => sets.flatMap((know) => one('wait').flatMap((wait) => one('bad').map((bad) => ({ undo, know, wait, bad })))));
}
