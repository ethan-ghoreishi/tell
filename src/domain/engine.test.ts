import { describe, expect, it } from 'vitest';
import { DECK, PAIRS } from './deck';
import {
  ROUNDS_PER_DAY,
  addNote,
  answer,
  binomTail,
  clearsGate,
  currentRound,
  daysBetween,
  deal,
  deposit,
  emptyState,
  lensRecord,
  localDay,
  matchedPairs,
  observations,
  outRecord,
  pairResults,
  toggleDisagree,
  toggleKeep,
} from './engine';
import type { Answer, Card, LensCard, LensId, TellState } from './types';

const on = (d: number, h = 9) => new Date(2026, 9, d, h, 0, 0); // October 2026, local time
const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const card = (id: string) => DECK.find((c) => c.id === id)!;

/** Deal a day and answer every round with `choose`. */
function playDay(state: TellState, now: Date, choose: (c: Card) => string, area: 'mix' | 'world' | 'work' = 'mix') {
  let s: TellState = { ...state, deal: deal(state, DECK, now, area, seeded(now.getDate())) };
  for (const slot of s.deal!.cards) s = answer(s, DECK, slot.id, choose(card(slot.id)), now);
  return s;
}
const first = (c: Card) => c.options[0].id;
const prefer = (lens: LensId) => (c: Card) =>
  c.kind === 'switch' ? c.options[0].id : ((c as LensCard).options.find((o) => o.lens === lens) ?? c.options[0]).id;

describe('calendar', () => {
  it('uses the local calendar day and counts whole days across a clock change', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2); // UK clocks change on 29 March 2026
    expect(daysBetween('2026-10-31', '2026-11-01')).toBe(1);
  });
});

describe('binomial gate', () => {
  it('computes exact tail probabilities', () => {
    expect(binomTail(4, 6, 0.25)).toBeCloseTo(0.03759765625, 12);
    expect(binomTail(5, 6, 0.25)).toBeCloseTo(0.004638671875, 12);
    expect(binomTail(3, 5, 0.25)).toBeCloseTo(0.103515625, 12);
    expect(binomTail(0, 6, 0.25)).toBe(1);
    expect(binomTail(7, 6, 0.25)).toBe(0);
  });

  it('shows an angle only when chance is implausible even after allowing for eight angles', () => {
    expect(clearsGate(5, 6)).toBe(true); // 0.0046 × 8 = 0.037
    expect(clearsGate(4, 6)).toBe(false); // 0.0376 × 8 = 0.30
    expect(clearsGate(6, 8)).toBe(true);
    expect(clearsGate(5, 8)).toBe(false);
    expect(clearsGate(5, 5)).toBe(true); // 0.00098 × 8 = 0.0078
    expect(clearsGate(4, 4)).toBe(false); // would clear on chance alone, but fewer than five offers
  });
});

describe('dealing', () => {
  it('deals four rounds, alternating areas, never two linked rounds on one day', () => {
    const d = deal(emptyState(), DECK, on(1), 'mix', seeded());
    expect(d.day).toBe('2026-10-01');
    // w-newsroom's twin k-focus is skipped for k-reply.
    expect(d.cards.map((c) => c.id)).toEqual(['w-headlines', 'k-plan', 'w-newsroom', 'k-reply']);
  });

  it('stores a shuffled option order that is a permutation of the round’s options', () => {
    const d = deal(emptyState(), DECK, on(1), 'mix', seeded(7));
    for (const slot of d.cards) expect([...slot.order].sort()).toEqual(card(slot.id).options.map((o) => o.id).sort());
  });

  it('brings matched scenes forward once their twin is answered, then fresh rounds', () => {
    const day1 = playDay(emptyState(), on(1), first);
    const d2 = deal(day1, DECK, on(2), 'mix', seeded());
    expect(d2.cards.map((c) => c.id)).toEqual(['w-cycle', 'k-focus', 'w-late', 's-workshop-a']);
  });

  it('deals the second half of a pair only once the first is two calendar days old', () => {
    let s = playDay(emptyState(), on(1), first);
    s = playDay(s, on(2), first); // s-workshop-a answered on 2 October
    expect(deal(s, DECK, on(3), 'mix').cards.map((c) => c.id)).not.toContain('s-workshop-b');
    s = playDay(s, on(3), first);
    expect(deal(s, DECK, on(4), 'mix').cards[0].id).toBe('s-workshop-b');
  });

  it('keeps to the chosen area', () => {
    const d = deal(emptyState(), DECK, on(1), 'world', seeded());
    expect(d.cards).toHaveLength(ROUNDS_PER_DAY);
    expect(d.cards.every((c) => card(c.id).area === 'world')).toBe(true);
  });

  it('returns rounds left unanswered on an earlier day to the pool', () => {
    let s: TellState = { ...emptyState(), deal: deal(emptyState(), DECK, on(1), 'mix', seeded()) };
    s = answer(s, DECK, 'w-headlines', 'power', on(1));
    expect(deal(s, DECK, on(2), 'mix').cards.map((c) => c.id)).toContain('w-newsroom');
  });

  it('eventually deals every round, then nothing', () => {
    // A guard against twin or pair rules stranding a card.
    let s = emptyState();
    for (let d = 1; d <= 60; d++) s = playDay(s, on(d), first);
    expect(s.answers).toHaveLength(DECK.length);
    expect(deal(s, DECK, on(61), 'mix').cards).toEqual([]);
  });
});

describe('recording', () => {
  const dealt = () => ({ ...emptyState(), deal: deal(emptyState(), DECK, on(1), 'mix', seeded(3)) });

  it('snapshots what was shown, in order, with each option’s angle', () => {
    const s = dealt();
    const order = s.deal.cards[0].order;
    const a = answer(s, DECK, 'w-headlines', order[2], on(1)).answers[0];
    expect(a.shown.map((x) => x.id)).toEqual(order);
    expect(a.shown.every((x) => x.lens)).toBe(true);
    expect(a.pickText).toBe(card('w-headlines').options.find((o) => o.id === order[2])!.text);
    expect(a.day).toBe('2026-10-01');
  });

  it('refuses answers outside today’s set, repeats and invalid picks', () => {
    const s = dealt();
    expect(() => answer(s, DECK, 'w-rail', 'identity', on(1))).toThrow(/not in today/);
    expect(() => answer(s, DECK, 'w-headlines', 'notme', on(1))).toThrow(/not an answer/);
    expect(() => answer(s, DECK, 'w-headlines', 'power', on(2))).toThrow(/not in today/);
    const once = answer(s, DECK, 'w-headlines', 'power', on(1));
    expect(() => answer(once, DECK, 'w-headlines', 'power', on(1))).toThrow(/already/);
  });

  it('moves through the set and then ends it', () => {
    let s: TellState = dealt();
    for (let i = 0; i < ROUNDS_PER_DAY; i++) {
      const round = currentRound(s, DECK, on(1))!;
      expect(round.index).toBe(i);
      s = answer(s, DECK, round.card.id, round.card.options[0].id, on(1));
    }
    expect(currentRound(s, DECK, on(1))).toBeNull();
  });

  it('keeps and un-keeps a line with its text snapshotted, and toggles disagreement', () => {
    let s = toggleKeep(emptyState(), DECK, 'w-headlines', on(1));
    expect(s.kept[0]).toMatchObject({ card: 'w-headlines', line: card('w-headlines').kind !== 'switch' ? (card('w-headlines') as LensCard).line : '' });
    s = toggleKeep(s, DECK, 'w-headlines', on(1));
    expect(s.kept).toEqual([]);
    s = toggleDisagree(s, 'w-headlines', on(1));
    expect(s.disagreed.map((d) => d.card)).toEqual(['w-headlines']);
    expect(toggleDisagree(s, 'w-headlines', on(1)).disagreed).toEqual([]);
  });
});

describe('counting', () => {
  it('counts each angle as picked-of-offered from the answers alone', () => {
    const s = playDay(emptyState(), on(1), prefer('perception'));
    const world = lensRecord(s.answers, 'world');
    // w-headlines and w-newsroom both offer Perception, and it was picked both times.
    expect(world.find((r) => r.lens === 'perception')).toMatchObject({ offered: 2, chosen: 2 });
    expect(world.find((r) => r.lens === 'incentives')).toMatchObject({ offered: 2, chosen: 0 });
    expect(world.reduce((n, r) => n + r.offered, 0)).toBe(8); // 2 rounds × 4 angles
  });

  it('keeps past denominators when the deck is later edited', () => {
    // Answered under an older tagging, where this option counted as Identity…
    const older = DECK.map((c) =>
      c.id === 'w-headlines' && c.kind !== 'switch'
        ? { ...c, options: c.options.map((o) => (o.id === 'power' ? { ...o, lens: 'identity' as const } : o)) }
        : c,
    );
    let s: TellState = { ...emptyState(), deal: deal(emptyState(), older, on(1), 'mix', seeded()) };
    s = answer(s, older, 'w-headlines', 'power', on(1));
    // …the record keeps what was shown then, whatever the deck says now.
    const record = lensRecord(s.answers, 'world');
    expect(record.find((r) => r.lens === 'identity')).toMatchObject({ offered: 1, chosen: 1 });
    expect(record.find((r) => r.lens === 'power')).toMatchObject({ offered: 0, chosen: 0 });
  });

  it('counts ways out separately', () => {
    let s: TellState = { ...emptyState(), deal: deal(emptyState(), DECK, on(1), 'mix', seeded()) };
    s = answer(s, DECK, 'w-headlines', 'unknown', on(1));
    s = answer(s, DECK, 'k-plan', 'notme', on(1));
    expect(outRecord(s.answers, 'world')).toEqual([{ out: 'unknown', label: 'Not enough to go on', count: 1 }]);
    expect(outRecord(s.answers, 'work')).toEqual([{ out: 'notme', label: 'Doesn’t happen to me', count: 1 }]);
    expect(lensRecord(s.answers, 'world').find((r) => r.lens === 'perception')).toMatchObject({ offered: 1, chosen: 0 });
  });

  it('says what each answer added, with its denominator', () => {
    let s = playDay(emptyState(), on(1), prefer('perception'));
    expect(deposit(s, 'w-newsroom')).toEqual(['Added to The world: Perception has been offered 2 times and picked 2.']);
    s = playDay(s, on(2), prefer('perception'));
    expect(deposit(s, 'k-focus')[1]).toBe('This completes a matched pair with “The newsroom’s good intentions”.');
    // The first half of a pair never mentions pairing.
    expect(deposit(s, 's-workshop-a')).toEqual(['Added to Work & projects: one choice recorded.']);
  });
});

describe('observations', () => {
  /** Play every round in an area, preferring one angle wherever it's offered. */
  const playAll = (lens: LensId, area: 'world' | 'work') => {
    let s = emptyState();
    for (let d = 1; d <= 30; d++) s = playDay(s, on(d), prefer(lens), area);
    return s;
  };
  /** How many lens rounds in an area offer this angle: the deck's own number, not a constant. */
  const offersIn = (lens: LensId, area: 'world' | 'work') =>
    DECK.filter((c) => c.kind !== 'switch' && c.area === area && c.options.some((o) => (o as LensCard['options'][number]).lens === lens)).length;

  /** A synthetic lens round answered on `day`, offering Identity, Power, Capacity and Structure. */
  const round = (i: number, pick: string, day: string): Answer => ({
    card: `x-${i}`,
    v: 1,
    kind: 'mirror',
    area: 'work',
    title: `Scene ${i}`,
    at: `${day}T08:00:00.000Z`,
    day,
    shown: (['identity', 'power', 'capacity', 'structure'] as const).map((lens) => ({ id: lens, lens })),
    pick,
    pickText: pick,
  });

  it('appears only when an angle clears the published bar', () => {
    const s = playAll('identity', 'work');
    const n = offersIn('identity', 'work');
    expect(lensRecord(s.answers, 'work').find((r) => r.lens === 'identity')).toMatchObject({ offered: n, chosen: n });
    const obs = observations(s.answers).find((o) => o.id === 'lean:work:identity')!;
    expect(obs).toMatchObject({ counts: `${n} of ${n}`, clears: true });
  });

  it('stays once shown, marked with both counts, when later rounds bring it under the bar', () => {
    const answers = [1, 2, 3, 4, 5].map((i) => round(i, 'identity', `2026-10-0${i}`));
    expect(observations(answers)).toEqual([
      expect.objectContaining({ id: 'lean:work:identity', counts: '5 of 5', clears: true, first: { counts: '5 of 5', day: '2026-10-05' } }),
    ]);
    const later = [...answers, round(6, 'power', '2026-10-06'), round(7, 'capacity', '2026-10-07')];
    expect(observations(later)).toEqual([
      expect.objectContaining({ id: 'lean:work:identity', counts: '5 of 7', clears: false, first: { counts: '5 of 5', day: '2026-10-05' } }),
    ]);
  });

  it('counts its walk exactly as the record does, ways out and all', () => {
    // Cleared on the very last answer, so the walk's counts at that moment are its final counts.
    const answers = [round(1, 'else', '2026-10-01'), ...[2, 3, 4, 5, 6].map((i) => round(i, 'identity', `2026-10-0${i}`))];
    const obs = observations(answers)[0];
    const row = lensRecord(answers, 'work').find((r) => r.lens === 'identity')!;
    expect(obs.first.counts).toBe(`${row.chosen} of ${row.offered}`);
    expect(obs.counts).toBe('5 of 6');
  });

  it('does not appear for an angle picked at chance-like rates', () => {
    let s = emptyState();
    for (let d = 1; d <= 3; d++) s = playDay(s, on(d), first, 'world');
    const record = lensRecord(s.answers, 'world');
    expect(s.answers).toHaveLength(12);
    expect(Math.max(...record.map((r) => r.chosen))).toBe(3); // at most 3 of 6
    expect(observations(s.answers)).toEqual([]);
  });

  it('is never changed by the player’s verdict', () => {
    const s = playAll('identity', 'work');
    const noted = addNote(s, 'lean:work:identity', 'doesnt', '6 of 6', on(7));
    expect(observations(noted.answers)).toEqual(observations(s.answers));
    expect(noted.notes.at(-1)).toMatchObject({ verdict: 'doesnt', counts: '6 of 6' });
  });
});

describe('matched scenes and pairs', () => {
  it('compares only twins answered on both sides', () => {
    let s = playDay(emptyState(), on(1), prefer('capacity'));
    expect(matchedPairs(s.answers)).toEqual([]);
    s = playDay(s, on(2), prefer('capacity'));
    const pairs = matchedPairs(s.answers);
    expect(pairs.map((p) => [p.world.card, p.work.card])).toEqual([
      ['w-newsroom', 'k-focus'],
      ['w-cycle', 'k-plan'],
    ]);
    expect(pairs.every((p) => p.worldLens === 'capacity' && p.workLens === 'capacity')).toBe(true);
  });

  it('reports whether the answer changed once both halves are in', () => {
    let s = emptyState();
    for (let d = 1; d <= 4; d++) {
      s = playDay(s, on(d), (c) => (c.kind === 'switch' && c.pair === 'workshop' ? (c.variant === 'a' ? 'go' : 'stay') : first(c)));
    }
    const workshop = pairResults(s.answers, PAIRS).find((r) => r.pair.id === 'workshop')!;
    expect(workshop).toMatchObject({ changed: true });
    expect(workshop.first.pickText).toBe('Go');
    expect(workshop.second!.pickText).toBe('Stay home');
  });
});
