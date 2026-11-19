import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { ROUNDS } from '../content';
import { archiveText, hasText } from '../domain/archive';
import { STATUSES, earlierName, type TellState } from '../domain/types';
import { store } from '../store/store';
import { download, localDay } from '../ui';

// What Tell is, how its rounds are checked, and the player's control over
// their data: backup, restore, the Book as text, earlier records, erasure.

const Section = ({ title, id, children }: { title: string; id: string; children: ReactNode }) => (
  <section className="stack" aria-labelledby={id}>
    <h2 className="section-title" id={id}>
      {title}
    </h2>
    {children}
  </section>
);

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function About({ state }: { state: TellState }) {
  return (
    <div className="stack-xl">
      <header className="stack">
        <h1 className="title" tabIndex={-1}>
          About Tell
        </h1>
        <p className="lede">A game of ideas that stay with you. Short rounds of puzzles, true stories and thought experiments; the ideas worth keeping go into your Book, where they start to connect.</p>
      </header>

      <Section title="How it works" id="how">
        <ul className="rules">
          <li>Each round takes a few minutes: a question, a guess or a choice, then what actually happened or what people have argued.</li>
          <li>Some questions have right answers. Others have several good ones, and the round shows how people have answered them.</li>
          <li>At the end there’s an idea to keep, in its words or yours. Rounds that bear on each other say how: one idea supports, challenges, qualifies or reinterprets another.</li>
          <li>There are no scores, streaks or reminders, and Tell never draws conclusions about you from your answers.</li>
        </ul>
      </Section>

      <Section title="How the rounds are checked" id="checked">
        <ul className="rules">
          <li>
            The collection has {plural(ROUNDS.length, 'round')}. Every fact in them was checked against the sources each round lists, and every claim says how sure it is: {Object.values(STATUSES).join(', ').toLowerCase()}.
          </li>
          <li>Rounds are written and checked when Tell is made, never generated while you play. New rounds come with updates.</li>
        </ul>
      </Section>

      <Section title="Your data" id="data">
        <p className="small dim">
          No accounts, no analytics and no AI, and the security policy blocks connections to anywhere else. Everything stays in this browser: {plural(state.plays.length, 'round played', 'rounds played')} and{' '}
          {plural(state.book.length, 'idea')} in your Book.
        </p>
        <button className="btn btn-block" onClick={() => download(`tell-backup-${localDay(new Date())}.json`, store.exportText())}>
          Export a backup
        </button>
        <RestoreButton current={state.plays.length + state.book.length} />
        {state.archive.map((a) => (
          <div key={`${a.schema}-${a.at}`} className="card-quiet stack">
            <p className="small">
              Your record from {earlierName(a.schema)}, kept exactly as it was on {shortDate.format(new Date(a.at))}. This version of Tell is a different game, so it doesn’t use it.
            </p>
            <button className="btn btn-block" onClick={() => download(`tell-schema-${a.schema}-record.json`, JSON.stringify(a.doc, null, 2))}>
              Download it
            </button>
            {hasText(a) && (
              <button className="btn btn-ghost btn-block" onClick={() => download(`tell-schema-${a.schema}-record.txt`, archiveText(a), 'text/plain')}>
                Download it as plain text
              </button>
            )}
          </div>
        ))}
        <button
          className="btn btn-ghost btn-block"
          onClick={() => {
            if (window.confirm('Delete everything Tell has kept on this device, earlier records included? This can’t be undone. Export a backup first if you might want it back.')) {
              store.erase();
            }
          }}
        >
          Delete everything
        </button>
      </Section>
      <p className="tiny faint num">Tell {__APP_VERSION__}</p>
    </div>
  );
}

/** Restore from a backup file: validated in full before anything is replaced. */
export function RestoreButton({ current }: { current?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    const backup = store.inspect(text);
    if (!backup.ok) return setMessage(backup.error);
    const s = backup.state;
    const replacing = current ? ' This replaces what is on this device.' : '';
    const what =
      s.archive.length && !s.plays.length && !s.book.length
        ? `a record from ${earlierName(s.archive.at(-1)!.schema)}, to be kept as it was`
        : `${plural(s.plays.length, 'round played', 'rounds played')} and ${plural(s.book.length, 'idea')}`;
    if (!window.confirm(`Restore this backup of ${what}?${replacing}`)) return;
    const result = store.importText(text);
    setMessage(result.ok ? 'Restored.' : result.error);
  }

  return (
    <>
      <button className="btn btn-block" onClick={() => input.current?.click()}>
        Restore from a backup
      </button>
      <input ref={input} type="file" accept="application/json,.json" hidden aria-label="Backup file" onChange={onFile} />
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
    </>
  );
}
