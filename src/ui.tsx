import { useEffect, useState, type SVGProps } from 'react';

// Small shared pieces: icons, the clock, dates, file download.

type IconProps = SVGProps<SVGSVGElement>;
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const MarkIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M12 7.4a5.25 5.25 0 0 1 0 9.2a5.25 5.25 0 0 1 0-9.2z" fill="currentColor" opacity=".22" />
    <circle cx="9.4" cy="12" r="5.25" {...stroke} strokeWidth={2} />
    <circle cx="14.6" cy="12" r="5.25" {...stroke} strokeWidth={2} />
  </svg>
);
export const PlayIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4" {...stroke} />
    <path d="M10 9l5 3l-5 3z" {...stroke} />
  </svg>
);
export const MapIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M9 5L4 7v12l5-2l6 2l5-2V5l-5 2z" {...stroke} />
    <path d="M9 5v12M15 7v12" {...stroke} />
  </svg>
);
export const InfoIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <circle cx="12" cy="12" r="8.5" {...stroke} />
    <path d="M12 11v5M12 8h.01" {...stroke} strokeWidth={2.2} />
  </svg>
);
export const KeepIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M7 4h10v16l-5-3.5L7 20z" {...stroke} fill={filled ? 'currentColor' : 'none'} />
  </svg>
);
export const AddedIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <circle cx="12" cy="12" r="8.5" {...stroke} />
    <path d="M12 8v8M8 12h8" {...stroke} />
  </svg>
);

/** The current time, refreshed each minute and whenever the app comes back into view. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return now;
}

const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const shortFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

/** "Thursday 8 October" for a Date or a YYYY-MM-DD day. */
export const longDate = (d: Date | string) => dayFormat.format(typeof d === 'string' ? fromDay(d) : d);
/** "8 Oct" for a Date, ISO time or YYYY-MM-DD day. */
export const shortDate = (d: Date | string) => shortFormat.format(typeof d === 'string' ? fromDay(d) : d);

function fromDay(s: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(s);
}

/** "1 round", "3 rounds". */
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function download(filename: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
