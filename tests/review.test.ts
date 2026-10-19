import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { emptyState, found, keyOf, keysOf, limitLine, playView, recordPlay, spent } from '../src/domain/engine';
import { CONNECTIONS, SITUATIONS } from '../src/domain/situations';
import type { Answers, Situation, Step, StepAnswer } from '../src/domain/types';

// Every way through every situation, and every combination a connection can
// show. A test can check that each has words; only a person can judge them:
// REVIEW_FILE=/tmp/review.txt npx vitest run tests/review.test.ts

const on = (h: number) => new Date(2026, 9, 1, h, 0, 0);

/** One answer per distinct key a step can have, plus every fact subset for uncover. */
function answersFor(step: Step): StepAnswer[] {
  if (step.kind === 'choose') return [...step.options.map((o) => ({ kind: 'choose' as const, pick: o.id, asked: false })), ...(step.ask ? [...step.options, step.ask.adds].map((o) => ({ kind: 'choose' as const, pick: o.id, asked: true })) : [])];
  if (step.kind === 'uncover') {
    const subsets = step.facts.reduce<string[][]>((all, f) => [...all, ...all.map((s) => [...s, f.id])], [[]]);
    return subsets.filter((opened) => spent(step, opened) <= step.budget).map((opened) => ({ kind: 'uncover' as const, opened }));
  }
  if (step.kind === 'allocate') {
    return Array.from({ length: step.total + 1 }, (_, n) => ({ kind: 'allocate' as const, amounts: Object.fromEntries(step.items.map((i, k) => [i.id, i.id === step.measure ? n : k === step.items.length - 1 ? step.total - n : 0])) }));
  }
  return Array.from({ length: step.days.length + 1 }, (_, day) => ({ kind: 'days' as const, day }));
}

/** Every combination of answers to every step. */
export function paths(s: Situation): Answers[] {
  return s.steps.reduce<Answers[]>((all, step) => all.flatMap((a) => answersFor(step).map((x) => ({ ...a, [step.id]: x }))), [{}]);
}

describe('every way through', () => {
  const printed: string[] = [];

  it('reaches every key of every step, and ends in words on every path', () => {
    for (const s of SITUATIONS) {
      const all = paths(s);
      for (const step of s.steps) expect(new Set(all.map((a) => keyOf(step, a[step.id]))), `${s.id}.${step.id}`).toEqual(new Set(keysOf(step)));
      const seen = new Set<string>();
      printed.push(`==== ${s.title} (${s.place})\n${s.setup}`);
      for (const a of all) {
        const v = playView(recordPlay(emptyState(), SITUATIONS, s.id, a, on(9)).plays[0]);
        expect(v.closing, s.id).toBeTruthy();
        const line = `  ${v.did.join(' ')}\n    → ${v.closing}`;
        if (!seen.has(line)) printed.push(line);
        seen.add(line);
      }
      printed.push(`  Others: ${s.ending.others}\n`);
    }
  });

  it('has a note for every combination a connection can show', () => {
    for (const c of CONNECTIONS) {
      const [a, b] = c.sides.map((side) => SITUATIONS.find((s) => s.id === side.situation)!);
      printed.push(`==== Connection: ${c.title}\n${c.link}\n  ${limitLine(c)}\n  Question: ${c.question}`);
      const shown = new Set<string>();
      for (const pa of paths(a)) {
        for (const pb of paths(b)) {
          let state = recordPlay(emptyState(), SITUATIONS, a.id, pa, on(9));
          state = recordPlay(state, SITUATIONS, b.id, pb, on(10));
          const f = found(state, [c])[0];
          expect(f.note, `${c.id} ${f.classes.join('+')}`).toBeTruthy();
          const key = f.classes.join('+');
          if (!shown.has(key)) printed.push(`  [${key}] e.g. ${f.chose.join(' / ')}\n    ${f.note}`);
          shown.add(key);
        }
      }
      expect(shown.size, c.id).toBe(Object.keys(c.notes).length);
      printed.push('');
    }
    if (process.env.REVIEW_FILE) writeFileSync(process.env.REVIEW_FILE, printed.join('\n'));
  });
});
