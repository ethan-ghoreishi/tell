import { describe, expect, it } from 'vitest';
import { EPISODES } from '../domain/episodes';
import { addOutcome, answerExample, bracket, createChoice, editChoice, emptyState, examplePool, keep, nextAsk, recordPlay, retire, revise, saveChoice } from '../domain/engine';
import type { Side, TellState } from '../domain/types';
import { validateState } from '../domain/validate';
import { STORAGE_KEY, createStore, readBackup, type StorageLike } from './store';

// Persistence, migration and data safety, against an in-memory stand-in for localStorage.

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
const played = (s: TellState = emptyState()) => recordPlay(s, EPISODES, 'ev-cafe', { first: 'framed', beat: { kind: 'twist' }, final: 'grid' }, now);

/** Everything a player can record, so validation is checked against what the engine really writes. */
function everything(): TellState {
  let s = played();
  const asked: { step: number; pick: Side }[] = [];
  for (let st = nextAsk(7, 'a', asked); st !== null; st = nextAsk(7, 'a', asked)) asked.push({ step: st, pick: st >= 4 ? 'a' : 'b' });
  s = recordPlay(s, EPISODES, 'ev-testers', { first: 'unsure', beat: { kind: 'slide', asked, outcome: { kind: 'switch', at: bracket(7, 'a', asked).lo } }, final: 'launch' }, now);
  s = recordPlay(s, EPISODES, 'ev-mugs', { first: 'make', beat: { kind: 'peek', opened: [{ fact: 2, lean: 'not' }], wouldHave: [3] }, final: 'not' }, now);
  s = recordPlay(s, EPISODES, 'po-rewrite', { first: 'keep', beat: { kind: 'widen', picked: ['part', 'done'] }, final: 'done' }, now);
  s = recordPlay(s, EPISODES, 'pr-journal', { first: 'local', beat: { kind: 'cut', order: ['devices', 'friends', 'safe', 'noserver'] }, final: 'local' }, now);
  s = keep(s, 't1', 'Check where a limit came from', { kind: 'play', play: s.plays[0].id }, now);
  s = createChoice(s, 'c1', now);
  s = editChoice(
    s,
    'c1',
    {
      title: 'Show at the café',
      situation: 'They offered March',
      circumstances: ['public', 'deadline'],
      parts: ['possibilities', 'evidence'],
      options: [
        { id: 'o1', text: 'Framed' },
        { id: 'o2', text: 'Ask them', shape: 'ask' },
      ],
      lean: 'o2',
      criteria: [{ id: 'k1', text: 'Under budget', must: true }],
      top: 'k1',
      ruledOut: ['o1'],
      unknowns: [{ id: 'u1', text: 'They want frames', kind: 'assumption', changes: 'yes', how: 'ask' }],
      clearer: 'Ask first',
      unresolved: 'Budget',
      next: { kind: 'find-out', text: 'Email them' },
      expectation: { text: 'They say anything goes', by: '2026-10-08' },
      step: 'summary',
    },
    now,
  );
  s = answerExample(s, 'c1', examplePool(s, 'c1')[0], 'applies', false, now);
  s = saveChoice(s, 'c1', now);
  s = addOutcome(s, 'c1', 'out1', { state: 'happened', compared: 'as-expected', what: 'Anything goes', surprise: 'They wanted a grid', settled: true, lesson: { kind: 'kept', id: 't2', text: 'Ask early' } }, now);
  s = revise(retire(s, 't1', now), 't2', 'Ask early, cheaply', now);
  return s;
}

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
    const s = everything();
    expect(validateState(JSON.parse(JSON.stringify(s)), now)).toEqual({ ok: true, state: s });
  });

  it('round-trips a backup through export and import exactly', () => {
    const a = createStore(memory());
    a.update(everything);
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
    const newer = JSON.stringify({ ...emptyState(), schema: 4 });
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

  it('carries the first version’s record into the archive, whole', () => {
    const v1 = { schema: 1, answers: [{ card: 'w-01', pick: 'power', at: '2026-10-08T09:00:00.000Z' }], deal: null, kept: [{ text: 'Kept line' }], disagreed: [], notes: [] };
    const storage = memory(JSON.stringify(v1));
    const snap = createStore(storage).get();
    expect(snap).toMatchObject({ status: 'ready', migrated: 1 });
    if (snap.status !== 'ready') return;
    expect(snap.state.archive).toEqual([{ schema: 1, at: expect.any(String), doc: v1 }]);
    expect(snap.state.takeaways).toEqual([]); // v1's lines described the player; they stay in the archive only
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!)).toEqual(snap.state); // written once it validated
  });

  it('carries version 2 into the archive, and its written principles into takeaways', () => {
    const v2 = {
      schema: 2,
      currency: 'GBP',
      runs: [{ id: '2026-10-14-0', mechanic: 'slide', card: 'sl-shop' }],
      session: null,
      calls: [{ id: 'c-1', title: 'Which laptop' }],
      notes: [],
      principles: [
        { id: 'p-1', text: 'Light beats fast', at: '2026-10-14T10:00:00.000Z', call: 'c-1' },
        { id: 'p-2', text: '   ', at: '2026-10-14T10:00:00.000Z' },
      ],
      ratings: [],
      pool: [],
    };
    const r = readBackup(JSON.stringify(v2), now);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.archive[0].doc).toEqual(v2);
    expect(r.state.takeaways).toEqual([
      { id: 'earlier-1', at: '2026-10-14T10:00:00.000Z', source: { kind: 'earlier', schema: 2 }, versions: [{ at: '2026-10-14T10:00:00.000Z', text: 'Light beats fast' }], features: [], retired: '' },
    ]);
  });

  it('validates an import completely and changes nothing on refusal', () => {
    const store = createStore(memory());
    store.update(played);
    const before = store.get();
    expect(store.importText('[]')).toMatchObject({ ok: false });
    expect(store.importText(JSON.stringify({ ...emptyState(), takeaways: [{ id: 1 }] }))).toMatchObject({ ok: false, error: expect.stringMatching(/takeaway 1/) });
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

  it('surfaces a failed write and keeps the answer in memory', () => {
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
