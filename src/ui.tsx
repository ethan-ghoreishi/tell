import { Fragment, type ReactNode, type SVGProps } from 'react';

// Small shared pieces: icons, the content's plain text, file download.

type IconProps = SVGProps<SVGSVGElement>;
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const PlayIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4" {...stroke} />
    <path d="M10 9l5 3l-5 3z" {...stroke} />
  </svg>
);
export const BookIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M12 6.5C10.2 5.2 7.6 4.6 4.5 4.8v12.6c3.1-.2 5.7.4 7.5 1.7c1.8-1.3 4.4-1.9 7.5-1.7V4.8c-3.1-.2-5.7.4-7.5 1.7z" {...stroke} />
    <path d="M12 6.5v11.6" {...stroke} />
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
export const CheckIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M5.5 12.5l4 4l9-9" {...stroke} strokeWidth={2.4} />
  </svg>
);
export const CrossIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" {...stroke} strokeWidth={2.4} />
  </svg>
);
export const LinkIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" {...stroke} />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" {...stroke} />
  </svg>
);

/** Content text: paragraphs split by a blank line, *emphasis* for titles of works. */
export function Rich({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text.split('\n\n').map((para, i) => (
        <p key={i} className={className}>
          <Inline text={para} />
        </p>
      ))}
    </>
  );
}

export const Inline = ({ text }: { text: string }): ReactNode =>
  text.split('*').map((part, i) => (i % 2 ? <em key={i}>{part}</em> : <Fragment key={i}>{part}</Fragment>));

/** For an aria-label or a title attribute: the text without its markup. */
export const plain = (text: string) => text.replace(/\*/g, '');

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

/** The player's own calendar day, YYYY-MM-DD, for file names. */
export function localDay(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
