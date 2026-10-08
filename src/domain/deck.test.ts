import { describe, expect, it } from 'vitest';
import { DECK, PAIRS } from './deck';
import { AREAS, LENSES, OUTS, type Area, type LensCard, type SwitchCard } from './types';

// The deck's structure is what makes the counts fair. These checks are the
// contract any new round must meet.

const lensCards = DECK.filter((c): c is LensCard => c.kind !== 'switch');
const halves = DECK.filter((c): c is SwitchCard => c.kind === 'switch');
const byId = new Map(DECK.map((c) => [c.id, c]));
const filled = (s: string) => s.trim().length > 0;

describe('deck', () => {
  it('has unique round ids and complete text', () => {
    expect(byId.size).toBe(DECK.length);
    for (const c of DECK) {
      expect(filled(c.title) && filled(c.scene), c.id).toBe(true);
      for (const o of c.options) expect(filled(o.text), `${c.id}/${o.id}`).toBe(true);
    }
  });

  it('offers exactly four distinct angles in every lens round, each with what it sees and misses', () => {
    for (const c of lensCards) {
      expect(c.options, c.id).toHaveLength(4);
      expect(new Set(c.options.map((o) => o.lens)).size, c.id).toBe(4);
      expect(new Set(c.options.map((o) => o.id)).size, c.id).toBe(4);
      expect(filled(c.line), c.id).toBe(true);
      for (const o of c.options) {
        expect(filled(o.sees) && filled(o.misses), `${c.id}/${o.id}`).toBe(true);
        expect(Object.keys(OUTS), `${c.id}/${o.id} collides with a way out`).not.toContain(o.id);
      }
    }
  });

  it('keeps world scenes as Decode rounds and your own scenes as Mirror rounds', () => {
    for (const c of lensCards) expect(c.kind, c.id).toBe(c.area === 'world' ? 'decode' : 'mirror');
  });

  it('matches twins both ways, across areas, offering the same four angles', () => {
    const twins = lensCards.filter((c) => c.twin);
    expect(twins.length).toBeGreaterThanOrEqual(2);
    for (const c of twins) {
      const other = byId.get(c.twin!) as LensCard | undefined;
      expect(other?.twin, c.id).toBe(c.id);
      expect(other!.area, c.id).not.toBe(c.area);
      expect(new Set(other!.options.map((o) => o.lens)), c.id).toEqual(new Set(c.options.map((o) => o.lens)));
    }
  });

  it('offers every angle equally often in each area, so no angle wins by exposure', () => {
    for (const area of Object.keys(AREAS) as Area[]) {
      const offered = LENSES.map((l) => lensCards.filter((c) => c.area === area && c.options.some((o) => o.lens === l.id)).length);
      expect(Math.max(...offered) - Math.min(...offered), area).toBeLessThanOrEqual(1);
      expect(Math.min(...offered), area).toBeGreaterThanOrEqual(5);
    }
  });

  it('gives every pair exactly two halves, a then b, with the same answers in the same order', () => {
    for (const pair of PAIRS) {
      const [a, b] = ['a', 'b'].map((v) => halves.filter((h) => h.pair === pair.id && h.variant === v));
      expect(a, pair.id).toHaveLength(1);
      expect(b, pair.id).toHaveLength(1);
      expect(b[0].options.map((o) => o.id), pair.id).toEqual(a[0].options.map((o) => o.id));
      expect(b[0].scene, pair.id).not.toBe(a[0].scene);
      expect(DECK.indexOf(b[0]), pair.id).toBeGreaterThan(DECK.indexOf(a[0]));
      expect(filled(pair.changed) && filled(pair.note), pair.id).toBe(true);
    }
    for (const h of halves) expect(PAIRS.some((p) => p.id === h.pair), h.id).toBe(true);
  });
});
