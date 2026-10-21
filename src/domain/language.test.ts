import { describe, expect, it } from 'vitest';
import { allShapes, everything } from '../../tests/sample';
import { ADVICE, CURRENCY, DESCRIBES_YOU, PSYCHOLOGY, VERDICT } from '../../tests/wording';
import { emptyState, recordChoice, shownFor } from './engine';
import { LANGUAGE_MOVES, NONE, NOT_SURE, OUTSIDE, PARTLY, QUESTIONS, SCOPE, STRATEGIES, differs, fitOf, outside, partly, results, shapeProblem, shortText, type Shape } from './language';
import { SITUATIONS } from './situations';

// What the language must be, and what Bring a choice may do with it. These
// checks catch structure, the rules and the wording; whether a move helps
// with a real choice is for people to say (PILOT.md).

const words = (s: string) => s.trim().split(/\s+/).length;
const SHAPES = allShapes();
const ids = (shape: Shape) => results(shape).flatMap((l) => l.moves.map((m) => m.id));
const at = new Date(2026, 9, 21, 9);

describe('the language', () => {
  it('has four questions, six strategies and fifteen moves, each move with one home', () => {
    expect(QUESTIONS.map((q) => q.id)).toEqual(['undo', 'know', 'wait', 'bad']);
    expect(STRATEGIES).toHaveLength(6);
    expect(LANGUAGE_MOVES).toHaveLength(15);
    expect(new Set(LANGUAGE_MOVES.map((m) => m.id)).size).toBe(15);
    expect(new Set(LANGUAGE_MOVES.map((m) => m.name)).size).toBe(15);
    for (const m of LANGUAGE_MOVES) expect(STRATEGIES.map((s) => s.id), m.id).toContain(m.strategy);
    for (const s of STRATEGIES) expect(LANGUAGE_MOVES.some((m) => m.strategy === s.id), s.id).toBe(true);
  });

  it('fits moves only to answers the questions have', () => {
    for (const m of LANGUAGE_MOVES) {
      for (const [q, wanted] of Object.entries(m.fits)) {
        const answers = QUESTIONS.find((x) => x.id === q)!.answers.map((a) => a.id);
        for (const w of wanted) expect(answers, `${m.id}: ${q}=${w}`).toContain(w);
      }
    }
  });

  it('ties each strategy that answers a question to that question’s hard answers, and only those', () => {
    for (const s of STRATEGIES.filter((x) => x.about)) {
      for (const m of LANGUAGE_MOVES.filter((x) => x.strategy === s.id)) expect(Object.keys(m.fits), `${m.id} sits in ${s.id}`).toContain(s.about);
    }
  });

  it('keeps every string to its word limits and wording rules: nothing about the player, no verdicts, no advice', () => {
    const all: [string, number][] = [[SCOPE, 50], [OUTSIDE, 25], [PARTLY, 25]];
    for (const q of QUESTIONS) {
      all.push([q.ask, 10], [q.short, 4], [q.principle, 25]);
      for (const a of q.answers) all.push([a.text, 8], [a.short, 3], [a.said, 10], [a.like, 18]);
    }
    for (const m of LANGUAGE_MOVES) all.push([m.name, 4], [m.is, 14], [m.costs, 14], [m.breaks, 20], [m.like, 14], ...(m.asks ? [[m.asks, 12] as [string, number]] : []));
    const because = new Set(SHAPES.flatMap((s) => results(s).flatMap((l) => [l.because, ...l.moves.map((m) => m.because)])));
    for (const b of because) all.push([b, 45]);
    for (const [t, max] of all) {
      expect(words(t), `“${t}”`).toBeLessThanOrEqual(max);
      for (const rule of [PSYCHOLOGY, DESCRIBES_YOU, VERDICT, ADVICE, CURRENCY]) expect(t).not.toMatch(rule);
    }
  });

  it('puts each principle as a condition on a move’s worth, never as an instruction', () => {
    for (const q of QUESTIONS) expect(q.principle, q.id).toMatch(/is worth .*only (if|when)/);
  });

  it('gives every answer an everyday moment, so no answer leans on a story the player may not have played', () => {
    for (const q of QUESTIONS) {
      for (const a of q.answers) for (const s of SITUATIONS) for (const name of [s.title, s.turnsOn]) expect(a.like, `${q.id}.${a.id}`).not.toContain(name.toLowerCase());
    }
  });

  it('puts a shape in a few words for its cells, and says which questions two shapes differ on', () => {
    const shape: Shape = { undo: 'no', know: ['check', 'after'], wait: 'risk', bad: 'hard' };
    expect(QUESTIONS.map((q) => shortText(shape, q.id))).toEqual(['No', 'Check first, once done', 'Risk grows', 'Hard to recover']);
    expect(shortText({ ...shape, know: [NOT_SURE] }, 'know')).toBe('Not sure');
    expect(differs(shape, { ...shape, bad: 'over' })).toEqual(['bad']);
    expect(differs(shape, shape)).toEqual([]);
  });

  it('asks rather than claims where the four questions can’t read a condition', () => {
    for (const m of LANGUAGE_MOVES.filter((x) => x.asks)) expect(m.asks!.endsWith('?'), m.id).toBe(true);
  });
});

describe('results', () => {
  it('always offer a way to settle it, and another option, whatever the answers', () => {
    for (const s of SHAPES) {
      expect(ids(s), JSON.stringify(s)).toEqual(expect.arrayContaining(['another', 'commit', 'rule-out']));
      expect(results(s).at(-1)!.strategy).toBe('settle');
    }
  });

  it('show a move only with its reason, a strategy only with a move, and both in the fixed order', () => {
    const order = STRATEGIES.map((s) => s.id);
    const moveOrder = LANGUAGE_MOVES.map((m) => m.id);
    for (const s of SHAPES) {
      const r = results(s);
      expect(r.map((l) => order.indexOf(l.strategy))).toEqual([...r.map((l) => order.indexOf(l.strategy))].sort((a, b) => a - b));
      expect(ids(s).map((id) => moveOrder.indexOf(id))).toEqual([...ids(s).map((id) => moveOrder.indexOf(id))].sort((a, b) => a - b));
      for (const l of r) {
        expect(l.moves.length).toBeGreaterThan(0);
        for (const m of l.moves) expect(m.because).toMatch(/^(Because you said .+|If .+|Always possible)\.$/);
      }
    }
  });

  it('read the answers alone: the same answers show the same moves whatever the player has played or kept', () => {
    const records = [emptyState(), everything(at), recordChoice(everything(at), 'Something else', SHAPES[7], at)];
    for (const s of SHAPES.filter((_, i) => i % 17 === 0)) {
      const kept = records.map((r) => recordChoice(r, '', s, at).choices.at(-1)!.shown);
      for (const k of kept) expect(k).toEqual(shownFor(s));
    }
  });

  it('treat Not sure as could be, and None of these as doesn’t apply', () => {
    const hard: Shape = { undo: 'no', know: ['after'], wait: 'closes', bad: 'hard' };
    const unsure: Shape = { undo: NOT_SURE, know: [NOT_SURE], wait: NOT_SURE, bad: NOT_SURE };
    const none: Shape = { undo: NONE, know: [NONE], wait: NONE, bad: NONE };
    // Not sure shows every move that could fit, each saying what it would depend on.
    expect(ids(unsure)).toEqual(LANGUAGE_MOVES.map((m) => m.id));
    expect(fitOf(LANGUAGE_MOVES.find((m) => m.id === 'undoable')!, unsure)).toBe('If it can’t be undone or undoing it would cost something.');
    expect(fitOf(LANGUAGE_MOVES.find((m) => m.id === 'tripwire')!, unsure)).toBe('If waiting lets the chance go, raises the risk or makes it better but riskier.');
    // A definite answer shows only what fits it.
    expect(ids({ ...hard, bad: 'over' })).not.toContain('guard');
    expect(fitOf(LANGUAGE_MOVES.find((m) => m.id === 'spare')!, hard)).toBe('Because you said it would be hard to recover from and it will only show once it’s done.');
    // None of these hides what depends on that question, and says so only when nothing is described.
    expect(ids({ ...hard, bad: NONE })).not.toContain('guard');
    expect(outside({ ...hard, bad: NONE })).toBe(false);
    expect(partly({ ...hard, bad: NONE })).toBe(true);
    expect(partly(hard)).toBe(false);
    expect(ids(none)).toEqual(['another', 'commit', 'rule-out']);
    expect(outside(none)).toBe(true);
    expect(partly(none)).toBe(false);
  });

  it('filter by shape: a step that is easy to undo, cheap to wait on and easy to get over shows least', () => {
    const easy: Shape = { undo: 'easily', know: ['after'], wait: 'nothing', bad: 'over' };
    expect(ids(easy)).toEqual(['small', 'another', 'commit', 'rule-out']);
    const sizes = SHAPES.map((s) => ids(s).length);
    expect(Math.min(...sizes)).toBe(3);
    expect(Math.max(...sizes)).toBe(15);
  });

  it('refuse answers the questions don’t have, and escapes mixed with answers', () => {
    expect(shapeProblem({ undo: 'no', know: ['after'], wait: 'closes', bad: 'hard' }, false)).toBeNull();
    expect(shapeProblem({ undo: NOT_SURE, know: ['after'], wait: 'closes', bad: 'hard' }, false)).toMatch(/can it be undone/);
    expect(shapeProblem({ undo: 'no', know: ['after', NOT_SURE], wait: 'closes', bad: 'hard' }, true)).toMatch(/mixes/);
    expect(shapeProblem({ undo: 'no', know: [], wait: 'closes', bad: 'hard' }, true)).toMatch(/When will you know/);
    expect(shapeProblem({ undo: 'no', know: ['after'], wait: 'closes', bad: 'hard', extra: 1 }, true)).toMatch(/doesn’t ask/);
    expect(shapeProblem({ undo: ['no'], know: ['after'], wait: 'closes', bad: 'hard' }, true)).toMatch(/undone/);
  });
});
