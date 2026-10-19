import type { Currency, Unit } from './types';

// Values and placeholders. Content never writes a currency symbol: amounts are
// {x}, {y} or {m:N} and take the player's currency here.

const money = new Map<Currency, Intl.NumberFormat>();
const moneyFormat = (c: Currency) => {
  if (!money.has(c)) money.set(c, new Intl.NumberFormat('en-GB', { style: 'currency', currency: c, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }));
  return money.get(c)!;
};

const UNIT_WORDS: Record<Exclude<Unit, 'money' | 'percent'>, string> = {
  minutes: 'minute',
  hours: 'hour',
  days: 'day',
  weeks: 'week',
};

export function value(unit: Unit, n: number, currency: Currency): string {
  if (unit === 'money') return moneyFormat(currency).format(n);
  if (unit === 'percent') return `${n}%`;
  return `${n} ${UNIT_WORDS[unit]}${n === 1 ? '' : 's'}`;
}

/** Replace {x}, {y} and {m:N} in authored text. */
export function fill(text: string, currency: Currency, vars: { x?: string; y?: string } = {}): string {
  return text
    .replace(/\{m:(\d+)\}/g, (_, n: string) => value('money', Number(n), currency))
    .replace(/\{x\}/g, vars.x ?? '{x}')
    .replace(/\{y\}/g, vars.y ?? '{y}');
}

/**
 * One of a Slide's steps.length + 1 intervals, in words. `at` is the first
 * step where the rising option won; 0 means even the smallest step did it and
 * steps.length means none did.
 */
export function interval(steps: number[], unit: Unit, at: number, currency: Currency): string {
  const v = (i: number) => value(unit, steps[i], currency);
  if (at <= 0) return `${v(0)} or less`;
  if (at >= steps.length) return `more than ${v(steps.length - 1)}`;
  return `between ${v(at - 1)} and ${v(at)}`;
}

/** The same interval, compact, for tables: "£4–£8", "8–13 days", "≤ £1", "> £60". */
export function shortInterval(steps: number[], unit: Unit, at: number, currency: Currency): string {
  const v = (i: number) => value(unit, steps[i], currency);
  if (at <= 0) return `≤ ${v(0)}`;
  if (at >= steps.length) return `> ${v(steps.length - 1)}`;
  if (unit === 'money' || unit === 'percent') return `${v(at - 1)}–${v(at)}`;
  return `${steps[at - 1]}–${v(at)}`;
}

export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "1 Slide", "3 Slides". */
export const plural = (n: number, word: string, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
