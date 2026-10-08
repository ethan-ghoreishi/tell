import { describe, expect, it } from 'vitest';
import { DECK } from '../domain/deck';
import { answer, deal, emptyState } from '../domain/engine';
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
const played = () => {
  const s = { ...emptyState(), deal: deal(emptyState(), DECK, now, 'mix', () => 0.5) };
  return answer(s, DECK, s.deal.cards[0].id, s.deal.cards[0].order[0], now);
};

describe('store', () => {
  it('starts empty and persists every update', () => {
    const storage = memory();
    const store = createStore(storage);
    expect(store.get()).toMatchObject({ status: 'ready', state: emptyState() });
    store.update(played);
    const reopened = createStore(storage).get();
    expect(reopened.status).toBe('ready');
    if (reopened.status === 'ready') expect(reopened.state.answers).toHaveLength(1);
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
    const store = createStore(memory(JSON.stringify({ ...emptyState(), schema: 2 })));
    expect(store.get()).toMatchObject({ status: 'refused', newer: true });
  });

  it('refuses a malformed answer, naming it', () => {
    const bad = { ...emptyState(), answers: [{ card: 'w-headlines' }] };
    const store = createStore(memory(JSON.stringify(bad)));
    const snap = store.get();
    expect(snap.status).toBe('refused');
    if (snap.status === 'refused') expect(snap.reason).toMatch(/^answer 1 /);
  });

  it('validates an import completely and changes nothing on refusal', () => {
    const store = createStore(memory());
    store.update(played);
    const before = store.get();
    expect(store.importText('[]')).toMatchObject({ ok: false });
    expect(store.importText(JSON.stringify({ ...emptyState(), kept: [{ card: 1 }] }))).toMatchObject({ ok: false, error: expect.stringMatching(/kept line/) });
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
      expect(snap.state.answers).toHaveLength(1);
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
