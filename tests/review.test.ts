import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { answerOf, emptyState, keyOf, keysOf, playView, recordPlay, spent, storyMoves } from '../src/domain/engine';
import { LANGUAGE_MOVES, OUTSIDE, QUESTIONS, SCOPE, STRATEGIES, answersText, differs, outside, results, type Shape } from '../src/domain/language';
import { SITUATIONS, situation } from '../src/domain/situations';
import type { Answers, Situation, Step, StepAnswer } from '../src/domain/types';
import reference from './fixtures/reference-choices.json';
import { allShapes } from './sample';

// The editorial review, as one file for a person to read: the language once,
// every way through every story with the moves it names, which moves and
// answers the stories show, and what Bring a choice shows for a set of
// reference choices. Tests check structure; only a person can judge whether
// each sentence is true and useful:
// REVIEW_FILE=/tmp/review.txt npx vitest run tests/review.test.ts
//
// The reference choices (tests/fixtures/reference-choices.json) were written
// and coded by one person before the rules existed, and are not evidence that
// the language fits real choices; they let a reader see what it does.

const on = new Date(2026, 9, 1, 9, 0, 0);
const name = (id: string) => LANGUAGE_MOVES.find((m) => m.id === id)!.name;
const shapeLine = (s: Shape) => QUESTIONS.map((q) => `${q.ask} ${answersText(s, q.id)}.`).join(' ');

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

describe('the review', () => {
  const printed: string[] = [];

  it('prints the language once: the questions, their principles, and every move', () => {
    printed.push('==== The language', '');
    for (const q of QUESTIONS) {
      printed.push(`${q.ask}${q.multi ? ' (tap all that fit)' : ''}`, ...q.answers.map((a) => `  ${a.text}${a.like ? `: like ${a.like}` : ''}   [said: ${a.said}]`), `  Principle: ${q.principle}`, '');
    }
    for (const s of STRATEGIES) {
      printed.push(`${s.name}${s.about ? ` (deals with: ${QUESTIONS.find((q) => q.id === s.about)!.ask})` : ' (always possible)'}`);
      for (const m of LANGUAGE_MOVES.filter((x) => x.strategy === s.id)) {
        const fits = Object.entries(m.fits).map(([q, a]) => `${q} ∈ ${a.join('|')}`).join(' and ') || 'always';
        printed.push(`  ${m.name} [fits: ${fits}]`, ...(m.asks ? [`    Asks: ${m.asks}`] : []), `    Is: ${m.is}`, `    Costs: ${m.costs}`, `    Breaks: ${m.breaks}`, `    Like: ${m.like}`);
      }
      printed.push('');
    }
    printed.push(`Scope, always shown: ${SCOPE}`, `When every answer is None of these: ${OUTSIDE}`, '');
    expect(printed.length).toBeGreaterThan(40);
  });

  it('reaches every key of every step, and ends in words and named moves on every path', () => {
    for (const s of SITUATIONS) {
      const all = paths(s);
      for (const step of s.steps) expect(new Set(all.map((a) => keyOf(step, a[step.id]))), `${s.id}.${step.id}`).toEqual(new Set(keysOf(step)));
      printed.push(`==== ${s.title} (${s.place})`, ...(s.whatIf ? [`  ${s.whatIf}`] : []), s.setup, `  Unknown: ${s.uncertain}`, `  Turns on ${s.turnsOn}. ${shapeLine(s.shape)}`);
      const seen = new Set<string>();
      for (const a of all) {
        const v = playView(recordPlay(emptyState(), SITUATIONS, s.id, a, on).plays[0]);
        expect(v.closing, s.id).toBeTruthy();
        const steps = s.steps.map((step, i) => {
          const d = answerOf(step, keyOf(step, a[step.id]));
          return `${v.did[i].line} [${v.did[i].moves.map(name).join(', ') || 'no move'} | costs ${d.costs} | risks ${d.risks}]`;
        });
        const line = `  ${steps.join('\n    ')}\n    → ${v.closing}\n    Other moves here: ${v.unmade.map(name).join(', ') || 'none'}`;
        if (!seen.has(line)) printed.push(line);
        seen.add(line);
      }
      printed.push(`  Others: ${s.ending.others}`, '');
    }
  });

  it('prints each variant beside its story: the one fact, the answer it changes, and the moves each offers', () => {
    printed.push('==== Variants: one fact changed');
    for (const v of SITUATIONS.filter((x) => x.of)) {
      const base = situation(v.of!)!;
      const q = differs(base.shape, v.shape);
      expect(q, v.id).toHaveLength(1);
      const ask = QUESTIONS.find((x) => x.id === q[0])!;
      printed.push(
        `  ${base.title} → ${v.title}: ${v.whatIf}`,
        `    ${ask.ask} ${answersText(base.shape, q[0])} → ${answersText(v.shape, q[0])}`,
        `    Moves offered: ${storyMoves(base).map(name).join(', ')} → ${storyMoves(v).map(name).join(', ')}`,
      );
    }
    printed.push('');
  });

  it('prints which moves and answers the stories show, so gaps are visible', () => {
    printed.push('==== Which stories show each move');
    for (const m of LANGUAGE_MOVES) printed.push(`  ${m.name}: ${SITUATIONS.filter((s) => storyMoves(s).includes(m.id)).map((s) => s.title).join(', ') || 'no story yet'}`);
    printed.push('', '==== Which stories turn on each answer');
    for (const q of QUESTIONS) {
      for (const a of q.answers) printed.push(`  ${q.ask} ${a.text}: ${SITUATIONS.filter((s) => (q.id === 'know' ? s.shape.know : [s.shape[q.id]]).includes(a.id)).map((s) => s.title).join(', ') || 'no story yet'}`);
    }
    printed.push('');
  });

  it('prints what Bring a choice shows for the reference choices, and how much the answers filter', () => {
    printed.push('==== Bring a choice, for the reference choices (one coder; not evidence)', '');
    for (const c of reference.cases) {
      const shape: Shape = { undo: c.undo, know: c.know, wait: c.wait, bad: c.bad };
      printed.push(`${c.choice} [${c.scope}${'core' in c ? `: ${c.core}` : ''}]`, `  The step: ${c.step}. Options people name: ${c.options.join(' / ')}.`, `  ${shapeLine(shape)}`);
      if (outside(shape)) printed.push(`  ${OUTSIDE}`);
      for (const l of results(shape)) printed.push(`  ${STRATEGIES.find((s) => s.id === l.strategy)!.name}: ${l.because} ${l.moves.map((m) => `${name(m.id)} (${m.because})`).join('; ')}`);
      printed.push('');
    }
    const sizes = allShapes().map((s) => results(s).flatMap((l) => l.moves).length);
    printed.push(`==== Every set of answers (${sizes.length}): moves shown range from ${Math.min(...sizes)} to ${Math.max(...sizes)} of ${LANGUAGE_MOVES.length}.`);
    if (process.env.REVIEW_FILE) writeFileSync(process.env.REVIEW_FILE, printed.join('\n'));
    expect(reference.cases.length).toBe(25);
  });
});
