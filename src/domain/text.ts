import type { Unit } from './types';

// Values and placeholders. A Slide's changing value is written {x} in content.

const UNIT_WORDS: Record<Exclude<Unit, 'number' | 'percent'>, string> = {
  hours: 'hour',
  days: 'day',
  weeks: 'week',
};

export function value(unit: Unit, n: number): string {
  if (unit === 'number') return String(n);
  if (unit === 'percent') return `${n}%`;
  return `${n} ${UNIT_WORDS[unit]}${n === 1 ? '' : 's'}`;
}

export const fill = (text: string, x: string) => text.replace(/\{x\}/g, x);

export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** "a", "a and b", "a, b and c". */
export const list = (xs: string[]) => (xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

/** "1 play", "3 plays". */
export const plural = (n: number, word: string, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

export const times = (n: number) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);

const SHORT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const LONG = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** A YYYY-MM-DD day is the player's own calendar day; anything else is an ISO time. */
function toDate(s: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(s);
}

/** "8 Oct". */
export const shortDate = (s: string) => SHORT.format(toDate(s));
/** "8 October 2026". */
export const longDate = (s: string) => LONG.format(toDate(s));
