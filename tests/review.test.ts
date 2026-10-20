import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { discoveries, emptyState, keyOf, keysOf, moveOf, playView, recordPlay, spent } from '../src/domain/engine';
import { CONNECTIONS, SITUATIONS } from '../src/domain/situations';
import { MOVES, type Answers, type Play, type Situation, type Step, type StepAnswer } from '../src/domain/types';

// Every way through every situation, and every combination of ways through
// two situations, with the connection (if any) it would show. A test checks
// that each has words and that no combination shows two; only a person can
// judge whether each sentence is true and useful for that exact path:
// REVIEW_FILE=/tmp/review.txt npx vitest run tests/review.test.ts

const on = (h: number) => new Date(2026, 9, 1, h, 0, 0);

/** One answer per distinct key a step can have, plus every fact subset for uncover. */
function answersFor(step: Step): StepAnswer[] {
  if (step.kind === 'choose') {
    const plain = step.options.map((o) => ({ kind: 'choose' as const, pick: o.id, asked: false }));
    const asked = step.ask ? [...step.options, ...(step.ask.adds ? [step.ask.adds] : [])].map((o) => ({ kind: 'choose' as const, pick: o.id, asked: true })) : [];
    return [...plain, ...asked];
  }
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

/** One play per distinct combination of keys: the ways through that the model can tell apart. */
function ways(s: Situation): Play[] {
  const seen = new Map<string, Play>();
  for (const a of paths(s)) {
    const key = s.steps.map((step) => keyOf(step, a[step.id])).join('/');
    if (!seen.has(key)) seen.set(key, recordPlay(emptyState(), SITUATIONS, s.id, a, on(9)).plays[0]);
  }
  return [...seen.values()];
}

const words = (m: Record<string, unknown>) =>
  (Object.keys(MOVES) as (keyof typeof MOVES)[])
    .filter((p) => m[p])
    .map((p) => (MOVES[p] as Record<string, string>)[m[p] as string])
    .join('; ');

describe('every way through', () => {
  const printed: string[] = [];

  it('reaches every key of every step, and ends in words on every path', () => {
    for (const s of SITUATIONS) {
      const all = paths(s);
      for (const step of s.steps) expect(new Set(all.map((a) => keyOf(step, a[step.id]))), `${s.id}.${step.id}`).toEqual(new Set(keysOf(step)));
      printed.push(`==== ${s.title} (${s.place})\n${s.setup}\n  Unknown: ${s.uncertain}`);
      const seen = new Set<string>();
      for (const a of all) {
        const p = recordPlay(emptyState(), SITUATIONS, s.id, a, on(9)).plays[0];
        const v = playView(p);
        expect(v.closing, s.id).toBeTruthy();
        const moves = s.steps.map((step) => {
          const m = moveOf(step, keyOf(step, a[step.id]));
          return `[${words(m as unknown as Record<string, unknown>)} | costs ${m.costs} | risks ${m.risks}]`;
        });
        const line = `  ${v.did.join(' ')}\n    ${moves.join('\n    ')}\n    → ${v.closing}`;
        if (!seen.has(line)) printed.push(line);
        seen.add(line);
      }
      printed.push(`  Others: ${s.ending.others}\n`);
    }
  });

  it('shows at most one connection for any two ways through two situations, and says which get none', () => {
    const plays = new Map(SITUATIONS.map((s) => [s.id, ways(s)]));
    const shown = new Map<string, string[]>();
    const none: string[] = [];
    SITUATIONS.forEach((a, i) => {
      for (const b of SITUATIONS.slice(i + 1)) {
        for (const pa of plays.get(a.id)!) {
          for (const pb of plays.get(b.id)!) {
            const state = { ...emptyState(), plays: [pa, { ...pb, id: `${pb.id}b`, at: on(10).toISOString() }] };
            const found = discoveries(state, CONNECTIONS);
            const label = `${a.title}: ${playView(pa).did.join(' ')} / ${b.title}: ${playView(pb).did.join(' ')}`;
            expect(found.length, label).toBeLessThanOrEqual(1);
            if (found.length) shown.set(found[0].connection.id, [...(shown.get(found[0].connection.id) ?? []), label]);
            else if (CONNECTIONS.some((c) => c.sides.some((s) => s.situation === a.id) && c.sides.some((s) => s.situation === b.id))) none.push(label);
          }
        }
      }
    });
    for (const c of CONNECTIONS) {
      const examples = shown.get(c.id) ?? [];
      expect(examples.length, `${c.id} is never shown`).toBeGreaterThan(0);
      // Steps a side doesn't name don't change what it shows: every sentence must hold across them.
      const ignores = c.sides.flatMap((side) => SITUATIONS.find((x) => x.id === side.situation)!.steps.filter((st) => !(st.id in side.when)).map((st) => `${side.situation}.${st.id}`));
      printed.push(`==== Connection: ${c.title}\n  ${c.says}\n  Breaks: ${c.breaks}\n  Question: ${c.question}\n  Must hold whatever: ${ignores.join(', ') || 'nothing (every step is named)'}\n  Shown for:`);
      for (const e of examples) printed.push(`    - ${e}`);
      printed.push('');
    }
    printed.push('==== Combinations of two connected situations that show nothing (check each is deliberate):');
    for (const n of none) printed.push(`    - ${n}`);
    if (process.env.REVIEW_FILE) writeFileSync(process.env.REVIEW_FILE, printed.join('\n'));
  });

});
