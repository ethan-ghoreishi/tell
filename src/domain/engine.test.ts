import { describe, expect, it } from 'vitest';
import tell41 from '../../tests/fixtures/tell-4.1.json';
import { ANSWERS } from '../../tests/answers';
import { ROUNDS, roundById } from '../content';
import { archiveText } from './archive';
import { amount, answerProblem, bookOrder, bookText, connections, editIdea, emptyState, hasPlayed, ideaOf, keep, nextUp, recordPlay, relationWord, removeIdea, scrambled, search, skip } from './engine';
import type { TellState } from './types';
import { archive } from './validate';

const now = new Date(2026, 10, 19, 9);
const r = (id: string) => roundById(id)!;
const play = (s: TellState, id: string) => recordPlay(s, r(id), ANSWERS[id], now);

describe('what Play offers next', () => {
  it('goes through the collection in order, then says there is nothing new', () => {
    let s = emptyState();
    for (const round of ROUNDS) {
      expect(nextUp(s, ROUNDS)?.id).toBe(round.id);
      s = play(s, round.id);
    }
    expect(nextUp(s, ROUNDS)).toBeNull();
  });

  it('never offers the round on screen again, and passes over skipped rounds until the rest are played', () => {
    const [a, b, c] = ROUNDS;
    expect(nextUp(emptyState(), ROUNDS, a.id)?.id).toBe(b.id);
    const s = skip(skip(emptyState(), a.id), a.id);
    expect(s.skipped).toEqual([a.id]);
    expect(nextUp(s, ROUNDS)?.id).toBe(b.id);
    const rest = ROUNDS.slice(1).reduce((x, round) => play(x, round.id), s);
    expect(nextUp(rest, ROUNDS)?.id).toBe(a.id);
    // Playing a skipped round clears its skip.
    expect(play(s, a.id).skipped).toEqual([]);
    expect(nextUp(play(emptyState(), a.id), ROUNDS, b.id)?.id).toBe(c.id);
  });
});

describe('recording a play', () => {
  it('records every round with a valid answer for each step, and refuses an invalid one', () => {
    const s = ROUNDS.reduce((x, round) => play(x, round.id), emptyState());
    expect(s.plays.map((p) => p.round)).toEqual(ROUNDS.map((x) => x.id));
    expect(() => recordPlay(emptyState(), r('night-sky'), { why: 'nope', who: 'poe' }, now)).toThrow(/why: the answer is not one of the options/);
    expect(() => recordPlay(emptyState(), r('night-sky'), { why: 'age' }, now)).toThrow(/who/);
  });

  it('checks each kind of answer', () => {
    const steps = ROUNDS.flatMap((x) => x.steps);
    const est = steps.find((s) => s.kind === 'estimate')!;
    const ord = steps.find((s) => s.kind === 'order')!;
    const qf = steps.find((s) => s.kind === 'quickfire')!;
    if (est.kind !== 'estimate' || ord.kind !== 'order' || qf.kind !== 'quickfire') throw new Error('kinds');
    expect(answerProblem(est, est.max + 1)).toMatch(/range/);
    expect(answerProblem(est, Number.NaN)).toMatch(/range/);
    expect(answerProblem(ord, ord.items.slice(1).map((i) => i.id))).toMatch(/every item/);
    expect(answerProblem(ord, [...ord.items.map((i) => i.id).slice(1), ord.items[1].id])).toMatch(/every item/);
    expect(answerProblem(qf, qf.items.map(() => 2))).toMatch(/every item/);
    expect(answerProblem(qf, qf.items.map(() => 1))).toBeNull();
  });

  it('keeps only the answers the round asks for', () => {
    const s = recordPlay(emptyState(), r('night-sky'), { ...ANSWERS['night-sky'], extra: 'x' }, now);
    expect(Object.keys(s.plays[0].answers)).toEqual(['why', 'who']);
    expect(hasPlayed(s, 'night-sky')).toBe(true);
  });
});

describe('the Book', () => {
  it('keeps an idea once, in the round’s words or the player’s', () => {
    const sky = r('night-sky');
    const s = keep(emptyState(), sky, now);
    expect(ideaOf(s, sky.id)).toEqual({ round: sky.id, title: sky.title, kind: sky.takeaway.kind, text: sky.takeaway.text, original: sky.takeaway.text, at: now.toISOString() });
    expect(keep(s, sky, now, 'Another')).toBe(s);
    const mine = keep(emptyState(), sky, now, '  My   words ');
    expect(ideaOf(mine, sky.id)).toMatchObject({ text: 'My words', edited: now.toISOString() });
    expect(keep(emptyState(), sky, now, '   ')).toEqual(emptyState());
    // A saying keeps its author.
    expect(ideaOf(keep(emptyState(), r('rats'), now), 'rats')?.by).toMatch(/Strathern/);
  });

  it('edits, restores the original wording and removes', () => {
    const sky = r('night-sky');
    const s = keep(emptyState(), sky, now);
    const edited = editIdea(s, sky.id, 'Mine', now);
    expect(ideaOf(edited, sky.id)).toMatchObject({ text: 'Mine', edited: now.toISOString() });
    expect(editIdea(edited, sky.id, '', now)).toBe(edited);
    expect(editIdea(edited, sky.id, 'Mine', now)).toBe(edited);
    const restored = editIdea(edited, sky.id, sky.takeaway.text, now);
    expect(ideaOf(restored, sky.id)).toEqual(ideaOf(s, sky.id));
    expect(removeIdea(restored, sky.id).book).toEqual([]);
    expect(removeIdea(emptyState(), sky.id)).toEqual(emptyState());
  });

  it('lists newest first and searches words, rounds and topics', () => {
    const s = keep(keep(keep(emptyState(), r('night-sky'), now), r('rats'), now), r('ship'), now);
    expect(bookOrder(s).map((i) => i.round)).toEqual(['ship', 'rats', 'night-sky']);
    expect(search(s.book, ROUNDS, 'measure target').map((i) => i.round)).toEqual(['rats']);
    expect(search(s.book, ROUNDS, 'PHILOSOPHY').map((i) => i.round)).toEqual(['ship']);
    expect(search(s.book, ROUNDS, 'night').map((i) => i.round)).toEqual(['night-sky']);
    expect(search(s.book, ROUNDS, '   ')).toEqual(s.book);
    expect(search(s.book, ROUNDS, 'zebra')).toEqual([]);
  });

  it('writes itself out as plain text, connections between kept ideas included', () => {
    const s = keep(keep(emptyState(), r('earth'), now), r('night-sky'), now);
    const text = bookText(s, ROUNDS);
    expect(text).toContain(r('earth').takeaway.text);
    expect(text).toContain('Supported by “Measuring the Earth with a shadow”');
    expect(text).toContain('Supports “Why is the night dark?”');
    expect(bookText(emptyState(), ROUNDS)).toContain('Nothing kept yet.');
  });
});

describe('connections', () => {
  it('reads a link from either end, kept ideas first, then played rounds', () => {
    let s = emptyState();
    const from = connections(s, ROUNDS, 'night-sky');
    expect(from.map((c) => [c.other.id, c.how, c.outward])).toEqual([
      ['earth', 'supports', false],
      ['stones', 'supports', true],
    ]);
    expect(from.map(relationWord)).toEqual(['Supported by', 'Supports']);
    s = keep(play(play(s, 'stones'), 'earth'), r('earth'), now);
    const after = connections(s, ROUNDS, 'night-sky');
    expect(after.map((c) => [c.other.id, !!c.kept, c.played])).toEqual([
      ['earth', true, true],
      ['stones', false, true],
    ]);
  });

  it('gives every round at least one connection', () => {
    for (const round of ROUNDS) expect(connections(emptyState(), ROUNDS, round.id).length, round.id).toBeGreaterThan(0);
  });
});

describe('small helpers', () => {
  it('scrambles the same way every time, never into the answer', () => {
    const items = ['a', 'b', 'c', 'd'].map((id) => ({ id }));
    expect(scrambled(items)).toEqual(scrambled(items));
    expect(scrambled(items).map((i) => i.id)).not.toEqual(['a', 'b', 'c', 'd']);
    expect(scrambled(items.slice(0, 2)).map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('formats amounts with their units', () => {
    expect(amount(2, '%')).toBe('2%');
    expect(amount(250000, 'stadia')).toBe('250,000 stadia');
  });
});

describe('an archived Tell 4.1 record as plain text', () => {
  it('names the kept choice, its moves, what was being tried and the note, and the stories played', () => {
    const a = archive(tell41 as unknown as Record<string, unknown>, now).archive.at(-1)!;
    const text = archiveText(a);
    expect(text).toContain('Move flat this spring');
    expect(text).toContain('Note: Ask the landlord about a break clause.');
    expect(text).toContain('(trying this)');
    expect(text).toContain('The old oak');
    // Defensive: a record missing everything still prints.
    expect(archiveText({ schema: 6, at: now.toISOString(), doc: {} })).toContain('No kept choices.');
  });
});

