import { describe, expect, it } from 'vitest';
import { SAMPLE, everything } from '../../tests/sample';
import { discoveries, emptyState, fitsAgain, keyed, localDay, madeBy, markSeen, playView, recordPlay, recordText } from './engine';
import { CONNECTIONS, SITUATIONS } from './situations';
import type { Answers, Situation, TellState } from './types';

const at = (h: number) => new Date(2026, 9, 1, h, 0, 0);
const play = (s: TellState, id: string, answers: Answers = SAMPLE[id], h = 9) => recordPlay(s, SITUATIONS, id, answers, at(h));
const oak = (pick: string, opened: string[] = []): Answers => ({ look: { kind: 'uncover', opened }, act: { kind: 'choose', pick, asked: false } });
const loaf = (plan: string): Answers => ({ plan: { kind: 'choose', pick: plan, asked: false }, next: { kind: 'choose', pick: 'weekly', asked: false } });
const boat = (pick: string, asked = false): Answers => ({ keep: { kind: 'choose', pick, asked } });
const beans = (old: number): Answers => ({ rows: { kind: 'allocate', amounts: { old, usual: 10 - old } } });
const ids = (s: TellState) => discoveries(s, CONNECTIONS).map((d) => d.connection.id);

describe('a play', () => {
  it('snapshots the situation as shown, and numbers replays', () => {
    let s = play(emptyState(), 'oak');
    s = play(s, 'oak', oak('fell'), 10);
    expect(s.plays.map((p) => [p.situation, p.v, p.replay, p.day])).toEqual([
      ['oak', 2, 0, localDay(at(9))],
      ['oak', 2, 1, localDay(at(10))],
    ]);
    expect(s.plays[0].shown).toEqual(SITUATIONS.find((x) => x.id === 'oak'));
    expect(s.plays[0].shown).not.toBe(SITUATIONS.find((x) => x.id === 'oak'));
  });

  it.each<[string, string, Answers, RegExp]>([
    ['an option it didn’t offer', 'oak', oak('burn'), /didn’t offer/],
    ['the asked-for option without asking', 'boat', boat('club'), /didn’t offer/],
    ['asking where nothing can be asked', 'oak', { look: { kind: 'uncover', opened: [] }, act: { kind: 'choose', pick: 'fell', asked: true } }, /nothing to ask/],
    ['more than the budget', 'oak', oak('fell', ['scan', 'photos', 'climb']), /more than/],
    ['a fact opened twice', 'oak', oak('fell', ['climb', 'climb']), /facts/],
    ['a share that doesn’t add up', 'beans', { rows: { kind: 'allocate', amounts: { old: 3, usual: 3 } } }, /doesn’t share all/],
    ['a negative share', 'beans', { rows: { kind: 'allocate', amounts: { old: -1, usual: 11 } } }, /wrong things/],
    ['a day the week doesn’t have', 'harvest', { pick: { kind: 'days', day: 5 } }, /day/],
    ['a missing step', 'loaf', { plan: { kind: 'choose', pick: 'shelf', asked: false } }, /different number of steps/],
    ['an answer of the wrong kind', 'harvest', { pick: { kind: 'choose', pick: 'mon', asked: false } }, /no answer for “pick”/],
  ])('refuses %s', (_, id, answers, error) => {
    expect(() => play(emptyState(), id, answers)).toThrow(error);
  });

  it('refuses a situation that doesn’t exist', () => {
    expect(() => play(emptyState(), 'nowhere', {})).toThrow(/no situation/);
  });

  it('ends with fixed sentences from the record, and the closing for the path taken', () => {
    const s = everything(at(9));
    const view = (id: string) => playView(s.plays.find((p) => p.situation === id)!);
    expect(view('oak')).toMatchObject({
      did: ['Spent 3 of 4 weeks finding out: “Have the trunk scanned”.', 'Chose “Take a third of the weight off the crown”.'],
      closing: expect.stringMatching(/^The tree surgeon spends two days in the crown/),
    });
    expect(view('harvest').did).toEqual(['“Pick today” on Wednesday.']);
    expect(view('boat').did).toEqual(['Asked at the sailing club, then chose “Lend her to the club for the season”.']);
    expect(view('beans').did).toEqual(['The old beans: 2 rows. Your usual vegetables: 8 rows.']);
    // Asking can bring only an answer, and the record says it was asked.
    expect(view('take').did).toEqual(['Asked the camera operator, then chose “Another take of the scene”.']);
    expect(view('take').closing).toMatch(/^Thursday, at the lab\. Take four is soft/);
    expect(playView(play(emptyState(), 'harvest', { pick: { kind: 'days', day: 4 } }).plays[0]).did).toEqual(['“Wait for the storm to pass” on Thursday.']);
    expect(playView(play(emptyState(), 'oak', oak('fence')).plays[0]).did[0]).toBe('Decided without spending time finding out.');
  });

  it('shows what follows from an earlier answer before the next step', () => {
    const l = SITUATIONS.find((x) => x.id === 'loaf')!;
    const next = l.steps[1];
    if (next.kind !== 'choose' || !next.before) throw new Error('the loaf’s second step follows its first');
    expect(keyed(next.before, l, { plan: { kind: 'choose', pick: 'regulars', asked: false } })).toMatch(/^Two of them love it/);
  });

  it('keeps showing what it showed after the content changes', () => {
    const s = play(emptyState(), 'oak');
    const before = playView(s.plays[0]);
    const edited: Situation[] = SITUATIONS.map((x) => (x.id === 'oak' ? { ...x, v: 3, ending: { ...x.ending, others: 'Rewritten.' } } : x));
    const later = recordPlay(s, edited, 'oak', SAMPLE.oak, at(10));
    expect(playView(later.plays[0])).toEqual(before);
    expect(playView(later.plays[1]).others).toBe('Rewritten.');
  });
});

describe('connections', () => {
  it('appear only once both sides fit', () => {
    let s = play(emptyState(), 'oak', oak('fence'));
    s = play(s, 'harvest', SAMPLE.harvest, 10);
    expect(ids(s)).toEqual([]);
    s = play(s, 'loaf', loaf('shelf'), 11);
    expect(ids(s)).toEqual(['way-back-that-teaches']);
  });

  it('follow the path taken: felling and fencing the oak meet the shelf differently', () => {
    const shelf = play(emptyState(), 'loaf', loaf('shelf'));
    expect(ids(play(shelf, 'oak', oak('fell'), 10))).toEqual(['ending-or-testing']);
    expect(ids(play(shelf, 'oak', oak('fence'), 10))).toEqual(['way-back-that-teaches']);
    expect(ids(play(shelf, 'oak', oak('crown'), 10))).toEqual(['small-is-not-reversible']);
  });

  it('follow the path taken: selling and keeping the boat are never explained alike', () => {
    const sown = play(emptyState(), 'beans', beans(2));
    expect(ids(play(sown, 'boat', boat('sell'), 10))).toEqual(['what-can-be-replaced']);
    expect(ids(play(sown, 'boat', boat('summer'), 10))).toEqual(['keeping-by-waiting-or-using']);
    // Keeping her whatever happens decides before the lessons answer: nothing true to add here, so nothing is shown.
    expect(ids(play(sown, 'boat', boat('always'), 10))).toEqual([]);
  });

  it('stay as they were found: a later play can fit one again, or find a new one, but never changes the first', () => {
    let s = play(emptyState(), 'oak', oak('fence'));
    s = play(s, 'loaf', loaf('shelf'), 10);
    const [first] = discoveries(s, CONNECTIONS);
    expect(madeBy(discoveries(s, CONNECTIONS), s.plays[1]).map((d) => d.connection.id)).toEqual(['way-back-that-teaches']);

    // Replaying the oak the same way fits it again, quietly.
    s = play(s, 'oak', oak('fence', ['scan']), 11);
    let found = discoveries(s, CONNECTIONS);
    const again = found.find((d) => d.connection.id === 'way-back-that-teaches')!;
    expect(again.plays).toEqual(first.plays);
    expect(again.at).toBe(first.at);
    expect(fitsAgain(found, s.plays[2]).map((d) => d.connection.id)).toEqual(['way-back-that-teaches']);
    expect(madeBy(found, s.plays[2])).toEqual([]);

    // Replaying it another way finds something new; the first stays put, and newest comes first.
    s = play(s, 'oak', oak('fell'), 12);
    found = discoveries(s, CONNECTIONS);
    expect(found.map((d) => d.connection.id)).toEqual(['ending-or-testing', 'way-back-that-teaches']);
    expect(madeBy(found, s.plays[3]).map((d) => d.connection.id)).toEqual(['ending-or-testing']);
    expect(found[1].plays).toEqual(first.plays);
  });

  it('count only plays of the version a connection was written for', () => {
    const edited: Situation[] = SITUATIONS.map((x) => (x.id === 'oak' ? { ...x, v: 3 } : x));
    let s = recordPlay(emptyState(), edited, 'oak', oak('fence'), at(9));
    s = play(s, 'loaf', loaf('shelf'), 10);
    expect(ids(s)).toEqual([]);
  });

  it('follow the whole path: not looking, then felling or fencing, meet asking first differently', () => {
    const asked = play(emptyState(), 'loaf', loaf('taste'));
    expect(ids(play(asked, 'oak', oak('fell'), 10))).toEqual(['what-finding-out-costs']);
    expect(ids(play(asked, 'oak', oak('fence'), 10))).toEqual(['find-out-later']);
    // A partial cut after not looking: nothing true to add, so nothing is shown.
    expect(ids(play(asked, 'oak', oak('crown'), 10))).toEqual([]);
  });

  it('show the whole of each path they compare', () => {
    let s = play(emptyState(), 'oak', oak('fence', ['photos']));
    s = play(s, 'loaf', loaf('shelf'), 10);
    const [d] = discoveries(s, CONNECTIONS);
    expect(d.plays.map((p) => playView(p).did)).toEqual([
      ['Spent 1 of 4 weeks finding out: “Find old photographs of the green”.', 'Chose “Leave it, and fence off the path”.'],
      ['Chose “Put twelve on the shelf on Saturday”.', 'Chose “Bake it every Saturday”.'],
    ]);
  });

  it('remember when each was first seen, and only that', () => {
    let s = markSeen(emptyState(), ['a'], at(9));
    s = markSeen(s, ['a', 'b'], at(10));
    expect(s.seen).toEqual({ a: at(9).toISOString(), b: at(10).toISOString() });
    expect(markSeen(s, ['a'], at(11))).toBe(s);
  });

  it('come out in plain text with every play, what was unknown, and what each move risked', () => {
    const text = recordText(everything(at(9)), CONNECTIONS);
    for (const d of discoveries(everything(at(9)), CONNECTIONS)) expect(text).toContain(`Connection: ${d.connection.title}`);
    for (const x of SITUATIONS) expect(text).toContain(`${x.title}, 1 Oct\n  Unknown: ${x.uncertain}`);
    expect(text).toContain('Chose “Take a third of the weight off the crown”. It can’t be taken back; guards against the worst, at a price; costs a third of the crown, for good; risks rot in the cuts, or a fall anyway.');
    expect(text).toContain('  Where it breaks: ');
  });
});
