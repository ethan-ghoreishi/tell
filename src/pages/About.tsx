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
          Short stories to play, each a small choice somewhere unfamiliar. Now and then two of your choices, side by side, turn up a distinction worth keeping.
          Those go on your map, to draw on when a real choice comes.
        </p>
      </header>

      <Section title="Play" id="play">
        <ul className="rules">
          <li>
            The collection has {plural(SITUATIONS.length, 'invented story', 'invented stories')}, two or three minutes each. Each ends when its story does. Play them in any order, as often as you
            like; nothing unlocks, expires or arrives by itself.
          </li>
          <li>There are no right answers and nothing is scored. Every ending shows other reasonable ways through.</li>
          <li>
            Some stories rest on real facts, like how film is developed or how long seed keeps. Each says what’s real, with sources, and what’s invented. A few
            taps don’t make anyone an expert.
          </li>
        </ul>
      </Section>

      <Section title="Your map" id="map">
        <ul className="rules">
          <li>
            A connection is written by hand for particular ways through two stories: felling the oak and fencing it off meet the bakery differently. Tell
            never matches words.
          </li>
          <li>
            It appears when your plays first fit it, and stays as it was found. A later play can fit it again, or turn up a new one, marked New until you’ve seen
            it.
          </li>
          <li>
            It describes the moves, not you. It shows what you chose, never why, and two stories always differ in more than one way. Tell never describes
            you or treats an answer as a trait.
          </li>
          <li>Not every pair of choices has a connection. Where nothing true and useful can be said, nothing is.</li>
        </ul>
      </Section>

      <Section title="Underneath" id="model">
        <p className="small">
          Every answer in every story is described as a move, in four parts: whether it can be taken back, what it does about what isn’t known, what it leaves
          possible, and what it costs and risks.
        </p>
        <p className="small dim">
          Finding out is worth something only if it could change what you do and arrives before the point of no return. Keeping options open is worth something
          only if a move can be undone or put off. What’s at stake decides how much either matters. These ideas come from decision analysis: the value of
          information (Ronald Howard, 1966), the irreversibility effect (Kenneth Arrow and Anthony Fisher, 1974) and real options (Avinash Dixit and Robert
          Pindyck, 1994). Tell uses them to write stories, never to measure anyone.
        </p>
      </Section>

      <Section title="What Tell can’t show" id="limits">
        <ul className="rules">
          <li>What you’d choose in an invented situation can differ from what you’d do for real.</li>
          <li>Untested so far: whether the stories stay interesting, and whether the connections help with real choices.</li>
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
