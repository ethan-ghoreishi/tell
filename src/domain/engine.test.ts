import { describe, expect, it } from 'vitest';
import { SAMPLE, everything } from '../../tests/sample';
import { emptyState, found, keyed, limitLine, localDay, playView, recordPlay, recordText } from './engine';
import { CONNECTIONS, SITUATIONS } from './situations';
import type { Answers, Situation, TellState } from './types';

const at = (h: number) => new Date(2026, 9, 1, h, 0, 0);
const play = (s: TellState, id: string, answers: Answers = SAMPLE[id], h = 9) => recordPlay(s, SITUATIONS, id, answers, at(h));

describe('a play', () => {
  it('snapshots the situation as shown, and numbers replays', () => {
    let s = play(emptyState(), 'oak');
    s = play(s, 'oak', { look: { kind: 'uncover', opened: [] }, act: { kind: 'choose', pick: 'fell', asked: false } }, 10);
    expect(s.plays.map((p) => [p.situation, p.v, p.replay, p.day])).toEqual([
      ['oak', 1, 0, localDay(at(9))],
      ['oak', 1, 1, localDay(at(10))],
    ]);
    expect(s.plays[0].shown).toEqual(SITUATIONS.find((x) => x.id === 'oak'));
    expect(s.plays[0].shown).not.toBe(SITUATIONS.find((x) => x.id === 'oak'));
  });

  it.each<[string, string, Answers, RegExp]>([
    ['an option it didn’t offer', 'oak', { look: { kind: 'uncover', opened: [] }, act: { kind: 'choose', pick: 'burn', asked: false } }, /didn’t offer/],
    ['the asked-for option without asking', 'boat', { keep: { kind: 'choose', pick: 'club', asked: false } }, /didn’t offer/],
    ['asking where nothing can be asked', 'oak', { look: { kind: 'uncover', opened: [] }, act: { kind: 'choose', pick: 'fell', asked: true } }, /nothing to ask/],
    ['more than the budget', 'oak', { look: { kind: 'uncover', opened: ['scan', 'photos', 'climb'] }, act: { kind: 'choose', pick: 'fell', asked: false } }, /more than/],
    ['a fact opened twice', 'oak', { look: { kind: 'uncover', opened: ['climb', 'climb'] }, act: { kind: 'choose', pick: 'fell', asked: false } }, /facts/],
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
    expect(view('boat').did).toEqual(['Asked at the sailing club, then chose “Lend her to the club for the summer”.']);
    expect(view('beans').did).toEqual(['The old beans: 2 rows. Your usual vegetables: 8 rows.']);
    expect(view('beans').closing).toMatch(/^About one seed in three comes up\. By September a handful/);
    const waited = play(emptyState(), 'harvest', { pick: { kind: 'days', day: 4 } });
    expect(playView(waited.plays[0]).did).toEqual(['“Wait for the storm to pass” on Thursday.']);
    const none = play(emptyState(), 'oak', { look: { kind: 'uncover', opened: [] }, act: { kind: 'choose', pick: 'fence', asked: false } });
    expect(playView(none.plays[0]).did[0]).toBe('Decided without spending time finding out.');
  });

  it('shows what follows from an earlier answer before the next step', () => {
    const loaf = SITUATIONS.find((x) => x.id === 'loaf')!;
    const next = loaf.steps[1];
    if (next.kind !== 'choose' || !next.before) throw new Error('the loaf’s second step follows its first');
    expect(keyed(next.before, loaf, { plan: { kind: 'choose', pick: 'regulars', asked: false } })).toMatch(/^Two of them love it/);
  });

  it('keeps showing what it showed after the content changes', () => {
    const s = play(emptyState(), 'oak');
    const before = playView(s.plays[0]);
    const edited: Situation[] = SITUATIONS.map((x) => (x.id === 'oak' ? { ...x, v: 2, ending: { ...x.ending, others: 'Rewritten.' } } : x));
    const later = recordPlay(s, edited, 'oak', SAMPLE.oak, at(10));
    expect(playView(later.plays[0])).toEqual(before);
    expect(playView(later.plays[1]).others).toBe('Rewritten.');
  });
});

describe('connections', () => {
  const oakLoaf = CONNECTIONS.find((c) => c.id === 'look-or-undo')!;

  it('appear only once both situations have been played', () => {
    let s = play(emptyState(), 'oak');
    s = play(s, 'harvest', SAMPLE.harvest, 10);
    s = play(s, 'beans', SAMPLE.beans, 11);
    expect(found(s, CONNECTIONS)).toEqual([]);
    s = play(s, 'loaf', SAMPLE.loaf, 12);
    expect(found(s, CONNECTIONS).map((f) => f.connection.id)).toEqual(['look-or-undo']);
  });

  it('show what each side chose and the note for that combination, from the first play of each', () => {
    let s = play(emptyState(), 'loaf');
    s = play(s, 'oak', SAMPLE.oak, 10);
    const [f] = found(s, [oakLoaf]);
    expect(f.plays.map((p) => p.situation)).toEqual(['oak', 'loaf']);
    expect(f.classes).toEqual(['looked', 'went']);
    expect(f.chose).toEqual(['Spent 3 of 4 weeks finding out.', 'Chose “Put twelve on the shelf on Saturday”.']);
    expect(f.note).toBe(oakLoaf.notes['looked+went']);
    expect(f.replayed).toBe(false);
    // A replay that goes the other way changes nothing: it came after the connection could be seen.
    s = play(s, 'oak', { look: { kind: 'uncover', opened: [] }, act: { kind: 'choose', pick: 'fell', asked: false } }, 11);
    const [again] = found(s, [oakLoaf]);
    expect(again.classes).toEqual(['looked', 'went']);
    expect(again.replayed).toBe(true);
  });

  it('count only plays of the version a connection was written for', () => {
    const edited: Situation[] = SITUATIONS.map((x) => (x.id === 'oak' ? { ...x, v: 2 } : x));
    let s = recordPlay(emptyState(), edited, 'oak', SAMPLE.oak, at(9));
    s = play(s, 'loaf', SAMPLE.loaf, 10);
    expect(found(s, [oakLoaf])).toEqual([]);
  });

  it('say what the answers can’t show, in a fixed sentence', () => {
    expect(limitLine(oakLoaf)).toBe(
      'Your answers show what you chose, not why. These two situations also differ in what was at stake, and what finding out cost, so they can’t show which difference mattered.',
    );
  });

  it('come out in plain text with every play', () => {
    const text = recordText(everything(at(9)), CONNECTIONS);
    for (const c of CONNECTIONS) expect(text).toContain(`Connection: ${c.title}`);
    for (const x of SITUATIONS) expect(text).toContain(`${x.title}, 1 Oct`);
    expect(text).toContain('  Asked at the sailing club, then chose “Lend her to the club for the summer”.');
  });
});
