import { describe, expect, it } from 'vitest';
import tell20 from '../../tests/fixtures/tell-2.0.json';
import tell30 from '../../tests/fixtures/tell-3.0.json';
import tell31 from '../../tests/fixtures/tell-3.1.json';
import tell41 from '../../tests/fixtures/tell-4.1.json';
import { roundById } from '../content';
import { emptyState, keep, recordPlay } from '../domain/engine';
import { SCHEMA, type TellState } from '../domain/types';
import { validateState } from '../domain/validate';
import { STORAGE_KEY, createStore, readBackup, type StorageLike } from './store';
import { ANSWERS } from '../../tests/answers';

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

const now = new Date(2026, 10, 19, 9);
const sky = roundById('night-sky')!;
const played = (s: TellState = emptyState()) => recordPlay(s, sky, ANSWERS['night-sky'], now);
const kept = (s: TellState = played()) => keep(s, sky, now, 'My own words');

/** Documents as earlier versions of Tell really stored them. 2.0's to 4.1's were written by their own engines. */
const EARLIER = {
  1: { schema: 1, answers: [{ card: 'w-01', pick: 'power', at: '2026-10-08T09:00:00.000Z' }], deal: null, kept: [{ text: 'Kept line' }], disagreed: [], notes: [] },
  2: { schema: 2, currency: 'GBP', runs: [{ id: '2026-10-14-0', mechanic: 'slide', card: 'sl-shop' }], session: null, calls: [], notes: [], principles: [{ id: 'p-1', text: 'Light beats fast', at: '2026-10-14T10:00:00.000Z' }], ratings: [], pool: [] },
  3: tell20,
  4: tell30,
  5: tell31,
};

describe('store', () => {
  it('starts empty and persists every update', () => {
    const storage = memory();
    const store = createStore(storage);
    expect(store.get()).toMatchObject({ status: 'ready', state: emptyState() });
    store.update((s) => kept(played(s)));
    const reopened = createStore(storage).get();
    expect(reopened).toMatchObject({ status: 'ready', state: { plays: [{ round: 'night-sky' }], book: [{ round: 'night-sky', text: 'My own words' }] } });
  });

  it('accepts everything the engine writes', () => {
    const s = kept();
    expect(validateState(JSON.parse(JSON.stringify(s)), now)).toEqual({ ok: true, state: s });
  });

  it('doesn’t rewrite storage when nothing changed', () => {
    const storage = memory();
    const store = createStore(storage);
    store.update(played);
    storage.data.set(STORAGE_KEY, 'sentinel');
    store.update((s) => s);
    expect(storage.data.get(STORAGE_KEY)).toBe('sentinel');
  });

  it('round-trips a backup through export and import exactly', () => {
    const a = createStore(memory());
    a.update(() => kept());
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
    const newer = JSON.stringify({ ...emptyState(), schema: SCHEMA + 1 });
    const storage = memory(newer);
    expect(createStore(storage).get()).toMatchObject({ status: 'refused', newer: true });
    expect(storage.data.get(STORAGE_KEY)).toBe(newer);
  });

  it('refuses a malformed record, naming the problem, and changes nothing', () => {
    const s = kept();
    const bad = (x: object) => validateState(JSON.parse(JSON.stringify({ ...s, ...x })), now);
    expect(bad({ plays: [{ round: 'night-sky' }] })).toMatchObject({ ok: false, error: 'play 1 is not a play' });
    expect(bad({ plays: [{ ...s.plays[0], answers: { why: { pick: 'age' } } }] })).toMatchObject({ ok: false, error: 'play 1 has malformed answers' });
    expect(bad({ book: [{ ...s.book[0], kind: 'verdict' }] })).toMatchObject({ ok: false, error: 'idea 1 has an unknown kind' });
    expect(bad({ book: [{ ...s.book[0], text: '  ' }] })).toMatchObject({ ok: false, error: 'idea 1 is not a kept idea' });
    expect(bad({ book: [s.book[0], s.book[0]] })).toMatchObject({ ok: false, error: 'two ideas are for the same round' });
    expect(bad({ skipped: ['a', 'a'] })).toMatchObject({ ok: false, error: 'the passed-over rounds are malformed' });
    expect(bad({ archive: [{ schema: 6 }] })).toMatchObject({ ok: false, error: 'the archive is malformed' });
    expect(bad({ book: undefined })).toMatchObject({ ok: false, error: 'the ideas are not a list' });
    const raw = JSON.stringify({ ...s, plays: [{ round: 1 }] });
    const storage = memory(raw);
    expect(createStore(storage).get()).toMatchObject({ status: 'refused', reason: 'play 1 is not a play' });
    expect(storage.data.get(STORAGE_KEY)).toBe(raw);
  });

  it('keeps an idea whose round has left the collection, and a play of it', () => {
    const s = kept();
    const gone = { ...s, plays: [{ ...s.plays[0], round: 'retired' }], book: [{ ...s.book[0], round: 'retired' }] };
    expect(validateState(JSON.parse(JSON.stringify(gone)), now)).toMatchObject({ ok: true });
  });

  it.each([1, 2, 3, 4, 5] as const)('keeps a schema-%i record whole in the archive of a fresh record', (schema) => {
    const doc = EARLIER[schema];
    const storage = memory(JSON.stringify(doc));
    const snap = createStore(storage).get();
    expect(snap).toMatchObject({ status: 'ready', archived: schema });
    if (snap.status !== 'ready') return;
    // Anything the earlier record had itself archived is lifted beside it (2.0 kept a schema-1 record).
    const earlier = 'archive' in doc ? (doc.archive as unknown[]) : [];
    expect(snap.state).toEqual({ ...emptyState(), archive: [...earlier, { schema, at: expect.any(String), doc }] });
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!)).toEqual(snap.state); // written straight away, so it isn't archived twice
    expect(createStore(storage).get()).toMatchObject({ status: 'ready', state: snap.state });
    expect(readBackup(JSON.stringify(doc), now)).toMatchObject({ ok: true, state: { plays: [], archive: [...earlier, { schema, doc }] } });
  });

  it('keeps a real Tell 4.1 record whole, and lifts what it had archived beside it', () => {
    const storage = memory(JSON.stringify(tell41));
    const snap = createStore(storage).get();
    expect(snap).toMatchObject({ status: 'ready', archived: 6 });
    if (snap.status !== 'ready') return;
    expect(snap.state.plays).toEqual([]);
    expect(snap.state.archive.map((a) => a.schema)).toEqual([5, 6]);
    expect(snap.state.archive[0]).toEqual(tell41.archive[0]);
    expect(snap.state.archive[1].doc).toEqual(tell41);
    // Through Restore too: a 4.1 backup becomes the archive of a fresh record.
    expect(readBackup(JSON.stringify(tell41), now)).toMatchObject({ ok: true, state: { book: [], archive: [{ schema: 5 }, { schema: 6, doc: tell41 }] } });
  });

  it('validates an import completely and changes nothing on refusal', () => {
    const store = createStore(memory());
    store.update(played);
    const before = store.get();
    expect(store.importText('[]')).toMatchObject({ ok: false });
    expect(store.importText('not json')).toMatchObject({ ok: false, error: 'That file is not readable JSON.' });
    expect(store.importText(JSON.stringify({ ...emptyState(), plays: [{ id: 1 }] }))).toMatchObject({ ok: false, error: expect.stringMatching(/play 1/) });
    expect(store.importText(JSON.stringify({ ...emptyState(), schema: 99 }))).toMatchObject({ ok: false, error: expect.stringMatching(/newer/) });
    expect(store.get()).toBe(before);
  });

  it('can restore a refused store from a valid backup', () => {
    const good = createStore(memory());
    good.update(played);
    const broken = createStore(memory('garbage'));
    expect(broken.importText(good.exportText())).toEqual({ ok: true });
    expect(broken.get().status).toBe('ready');
  });

  it('surfaces a failed write and keeps the state in memory', () => {
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
