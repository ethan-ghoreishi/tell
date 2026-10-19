import { describe, expect, it } from 'vitest';
import { CARDS, KINDS } from './content';
import {
  CHANGE_GAP,
  RETEST_DAYS,
  ROTATION,
  SET_SIZE,
  addCall,
  addNote,
  addPool,
  addPrinciple,
  bracket,
  brief,
  callSummary,
  charted,
  chart,
  clashPairs,
  currentStep,
  daysBetween,
  dueCalls,
  emptyState,
  followUp,
  lessonsFile,
  localDay,
  myLessons,
  nextAsk,
  noticed,
  patterns,
  protectedRecord,
  rate,
  ratingRecord,
  ratingsByCard,
  record,
  rotate,
  rotation,
  runResult,
  setStatus,
  slideSetup,
  startSet,
  todaysSession,
  type CallDraft,
  type Play,
} from './engine';
import type { Card, Lesson, Side, SlideCard, SlideRun, Step, TellState } from './types';

const on = (d: number, h = 9) => new Date(2026, 9, d, h, 0, 0); // October 2026 onwards, local time

/** A player: for each experiment, how they answer. Slides switch at a fixed step. */
interface Chooser {
  switchAt?: (c: SlideCard, step: Step) => number;
  depends?: (c: SlideCard, step: Step) => 'alt' | 'condition' | 'else' | undefined;
  guess?: number;
  coins?: number[];
}

function playOf(state: TellState, cards: Card[], step: Step, who: Chooser): Play {
  const c = cards.find((x) => x.id === step.card)!;
  if (c.mechanic === 'slide') {
    const { dial } = slideSetup(c, step);
    const at = who.switchAt?.(c, step) ?? 3;
    const on = step.role === 'depends' ? undefined : who.depends?.(c, step);
    const asked: { step: number; pick: Side }[] = [];
    if (on) return { mechanic: 'slide', asked, outcome: { kind: 'depends', at: nextAsk(7, dial.rises, asked)!, on } };
    for (let s = nextAsk(7, dial.rises, asked); s !== null; s = nextAsk(7, dial.rises, asked)) {
      asked.push({ step: s, pick: s >= at ? dial.rises : dial.rises === 'a' ? 'b' : 'a' });
    }
    return { mechanic: 'slide', guess: who.guess, asked, outcome: { kind: 'switch', at: bracket(7, dial.rises, asked).lo } };
  }
  if (c.mechanic === 'cut') return { mechanic: 'cut', order: rotate(c.items, rotation(state, 'cut')).slice(0, 4).map((i) => i.id) };
  if (c.mechanic === 'spend') {
    const coins = who.coins ?? [4, 3, 2, 1, 0];
    return { mechanic: 'spend', coins, clashes: clashPairs(coins).map((p) => ({ ...p, pick: p.a })) };
  }
  return { mechanic: 'peek', before: 'a', opened: [{ fact: 0, lean: 'a' }, { fact: 1, lean: 'b' }], pick: 'b', wouldHave: [] };
}

/** Play today's whole set. */
function playDay(state: TellState, now: Date, who: Chooser = {}, cards: Card[] = CARDS): TellState {
  let s = startSet(state, cards, now);
  for (let cur = currentStep(s, now); cur; cur = currentStep(s, now)) s = record(s, cards, playOf(s, cards, cur.step, who), now);
  return s;
}

const steps = (s: TellState) => s.session!.steps.map((x) => `${x.role}:${x.card}${x.condition ? '+' : ''}${x.dial === 'alt' ? '~alt' : ''}`);

describe('calendar', () => {
  it('uses the local calendar day and counts whole days across a clock change', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2); // UK clocks change on 29 March 2026
    expect(daysBetween('2026-10-31', '2026-11-01')).toBe(1);
  });
});

describe('Slide: halving over seven steps', () => {
  it('asks the middle step first and settles any of the eight intervals in three choices', () => {
    expect(nextAsk(7, 'b', [])).toBe(3);
    for (let at = 0; at <= 7; at++) {
      const asked: { step: number; pick: Side }[] = [];
      for (let s = nextAsk(7, 'b', asked); s !== null; s = nextAsk(7, 'b', asked)) asked.push({ step: s, pick: s >= at ? 'b' : 'a' });
      expect(asked, `interval ${at}`).toHaveLength(3);
      expect(bracket(7, 'b', asked)).toEqual({ lo: at, hi: at });
    }
  });

  it('refuses answers that aren’t the halving they claim to be', () => {
    const s = startSet(emptyState(), CARDS, on(1));
    const out: Play = { mechanic: 'slide', asked: [{ step: 2, pick: 'a' }], outcome: { kind: 'switch', at: 3 } };
    expect(() => record(s, CARDS, out, on(1))).toThrow(/out of order/);
    const unsettled: Play = { mechanic: 'slide', asked: [{ step: 3, pick: 'a' }], outcome: { kind: 'switch', at: 4 } };
    expect(() => record(s, CARDS, unsettled, on(1))).toThrow(/not settled/);
  });
});

describe('Spend: clashes', () => {
  it('pairs adjacent ranks by coins, keeping authored order on ties', () => {
    expect(clashPairs([1, 4, 0, 3, 2])).toEqual([
      { a: 1, b: 3 },
      { a: 3, b: 4 },
      { a: 4, b: 0 },
      { a: 0, b: 2 },
    ]);
    expect(clashPairs([2, 2, 2, 2, 2])).toEqual([
      { a: 0, b: 1 },
      { a: 1, b: 2 },
      { a: 2, b: 3 },
      { a: 3, b: 4 },
    ]);
  });
});

describe('sets', () => {
  it('runs probe, stress-test, connect on day one, each with its reason', () => {
    const s = playDay(emptyState(), on(1));
    expect(steps(s)).toEqual(['probe:sl-shop', 'stress:sl-shop+', 'connect:sl-taxi']);
    expect(s.session!.steps.map((x) => x.reason)).toEqual([
      'You haven’t tested money for time yet.',
      'The same choice, with one thing changed: friends due in an hour.',
      'The same trade-off in travel instead of home.',
    ]);
    expect(s.session!.done).toBe(true);
    expect(s.runs).toHaveLength(SET_SIZE);
  });

  it('deals one set a day, fixed once planned', () => {
    let s = startSet(emptyState(), CARDS, on(1));
    expect(setStatus(s, CARDS, on(1))).toBe('playing');
    expect(() => startSet(s, CARDS, on(1, 20))).toThrow(/already started/);
    expect(currentStep(s, on(1, 20))).toEqual(currentStep(s, on(1)));
    s = playDay(emptyState(), on(1));
    expect(setStatus(s, CARDS, on(1, 23))).toBe('done');
    expect(setStatus(s, CARDS, on(2))).toBe('ready');
  });

  it('lets an unfinished set lapse at midnight: its unplayed steps return to the pool', () => {
    let s = startSet(emptyState(), CARDS, on(1));
    s = record(s, CARDS, playOf(s, CARDS, currentStep(s, on(1))!.step, {}), on(1));
    expect(todaysSession(s, on(2))).toBeNull();
    s = startSet(s, CARDS, on(2));
    expect(s.session!.steps[0].role).toBe('probe');
    expect(s.runs).toHaveLength(1);
  });

  it('rotates the probe’s mechanic, and prices what a Cut kept with a Slide', () => {
    let s = emptyState();
    for (let d = 1; d <= ROTATION.length; d++) s = playDay(s, on(d));
    const probes = s.runs.filter((r) => r.role === 'probe').map((r) => r.mechanic);
    expect(probes).toEqual(ROTATION);
    const day2 = s.runs.filter((r) => r.session === localDay(on(2)));
    const cut = day2[0];
    expect(cut.mechanic).toBe('cut');
    const winner = cut.mechanic === 'cut' ? cut.items.find((i) => i.id === cut.winner)!.factor : null;
    const stress = day2[1] as SlideRun;
    expect(stress.mechanic).toBe('slide');
    expect(stress.tradeoff).toContain(winner);
  });

  it('puts a price on what an open call protects first', () => {
    const draft: CallDraft = {
      kind: 'buying',
      title: 'Which laptop',
      options: ['Air', 'Pro'],
      items: KINDS[0].features.slice(0, 5),
      order: ['price', 'quality', 'daily'],
      winner: 'return',
      lean: 'a',
      unknowns: [],
    };
    draft.order = ['price', 'quality', 'daily', 'reliable'];
    const s = startSet(addCall(emptyState(), draft, 14, on(1)), CARDS, on(1));
    // "Easy to return or resell" is flexibility: the first Slide pricing it.
    expect(s.session!.steps[0]).toMatchObject({ card: 'sl-fare', reason: 'Your open call “Which laptop” protects flexibility. This puts a price on it.' });
  });

  it('checks a condition that changed an answer once in another setting', () => {
    // On day one the deadline moves the shop answer by three intervals.
    const s = playDay(emptyState(), on(1), { switchAt: (_, step) => (step.condition ? 0 : 3) });
    expect(patterns(s.runs, 'GBP').filter((p) => p.kind === 'change').map((p) => p.tag)).toEqual(['deadline']);
    let t = playDay(s, on(2)); // a Cut day
    t = startSet(t, CARDS, on(3));
    expect(t.session!.steps[0]).toMatchObject({ card: 'sl-delivery', reason: expect.stringMatching(/^Having a deadline changed one of your answers/) });
  });

  it('retests a result once it is three weeks old', () => {
    let s = emptyState();
    let d = 0;
    // Play daily until a probe is a retest.
    for (; d < 60 && !s.runs.some((r) => r.role === 'probe' && s.runs.some((x) => x.card === r.card && x.at < r.at)); d++) s = playDay(s, on(1 + d));
    const retest = s.runs.find((r) => r.role === 'probe' && s.runs.some((x) => x.card === r.card && x.at < r.at))!;
    const before = s.runs.filter((x) => x.card === retest.card && x.at < retest.at && !(x.mechanic === 'slide' && x.condition)).at(-1)!;
    expect(daysBetween(before.day, retest.day)).toBeGreaterThanOrEqual(RETEST_DAYS);
    expect(s.session!.steps[0].reason).toMatch(/days ago\. A retest shows/);
  });

  it('adds an “It depends” experiment inside the set, without counting it towards the three', () => {
    const s = playDay(emptyState(), on(1), { depends: (c, step) => (step.role === 'probe' && c.alt ? 'alt' : undefined) });
    expect(steps(s)).toEqual(['probe:sl-shop', 'depends:sl-shop~alt', 'stress:sl-shop+', 'connect:sl-taxi']);
    // A depends on the stress-test still connects to the same trade-off elsewhere.
    const t = playDay(emptyState(), on(1), { depends: (c, step) => (step.role === 'stress' && c.alt ? 'alt' : undefined) });
    expect(steps(t)).toEqual(['probe:sl-shop', 'stress:sl-shop+', 'depends:sl-shop+~alt', 'connect:sl-taxi']);
    const alt = s.runs[1] as SlideRun;
    expect(alt.measure).toBe('How far away the supermarket can be');
    expect(alt.tradeoff).toEqual(['time', 'money']);
    expect(s.session!.steps[1]).toMatchObject({ hold: 3, reason: 'You said it depends on how far away the supermarket is. This tests it.' });
    expect(runResult(s.runs[0], 'GBP').headline).toBe('It depended on how far away the supermarket is.');
  });

  it('plays sixty days in a row: a set every day, every experiment reached, all of it repeatable', () => {
    const run = () => {
      let s = emptyState();
      const days: number[] = [];
      for (let d = 0; d < 60; d++) {
        const now = new Date(2026, 9, 1 + d, 9);
        expect(setStatus(s, CARDS, now), `day ${d + 1}`).toBe('ready');
        s = playDay(s, now, { switchAt: (c, step) => (step.condition ? 1 : c.id.length % 7) });
        days.push(s.runs.filter((r) => r.day === localDay(now)).length);
        if (charted(s.runs, CARDS).done === charted(s.runs, CARDS).total) break;
      }
      return { s, days };
    };
    const { s, days } = run();
    expect(charted(s.runs, CARDS)).toEqual({ done: charted(s.runs, CARDS).total, total: 70 });
    expect(days.every((n) => n >= 2)).toBe(true);
    expect(run().s).toEqual(s); // the same state in, the same sets out
  });
});

describe('what a run shows', () => {
  const slideRun = (outcome: SlideRun['outcome'], guess?: number): SlideRun => ({
    id: 'x-0',
    session: 'x',
    role: 'probe',
    card: 'sl-flight',
    v: 1,
    context: 'travel',
    title: 'The 06:05 flight',
    at: '2026-10-01T08:00:00.000Z',
    day: '2026-10-01',
    mechanic: 'slide',
    tradeoff: ['money', 'energy'],
    dial: 'main',
    measure: 'What skipping a 03:30 alarm is worth to you',
    unit: 'money',
    steps: [5, 10, 20, 40, 80, 150, 300],
    rises: 'a',
    asked: [],
    outcome,
    ...(guess !== undefined ? { guess } : {}),
  });

  it('states a Slide’s switch point, a non-factor within the range tested, or a close call', () => {
    expect(runResult(slideRun({ kind: 'switch', at: 4 }, 4), 'GBP')).toEqual({
      headline: 'What skipping a 03:30 alarm is worth to you: between £40 and £80.',
      lines: ['You guessed between £40 and £80. Your choices landed there.'],
    });
    expect(runResult(slideRun({ kind: 'switch', at: 0 }), 'EUR').headline).toBe('What skipping a 03:30 alarm is worth to you: €5 or less.');
    expect(runResult(slideRun({ kind: 'switch', at: 7 }, 2), 'USD')).toEqual({
      headline: 'What skipping a 03:30 alarm is worth to you: more than $300.',
      lines: ['Within the range tested, the amount didn’t move your answer.', 'You guessed between $10 and $20.'],
    });
    expect(runResult(slideRun({ kind: 'close', at: 3 }), 'GBP').headline).toBe('What skipping a 03:30 alarm is worth to you: about £40.');
  });

  it('gives every Spend a result, even when the coins are tied', () => {
    let s = emptyState();
    for (let d = 1; d <= 5; d++) s = playDay(s, on(d));
    const spendOn = (coins: number[]) => runResult(playDay(s, on(6), { coins }).runs.find((r) => r.mechanic === 'spend')!, 'GBP').headline;
    expect(spendOn([2, 2, 2, 2, 2])).toBe('Your coins were tied, so your choices set the order: price, then camera, then battery, then updates.');
    expect(spendOn([4, 3, 2, 1, 0])).toBe('Your coins and your choices agreed in 4 of 4 clashes where the coins differed.');
  });

  it('names the Peek facts that moved the lean, with denominators', () => {
    let s = emptyState();
    for (let d = 1; d <= 4; d++) s = playDay(s, on(d));
    const peek = s.runs.find((r) => r.mechanic === 'peek')!;
    const r = runResult(peek, 'GBP');
    expect(r.headline).toMatch(/^Of the 2 facts you opened, only .+ moved your lean\.$/);
    expect(r.lines.at(-1)).toBe('None of the 3 facts you didn’t open would have changed your pick.');
  });

  it('keeps past results when the content is later edited', () => {
    const s = playDay(emptyState(), on(1));
    const before = s.runs.map((r) => runResult(r, 'GBP'));
    const edited = CARDS.map((c) => (c.id === 'sl-shop' ? { ...c, dial: { ...(c as SlideCard).dial, measure: 'Changed', steps: [1, 2, 3, 4, 5, 6, 7] } } : c));
    expect(s.runs.map((r) => runResult(r, 'GBP'))).toEqual(before);
    expect(chart(s.runs, edited).find((r) => r.tradeoff.join() === 'money,time')!.cells[0].base!.measure).toBe('How much cheaper the supermarket has to be');
  });
});

describe('patterns', () => {
  const cutDays = (n: number) => {
    let s = emptyState();
    let d = 1;
    while (s.runs.filter((r) => r.mechanic === 'cut').length < n) s = playDay(s, on(d++));
    return s;
  };

  it('shows a repeated choice only at three times and three in four, and keeps it once shown', () => {
    // Cutting the first shown item each time: rotation spreads first cuts across factors.
    const s = cutDays(6);
    const cuts = protectedRecord(s.runs);
    const money = cuts.find((r) => r.factor === 'money')!;
    expect(money.offered).toBe(6);
    const shown = patterns(s.runs, 'GBP').filter((p) => p.kind === 'repeat');
    for (const p of shown) {
      const [k, n] = p.first.counts.split(' of ').map(Number);
      expect(k >= 3 && k >= 0.75 * n, p.id).toBe(true);
    }
  });

  it('counts a context change only when the two results are at least two intervals apart', () => {
    const near = playDay(emptyState(), on(1), { switchAt: (_, step) => (step.condition ? 2 : 3) });
    expect(patterns(near.runs, 'GBP').some((p) => p.kind === 'change')).toBe(false);
    const far = playDay(emptyState(), on(1), { switchAt: (_, step) => (step.condition ? 3 - CHANGE_GAP : 3) });
    expect(patterns(far.runs, 'GBP').find((p) => p.kind === 'change')).toMatchObject({
      id: 'change:sl-shop',
      text: 'How much cheaper the supermarket has to be: between £4 and £8. With friends due in an hour: between £1 and £2.',
    });
  });

  it('never changes a pattern because of the player’s verdict', () => {
    const s = playDay(emptyState(), on(1), { switchAt: (_, step) => (step.condition ? 0 : 3) });
    const p = patterns(s.runs, 'GBP')[0];
    const noted = addNote(s, p.id, 'coincidence', p.counts, on(1));
    expect(patterns(noted.runs, 'GBP')).toEqual(patterns(s.runs, 'GBP'));
    expect(noted.notes).toEqual([{ pattern: p.id, verdict: 'coincidence', counts: p.counts, at: on(1).toISOString() }]);
  });
});

describe('calls and lessons', () => {
  const SECRET = 'zebra-secret';
  const kindB = KINDS[0];
  const draft: CallDraft = {
    kind: 'buying',
    title: `Camera ${SECRET}`,
    options: [`Keep ${SECRET}`, `Buy ${SECRET}`],
    items: [...kindB.features.slice(0, 4), { id: 'own-1', factor: 'quality', text: `Low light ${SECRET}`, own: true }],
    order: ['price', 'quality', 'daily', 'reliable'],
    winner: 'own-1',
    lean: 'b',
    slide: { unit: 'money', steps: kindB.dial.steps, phrase: kindB.dial.phrase, asked: [], outcome: { kind: 'switch', at: 4 } },
    unknowns: [
      { id: 'u1', text: 'The return window', check: 'return-window', answer: 'yes' },
      { id: 'u2', text: `Charger ${SECRET}`, answer: 'no' },
    ],
  };

  it('comes back due, closes with a follow-up and summarises only what was answered', () => {
    let s = addCall(emptyState(), draft, 14, on(1));
    expect(dueCalls(s, on(14))).toHaveLength(0);
    expect(dueCalls(s, on(15))).toHaveLength(1);
    expect(callSummary(s.calls[0], 'GBP')).toEqual([
      `What matters most here: low light ${SECRET}, then reliable for years. First to go: the price.`,
      `You’re leaning towards Buy ${SECRET}.`,
      `You’d still pick Buy ${SECRET} if it cost £200 more, but not if it cost £400 more.`,
      'Could change your pick, so worth finding out: the return window.',
      `Wouldn’t change it, so you can skip: charger ${SECRET}.`,
    ]);
    expect(brief(s.calls[0], kindB.name, 'GBP')).toContain(`A decision I’m making: Camera ${SECRET} (buying something).`);
    s = followUp(s, s.calls[0].id, { lesson: 'f00d0001', chose: 'b', went: 'worse', mattered: [{ item: 'price', how: 'more' }, { item: 'own-1', how: 'less' }], missed: [{ check: 'running-costs' }, { text: `Strap ${SECRET}` }] }, on(15));
    expect(dueCalls(s, on(16))).toHaveLength(0);
    expect(() => followUp(s, s.calls[0].id, s.calls[0].follow!, on(16))).toThrow(/already closed/);
  });

  it('shares lessons in fixed vocabulary only: none of the player’s words leave the device', () => {
    let s = addCall(emptyState(), draft, 14, on(1));
    s = followUp(s, s.calls[0].id, { lesson: 'f00d0001', chose: 'b', went: 'worse', mattered: [{ item: 'price', how: 'more' }, { item: 'own-1', how: 'less' }], missed: [{ check: 'running-costs' }, { text: `Strap ${SECRET}` }] }, on(15));
    s = addPrinciple(s, `Principle ${SECRET}`, on(15), s.calls[0].id);
    const file = lessonsFile(s);
    expect(file).not.toContain(SECRET);
    expect(JSON.parse(file)).toEqual({
      tell: 'lessons',
      v: 1,
      lessons: [{ id: 'f00d0001', kind: 'buying', went: 'worse', mattered: [{ feature: 'price', how: 'more' }], missed: ['running-costs'], other: 1 }],
    });
  });

  it('counts each shared call once, however many files it arrives in, and never your own', () => {
    const lesson = (id: string): Lesson => ({ id, kind: 'buying', went: 'expected', mattered: [], missed: ['return-window'], other: 0 });
    let s = addCall(emptyState(), draft, 14, on(1));
    s = followUp(s, s.calls[0].id, { lesson: 'mine0001', chose: 'a', went: 'better', mattered: [], missed: [] }, on(15));
    const add = (lessons: Lesson[]) => {
      const r = addPool(s, lessons, on(16));
      if (r.ok) s = r.state;
      return r;
    };
    expect(add(JSON.parse(lessonsFile(s)).lessons)).toEqual({ ok: false, error: 'Those lessons are already here.' });
    // A friend shares two calls, then closes one more and shares all three again.
    expect(add([lesson('a1'), lesson('a2')])).toMatchObject({ ok: true, added: 2, skipped: 0 });
    expect(noticed(s, 'buying').shared).toMatchObject({ calls: 2, missed: [], below: 1 });
    expect(add([lesson('a1'), lesson('a2')])).toEqual({ ok: false, error: 'Those lessons are already here.' });
    expect(add([lesson('a1'), lesson('a2'), lesson('a3')])).toMatchObject({ ok: true, added: 1, skipped: 2 });
    expect(noticed(s, 'buying').shared).toMatchObject({ calls: 3, missed: [{ id: 'return-window', count: 3 }], below: 0 });
    expect(myLessons(s).map((l) => l.id)).toEqual(['mine0001']);
  });
});

describe('ratings', () => {
  it('keeps one rating per set and credits it to the experiments in that set', () => {
    let s = playDay(emptyState(), on(1));
    s = rate(s, localDay(on(1)), 'meh', on(1));
    s = rate(s, localDay(on(1)), 'useful', on(1, 10));
    expect(ratingRecord(s)).toEqual({ good: 1, of: 1 });
    expect(ratingsByCard(s).get('sl-taxi')).toEqual({ useful: 1, interesting: 0, meh: 0 });
  });
});
