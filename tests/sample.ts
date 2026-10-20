import { emptyState, recordPlay } from '../src/domain/engine';
import { SITUATIONS } from '../src/domain/situations';
import type { Answers, TellState } from '../src/domain/types';

// One way through every situation, using every kind of step, for tests that
// need real records rather than hand-written ones.

export const SAMPLE: Record<string, Answers> = {
  oak: { look: { kind: 'uncover', opened: ['scan'] }, act: { kind: 'choose', pick: 'crown', asked: false } },
  harvest: { pick: { kind: 'days', day: 2 } },
  boat: { keep: { kind: 'choose', pick: 'club', asked: true } },
  loaf: { plan: { kind: 'choose', pick: 'shelf', asked: false }, next: { kind: 'choose', pick: 'weekly', asked: false } },
  take: { light: { kind: 'choose', pick: 'again', asked: true } },
  beans: { rows: { kind: 'allocate', amounts: { old: 2, usual: 8 } } },
};

/** Every situation played once, an hour apart from `start`. */
export function everything(start: Date): TellState {
  return SITUATIONS.reduce((s, x, i) => recordPlay(s, SITUATIONS, x.id, SAMPLE[x.id], new Date(start.getTime() + i * 3_600_000)), emptyState());
}
