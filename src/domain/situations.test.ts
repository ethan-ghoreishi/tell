import { describe, expect, it } from 'vitest';
import { CURRENCY, DESCRIBES_YOU, PSYCHOLOGY, VERDICT } from '../../tests/wording';
import { answerOf, keysOf, storyMoves } from './engine';
import { LANGUAGE_MOVES, QUESTIONS } from './language';
import { SITUATIONS } from './situations';
import type { Situation, Step } from './types';
import { situationProblem } from './validate';

// What every story must be. These checks catch structure, the tags and
// wording; they can't judge whether a story is interesting, so a person reads
// every path (tests/review.test.ts) before content ships (AGENTS.md).

const words = (s: string) => s.trim().split(/\s+/).length;
const keyedTexts = (k: Situation['ending']['closing']) => (typeof k === 'string' ? [k] : Object.values(k.cases));

/** Every answer a step offers. */
const answers = (step: Step) => keysOf(step).map((k) => answerOf(step, k));

/** Every string a player can read in a story, with the most words it may have. */
function texts(s: Situation): [string, number][] {
  const out: [string, number][] = [
    [s.title, 5],
    [s.place, 4],
    [s.hook, 14],
    [s.setup, 70],
    [s.uncertain, 14],
    [s.turnsOn, 8],
    ...keyedTexts(s.ending.closing).map((t): [string, number] => [t, 50]),
    [s.ending.others, 40],
  ];
  for (const step of s.steps) {
    for (const a of answers(step)) out.push([a.costs, 10], [a.risks, 10]);
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

const of = (s: Situation, q: string) => (q === 'know' ? s.shape.know : [s.shape[q as 'undo' | 'wait' | 'bad']]);

describe('the stories', () => {
  it('are a small, finite collection with distinct ids and places', () => {
    expect(SITUATIONS.length).toBeGreaterThanOrEqual(4);
    expect(SITUATIONS.length).toBeLessThanOrEqual(12);
    expect(new Set(SITUATIONS.map((s) => s.id)).size).toBe(SITUATIONS.length);
    expect(new Set(SITUATIONS.map((s) => s.place)).size).toBe(SITUATIONS.length);
  });

  it('each have a sound shape, and every answer is described in the language', () => {
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

  it('turn on steps of different shapes, and between them give every question two different answers to live', () => {
    expect(new Set(SITUATIONS.map((s) => JSON.stringify(s.shape))).size).toBe(SITUATIONS.length);
    for (const q of QUESTIONS) expect(new Set(SITUATIONS.flatMap((s) => of(s, q.id))).size, q.id).toBeGreaterThanOrEqual(2);
  });

  it('give no answer a free lunch: every answer costs something and risks something', () => {
    for (const s of SITUATIONS) for (const step of s.steps) for (const a of answers(step)) expect(a.costs && a.risks, s.id).toBeTruthy();
  });

  it('name a move for every option offered and for every ask; only holding off with nothing done makes none', () => {
    for (const s of SITUATIONS) {
      for (const step of s.steps) {
        if (step.kind !== 'choose') continue;
        for (const o of [...step.options, ...(step.ask?.adds ? [step.ask.adds] : [])]) expect(o.moves.length, `${s.id}.${o.id}`).toBeGreaterThan(0);
        if (step.ask) expect(step.ask.moves.length, `${s.id}.${step.id} ask`).toBeGreaterThan(0);
      }
    }
  });

  it('show most of the language between them, so play can lend examples to a real choice', () => {
    const shown = new Set(SITUATIONS.flatMap(storyMoves));
    expect(shown.size).toBeGreaterThanOrEqual(12);
    for (const s of SITUATIONS) expect(storyMoves(s).length, s.id).toBeGreaterThanOrEqual(2);
    // Settling it, and finding out first, are in more than one world.
    for (const id of ['commit', 'look', 'small']) expect(SITUATIONS.filter((s) => storyMoves(s).includes(id as never)).length, id).toBeGreaterThanOrEqual(2);
    expect(LANGUAGE_MOVES.filter((m) => !shown.has(m.id)).map((m) => m.id)).toEqual(['undoable', 'more-time', 'tripwire']);
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
        for (const rule of [PSYCHOLOGY, DESCRIBES_YOU, VERDICT, CURRENCY]) expect(t, s.id).not.toMatch(rule);
      }
    }
  });

  it('cite real-world facts with sources, and say what is invented', () => {
    const real = SITUATIONS.filter((s) => s.real);
    expect(real.length).toBeGreaterThanOrEqual(1);
    for (const s of real) for (const f of s.real!.facts) for (const src of f.sources) expect(src.url, s.id).toMatch(/^https:\/\//);
  });
});
