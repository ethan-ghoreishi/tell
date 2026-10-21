import { useRef, useState, type ChangeEvent } from 'react';
import { localDay, recordText } from '../domain/engine';
import { LANGUAGE_MOVES, SCOPE, STRATEGIES } from '../domain/language';
import { SITUATIONS, STORIES } from '../domain/situations';
import { list } from '../domain/text';
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
          Short stories to play, each a small choice somewhere unfamiliar. Every option in them is a move in a small language for choices under uncertainty, and the
          same moves come back when you bring a real choice.
        </p>
      </header>

      <Section title="Play" id="play">
        <ul className="rules">
          <li>
            The collection has {plural(STORIES.length, 'invented story', 'invented stories')}, two or three minutes each, and {plural(SITUATIONS.length - STORIES.length, 'variant')}: a story
            with one fact changed, played from its ending. Play them in any order, as often as you like; nothing unlocks, expires or arrives by itself.
          </li>
          <li>There are no right answers and nothing is scored. Every option shows the moves it makes, and every ending shows other reasonable ways through.</li>
          <li>
            Some stories rest on real facts, like how film is developed or how long seed keeps. Each says what’s real, with sources, and what’s invented. A few
            taps don’t make anyone an expert.
          </li>
        </ul>
      </Section>

      <Section title="The language" id="language">
        <p className="small">
          Four questions read the shape of a step: can it be undone, when will you know whether it was right, what waiting does, and how bad it could get. Each
          story shows the shape of the step it turns on. For what makes a step hard there are {LANGUAGE_MOVES.length} moves, grouped by the difficulty each meets:{' '}
          {list(STRATEGIES.map((s) => s.name.toLowerCase()))}. Which of them fit depends on the shape.
        </p>
        <p className="small dim">
          Finding out first is worth something only if it could change the step and arrives before it must be taken. A way back, or waiting, is worth its price
          only when the step is hard to undo, or something useful arrives while you wait. These ideas come from decision analysis: the value of information
          (Ronald Howard, 1966), the irreversibility effect (Kenneth Arrow and Anthony Fisher, 1974) and real options (Avinash Dixit and Robert Pindyck, 1994).
          Tell uses them to write stories and match moves, never to measure anyone.
        </p>
        <p className="small dim">Every move is a starting proposal. Tell will call one established only once real choices show it in use.</p>
      </Section>

      <Section title="Bring a choice" id="bring">
        <ul className="rules">
          <li>Only your four answers decide which moves show. The same answers always show the same moves, whatever you’ve played.</li>
          <li>Moves are never ranked or urged, and settling it is always there. Your plays only lend examples.</li>
          <li>Tell never reads what you type, and keeps a choice only if you keep it.</li>
          <li>{SCOPE}</li>
        </ul>
      </Section>

      <Section title="Your map" id="map">
        <ul className="rules">
          <li>It shows every move, the same for everyone, and under each the stories where you made it. Where you’ve played a story both ways, the two plays sit side by side.</li>
          <li>It shows what you chose, never why. It never counts your moves, sums them up or says what they mean about you.</li>
        </ul>
      </Section>

      <Section title="What Tell can’t show" id="limits">
        <ul className="rules">
          <li>What you’d choose in an invented story can differ from what you’d do for real.</li>
          <li>Untested so far: whether the stories stay interesting, whether different people read the same choice the same way, and whether the moves help with real choices.</li>
        </ul>
      </Section>

      <Section title="Your data" id="data">
        <p className="small dim">
          No accounts, no analytics and no AI, and the security policy blocks connections to anywhere else. Everything stays in this browser:{' '}
          {plural(state.plays.length, 'play')} and {plural(state.choices.length, 'kept choice')}.
        </p>
        <button className="btn btn-block" onClick={() => download(`tell-backup-${localDay(new Date())}.json`, store.exportText())}>
          Export a backup
        </button>
        <RestoreButton current={state.plays.length + state.choices.length} />
        <button className="btn btn-block" onClick={() => download(`tell-${localDay(new Date())}.txt`, recordText(state), 'text/plain')}>
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
    const what =
      s.archive.length && !s.plays.length && !s.choices.length
        ? `a record from ${earlierName(s.archive[0].schema)}, to be kept as it was`
        : s.choices.length
          ? `${plural(s.plays.length, 'play')} and ${plural(s.choices.length, 'kept choice')}`
          : plural(s.plays.length, 'play');
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
