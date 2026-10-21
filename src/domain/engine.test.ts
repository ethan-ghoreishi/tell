import { describe, expect, it } from 'vitest';
import { SAMPLE, everything } from '../../tests/sample';
import { emptyState, examples, fresh, keyed, lived, localDay, markSeen, playView, recordChoice, recordPlay, recordText, removeChoice, setNote, setTrying } from './engine';
import { LANGUAGE, type Shape } from './language';
import { SITUATIONS } from './situations';
import type { Answers, Situation, TellState } from './types';

const at = (h: number) => new Date(2026, 9, 1, h, 0, 0);
const play = (s: TellState, id: string, answers: Answers = SAMPLE[id], h = 9) => recordPlay(s, SITUATIONS, id, answers, at(h));
const oak = (pick: string, opened: string[] = []): Answers => ({ look: { kind: 'uncover', opened }, act: { kind: 'choose', pick, asked: false } });
const boat = (pick: string, asked = false): Answers => ({ keep: { kind: 'choose', pick, asked } });
const beans = (old: number): Answers => ({ rows: { kind: 'allocate', amounts: { old, usual: 10 - old } } });
const HARD: Shape = { undo: 'no', know: ['check', 'after'], wait: 'closes', bad: 'hard' };

describe('a play', () => {
  it('snapshots the story as shown, with the language it was described in, and numbers replays', () => {
    let s = play(emptyState(), 'oak');
    s = play(s, 'oak', oak('fell'), 10);
    expect(s.plays.map((p) => [p.situation, p.v, p.language, p.replay, p.day])).toEqual([
      ['oak', 3, LANGUAGE, 0, localDay(at(9))],
      ['oak', 3, LANGUAGE, 1, localDay(at(10))],
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

  it('refuses a story that doesn’t exist', () => {
    expect(() => play(emptyState(), 'nowhere', {})).toThrow(/no story/);
  });

  it('ends with fixed sentences from the record, each with the moves it made, and the closing for the path taken', () => {
    const s = everything(at(9));
    const view = (id: string) => playView(s.plays.find((p) => p.situation === id)!);
    expect(view('oak')).toMatchObject({
      did: [
        { line: 'Spent 3 of 4 weeks finding out: “Have the trunk scanned”.', moves: ['look'] },
        { line: 'Chose “Take a third of the weight off the crown”.', moves: ['guard'] },
      ],
      closing: expect.stringMatching(/^The tree surgeon spends two days in the crown/),
      unmade: ['hold', 'commit'],
    });
    expect(view('harvest').did).toEqual([{ line: '“Pick today” on Wednesday.', moves: ['wait-for-it'] }]);
    // Asking is a move of its own, made before the option it brought.
    expect(view('boat').did).toEqual([{ line: 'Asked at the sailing club, then chose “Lend her to the club for the season”.', moves: ['another', 'hand-over'] }]);
    expect(view('beans').did).toEqual([{ line: 'The old beans: 2 rows. Your usual vegetables: 8 rows.', moves: ['small', 'by-using'] }]);
    expect(view('take').did).toEqual([{ line: 'Asked the camera operator, then chose “Another take of the scene”.', moves: ['look', 'spare'] }]);
    // The film's endings stop before the lab, so neither take is shown right in hindsight.
    expect(view('take').closing).toMatch(/On Thursday the lab will show/);
    expect(playView(play(emptyState(), 'harvest', { pick: { kind: 'days', day: 4 } }).plays[0]).did).toEqual([{ line: '“Wait for the storm to pass” on Thursday.', moves: ['wait-for-it'] }]);
    // Holding off with nothing done makes no move, and says so by naming none.
    expect(playView(play(emptyState(), 'oak', oak('fence')).plays[0]).did[0]).toEqual({ line: 'Decided without spending time finding out.', moves: [] });
    expect(playView(play(emptyState(), 'beans', beans(0)).plays[0]).did[0].moves).toEqual([]);
    expect(playView(play(emptyState(), 'beans', beans(6)).plays[0]).did[0].moves).toEqual(['split', 'by-using']);
    expect(playView(play(emptyState(), 'beans', beans(10)).plays[0]).closing).toMatch(/whole plot/);
  });

  it('shows what follows from an earlier answer before the next step', () => {
    const l = SITUATIONS.find((x) => x.id === 'loaf')!;
    const next = l.steps[1];
    if (next.kind !== 'choose' || !next.before) throw new Error('the loaf’s second step follows its first');
    expect(keyed(next.before, l, { plan: { kind: 'choose', pick: 'regulars', asked: false } })).toMatch(/^Two of them love it/);
  });

  it('keeps showing what it showed, moves included, after the content changes', () => {
    const s = play(emptyState(), 'oak', oak('fence', ['scan']));
    const before = playView(s.plays[0]);
    const exBefore = examples(s);
    const edited: Situation[] = SITUATIONS.map((x) =>
      x.id === 'oak' ? { ...x, v: 4, ending: { ...x.ending, others: 'Rewritten.' }, steps: x.steps.map((st) => (st.kind === 'choose' ? { ...st, options: st.options.map((o) => ({ ...o, moves: ['commit' as const] })) } : st)) } : x,
    );
    const later = recordPlay(s, edited, 'oak', oak('fence'), at(10));
    expect(playView(later.plays[0])).toEqual(before);
    expect(playView(later.plays[1]).others).toBe('Rewritten.');
    expect(playView(later.plays[1]).did[1].moves).toEqual(['commit']);
    // The first play's moves are its own, whatever the story says today.
    expect(examples(later).find((e) => e.id === 'hold')).toEqual(exBefore.find((e) => e.id === 'hold'));
  });
});

describe('what the record holds', () => {
  it('lists every move the player has made, in the language’s order, with each step that made it', () => {
    let s = play(emptyState(), 'oak', oak('fence', ['photos']));
    s = play(s, 'loaf', SAMPLE.loaf, 10);
    s = play(s, 'oak', oak('fell'), 11);
    expect(examples(s).map((e) => [e.id, e.examples.map((x) => `${x.play.shown.title}${x.play.replay ? ' again' : ''}: ${x.line}`)])).toEqual([
      ['look', ['The old oak: Spent 1 of 4 weeks finding out: “Find old photographs of the green”.']],
      ['small', ['The new loaf: Chose “Put twelve on the shelf on Saturday”.']],
      ['hold', ['The old oak: Chose “Leave it, and fence off the path”.']],
      ['guard', ['The old oak: Chose “Leave it, and fence off the path”.']],
      ['commit', ['The new loaf: Chose “Bake it every Saturday”.', 'The old oak again: Chose “Fell it”.']],
    ]);
  });

  it('lists the contrasts played: each question the played stories answered differently, with the plays under each answer', () => {
    let s = play(emptyState(), 'oak');
    expect(lived(s)).toEqual([]);
    s = play(s, 'oak', oak('fell'), 9);
    expect(lived(s)).toEqual([]);
    s = play(s, 'loaf', SAMPLE.loaf, 10);
    expect(lived(s).map((x) => x.q)).toEqual(['undo', 'wait', 'bad']);
    s = play(s, 'harvest', SAMPLE.harvest, 11);
    const view = lived(s).map(({ q, answers }) => [q, answers.map((a) => [a.id, a.plays.map((p) => p.situation)])]);
    expect(view).toEqual([
      ['undo', [['easily', ['loaf']], ['no', ['oak', 'oak', 'harvest']]]],
      ['know', [['check', ['oak', 'oak', 'loaf']], ['wait', ['harvest']], ['after', ['oak', 'oak', 'loaf']]]],
      ['wait', [['nothing', ['loaf']], ['risk', ['oak', 'oak']], ['better', ['harvest']]]],
      ['bad', [['over', ['loaf', 'harvest']], ['hard', ['oak', 'oak']]]],
    ]);
  });

  it('marks a move New until an ending has shown it, and keeps the first sighting', () => {
    let s = play(emptyState(), 'oak', oak('fence', ['scan']));
    expect(fresh(s, s.plays[0])).toEqual(['look', 'hold', 'guard']);
    s = markSeen(s, fresh(s, s.plays[0]), at(9));
    s = play(s, 'loaf', SAMPLE.loaf, 10);
    expect(fresh(s, s.plays[1])).toEqual(['small', 'commit']);
    expect(fresh(s, s.plays[0])).toEqual([]);
    const seen = markSeen(s, ['look', 'small'], at(11)).seen;
    expect(seen).toEqual({ look: at(9).toISOString(), hold: at(9).toISOString(), guard: at(9).toISOString(), small: at(11).toISOString() });
    expect(markSeen(s, ['look'], at(12))).toBe(s);
  });
});

describe('a kept choice', () => {
  it('keeps the answers and the moves exactly as shown, with nothing read from the label', () => {
    const s = recordChoice(emptyState(), '  Open-source my app ', HARD, at(9));
    const [c] = s.choices;
    expect(c).toMatchObject({ label: 'Open-source my app', language: LANGUAGE, day: localDay(at(9)), shape: HARD, trying: [], note: '' });
    expect(c.shown.map((l) => l.name)).toEqual(['Find out first', 'Soften the step', 'Keep it open', 'Limit the harm', 'Find another way', 'Settle it']);
    expect(c.shown[0].moves[0]).toMatchObject({ id: 'look', name: 'Look first', because: 'Because you said there’s something to check or ask first.' });
    expect(recordChoice(emptyState(), 'Something else entirely', HARD, at(9)).choices[0].shown).toEqual(c.shown);
  });

  it('refuses answers the questions don’t have', () => {
    expect(() => recordChoice(emptyState(), '', { ...HARD, wait: 'soon' }, at(9))).toThrow(/doesn’t answer “If you wait/);
  });

  it('can mark moves as being tried, carry a note, and be removed, by the player alone', () => {
    let s = recordChoice(emptyState(), '', HARD, at(9));
    const id = s.choices[0].id;
    s = setTrying(s, id, 'small', true);
    s = setTrying(s, id, 'small', true);
    s = setTrying(s, id, 'tripwire', true);
    s = setTrying(s, id, 'tripwire', false);
    s = setNote(s, id, 'A beta for five friends first.');
    expect(s.choices[0]).toMatchObject({ trying: ['small'], note: 'A beta for five friends first.' });
    expect(removeChoice(s, id).choices).toEqual([]);
  });
});

describe('plain text', () => {
  it('carries every kept choice and every play, with its shape, moves and what each answer cost and risked', () => {
    let s = everything(at(9));
    s = recordChoice(s, 'Open-source my app', HARD, at(16));
    s = setTrying(s, s.choices[0].id, 'small', true);
    s = setNote(s, s.choices[0].id, 'One module first.');
    const text = recordText(s);
    expect(text).toContain('Choice: Open-source my app, 1 Oct\n  If you take it, can it be undone? No.');
    expect(text).toContain('  Trying: Try it small.\n  Note: One module first.');
    for (const x of SITUATIONS) expect(text).toContain(`${x.title}, 1 Oct\n  Unknown: ${x.uncertain}\n  About ${x.turnsOn}: If you take it, can it be undone?`);
    expect(text).toContain('Chose “Take a third of the weight off the crown”. Moves: Guard. Costs a third of the crown, for good; risks rot in the cuts, or a fall anyway.');
  });
});
