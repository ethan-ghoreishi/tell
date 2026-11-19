import { describe, expect, it } from 'vitest';
import { DESCRIBES_YOU, PRESSURE } from '../../tests/wording';
import { scrambled } from '../domain/engine';
import { FORMS, IDEA_KINDS, RELATIONS, STATUSES, TOPICS, type Round, type Step } from '../domain/types';
import { ROUNDS } from './index';

// The whole collection, checked automatically: structure, connections,
// sources, wording and length. A person still reads every round (CONTENT.md),
// but nothing here relies on that read to be sound.

/** Every string a player can read in a round. */
function strings(r: Round): string[] {
  const step = (s: Step): string[] => {
    const base = [s.setup ?? '', s.prompt, s.reveal, ...(s.views ?? []).flatMap((v) => [v.who, v.view])];
    if (s.kind === 'choose') return [...base, ...s.options.flatMap((o) => [o.text, o.reply ?? ''])];
    if (s.kind === 'estimate') return [...base, s.unit];
    if (s.kind === 'order') return [...base, s.first, s.last, ...s.items.flatMap((i) => [i.text, i.detail])];
    return [...base, ...s.labels, ...s.items.flatMap((i) => [i.text, i.note])];
  };
  return [r.title, r.hook, ...r.steps.flatMap(step), r.takeaway.text, r.takeaway.by ?? '', ...r.links.map((l) => l.note), ...r.claims.map((c) => c.text), r.note ?? ''].filter(Boolean);
}

/** What a player reads while playing (claims and notes are optional reading). */
const playWords = (r: Round) => {
  const step = (s: Step) => {
    const base = [s.setup, s.prompt, s.reveal, ...(s.views ?? []).map((v) => v.view)];
    if (s.kind === 'choose') return [...base, ...s.options.map((o) => `${o.text} ${o.reply ?? ''}`)];
    if (s.kind === 'quickfire') return [...base, ...s.items.map((i) => `${i.text} ${i.note}`)];
    if (s.kind === 'order') return [...base, ...s.items.map((i) => `${i.text} ${i.detail}`)];
    return base;
  };
  return r.steps.flatMap(step).join(' ').split(/\s+/).filter(Boolean).length;
};

const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

describe('the collection', () => {
  it('has at least ten rounds, ids unique and lower-case', () => {
    expect(ROUNDS.length).toBeGreaterThanOrEqual(10);
    const ids = ROUNDS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it('is varied: several topics and forms, and every kind of step', () => {
    expect(new Set(ROUNDS.map((r) => r.topic)).size).toBeGreaterThanOrEqual(7);
    expect(new Set(ROUNDS.map((r) => r.form)).size).toBeGreaterThanOrEqual(5);
    const kinds = new Set(ROUNDS.flatMap((r) => r.steps.map((s) => s.kind)));
    expect([...kinds].sort()).toEqual(['choose', 'estimate', 'order', 'quickfire']);
    // Some questions have right answers; some don't.
    const chooses = ROUNDS.flatMap((r) => r.steps).filter((s) => s.kind === 'choose');
    expect(chooses.some((s) => s.answer) && chooses.some((s) => !s.answer)).toBe(true);
    // No two neighbours in the first-run order share a topic and a form.
    for (let i = 1; i < ROUNDS.length; i++) expect(ROUNDS[i].topic === ROUNDS[i - 1].topic && ROUNDS[i].form === ROUNDS[i - 1].form, ROUNDS[i].id).toBe(false);
  });

  it('meets a connection early: the third round links to the first', () => {
    const [a, , c] = ROUNDS;
    expect(c.links.some((l) => l.to === a.id) || a.links.some((l) => l.to === c.id)).toBe(true);
  });
});

describe.each(ROUNDS.map((r) => [r.id, r] as const))('round %s', (_, r) => {
  it('is well formed', () => {
    expect(r.v).toBeGreaterThanOrEqual(1);
    expect(TOPICS).toContain(r.topic);
    expect(FORMS).toContain(r.form);
    expect(r.title.length).toBeLessThanOrEqual(40);
    expect(r.hook.length).toBeLessThanOrEqual(90);
    expect(r.steps.length).toBeGreaterThanOrEqual(1);
    expect(r.steps.length).toBeLessThanOrEqual(3);
    expect(new Set(r.steps.map((s) => s.id)).size).toBe(r.steps.length);
    expect(isDay(r.checked)).toBe(true);
  });

  it.each(r.steps.map((s) => [s.id, s] as const))('step %s is playable and its answer is possible', (_, s) => {
    expect(s.prompt.trim()).not.toBe('');
    expect(s.reveal.trim()).not.toBe('');
    if (s.kind === 'choose') {
      expect(s.options.length).toBeGreaterThanOrEqual(2);
      expect(s.options.length).toBeLessThanOrEqual(4);
      expect(new Set(s.options.map((o) => o.id)).size).toBe(s.options.length);
      if (s.answer) expect(s.options.map((o) => o.id)).toContain(s.answer);
      // A reply to the right answer would repeat the reveal.
      if (s.answer) expect(s.options.find((o) => o.id === s.answer)!.reply).toBeUndefined();
    }
    if (s.kind === 'estimate') {
      expect(s.min).toBeLessThan(s.max);
      // The slider starts at its minimum, which must never be the answer.
      expect(s.answer).toBeGreaterThan(s.min);
      expect(s.answer).toBeLessThanOrEqual(s.max);
      expect((s.answer - s.min) % s.step).toBe(0);
      expect((s.max - s.min) % s.step).toBe(0);
      expect((s.max - s.min) / s.step).toBeLessThanOrEqual(200);
    }
    if (s.kind === 'order') {
      expect(s.items.length).toBeGreaterThanOrEqual(3);
      expect(s.items.length).toBeLessThanOrEqual(6);
      expect(new Set(s.items.map((i) => i.id)).size).toBe(s.items.length);
      expect(scrambled(s.items).map((i) => i.id)).not.toEqual(s.items.map((i) => i.id));
    }
    if (s.kind === 'quickfire') {
      expect(s.items.length).toBeGreaterThanOrEqual(3);
      expect(s.items.length).toBeLessThanOrEqual(6);
      expect(new Set(s.items.map((i) => i.id)).size).toBe(s.items.length);
      // Not every call goes the same way.
      const answers = s.items.map((i) => i.answer).filter((a) => a !== undefined);
      if (answers.length) expect(new Set(answers).size).toBe(2);
    }
  });

  it('has a takeaway, attributed only where it is a saying with a source', () => {
    const t = r.takeaway;
    expect(Object.keys(IDEA_KINDS)).toContain(t.kind);
    expect(t.text.length).toBeGreaterThan(10);
    expect(t.text.length).toBeLessThanOrEqual(160);
    if (t.kind === 'saying') {
      expect(t.by?.trim()).toBeTruthy();
      expect(t.source?.url).toMatch(/^https:\/\//);
    } else {
      expect(t.by).toBeUndefined();
    }
  });

  it('connects to other rounds, each link real, explained and made once', () => {
    const ids = ROUNDS.map((x) => x.id);
    for (const l of r.links) {
      expect(ids).toContain(l.to);
      expect(l.to).not.toBe(r.id);
      expect(RELATIONS).toContain(l.how);
      expect(l.note.length).toBeGreaterThan(30);
      expect(ROUNDS.find((x) => x.id === l.to)!.links.some((b) => b.to === r.id), `${r.id}↔${l.to} is written twice`).toBe(false);
    }
    expect(new Set(r.links.map((l) => l.to)).size).toBe(r.links.length);
    const connected = r.links.length > 0 || ROUNDS.some((x) => x.links.some((l) => l.to === r.id));
    expect(connected).toBe(true);
  });

  it('grounds its claims in sources, each marked how sure it is', () => {
    expect(r.claims.length).toBeGreaterThanOrEqual(1);
    for (const c of r.claims) {
      expect(Object.keys(STATUSES)).toContain(c.status);
      expect(c.sources.length).toBeGreaterThanOrEqual(1);
      for (const src of c.sources) {
        expect(src.name.trim()).not.toBe('');
        expect(src.url).toMatch(/^https:\/\/[^\s]+$/);
      }
    }
  });

  it('keeps the wording rules, typographic quotes and simple markup', () => {
    for (const s of strings(r)) {
      expect(s, s).not.toMatch(DESCRIBES_YOU);
      expect(s, s).not.toMatch(PRESSURE);
      expect(s, s).not.toMatch(/['"]/);
      // Paragraphs are split by one blank line; nothing else is whitespace but single spaces.
      expect(s, s).not.toMatch(/ {2,}|^\s|\s$|[^\n]\n[^\n]|\n{3,}|\t/);
      expect((s.match(/\*/g) ?? []).length % 2, s).toBe(0);
      expect(s, s).not.toMatch(/TODO|TK|lorem/i);
    }
  });

  it('fits in a few minutes of reading', () => {
    expect(playWords(r)).toBeLessThanOrEqual(520);
  });
});
