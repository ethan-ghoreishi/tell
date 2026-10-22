import type { SVGProps } from 'react';

// Small shared pieces: icons, dates, file download.

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
export const BringIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M12 21V3" {...stroke} />
    <path d="M12 5h6l2 2.5L18 10h-6z" {...stroke} />
    <path d="M12 12H6l-2 2.5L6 17h6z" {...stroke} />
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
export const BackIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M14.5 5.5L8 12l6.5 6.5" {...stroke} strokeWidth={2.2} />
  </svg>
);
export const CloseIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M7 7l10 10M17 7L7 17" {...stroke} strokeWidth={2.2} />
  </svg>
);
export const CheckIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M5.5 12.5l4 4l9-9" {...stroke} strokeWidth={2.4} />
  </svg>
);
export { plural, shortDate } from './domain/text';

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
