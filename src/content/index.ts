import type { Round } from '../domain/types';
import { PACK_1 } from './pack-1';

// Every round, in the order Play offers them on a first run. A new pack is a
// file beside pack-1.ts, appended here (CONTENT.md). Rounds are never removed:
// a kept idea names its round, and a round's id is never reused.

export const ROUNDS: Round[] = [...PACK_1];

export const roundById = (id: string) => ROUNDS.find((r) => r.id === id);
