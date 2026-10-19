import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GENERIC_READINGS, emptyState, nextAsk, playView, recordPlay, secondOptions, type PlayAnswers } from '../src/domain/engine';
import { EPISODES } from '../src/domain/episodes';
import { UNSURE, type BeatAnswer, type Episode, type Side } from '../src/domain/types';

// Every reachable path through every episode, so the readings an ending shows
// can be checked against the answers on the same screen. A test can only check
// which set is chosen; a person reads them for meaning:
// PATHS_FILE=/tmp/paths.txt npx vitest run tests/paths.test.ts

const on = (d: number) => new Date(2026, 9, d, 9, 0, 0);

describe('every path through every episode', () => {
  /** Every reachable play: each first answer, representative moves, each second answer. */
  function paths(e: Episode): PlayAnswers[] {
    const firsts = [...e.options.map((o) => o.id), UNSURE];
    const b = e.beat;
    let beats: BeatAnswer[];
    if (b.kind === 'twist') beats = [{ kind: 'twist' }];
    else if (b.kind === 'widen') beats = [{ kind: 'widen', picked: [] }, { kind: 'widen', picked: b.items.map((i) => i.id) }];
    else if (b.kind === 'cut') beats = [{ kind: 'cut', order: b.items.slice(0, -1).map((i) => i.id) }];
    else if (b.kind === 'peek')
      beats = [
        { kind: 'peek', opened: [], wouldHave: [] },
        ...e.options.map((o) => ({ kind: 'peek' as const, opened: [{ fact: 0, lean: o.id }], wouldHave: [] })),
        { kind: 'peek', opened: [{ fact: 0, lean: UNSURE }], wouldHave: [] },
      ];
    else {
      const other: Side = b.rises === 'a' ? 'b' : 'a';
      beats = Array.from({ length: b.steps.length + 1 }, (_, at) => {
        const asked: { step: number; pick: Side }[] = [];
        for (let st = nextAsk(7, b.rises, asked); st !== null; st = nextAsk(7, b.rises, asked)) asked.push({ step: st, pick: st >= at ? b.rises : other });
        return { kind: 'slide' as const, asked, outcome: { kind: 'switch' as const, at } };
      });
    }
    return firsts.flatMap((first) => beats.flatMap((beat) => [...secondOptions(e, beat).map((o) => o.id), UNSURE].map((final) => ({ first, beat, final }))));
  }

  it('shows readings that are true for the path taken', () => {
    const generic = Object.values(GENERIC_READINGS);
    const printed: string[] = [];
    for (const e of EPISODES) {
      for (const a of paths(e)) {
        const p = recordPlay(emptyState(), EPISODES, e.id, a, on(1)).plays[0];
        const v = playView(p);
        const where = `${e.id}: ${a.first} → ${JSON.stringify(a.beat)} → ${a.final}`;
        expect(v.readings.length, where).toBeGreaterThanOrEqual(2);
        if (a.first === UNSURE || a.final === UNSURE) expect(generic, where).toContainEqual(v.readings);
        else if (!e.options.some((o) => o.id === a.final)) expect(v.readings, where).toEqual(e.ending.added);
        else if (a.beat.kind === 'peek') {
          // The episode's own Peek readings only where the lean and the answer moved together.
          const wavered = a.beat.opened.some((o) => o.lean !== a.first);
          const own = a.first === a.final ? e.ending.stayed : e.ending.changed;
          if (a.beat.opened.length === 0 || (a.first === a.final) === wavered) expect(generic, where).toContainEqual(v.readings);
          else expect(v.readings, where).toEqual(own);
        }
        else if (e.beat.kind === 'slide' && e.beat.actual && a.beat.kind === 'slide') {
          const line = v.observed.find((l) => l.startsWith('The story’s number'))!;
          if (line.includes('followed it')) expect(v.readings, where).toEqual(e.ending.followed);
          else if (line.includes('went the other way')) expect(v.readings, where).toEqual(e.ending.against);
          else expect(v.readings, where).toEqual(a.first === a.final ? e.ending.stayed : e.ending.changed);
        } else expect(v.readings, where).toEqual(a.first === a.final ? e.ending.stayed : e.ending.changed);
        printed.push(`${where}\n  ${v.observed.join('\n  ')}\n  ~ ${v.readings.join('\n  ~ ')}`);
      }
    }
    // For editorial review: PATHS_FILE=/tmp/paths.txt npx vitest run -t "every path"
    if (process.env.PATHS_FILE) writeFileSync(process.env.PATHS_FILE, printed.join('\n\n'));
  });
});
