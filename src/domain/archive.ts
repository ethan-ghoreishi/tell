import { earlierName, type Archived } from './types';

// A record from Tell 4 (schema 6) as plain text: the stories played and the
// real choices the player kept, with their own label and note. Read only to
// print; nothing in an archived record is ever used by this Tell. Written
// defensively: an archive is kept exactly as it was, whatever it holds.

type Obj = Record<string, unknown>;
const obj = (x: unknown): Obj => (typeof x === 'object' && x !== null && !Array.isArray(x) ? (x as Obj) : {});
const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
const str = (x: unknown) => (typeof x === 'string' ? x : '');

export const hasText = (a: Archived) => a.schema === 6;

export function archiveText(a: Archived): string {
  const doc = a.doc;
  const lines = [`Your record from ${earlierName(a.schema)}, kept ${a.at.slice(0, 10)}`, ''];
  const choices = arr(doc.choices).map(obj);
  lines.push(choices.length ? 'Choices you kept' : 'No kept choices.');
  for (const c of choices) {
    lines.push('', `${str(c.label) || 'A choice'} (${str(c.day)})`);
    const shape = obj(c.shape);
    lines.push(`  Answers: ${Object.entries(shape).map(([k, v]) => `${k} ${Array.isArray(v) ? v.join(' + ') : String(v)}`).join('; ')}`);
    const trying = arr(c.trying).map(str);
    for (const line of arr(c.shown).map(obj)) {
      for (const m of arr(line.moves).map(obj)) {
        lines.push(`  - ${str(m.name)}${trying.includes(str(m.id)) ? ' (trying this)' : ''}: ${str(m.asks) || str(m.is)} ${str(m.because)}`.trimEnd());
      }
    }
    if (str(c.note)) lines.push(`  Note: ${str(c.note)}`);
  }
  const plays = arr(doc.plays).map(obj);
  lines.push('', plays.length ? 'Stories you played' : 'No stories played.');
  for (const p of plays) lines.push(`  ${str(obj(p.shown).title) || str(p.situation)} (${str(p.day)})`);
  return lines.join('\n') + '\n';
}
