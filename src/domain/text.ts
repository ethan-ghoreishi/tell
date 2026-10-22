// Small wording helpers, shared by the domain and the pages.

/** "a", "a and b", "a, b and c" (or "a, b or c"). */
export const list = (xs: string[], word = 'and') => (xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} ${word} ${xs.at(-1)}`);

/** "Weeks closer to the storms": a phrase written to follow a label, shown on its own. */
export const capital = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

/** "1 play", "3 plays". */
export const plural = (n: number, word: string, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

const SHORT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

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
