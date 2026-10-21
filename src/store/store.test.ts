import { describe, expect, it } from 'vitest';
import tell20 from '../../tests/fixtures/tell-2.0.json';
import tell30 from '../../tests/fixtures/tell-3.0.json';
import tell31 from '../../tests/fixtures/tell-3.1.json';
import { everything, SAMPLE } from '../../tests/sample';
import { emptyState, recordChoice, recordPlay, setTrying } from '../domain/engine';
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

/** Documents as earlier versions of Tell really stored them. 2.0's, 3.0's and 3.1's were written by their own engines. */
const EARLIER = {
  1: { schema: 1, answers: [{ card: 'w-01', pick: 'power', at: '2026-10-08T09:00:00.000Z' }], deal: null, kept: [{ text: 'Kept line' }], disagreed: [], notes: [] },
  2: { schema: 2, currency: 'GBP', runs: [{ id: '2026-10-14-0', mechanic: 'slide', card: 'sl-shop' }], session: null, calls: [], notes: [], principles: [{ id: 'p-1', text: 'Light beats fast', at: '2026-10-14T10:00:00.000Z' }], ratings: [], pool: [] },
  3: tell20,
  4: tell30,
  5: tell31,
};
const HARD = { undo: 'no', know: ['check', 'after'], wait: 'closes', bad: 'hard' };
const kept = (s: TellState = emptyState()) => setTrying(recordChoice(s, 'Open-source my app', HARD, now), `c${s.choices.length + 1}-${now.getTime()}`, 'small', true);

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

  it('accepts everything the engine writes, kept choices included', () => {
    const s = kept(everything(now));
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
    a.update(() => kept(everything(now)));
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
    const newer = JSON.stringify({ ...emptyState(), schema: 7 });
    const storage = memory(newer);
    expect(createStore(storage).get()).toMatchObject({ status: 'refused', newer: true });
    expect(storage.data.get(STORAGE_KEY)).toBe(newer);
  });

  it('refuses records written with a newer language as newer, and leaves them untouched', () => {
    const s = played();
    const newer = JSON.stringify({ ...s, plays: [{ ...s.plays[0], language: 2 }] });
    const storage = memory(newer);
    expect(createStore(storage).get()).toMatchObject({ status: 'refused', newer: true, reason: 'play 1 was written by a newer version of Tell (language 2)' });
    expect(storage.data.get(STORAGE_KEY)).toBe(newer);
    const c = kept();
    expect(validateState(JSON.parse(JSON.stringify({ ...c, choices: [{ ...c.choices[0], language: 3 }] })), now)).toMatchObject({ ok: false, newer: true });
  });

  it('refuses a kept choice that doesn’t hold together, naming it', () => {
    const c = kept();
    const bad = (choice: object) => validateState(JSON.parse(JSON.stringify({ ...c, choices: [{ ...c.choices[0], ...choice }] })), now);
    expect(bad({ trying: ['spare', 'spare'] })).toMatchObject({ ok: false, error: 'choice 1 marks a move it didn’t show' });
    expect(bad({ shape: { ...HARD, wait: 'later' } })).toMatchObject({ ok: false, error: 'choice 1 doesn’t answer “If you wait, what happens?”' });
    expect(bad({ shown: [] })).toMatchObject({ ok: false, error: 'choice 1 shows no moves' });
    expect(bad({ note: 7 })).toMatchObject({ ok: false, error: 'choice 1 is not a kept choice' });
    expect(validateState(JSON.parse(JSON.stringify({ ...c, choices: [c.choices[0], c.choices[0]] })), now)).toMatchObject({ ok: false, error: expect.stringMatching(/^choice 2 repeats/) });
    expect(validateState({ ...c, choices: undefined }, now)).toMatchObject({ ok: false, error: 'choices is not a list' });
  });

  it('refuses a play whose story names a move the language doesn’t have', () => {
    const s = played();
    const shown = { ...s.plays[0].shown, steps: s.plays[0].shown.steps.map((st) => (st.kind === 'choose' ? { ...st, options: st.options.map((o) => ({ ...o, moves: ['teleport'] })) } : st)) };
    expect(validateState(JSON.parse(JSON.stringify({ ...s, plays: [{ ...s.plays[0], shown }] })), now)).toMatchObject({ ok: false, error: expect.stringMatching(/^play 1 shows a story that step “act” needs two to four options/) });
  });

  it('keeps a variant’s play, and refuses one whose story half-names a variant', () => {
    const s = recordPlay(emptyState(), SITUATIONS, 'harvest-blind', SAMPLE['harvest-blind'], now);
    expect(validateState(JSON.parse(JSON.stringify(s)), now)).toEqual({ ok: true, state: s });
    const { whatIf: _, ...half } = s.plays[0].shown;
    expect(validateState(JSON.parse(JSON.stringify({ ...s, plays: [{ ...s.plays[0], shown: half }] })), now)).toMatchObject({ ok: false, error: 'play 1 shows a story that is a malformed variant' });
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
    expect(validateState(JSON.parse(JSON.stringify(shown)), now)).toMatchObject({ ok: false, error: 'play 1 shows a different story from the one it names' });
  });

  it.each([1, 2, 3, 4, 5] as const)('keeps a schema-%i record whole in the archive of a fresh record', (schema) => {
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
    expect(validateState({ ...emptyState(), seen: { look: 'yesterday' } }, now)).toMatchObject({ ok: false, error: 'what has been seen is malformed' });
    expect(validateState({ ...emptyState(), seen: { teleport: now.toISOString() } }, now)).toMatchObject({ ok: false, error: 'what has been seen is malformed' });
    expect(validateState({ ...emptyState(), seen: undefined }, now)).toMatchObject({ ok: false });
  });

  it('validates an import completely and changes nothing on refusal', () => {
    const store = createStore(memory());
    store.update(played);
    const before = store.get();
    expect(store.importText('[]')).toMatchObject({ ok: false });
    expect(store.importText(JSON.stringify({ ...emptyState(), plays: [{ id: 1 }] }))).toMatchObject({ ok: false, error: expect.stringMatching(/play 1/) });
    expect(store.importText(JSON.stringify({ ...emptyState(), schema: 9 }))).toMatchObject({ ok: false, error: expect.stringMatching(/newer/) });
    expect(store.importText(JSON.stringify({ ...emptyState(), choices: [{ id: 'c1' }] }))).toMatchObject({ ok: false, error: expect.stringMatching(/choice 1/) });
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
