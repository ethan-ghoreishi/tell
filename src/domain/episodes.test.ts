import { describe, expect, it } from 'vitest';
import { EPISODES, START } from './episodes';
import { PART_ORDER, type Episode } from './types';
import { episodeProblem } from './validate';

// What every episode must be. These checks catch structure and wording; they
// can't judge meaning, so a person reads every new episode against its
// rationale before it ships (AGENTS.md).

const words = (s: string) => s.trim().split(/\s+/).length;

/** Every string a player can read in an episode. */
function texts(e: Episode): string[] {
  const b = e.beat;
  const beat =
    b.kind === 'twist'
      ? [b.text, b.adds?.text ?? '']
      : b.kind === 'peek'
        ? [b.prompt, ...b.facts.flatMap((f) => [f.label, f.text])]
        : b.kind === 'slide'
          ? [b.text, b.measure, b.actual?.text ?? '']
          : [b.prompt, ...b.items.map((i) => i.text)];
  const r = e.rationale;
  return [e.title, e.project, e.setup, e.ask, ...e.options.map((o) => o.text), ...beat, e.reask, e.ending.point, ...e.ending.changed, ...e.ending.stayed, e.ending.unknown, e.ending.apply, r.distinction, r.alternatives, r.limits, r.relevance].filter(Boolean);
}

/** Words that would turn a story into a verdict on the person. */
const PSYCHOLOGY = /\b(bias|biased|fear|afraid|anxi\w*|avoid\w*|procrastinat\w*|personality|trait|insecur\w*|ego|trauma\w*|impostor|perfectionis\w*|addict\w*|compuls\w*|lazy|guilt\w*|shame\w*|self-esteem|denial|irrational|loss aversion|sunk cost|risk-averse|diagnos\w*|therap\w*|cognitive)\b/i;
/** Sentences that describe the player rather than the answers. */
const DESCRIBES_YOU = /\b(you are|you're|you’re the|you tend|you always|you never|you often|you usually|people like you|your type|kind of person)\b/i;

const jaccard = (a: string, b: string) => {
  const [x, y] = [a, b].map((s) => new Set(s.toLowerCase().match(/[a-z’']+/g)));
  const shared = [...x].filter((w) => y.has(w)).length;
  return shared / (x.size + y.size - shared);
};

describe('the episode collection', () => {
  it('is finite: three episodes for each of the four questions, with a recommended start', () => {
    expect(EPISODES).toHaveLength(12);
    for (const p of PART_ORDER) expect(EPISODES.filter((e) => e.part === p), p).toHaveLength(3);
    expect(new Set(EPISODES.map((e) => e.id)).size).toBe(EPISODES.length);
    expect(EPISODES.some((e) => e.id === START)).toBe(true);
  });

  it('uses every move, and leans on none of them', () => {
    const kinds = EPISODES.map((e) => e.beat.kind);
    for (const k of ['twist', 'widen', 'cut', 'peek', 'slide']) expect(kinds, k).toContain(k);
    for (const k of new Set(kinds)) expect(kinds.filter((x) => x === k).length, k).toBeLessThanOrEqual(4);
  });

  it('gives every episode a sound shape', () => {
    for (const e of EPISODES) expect(episodeProblem(e), e.id).toBeNull();
  });

  it('gives every episode an editorial rationale', () => {
    for (const e of EPISODES) for (const [k, v] of Object.entries(e.rationale)) expect(words(v), `${e.id}.${k}`).toBeGreaterThanOrEqual(6);
  });
});

describe('every episode', () => {
  it('marks invented facts as invented', () => {
    for (const e of EPISODES) {
      const b = e.beat;
      const invented = b.kind === 'twist' ? [b.text] : b.kind === 'peek' ? b.facts.map((f) => f.text) : b.kind === 'slide' ? [b.text, b.actual?.text ?? 'In this story'] : [];
      for (const t of invented) expect(t, `${e.id}: ${t}`).toMatch(/^(Suppose|Now suppose)\b|\bIn this story\b/i);
    }
  });

  it('changes exactly one value in a Slide, and reveals one inside its range', () => {
    for (const e of EPISODES) {
      const b = e.beat;
      if (b.kind !== 'slide') continue;
      expect(b.text.split('{x}').length - 1, e.id).toBe(1);
      if (b.actual) expect(b.actual.value > b.steps[0] && b.actual.value < b.steps[6], e.id).toBe(true);
    }
  });

  it('offers readings both ways, so no answer is the intended one', () => {
    for (const e of EPISODES) {
      expect(e.ending.changed.length, e.id).toBeGreaterThanOrEqual(2);
      expect(e.ending.stayed.length, e.id).toBeGreaterThanOrEqual(2);
      // The second reading each way is an alternative, introduced as one.
      for (const r of [e.ending.changed[1], e.ending.stayed[1]]) expect(r, `${e.id}: ${r}`).toMatch(/^Or\b/);
    }
  });

  it('uses no psychology vocabulary and never describes the player', () => {
    for (const e of EPISODES) {
      for (const t of texts(e)) {
        expect(t, `${e.id}: ${t}`).not.toMatch(PSYCHOLOGY);
        expect(t, `${e.id}: ${t}`).not.toMatch(DESCRIBES_YOU);
        expect(t, `${e.id}: ${t}`).not.toMatch(/[£$€]/);
      }
    }
  });

  it('stays short enough for two to four minutes', () => {
    for (const e of EPISODES) {
      expect(words(e.setup), e.id).toBeLessThanOrEqual(55);
      for (const o of e.options) expect(words(o.text), `${e.id}: ${o.text}`).toBeLessThanOrEqual(10);
      for (const r of [e.ending.point, ...e.ending.changed, ...e.ending.stayed, e.ending.unknown]) expect(words(r), `${e.id}: ${r}`).toBeLessThanOrEqual(32);
      const b = e.beat;
      if (b.kind === 'peek') for (const f of b.facts) expect(words(f.text), `${e.id}: ${f.text}`).toBeLessThanOrEqual(25);
    }
  });

  it('is not a near-duplicate of another', () => {
    for (const [i, a] of EPISODES.entries()) for (const b of EPISODES.slice(i + 1)) expect(jaccard(a.setup, b.setup), `${a.id} ~ ${b.id}`).toBeLessThan(0.35);
  });
});
