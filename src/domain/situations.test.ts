import { describe, expect, it } from 'vitest';
import { keysOf, moveOf } from './engine';
import { CONNECTIONS, SITUATIONS } from './situations';
import { MOVES, type Part, type Situation, type Step } from './types';
import { situationProblem } from './validate';

// What every situation and connection must be. These checks catch structure,
// the model and wording; they can't judge whether a situation is interesting
// or a connection useful, so a person reads every path and combination
// (tests/review.test.ts) before content ships (AGENTS.md).

const words = (s: string) => s.trim().split(/\s+/).length;
const sentences = (s: string) => s.split(/(?<=[.?!])\s+/).length;
const keyedTexts = (k: Situation['ending']['closing']) => (typeof k === 'string' ? [k] : Object.values(k.cases));
const PARTS = Object.keys(MOVES) as Part[];

/** Every answer a step offers, with its move. */
const moves = (step: Step) => keysOf(step).map((k) => moveOf(step, k));

/** Every string a player can read in a situation, with the most words it may have. */
function texts(s: Situation): [string, number][] {
  const out: [string, number][] = [
    [s.title, 5],
    [s.place, 4],
    [s.hook, 14],
    [s.setup, 70],
    [s.uncertain, 14],
    ...keyedTexts(s.ending.closing).map((t): [string, number] => [t, 50]),
    [s.ending.others, 40],
  ];
  for (const step of s.steps) {
    for (const m of moves(step)) out.push([m.costs, 10], [m.risks, 10]);
    if (step.kind === 'choose') {
      out.push([step.prompt, 25], ...(step.before ? keyedTexts(step.before).map((t): [string, number] => [t, 40]) : []));
      for (const o of [...step.options, ...(step.ask?.adds ? [step.ask.adds] : [])]) out.push([o.text, 10], ...(o.detail ? [[o.detail, 16] as [string, number]] : []));
      if (step.ask) out.push([step.ask.label, 8], [step.ask.did, 8], [step.ask.answer, 35]);
    }
    if (step.kind === 'uncover') out.push([step.prompt, 25], ...step.facts.flatMap((f): [string, number][] => [[f.label, 8], [f.text, 30]]));
    if (step.kind === 'allocate') out.push([step.prompt, 25], ...step.items.flatMap((i): [string, number][] => [[i.text, 6], ...(i.detail ? [[i.detail, 10] as [string, number]] : [])]));
    if (step.kind === 'days') out.push([step.act, 4], [step.wait, 4], [step.last, 6], ...step.days.map((d): [string, number] => [d.text, 40]));
  }
  if (s.real) out.push([s.real.invented, 35], ...s.real.facts.map((f): [string, number] => [f.fact, 40]));
  return out;
}

/** Words that would turn a story into a verdict on the person. */
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
  it('are a small, finite collection with distinct ids and places', () => {
    expect(SITUATIONS.length).toBeGreaterThanOrEqual(4);
    expect(SITUATIONS.length).toBeLessThanOrEqual(12);
    expect(new Set(SITUATIONS.map((s) => s.id)).size).toBe(SITUATIONS.length);
    expect(new Set(SITUATIONS.map((s) => s.place)).size).toBe(SITUATIONS.length);
  });

  it('each have a sound shape, and every answer is a move in the model', () => {
    for (const s of SITUATIONS) expect(situationProblem(s), s.id).toBeNull();
  });

  it('vary how they are played: no arrangement repeats, and every control is used', () => {
    const shapes = SITUATIONS.map((s) =>
      s.steps.map((x) => x.kind + (x.kind === 'choose' ? (x.before ? '+before' : '') + (x.ask ? (x.ask.adds ? '+ask-for-an-option' : '+ask-for-an-answer') : '') : '')).join(' → '),
    );
    expect(new Set(shapes).size, shapes.join('\n')).toBe(SITUATIONS.length);
    const kinds = new Set(SITUATIONS.flatMap((s) => s.steps.map((x) => x.kind)));
    expect([...kinds].sort()).toEqual(['allocate', 'choose', 'days', 'uncover']);
  });

  it('give no answer a free lunch: every move costs something and risks something', () => {
    for (const s of SITUATIONS) for (const step of s.steps) for (const m of moves(step)) expect(m.costs && m.risks, s.id).toBeTruthy();
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

  it('cite real-world facts with sources, and say what is invented', () => {
    const real = SITUATIONS.filter((s) => s.real);
    expect(real.length).toBeGreaterThanOrEqual(1);
    for (const s of real) for (const f of s.real!.facts) for (const src of f.sources) expect(src.url, s.id).toMatch(/^https:\/\//);
  });
});

describe('the connections', () => {
  const sit = (id: string) => SITUATIONS.find((s) => s.id === id)!;

  it('join two different situations that exist, at their current version, on steps they have', () => {
    expect(new Set(CONNECTIONS.map((c) => c.id)).size).toBe(CONNECTIONS.length);
    for (const c of CONNECTIONS) {
      expect(c.sides[0].situation, c.id).not.toBe(c.sides[1].situation);
      for (const side of c.sides) {
        const s = sit(side.situation);
        expect(s, `${c.id} → ${side.situation}`).toBeDefined();
        expect(side.v, `${c.id} → ${side.situation}`).toBe(s.v);
        expect(Object.keys(side.when).length, c.id).toBeGreaterThan(0);
        for (const [stepId, keys] of Object.entries(side.when)) {
          const step = s.steps.find((x) => x.id === stepId);
          expect(step, `${c.id}: ${side.situation}.${stepId}`).toBeDefined();
          expect(keys.length, c.id).toBeGreaterThan(0);
          for (const k of keys) expect(keysOf(step!), `${c.id}: ${k}`).toContain(k);
        }
      }
    }
  });

  it('never group answers the model describes differently, so different moves never share an explanation', () => {
    for (const c of CONNECTIONS) {
      for (const side of c.sides) {
        const s = sit(side.situation);
        for (const [stepId, keys] of Object.entries(side.when)) {
          const step = s.steps.find((x) => x.id === stepId)!;
          const shapes = keys.map((k) => JSON.stringify(PARTS.map((p) => moveOf(step, k)[p] ?? null)));
          expect(new Set(shapes).size, `${c.id}: ${side.situation}.${stepId} groups ${keys.join(', ')}`).toBe(1);
        }
      }
    }
  });

  it('claim only what the model says about every answer they fit', () => {
    for (const c of CONNECTIONS) {
      for (const side of c.sides) {
        const s = sit(side.situation);
        const named = Object.entries(side.when).flatMap(([stepId, keys]) => keys.map((k) => moveOf(s.steps.find((x) => x.id === stepId)!, k)));
        expect(Object.keys(side.claims).length, `${c.id} claims nothing about ${side.situation}`).toBeGreaterThan(0);
        for (const [part, value] of Object.entries(side.claims)) {
          const said = named.filter((m) => m[part as Part] !== undefined);
          expect(said.length, `${c.id}: no ${part} in ${side.situation}`).toBeGreaterThan(0);
          for (const m of said) expect(m[part as Part], `${c.id}: ${side.situation} ${part}`).toBe(value);
        }
      }
    }
  });

  it('reach every situation more than once, so the map can grow with play', () => {
    for (const s of SITUATIONS) expect(CONNECTIONS.filter((c) => c.sides.some((x) => x.situation === s.id)).length, s.id).toBeGreaterThanOrEqual(2);
  });

  it('lead with the moves, not the player, in a sentence or two', () => {
    for (const c of CONNECTIONS) {
      expect(sentences(c.says), c.id).toBeLessThanOrEqual(3);
      expect(c.says, c.id).not.toMatch(/\byou (chose|picked|decided|went|waited|sold|felled|asked|kept)\b/i);
      expect(c.question.endsWith('?'), c.id).toBe(true);
    }
  });

  it('keep to their word limits and wording rules, with no two alike', () => {
    for (const c of CONNECTIONS) {
      const all: [string, number][] = [[c.title, 9], [c.says, 40], [c.breaks, 20], [c.question, 16]];
      for (const [t, max] of all) {
        expect(words(t), `${c.id}: “${t}”`).toBeLessThanOrEqual(max);
        expect(t, c.id).not.toMatch(PSYCHOLOGY);
        expect(t, c.id).not.toMatch(DESCRIBES_YOU);
        expect(t, c.id).not.toMatch(VERDICT);
      }
    }
    const says = CONNECTIONS.map((c) => c.says);
    for (const [i, a] of says.entries()) for (const b of says.slice(i + 1)) expect(jaccard(a, b), `${a}\n${b}`).toBeLessThan(0.5);
    expect(new Set(CONNECTIONS.map((c) => c.question)).size).toBe(CONNECTIONS.length);
  });
});
