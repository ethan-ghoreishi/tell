import { describe, expect, it } from 'vitest';
import { CARDS, KINDS } from './content';
import { fill } from './text';
import { FACTORS, TAGS, type Card, type CutCard, type Factor, type PeekCard, type SlideCard, type SpendCard } from './types';

// The recipe every experiment must meet. A new experiment that fails here
// doesn't ship; About states the same rules in plain words.

const slides = CARDS.filter((c): c is SlideCard => c.mechanic === 'slide');
const cuts = CARDS.filter((c): c is CutCard => c.mechanic === 'cut');
const spends = CARDS.filter((c): c is SpendCard => c.mechanic === 'spend');
const peeks = CARDS.filter((c): c is PeekCard => c.mechanic === 'peek');
const words = (s: string) => s.trim().split(/\s+/).length;
const count = (s: string, token: string) => s.split(token).length - 1;
const tradeoff = (c: SlideCard) => `${c.dial.factor}/${(c.dial.rises === 'a' ? c.b : c.a).gives}`;

/** Every string a player can read, per experiment and per kind. */
function texts(c: Card): string[] {
  const base = [c.title, c.scene];
  if (c.mechanic === 'slide') return [...base, c.a.text, c.b.text, c.dial.measure, c.condition.text, c.condition.label, c.alt?.label ?? '', c.alt?.measure ?? ''];
  if (c.mechanic === 'cut') return [...base, ...c.items.map((i) => i.text)];
  if (c.mechanic === 'spend') return [...base, ...c.features.flatMap((f) => [f.label, f.high, f.low])];
  return [...base, c.a, c.b, ...c.facts.flatMap((f) => [f.label, f.a, f.b])];
}
const kindTexts = KINDS.flatMap((k) => [k.name, k.example, ...k.options, k.dial.phrase, ...k.features.map((f) => f.text), ...k.checks.map((c) => c.text)]);
const ALL = [...CARDS.flatMap(texts), ...kindTexts];

/** Words that would turn an experiment into a verdict on the person. */
const PSYCHOLOGY = /\b(bias|biased|fear|afraid|anxi\w*|avoid\w*|procrastinat\w*|personality|trait|insecur\w*|ego|trauma\w*|impostor|perfectionis\w*|addict\w*|compuls\w*|lazy|guilt\w*|shame\w*|self-esteem|denial|irrational|loss aversion|sunk cost|risk-averse|diagnos\w*)\b/i;

const jaccard = (a: string, b: string) => {
  const [x, y] = [a, b].map((s) => new Set(s.toLowerCase().match(/[a-z’']+/g)));
  const shared = [...x].filter((w) => y.has(w)).length;
  return shared / (x.size + y.size - shared);
};

describe('every experiment', () => {
  it('has a unique id and complete text', () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
    for (const c of CARDS) for (const t of texts(c).filter((t, i) => i < 2 || t)) expect(t.trim(), c.id).not.toBe('');
  });

  it('never prints a currency symbol: amounts take the player’s currency', () => {
    for (const t of ALL) expect(t, t).not.toMatch(/[£$€]/);
  });

  it('uses no psychology vocabulary', () => {
    for (const t of ALL) expect(t, t).not.toMatch(PSYCHOLOGY);
  });

  it('stays short enough to read at a glance', () => {
    for (const c of CARDS) expect(words(fill(c.scene, 'GBP', { y: '10 minutes' })), c.id).toBeLessThanOrEqual(32);
    for (const c of slides) {
      for (const t of [c.a.text, c.b.text, c.dial.measure]) expect(words(t), `${c.id}: ${t}`).toBeLessThanOrEqual(12);
      expect(words(c.condition.text), c.id).toBeLessThanOrEqual(14);
      expect(words(c.condition.label), c.id).toBeLessThanOrEqual(6);
    }
    for (const c of [...cuts, ...spends, ...peeks]) for (const t of texts(c).slice(2)) expect(words(t), `${c.id}: ${t}`).toBeLessThanOrEqual(7);
  });
});

describe('Slides', () => {
  it('change exactly one value: {x} once, in the option that varies, and nowhere else', () => {
    for (const c of slides) {
      expect(count(c.b.text, '{x}'), c.id).toBe(1);
      expect(count(c.a.text + c.scene + c.condition.text, '{x}'), c.id).toBe(0);
      // {y} is the second value "It depends" can test: present once if, and only if, there is one.
      expect(count(c.scene + c.a.text + c.b.text, '{y}'), c.id).toBe(c.alt ? 1 : 0);
      expect(count(c.condition.text, '{y}'), c.id).toBe(0);
    }
  });

  it('use seven ascending steps, each 1.3 to 3.5 times the last (amounts felt as ratios)', () => {
    for (const c of slides) {
      for (const dial of [c.dial, ...(c.alt ? [c.alt] : [])]) {
        expect(dial.steps, c.id).toHaveLength(7);
        for (let i = 1; i < 7; i++) {
          const r = dial.steps[i] / dial.steps[i - 1];
          expect(r >= 1.3 && r <= 3.5, `${c.id}: ${dial.steps[i - 1]} → ${dial.steps[i]}`).toBe(true);
        }
        expect(dial.steps.every((n) => Number.isInteger(n) && n > 0), c.id).toBe(true);
      }
      if (c.alt) expect(c.alt.at >= 0 && c.alt.at < 7, c.id).toBe(true);
    }
  });

  it('let neither option win on everything: each gives one different factor, and the rising one gives the dial’s', () => {
    for (const c of slides) {
      expect(c.a.gives, c.id).not.toBe(c.b.gives);
      expect((c.dial.rises === 'a' ? c.a : c.b).gives, c.id).toBe(c.dial.factor);
    }
  });

  it('measure each trade-off in three different contexts, so results can be compared across them', () => {
    const contexts = new Map<string, Set<string>>();
    for (const c of slides) contexts.set(tradeoff(c), (contexts.get(tradeoff(c)) ?? new Set()).add(c.context));
    for (const [t, set] of contexts) expect(set.size, t).toBe(3);
    expect(slides).toHaveLength(contexts.size * 3);
  });

  it('give every condition tag to at least three Slides, so a change seen once can be checked elsewhere', () => {
    for (const tag of Object.keys(TAGS)) expect(slides.filter((c) => c.condition.tag === tag).length, tag).toBeGreaterThanOrEqual(3);
  });

  it('are not near-duplicates of each other', () => {
    for (const [i, a] of slides.entries()) for (const b of slides.slice(i + 1)) expect(jaccard(a.scene, b.scene), `${a.id} ~ ${b.id}`).toBeLessThan(0.5);
  });
});

describe('Cuts, Spends and Peeks', () => {
  it('offer five items with five different factors', () => {
    for (const c of cuts) expect(new Set(c.items.map((i) => i.factor)).size, c.id).toBe(5);
    for (const c of spends) expect(new Set(c.features.map((f) => f.factor)).size, c.id).toBe(5);
    for (const c of peeks) expect(new Set(c.facts.map((f) => f.factor)).size, c.id).toBe(5);
    for (const c of [...cuts, ...spends, ...peeks]) {
      const ids = c.mechanic === 'cut' ? c.items : c.mechanic === 'spend' ? c.features : c.facts;
      expect(new Set(ids.map((x) => x.id)).size, c.id).toBe(5);
    }
  });

  it('make every Spend feature a real difference and every Peek fact differ between the options', () => {
    for (const c of spends) for (const f of c.features) expect(f.high, `${c.id}/${f.id}`).not.toBe(f.low);
    for (const c of peeks) for (const f of c.facts) expect(f.a, `${c.id}/${f.id}`).not.toBe(f.b);
  });

  it('hide facts in each Peek that favour each side, so no option wins on everything', () => {
    for (const c of peeks) for (const side of ['a', 'b']) expect(c.facts.some((f) => f.favours === side), c.id).toBe(true);
  });

  it('never repeat the same factors in the same context', () => {
    for (const group of [cuts, spends]) {
      const keys = group.map((c) => `${c.context}:${(c.mechanic === 'cut' ? c.items : (c as SpendCard).features).map((x) => x.factor).sort().join()}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
    for (const [i, a] of peeks.entries()) for (const b of peeks.slice(i + 1)) expect(jaccard(a.scene, b.scene), `${a.id} ~ ${b.id}`).toBeLessThan(0.5);
  });
});

describe('coverage', () => {
  it('lets every factor be both priced in a Slide and protected in a Cut', () => {
    const priced = new Set<Factor>(slides.flatMap((c) => [c.a.gives, c.b.gives]));
    const protectedBy = new Set<Factor>(cuts.flatMap((c) => c.items.map((i) => i.factor)));
    for (const f of FACTORS) {
      expect(priced.has(f.id), `${f.id} in a Slide`).toBe(true);
      expect(protectedBy.has(f.id), `${f.id} in a Cut`).toBe(true);
    }
  });
});

describe('kinds of call', () => {
  it('offer factor-tagged features, five defaults, a one-value dial and a checklist', () => {
    for (const k of KINDS) {
      expect(new Set(k.features.map((f) => f.id)).size, k.id).toBe(k.features.length);
      expect(k.defaults, k.id).toHaveLength(5);
      for (const d of k.defaults) expect(k.features.some((f) => f.id === d), `${k.id}/${d}`).toBe(true);
      expect(count(k.dial.phrase, '{x}'), k.id).toBe(1);
      expect(k.dial.steps, k.id).toHaveLength(7);
      expect(k.checks.length, k.id).toBeGreaterThanOrEqual(5);
      expect(new Set(k.checks.map((c) => c.id)).size, k.id).toBe(k.checks.length);
    }
  });
});
