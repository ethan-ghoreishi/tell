import { useRef, useState, type ChangeEvent } from 'react';
import { localDay, recordText } from '../domain/engine';
import { CONNECTIONS, SITUATIONS } from '../domain/situations';
import { earlierName, type TellState } from '../domain/types';
import { Section } from '../steps';
import { store } from '../store/store';
import { download, plural, shortDate } from '../ui';

// How Tell works, stated as the rules the code follows, what it can't show,
// and the player's control over their data.

export default function About({ state }: { state: TellState }) {
  return (
    <div className="stack-xl">
      <header className="stack">
        <h1 className="title">How Tell works</h1>
        <p className="lede">
          Tell is a collection of small situations to play. Each works on its own. Some share a shape with another set somewhere quite different, and putting
          what you chose in the two side by side may show something neither shows alone. That last part is an idea Tell is testing, not a promise.
        </p>
      </header>

      <Section title="Situations" id="situations">
        <ul className="rules">
          <li>
            The collection has {plural(SITUATIONS.length, 'invented situation')}, each two or three minutes long, each ending when its story does. Play them in any order, as often as
            you like. Nothing unlocks, expires or arrives by itself.
          </li>
          <li>There are no right answers and nothing is scored. Every situation has several reasonable ways through, and its ending shows some of them.</li>
          <li>
            Every situation is written around three questions. Can what you do be undone, and at what price? What can you find out, and when? What does waiting
            do to what’s still possible?
          </li>
        </ul>
      </Section>

      <Section title="Connections" id="connections">
        <ul className="rules">
          <li>
            There are {plural(CONNECTIONS.length, 'connection')}, each written by hand between two situations that share a tension and differ on one of those three
            questions.
            Tell never matches words.
          </li>
          <li>A connection appears once you’ve played both of its situations, and not before: knowing which two go together could shape how you play the second.</li>
          <li>
            It shows what connects them, what you chose in each, a note written for that combination of choices, and a question to take elsewhere. It uses your
            first play of each, since later plays come after you’ve seen how they compare.
          </li>
          <li>
            Your answers show what you chose, never why. Two situations always differ in more than one way, so different answers can’t show which difference
            mattered. Tell never describes you, and never treats an answer as a trait.
          </li>
        </ul>
      </Section>

      <Section title="What Tell can’t show" id="limits">
        <ul className="rules">
          <li>What you’d choose in an invented situation can differ from what you’d do for real. One play is one moment.</li>
          <li>A connection is an idea to try against your own choices, not a finding about you.</li>
          <li>Untested so far: whether the situations stay interesting from one to the next, and whether the connections are useful. That is what the pilot is for.</li>
        </ul>
      </Section>

      <Section title="Your data" id="data">
        <p className="small dim">
          No accounts, no analytics and no AI, and the security policy blocks connections to anywhere else. What you play stays in this browser:{' '}
          {plural(state.plays.length, 'play')}.
        </p>
        <button className="btn btn-block" onClick={() => download(`tell-backup-${localDay(new Date())}.json`, store.exportText())}>
          Export a backup
        </button>
        <RestoreButton current={state.plays.length} />
        <button className="btn btn-block" onClick={() => download(`tell-${localDay(new Date())}.txt`, recordText(state, CONNECTIONS), 'text/plain')}>
          Download as plain text
        </button>
        {state.archive.map((a) => (
          <div key={`${a.schema}-${a.at}`} className="card-quiet stack">
            <p className="small">
              Your record from {earlierName(a.schema)}, kept exactly as it was on {shortDate(a.at)}. This version asks different questions, so it doesn’t read it.
            </p>
            <button className="btn btn-block" onClick={() => download(`tell-schema-${a.schema}-record.json`, JSON.stringify(a.doc, null, 2))}>
              Download it
            </button>
          </div>
        ))}
        <button
          className="btn btn-ghost btn-block"
          onClick={() => {
            if (window.confirm('Delete everything Tell has kept on this device? This can’t be undone. Export a backup first if you might want it back.')) {
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
    const what = s.archive.length && !s.plays.length ? `a record from ${earlierName(s.archive[0].schema)}, to be kept as it was` : plural(s.plays.length, 'play');
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
