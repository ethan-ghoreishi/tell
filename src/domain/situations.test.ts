import { describe, expect, it } from 'vitest';
import { keysOf } from './engine';
import { CONNECTIONS, SITUATIONS } from './situations';
import type { Situation } from './types';
import { situationProblem } from './validate';

// What every situation and connection must be. These checks catch structure
// and wording; they can't judge whether a situation is interesting or a
// connection useful, so a person reads every path and combination
// (tests/review.test.ts) before content ships (AGENTS.md).

const words = (s: string) => s.trim().split(/\s+/).length;
const keyedTexts = (k: Situation['ending']['closing']) => (typeof k === 'string' ? [k] : Object.values(k.cases));

/** Every string a player can read in a situation, with the most words it may have. */
function texts(s: Situation): [string, number][] {
  const out: [string, number][] = [
    [s.title, 5],
    [s.place, 4],
    [s.hook, 14],
    [s.setup, 70],
    ...keyedTexts(s.ending.closing).map((t): [string, number] => [t, 50]),
    [s.ending.others, 50],
  ];
  for (const step of s.steps) {
    if (step.kind === 'choose') {
      out.push([step.prompt, 25], ...(step.before ? keyedTexts(step.before).map((t): [string, number] => [t, 40]) : []));
      for (const o of [...step.options, ...(step.ask ? [step.ask.adds] : [])]) out.push([o.text, 10], ...(o.detail ? [[o.detail, 14] as [string, number]] : []));
      if (step.ask) out.push([step.ask.label, 8], [step.ask.did, 8], [step.ask.answer, 35]);
    }
    if (step.kind === 'uncover') out.push([step.prompt, 25], ...step.facts.flatMap((f): [string, number][] => [[f.label, 8], [f.text, 30]]));
    if (step.kind === 'allocate') out.push([step.prompt, 25], ...step.items.flatMap((i): [string, number][] => [[i.text, 6], ...(i.detail ? [[i.detail, 10] as [string, number]] : [])]));
    if (step.kind === 'days') out.push([step.act, 4], [step.wait, 4], [step.last, 6], ...step.days.map((d): [string, number] => [d.text, 40]));
  }
  return out;
}

/** Words that would turn a situation into a verdict on the person. */
const PSYCHOLOGY = /\b(bias|biased|fear|afraid|anxi\w*|avoid\w*|procrastinat\w*|personality|trait|insecur\w*|ego|trauma\w*|impostor|perfectionis\w*|addict\w*|compuls\w*|lazy|guilt\w*|shame\w*|self-esteem|denial|irrational|loss aversion|sunk cost|risk-averse|cautious|reckless|impulsive|diagnos\w*|therap\w*|cognitive|mindset|instinct\w*|tendency|preference)\b/i;
/** Sentences that describe the player rather than the answers. */
const DESCRIBES_YOU = /\b(you are|you're|you’re the|you tend|you always|you never|you often|you usually|you prefer|you like to|people like you|your type|kind of person|that's like you|that’s like you)\b/i;
/** Lessons in disguise. */
const VERDICT = /\b(should have|right answer|wrong answer|the best choice|mistake|correct|smart|wise)\b/i;

const jaccard = (a: string, b: string) => {
  const [x, y] = [a, b].map((s) => new Set(s.toLowerCase().match(/[a-z’']+/g)));
  const shared = [...x].filter((w) => y.has(w)).length;
  return shared / (x.size + y.size - shared);
};

describe('the situations', () => {
  it('are a small, finite collection with distinct ids', () => {
    expect(SITUATIONS.length).toBeGreaterThanOrEqual(4);
    expect(SITUATIONS.length).toBeLessThanOrEqual(12);
    expect(new Set(SITUATIONS.map((s) => s.id)).size).toBe(SITUATIONS.length);
    expect(new Set(SITUATIONS.map((s) => s.place)).size).toBe(SITUATIONS.length);
  });

  it('each have a sound shape', () => {
    for (const s of SITUATIONS) expect(situationProblem(s), s.id).toBeNull();
  });

  it('vary how they are played: no formula repeats, and no control dominates', () => {
    const shapes = SITUATIONS.map((s) => s.steps.map((x) => x.kind + (x.kind === 'choose' && (x.before || x.ask) ? (x.before ? '+before' : '+ask') : '')).join(' → '));
    expect(new Set(shapes).size, shapes.join('\n')).toBe(SITUATIONS.length);
    const kinds = new Set(SITUATIONS.flatMap((s) => s.steps.map((x) => x.kind)));
    expect([...kinds].sort()).toEqual(['allocate', 'choose', 'days', 'uncover']);
  });

  it('end differently for different paths', () => {
    for (const s of SITUATIONS) {
      const closings = keyedTexts(s.ending.closing);
      expect(new Set(closings).size, s.id).toBe(closings.length);
    }
  });

  it('keep to their word limits and wording rules', () => {
    for (const s of SITUATIONS) {
      for (const [t, max] of texts(s)) {
        expect(words(t), `${s.id}: “${t}”`).toBeLessThanOrEqual(max);
        expect(t, s.id).not.toMatch(PSYCHOLOGY);
        expect(t, s.id).not.toMatch(DESCRIBES_YOU);
        expect(t, s.id).not.toMatch(VERDICT);
        expect(t, s.id).not.toMatch(/[£$€¥]/);
      }
    }
  });
});

describe('the connections', () => {
  const sit = (id: string) => SITUATIONS.find((s) => s.id === id)!;

  it('join two situations that exist, at their current version, and no situation joins two', () => {
    for (const c of CONNECTIONS) {
      for (const side of c.sides) {
        expect(sit(side.situation), `${c.id} → ${side.situation}`).toBeDefined();
        expect(side.v, `${c.id} → ${side.situation}`).toBe(sit(side.situation).v);
      }
      expect(c.sides[0].situation).not.toBe(c.sides[1].situation);
    }
    const joined = CONNECTIONS.flatMap((c) => c.sides.map((s) => s.situation));
    expect(new Set(joined).size).toBe(joined.length);
  });

  it('rest on a declared difference in the model, never on shared words', () => {
    for (const c of CONNECTIONS) {
      const [a, b] = c.sides.map((s) => sit(s.situation).structure[c.on]);
      expect(a, c.id).not.toBe(b);
    }
  });

  it('sort every answer of the compared step into exactly one class, and have a note for every combination', () => {
    for (const c of CONNECTIONS) {
      for (const side of c.sides) {
        const step = sit(side.situation).steps.find((x) => x.id === side.step);
        expect(step, `${c.id}.${side.step}`).toBeDefined();
        const sorted = Object.values(side.classes).flat();
        expect([...sorted].sort(), c.id).toEqual([...keysOf(step!)].sort());
        expect(Object.keys(side.classes).length, c.id).toBeGreaterThanOrEqual(2);
      }
      const combos = Object.keys(c.sides[0].classes).flatMap((a) => Object.keys(c.sides[1].classes).map((b) => `${a}+${b}`));
      expect(Object.keys(c.notes).sort(), c.id).toEqual(combos.sort());
    }
  });

  it('are never next to each other in the collection, so one doesn’t prime the other', () => {
    const order = SITUATIONS.map((s) => s.id);
    for (const c of CONNECTIONS) {
      const [i, j] = c.sides.map((s) => order.indexOf(s.situation));
      expect(Math.abs(i - j), c.id).toBeGreaterThan(1);
    }
  });

  it('keep to their word limits and wording rules, with no two notes alike', () => {
    for (const c of CONNECTIONS) {
      const all: [string, number][] = [[c.title, 8], [c.link, 45], [c.differs, 12], [c.question, 16], ...Object.values(c.notes).map((n): [string, number] => [n, 50])];
      for (const [t, max] of all) {
        expect(words(t), `${c.id}: “${t}”`).toBeLessThanOrEqual(max);
        expect(t, c.id).not.toMatch(PSYCHOLOGY);
        expect(t, c.id).not.toMatch(DESCRIBES_YOU);
        expect(t, c.id).not.toMatch(VERDICT);
      }
      expect(c.question.endsWith('?'), c.id).toBe(true);
    }
    const notes = CONNECTIONS.flatMap((c) => Object.values(c.notes));
    for (const [i, a] of notes.entries()) for (const b of notes.slice(i + 1)) expect(jaccard(a, b), `${a}\n${b}`).toBeLessThan(0.5);
  });
});
