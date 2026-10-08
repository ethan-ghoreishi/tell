import { useSyncExternalStore } from 'react';
import { emptyState } from '../domain/engine';
import type { TellState } from '../domain/types';
import { validateState } from '../domain/validate';

// One JSON document in localStorage, the source of truth on this device.
// ponytail: localStorage caps out around 5 MB, roughly 20k answers; move to
// IndexedDB if a player ever gets near that.
//
// Data safety: a document that can't be read (not JSON, malformed, or from a
// newer Tell) is REFUSED. Nothing is written over it; the app offers its raw
// text for download, Restore from a backup, or an explicit Start fresh. A
// failed write keeps the state in memory and says so; it is never swallowed.

export const STORAGE_KEY = 'tell';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type Snapshot =
  | { status: 'ready'; state: TellState; saveError: string | null }
  | { status: 'refused'; reason: string; newer: boolean; raw: string };

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** The one way a backup file is read: parse, then the same validation as loading. */
export function readBackup(text: string): { ok: true; state: TellState } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not readable JSON.' };
  }
  const v = validateState(parsed);
  return v.ok ? v : { ok: false, error: `That file can’t be used: ${v.error}.` };
}

export function createStore(storage: StorageLike) {
  const listeners = new Set<() => void>();
  let snapshot: Snapshot = read();

  function read(): Snapshot {
    let raw: string | null;
    try {
      raw = storage.getItem(STORAGE_KEY);
    } catch (e) {
      return { status: 'refused', reason: `this browser would not let Tell read its storage (${message(e)})`, newer: false, raw: '' };
    }
    if (raw === null) return { status: 'ready', state: emptyState(), saveError: null };
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { status: 'refused', reason: 'the saved data is not readable JSON', newer: false, raw };
    }
    const v = validateState(parsed);
    return v.ok ? { status: 'ready', state: v.state, saveError: null } : { status: 'refused', reason: v.error, newer: !!v.newer, raw };
  }

  function set(next: Snapshot) {
    snapshot = next;
    listeners.forEach((l) => l());
  }

  function write(state: TellState) {
    let saveError: string | null = null;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      saveError = `Tell couldn’t save (${message(e)}). Everything is kept while Tell stays open; export a backup from About to be safe.`;
    }
    set({ status: 'ready', state, saveError });
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    get: () => snapshot,

    /** Apply a pure transition and persist it. Refused data is never written over. */
    update(transition: (state: TellState) => TellState) {
      if (snapshot.status !== 'ready') throw new Error('Tell’s saved data was refused; restore or start fresh first');
      write(transition(snapshot.state));
    },

    /** Read a backup without changing anything, so the player can confirm what it holds. */
    inspect: readBackup,

    /** Validate a backup completely, then replace. On refusal nothing changes. */
    importText(text: string): { ok: true } | { ok: false; error: string } {
      const backup = readBackup(text);
      if (!backup.ok) return backup;
      write(backup.state);
      return { ok: true };
    },

    exportText(): string {
      if (snapshot.status !== 'ready') return snapshot.raw;
      return JSON.stringify(snapshot.state, null, 2);
    },

    /** Deliberate erasure: the only path that removes saved data. */
    erase() {
      try {
        storage.removeItem(STORAGE_KEY);
        set({ status: 'ready', state: emptyState(), saveError: null });
      } catch (e) {
        set({ status: 'ready', state: emptyState(), saveError: `Tell couldn’t clear its storage (${message(e)}).` });
      }
    },
  };
}

export type Store = ReturnType<typeof createStore>;

function browserStorage(): StorageLike {
  try {
    return window.localStorage;
  } catch (e) {
    const refuse = () => {
      throw e;
    };
    return { getItem: refuse, setItem: refuse, removeItem: refuse };
  }
}

export const store = typeof window === 'undefined' ? (undefined as unknown as Store) : createStore(browserStorage());

export const useTell = () => useSyncExternalStore(store.subscribe, store.get);
