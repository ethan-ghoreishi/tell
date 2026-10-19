import { describe, expect, it } from 'vitest';
import { CARDS, KINDS } from '../domain/content';
import { addCall, addNote, addPool, addPrinciple, bracket, currentStep, emptyState, followUp, lessonsFile, nextAsk, rate, record, startSet } from '../domain/engine';
import type { Side, TellState } from '../domain/types';
import { readLessons, validateState } from '../domain/validate';
import { STORAGE_KEY, createStore, type StorageLike } from './store';

// Persistence and data safety, against an in-memory stand-in for localStorage.

function memory(initial?: string) {
  const data = new Map<string, string>(initial === undefined ? [] : [[STORAGE_KEY, initial]]);
  const storage: StorageLike & { data: Map<string, string>; failWrites?: boolean } = {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem(k, v) {
      if (storage.failWrites) throw new Error('QuotaExceededError');
      data.set(k, v);
    },
    removeItem: (k) => void data.delete(k),
  };
  return storage;
}

const now = new Date(2026, 9, 1, 9);
/** Today's first experiment, a Slide, played through. */
const played = () => {
  const s = startSet(emptyState(), CARDS, now);
  const asked: { step: number; pick: Side }[] = [];
  for (let st = nextAsk(7, 'b', asked); st !== null; st = nextAsk(7, 'b', asked)) asked.push({ step: st, pick: st >= 3 ? 'b' : 'a' });
  return record(s, CARDS, { mechanic: 'slide', guess: 2, asked, outcome: { kind: 'switch', at: bracket(7, 'b', asked).lo } }, now);
};

/** Everything a player can record, so validation is checked against what the engine really writes. */
function everything(): TellState {
  let s = played();
  while (currentStep(s, now)) s = record(s, CARDS, { mechanic: 'slide', asked: [], outcome: { kind: 'depends', at: 3, on: 'else' } }, now);
  const k = KINDS[0];
  s = addCall(s, { kind: k.id, title: 'Camera', options: ['Keep', 'Buy'], items: [...k.features.slice(0, 4), { id: 'own-1', factor: 'quality', text: 'Low light', own: true }], order: ['price', 'quality', 'daily', 'reliable'], winner: 'own-1', lean: 'b', slide: { unit: 'money', steps: k.dial.steps, phrase: k.dial.phrase, asked: [{ step: 3, pick: 'a' }], outcome: { kind: 'close', at: 5 } }, unknowns: [{ id: 'u1', text: 'Return window', check: 'return-window', answer: 'yes' }] }, 14, now);
  s = followUp(s, s.calls[0].id, { lesson: '0a1b2c3d', chose: 'b', went: 'better', mattered: [{ item: 'price', how: 'less' }], missed: [{ check: 'resale' }, { text: 'Strap' }] }, now);
  s = addNote(addPrinciple(rate(s, s.session!.id, 'interesting', now), 'Light beats fast', now, s.calls[0].id), 'change:sl-shop', 'unsure', '1 / 2', now);
  const pooled = addPool(s, [{ ...JSON.parse(lessonsFile(s)).lessons[0], id: 'theirs01' }], now);
  return pooled.ok ? pooled.state : s;
}

describe('store', () => {
  it('starts empty and persists every update', () => {
    const storage = memory();
    const store = createStore(storage);
    expect(store.get()).toMatchObject({ status: 'ready', state: emptyState() });
    store.update(played);
    const reopened = createStore(storage).get();
    expect(reopened.status).toBe('ready');
    if (reopened.status === 'ready') expect(reopened.state.runs).toHaveLength(1);
  });

  it('round-trips a backup through export and import exactly', () => {
    const a = createStore(memory());
    a.update(played);
    const b = createStore(memory());
    expect(b.importText(a.exportText())).toEqual({ ok: true });
    expect(b.get()).toEqual(a.get());
  });

  it('refuses unreadable data and leaves it untouched', () => {
    const storage = memory('{ not json');
    const store = createStore(storage);
    expect(store.get()).toMatchObject({ status: 'refused', newer: false, raw: '{ not json' });
    expect(() => store.update(played)).toThrow(/refused/);
    expect(storage.data.get(STORAGE_KEY)).toBe('{ not json');
    expect(store.exportText()).toBe('{ not json');
  });

  it('refuses data from a newer version, saying so', () => {
    const store = createStore(memory(JSON.stringify({ ...emptyState(), schema: 3 })));
    expect(store.get()).toMatchObject({ status: 'refused', newer: true });
  });

  it('refuses the first version’s data without touching it, and says why', () => {
    const v1 = JSON.stringify({ schema: 1, answers: [], deal: null, kept: [], disagreed: [], notes: [] });
    const storage = memory(v1);
    const snap = createStore(storage).get();
    expect(snap).toMatchObject({ status: 'refused', newer: false, raw: v1 });
    if (snap.status === 'refused') expect(snap.reason).toMatch(/first version of Tell/);
    expect(storage.data.get(STORAGE_KEY)).toBe(v1);
  });

  it('refuses a malformed experiment, naming it', () => {
    const bad = { ...emptyState(), runs: [{ id: 'x' }] };
    const snap = createStore(memory(JSON.stringify(bad))).get();
    expect(snap.status).toBe('refused');
    if (snap.status === 'refused') expect(snap.reason).toMatch(/^experiment 1 /);
  });

  it('accepts everything the engine writes', () => {
    const s = everything();
    expect(s.pool).toHaveLength(1);
    expect(validateState(JSON.parse(JSON.stringify(s)))).toEqual({ ok: true, state: s });
  });

  it('reads a lessons file through the same strict door', () => {
    expect(readLessons(lessonsFile(everything()))).toMatchObject({ ok: true, lessons: [{ kind: 'buying' }] });
    expect(readLessons('{')).toEqual({ ok: false, error: 'That file is not readable JSON.' });
    expect(readLessons(JSON.stringify({ tell: 'backup' }))).toEqual({ ok: false, error: 'That isn’t a Tell lessons file.' });
    const words = { tell: 'lessons', v: 1, lessons: [{ id: 'x1', kind: 'buying', went: 'better', mattered: [], missed: ['My camera strap broke'], other: 0 }] };
    expect(readLessons(JSON.stringify(words))).toEqual({ ok: false, error: 'Lesson 1 holds text that isn’t one of Tell’s ids.' });
  });

  it('validates an import completely and changes nothing on refusal', () => {
    const store = createStore(memory());
    store.update(played);
    const before = store.get();
    expect(store.importText('[]')).toMatchObject({ ok: false });
    expect(store.importText(JSON.stringify({ ...emptyState(), principles: [{ id: 1 }] }))).toMatchObject({ ok: false, error: expect.stringMatching(/principle/) });
    expect(store.get()).toBe(before);
  });

  it('can restore a refused store from a valid backup', () => {
    const good = createStore(memory());
    good.update(played);
    const broken = createStore(memory('garbage'));
    expect(broken.importText(good.exportText())).toEqual({ ok: true });
    expect(broken.get().status).toBe('ready');
  });

  it('surfaces a failed write and keeps the answer in memory', () => {
    const storage = memory();
    const store = createStore(storage);
    storage.failWrites = true;
    store.update(played);
    const snap = store.get();
    expect(snap.status).toBe('ready');
    if (snap.status === 'ready') {
      expect(snap.saveError).toMatch(/couldn’t save/);
      expect(snap.state.runs).toHaveLength(1);
    }
    storage.failWrites = false;
    store.update((s) => s);
    expect(store.get()).toMatchObject({ saveError: null });
  });

  it('erases only when asked', () => {
    const storage = memory();
    const store = createStore(storage);
    store.update(played);
    store.erase();
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
    expect(store.get()).toMatchObject({ status: 'ready', state: emptyState() });
  });
});
