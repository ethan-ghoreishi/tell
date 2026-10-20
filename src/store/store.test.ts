import { describe, expect, it } from 'vitest';
import tell20 from '../../tests/fixtures/tell-2.0.json';
import tell30 from '../../tests/fixtures/tell-3.0.json';
import { everything, SAMPLE } from '../../tests/sample';
import { emptyState, recordPlay } from '../domain/engine';
import { SITUATIONS } from '../domain/situations';
import type { TellState } from '../domain/types';
import { validateState } from '../domain/validate';
import { STORAGE_KEY, createStore, readBackup, type StorageLike } from './store';

// Persistence, earlier versions and data safety, against an in-memory stand-in for localStorage.

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
const played = (s: TellState = emptyState()) => recordPlay(s, SITUATIONS, 'oak', SAMPLE.oak, now);

/** Documents as earlier versions of Tell really stored them. 2.0's and 3.0's were written by their own engines. */
const EARLIER = {
  1: { schema: 1, answers: [{ card: 'w-01', pick: 'power', at: '2026-10-08T09:00:00.000Z' }], deal: null, kept: [{ text: 'Kept line' }], disagreed: [], notes: [] },
  2: { schema: 2, currency: 'GBP', runs: [{ id: '2026-10-14-0', mechanic: 'slide', card: 'sl-shop' }], session: null, calls: [], notes: [], principles: [{ id: 'p-1', text: 'Light beats fast', at: '2026-10-14T10:00:00.000Z' }], ratings: [], pool: [] },
  3: tell20,
  4: tell30,
};

describe('store', () => {
  it('starts empty and persists every update', () => {
    const storage = memory();
    const store = createStore(storage);
    expect(store.get()).toMatchObject({ status: 'ready', state: emptyState() });
    store.update(played);
    const reopened = createStore(storage).get();
    expect(reopened.status).toBe('ready');
    if (reopened.status === 'ready') expect(reopened.state.plays).toHaveLength(1);
  });

  it('accepts everything the engine writes', () => {
    const s = everything(now);
    expect(validateState(JSON.parse(JSON.stringify(s)), now)).toEqual({ ok: true, state: s });
  });

  it('round-trips a backup through export and import exactly', () => {
    const a = createStore(memory());
    a.update(() => everything(now));
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

  it('refuses data from a newer version, saying so, and leaves it untouched', () => {
    const newer = JSON.stringify({ ...emptyState(), schema: 6 });
    const storage = memory(newer);
    expect(createStore(storage).get()).toMatchObject({ status: 'refused', newer: true });
    expect(storage.data.get(STORAGE_KEY)).toBe(newer);
  });

  it('refuses a malformed play, naming it, and changes nothing', () => {
    const bad = JSON.stringify({ ...emptyState(), plays: [{ id: 'x' }] });
    const storage = memory(bad);
    const snap = createStore(storage).get();
    expect(snap.status).toBe('refused');
    if (snap.status === 'refused') expect(snap.reason).toMatch(/^play 1 /);
    expect(storage.data.get(STORAGE_KEY)).toBe(bad);
  });

  it('refuses a play whose answers its own snapshot didn’t ask for', () => {
    const s = played();
    const tampered = { ...s, plays: [{ ...s.plays[0], answers: { ...s.plays[0].answers, act: { kind: 'choose', pick: 'burn', asked: false } } }] };
    expect(validateState(JSON.parse(JSON.stringify(tampered)), now)).toMatchObject({ ok: false, error: 'play 1 picks something “act” didn’t offer' });
    const shown = { ...s, plays: [{ ...s.plays[0], situation: 'loaf' }] };
    expect(validateState(JSON.parse(JSON.stringify(shown)), now)).toMatchObject({ ok: false, error: 'play 1 shows a different situation from the one it names' });
  });

  it.each([1, 2, 3, 4] as const)('keeps a schema-%i record whole in the archive of a fresh record', (schema) => {
    const doc = EARLIER[schema];
    const storage = memory(JSON.stringify(doc));
    const snap = createStore(storage).get();
    expect(snap).toMatchObject({ status: 'ready', archived: schema });
    if (snap.status !== 'ready') return;
    expect(snap.state).toEqual({ ...emptyState(), archive: [{ schema, at: expect.any(String), doc }] });
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!)).toEqual(snap.state); // written straight away, so it isn't archived twice
    expect(createStore(storage).get()).toMatchObject({ status: 'ready', state: snap.state });
    // And the same through Restore.
    const r = readBackup(JSON.stringify(doc), now);
    expect(r).toMatchObject({ ok: true, state: { plays: [], archive: [{ schema, doc }] } });
  });

  it('refuses a malformed record of what has been seen', () => {
    expect(validateState({ ...emptyState(), seen: { a: 'yesterday' } }, now)).toMatchObject({ ok: false, error: 'what has been seen is malformed' });
    expect(validateState({ ...emptyState(), seen: undefined }, now)).toMatchObject({ ok: false });
  });

  it('validates an import completely and changes nothing on refusal', () => {
    const store = createStore(memory());
    store.update(played);
    const before = store.get();
    expect(store.importText('[]')).toMatchObject({ ok: false });
    expect(store.importText(JSON.stringify({ ...emptyState(), plays: [{ id: 1 }] }))).toMatchObject({ ok: false, error: expect.stringMatching(/play 1/) });
    expect(store.importText(JSON.stringify({ ...emptyState(), schema: 9 }))).toMatchObject({ ok: false, error: expect.stringMatching(/newer/) });
    expect(store.get()).toBe(before);
  });

  it('can restore a refused store from a valid backup', () => {
    const good = createStore(memory());
    good.update(played);
    const broken = createStore(memory('garbage'));
    expect(broken.importText(good.exportText())).toEqual({ ok: true });
    expect(broken.get().status).toBe('ready');
  });

  it('surfaces a failed write and keeps the play in memory', () => {
    const storage = memory();
    const store = createStore(storage);
    storage.failWrites = true;
    store.update(played);
    const snap = store.get();
    expect(snap.status).toBe('ready');
    if (snap.status === 'ready') {
      expect(snap.saveError).toMatch(/couldn’t save/);
      expect(snap.state.plays).toHaveLength(1);
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
