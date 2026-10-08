import { useRef, useState, type ChangeEvent } from 'react';
import { ANGLES_CHECKED, MIN_OFFERS, PAIR_GAP_DAYS, ROUNDS_PER_DAY, localDay } from '../domain/engine';
import { LENSES, type TellState } from '../domain/types';
import { store } from '../store/store';
import { download, plural } from '../ui';

// How Tell works, stated as the rules the code follows (engine.ts), and the
// player's control over their data.

export default function About({ state }: { state: TellState }) {
  return (
    <div className="stack-xl">
      <header className="stack">
        <h1 className="title">How Tell works</h1>
        <p className="lede">A few minutes of play. A clearer view of how you see. Every rule below is the rule the app follows.</p>
      </header>

      <section className="stack" aria-labelledby="rules">
        <h2 className="section-title" id="rules">
          The rules
        </h2>
        <ul className="rules">
          <li>
            Each day Tell deals {ROUNDS_PER_DAY} rounds. When they’re done, the set ends until tomorrow. Rounds left unanswered go back
            into the pool.
          </li>
          <li>
            Which rounds come first: a choice returning with one detail changed (at least {PAIR_GAP_DAYS} days after it first appeared),
            then the matching scene of one you’ve already answered from the other side, then new rounds, alternating The world and Work
            &amp; projects.
          </li>
          <li>
            For each round Tell records what was shown, in order and with each option’s angle, what you picked, and when. Nothing else,
            and only on this device.
          </li>
          <li>
            Each angle is counted as picked, of the times it was offered. An answer like “Something else” counts as offered but not
            picked.
          </li>
          <li>
            An angle is called out only once it has been offered at least {MIN_OFFERS} times, and only when you picked it so often that
            random picking among four options would do that less than 1 time in 20, even after allowing for the {ANGLES_CHECKED} angles
            checked in each area. With several angles checked, one can still be luck, so each shows its rounds and asks for your view.
            Once something has been called out it stays on your map; if later rounds bring it back under the bar, it is marked and shows
            both counts. Because the check runs after every round, the 1 in 20 applies to each check rather than the whole run, so a
            lucky call-out becomes a little likelier over time. That is why one that falls back is marked rather than hidden.
          </li>
          <li>
            Your view (Fits, Partly, Doesn’t fit, Not sure) is saved as a note with the counts at the time. It never changes the counts
            or what is shown.
          </li>
          <li>
            Some world scenes have a twin about your own work offering the same four angles. They are compared only when you’ve answered
            both, and shown side by side.
          </li>
          <li>
            Some choices come back on a later day with one detail changed. Tell shows both answers and what differed. A changed answer
            is not a diagnosis: mood, circumstances and wording can all play a part.
          </li>
          <li>Angles are Tell’s labels for kinds of explanation, not traits. An angle you rarely pick is not a blind spot.</li>
          <li>Every scene is invented. None reports a real event.</li>
        </ul>
      </section>

      <section className="stack" aria-labelledby="angles">
        <h2 className="section-title" id="angles">
          The {ANGLES_CHECKED} angles
        </h2>
        <dl className="glossary">
          {LENSES.map((l) => (
            <div key={l.id}>
              <dt>
                <strong>{l.name}</strong>
              </dt>
              <dd className="dim small" style={{ margin: 0 }}>
                {l.about}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="stack" aria-labelledby="data">
        <h2 className="section-title" id="data">
          Your data
        </h2>
        <p className="small dim">
          Tell has no accounts, no analytics and no AI, and its security policy blocks connections to anywhere else. Your record lives
          in this browser: {plural(state.answers.length, 'round')}, {plural(state.kept.length, 'kept line')}.
        </p>
        <button className="btn btn-block" onClick={() => download(`tell-backup-${localDay(new Date())}.json`, store.exportText())}>
          Export a backup
        </button>
        <RestoreButton current={state.answers.length} />
        <button
          className="btn btn-ghost btn-block"
          onClick={() => {
            if (window.confirm('Delete everything Tell has recorded on this device? This can’t be undone. Export a backup first if you might want it back.')) {
              store.erase();
            }
          }}
        >
          Delete everything
        </button>
        <p className="tiny faint num">Tell {__APP_VERSION__}</p>
      </section>
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
    const replacing = current ? ` This replaces the ${plural(current, 'round')} on this device.` : '';
    if (!window.confirm(`Restore this backup of ${plural(backup.state.answers.length, 'round')}?${replacing}`)) return;
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
