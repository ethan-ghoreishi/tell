import { ROUNDS } from '../src/content';
import type { Answer, Round } from '../src/domain/types';

// One valid way through a round, made from the round itself: the right answer
// where there is one, else the first option. For tests that need real records.

export function answersFor(r: Round): Record<string, Answer> {
  return Object.fromEntries(
    r.steps.map((s) => {
      if (s.kind === 'choose') return [s.id, s.answer ?? s.options[0].id];
      if (s.kind === 'estimate') return [s.id, s.answer];
      if (s.kind === 'order') return [s.id, s.items.map((i) => i.id)];
      return [s.id, s.items.map((i) => i.answer ?? 0)];
    }),
  );
}

export const ANSWERS: Record<string, Record<string, Answer>> = Object.fromEntries(ROUNDS.map((r) => [r.id, answersFor(r)]));
