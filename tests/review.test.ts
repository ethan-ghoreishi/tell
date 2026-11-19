import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ROUNDS } from '../src/content';
import { scrambled } from '../src/domain/engine';
import { STATUSES, type Round } from '../src/domain/types';

// The editorial review: every round written out in full, answers and sources
// included, for whoever checks the facts and reads for quality (CONTENT.md).
// It spoils every round, so it is written only when asked:
//   REVIEW_FILE=/tmp/review.txt npx vitest run tests/review.test.ts
// Without REVIEW_FILE it prints only titles, for a spoiler-free look.

export function reviewText(rounds: Round[]): string {
  const out: string[] = [];
  for (const [n, r] of rounds.entries()) {
    out.push(`${'='.repeat(72)}`, `${n + 1}. ${r.title}  [${r.id} v${r.v}] ${r.topic} · ${r.form}  (checked ${r.checked})`, `Hook: ${r.hook}`, '');
    for (const s of r.steps) {
      out.push(`-- step ${s.id} (${s.kind})`);
      if (s.setup) out.push(s.setup);
      out.push(`Q: ${s.prompt}`);
      if (s.kind === 'choose') for (const o of s.options) out.push(`  ${o.id === s.answer ? '*' : '-'} ${o.text}${o.reply ? `  → ${o.reply}` : ''}`);
      if (s.kind === 'estimate') out.push(`  slider ${s.min}–${s.max} by ${s.step} ${s.unit}; answer ${s.answer}`);
      if (s.kind === 'order') {
        out.push(`  shown as: ${scrambled(s.items).map((i) => i.text).join(' | ')}`);
        for (const i of s.items) out.push(`  ${i.text} — ${i.detail}`);
      }
      if (s.kind === 'quickfire') for (const i of s.items) out.push(`  [${i.answer === undefined ? '?' : s.labels[i.answer]}] ${i.text}  → ${i.note}`);
      out.push(`Reveal: ${s.reveal}`);
      for (const v of s.views ?? []) out.push(`  View — ${v.who}: ${v.view}`);
      out.push('');
    }
    out.push(`Takeaway (${r.takeaway.kind}): ${r.takeaway.text}${r.takeaway.by ? ` — ${r.takeaway.by} <${r.takeaway.source?.url}>` : ''}`);
    for (const l of r.links) out.push(`Link: ${l.how} ${l.to} — ${l.note}`);
    if (r.note) out.push(`Note: ${r.note}`);
    out.push('Claims:');
    for (const c of r.claims) out.push(`  [${STATUSES[c.status]}] ${c.text}`, ...c.sources.map((s) => `      ${s.name} <${s.url}>`));
    out.push('');
  }
  return out.join('\n');
}

describe('editorial review', () => {
  it('writes every round in full when REVIEW_FILE is set', () => {
    const text = reviewText(ROUNDS);
    expect(text).toContain(ROUNDS[0].title);
    if (process.env.REVIEW_FILE) writeFileSync(process.env.REVIEW_FILE, text);
    else console.log(ROUNDS.map((r, i) => `${i + 1}. ${r.title} (${r.topic} · ${r.form})`).join('\n'));
  });
});
