import { useRef, useState, type ChangeEvent } from 'react';
import { CARDS } from '../domain/content';
import { CHANGE_GAP, COINS, PEEKS, POOL_MIN, REPEAT_MIN, RETEST_DAYS, ROTATION, SET_SIZE, localDay, ratingsByCard, setCurrency } from '../domain/engine';
import { FACTORS, MECHANICS, TAGS, type Currency, type TellState } from '../domain/types';
import { Section } from '../mechanics';
import { store } from '../store/store';
import { download, plural } from '../ui';

// How Tell works, stated as the rules the code follows (engine.ts and the
// recipe in content.test.ts), and the player's control over their data.

const CURRENCIES: { id: Currency; label: string }[] = [
  { id: 'GBP', label: '£' },
  { id: 'EUR', label: '€' },
  { id: 'USD', label: '$' },
];

export default function About({ state }: { state: TellState }) {
  const rated = [...ratingsByCard(state).entries()];
  return (
    <div className="stack-xl">
      <header className="stack">
        <h1 className="title">How Tell works</h1>
        <p className="lede">
          Tell never asks you the hard question. It asks small, easy choices and shows what they add up to. Every rule below is the rule the
          app follows.
        </p>
      </header>

      <Section title="A set" id="set">
        <ul className="rules">
          <li>
            One set a day, of {SET_SIZE} experiments, then it ends. Spreading them over days samples you on different days, rather than in
            one mood, and keeps the experiments from running out. Real calls in Decide are never limited.
          </li>
          <li>
            <strong>Probe</strong> tests what your map knows least about. <strong>Stress-test</strong> changes one thing that could
            legitimately matter, or puts a price on what the probe showed you protect. <strong>Connect</strong> tries the same trade-off
            in another setting.
          </li>
          <li>Each experiment shows why it was chosen. A set left unfinished lapses at midnight; what you finished is kept.</li>
        </ul>
      </Section>

      <Section title="How Tell picks the next experiment" id="picks">
        <ul className="rules">
          <li>
            The probe’s mechanic takes turns: {ROTATION.map((m) => MECHANICS[m].name).join(', ')}, then round again. Slide comes every
            other day.
          </li>
          <li>
            For a Slide, in this order: something an open call depends on; a condition that changed one answer, checked in another setting;
            a trade-off never tested; a trade-off whose last result was open-ended; a result at least {RETEST_DAYS} days old, to see
            whether it has moved; then the next one in Tell’s list.
          </li>
          <li>For the others: the next one you haven’t played, then one at least {RETEST_DAYS} days old. Ties always go to Tell’s list order, never to chance.</li>
          <li>Items in a Cut and facts in a Peek move round one place each time you play one, so no position is favoured.</li>
        </ul>
      </Section>

      <Section title="The four experiments" id="mechanics">
        <dl className="glossary">
          {(Object.keys(MECHANICS) as (keyof typeof MECHANICS)[]).map((m) => (
            <div key={m}>
              <dt>
                <strong>{MECHANICS[m].name}</strong>
              </dt>
              <dd className="dim small" style={{ margin: 0 }}>
                {MECHANICS[m].about}
              </dd>
            </div>
          ))}
        </dl>
        <ul className="rules">
          <li>
            A Slide halves the gap with each choice, as in the adjusting-amount method, so seven amounts settle in three choices. You can
            guess first. “Too close to call” marks where you switch. “It depends” asks on what, and Tell tests that next.
          </li>
          <li>A Cut is a best–worst ranking: what you give up first says more than what you say you want.</li>
          <li>
            A Spend hands you {COINS} coins, then pits each feature against the next one down, so your stated order is tested link by link.
          </li>
          <li>A Peek lets you open up to {PEEKS} facts, asking after each whether your lean moved. Afterwards it shows the rest.</li>
        </ul>
      </Section>

      <Section title="What a result can say" id="results">
        <ul className="rules">
          <li>A switch point, as a range between two amounts; or that the amount didn’t move you within the range tested.</li>
          <li>What you cut first and kept to the end; where your coins and your choices agreed; which facts moved your lean.</li>
          <li>
            A repeated choice, once it happened at least {REPEAT_MIN} times and in at least three of every four chances. Once shown it stays,
            marked if later experiments bring it under.
          </li>
          <li>
            A change, when the same Slide with and without one condition ({Object.values(TAGS).join(', ')}) lands at least {CHANGE_GAP} steps
            apart. One step could be ordinary wobble. It is asked as a question.
          </li>
          <li>Nothing describes you as a person. Your view of a pattern is a note: it never changes what is shown.</li>
        </ul>
      </Section>

      <Section title="Where the experiments come from" id="recipe">
        <p className="small dim">Each one is built from a recipe that a test checks before it can ship:</p>
        <ul className="rules">
          <li>Exactly one amount changes, in one option, through seven steps that each grow by a similar ratio.</li>
          <li>Each option offers something different, so neither wins on everything.</li>
          <li>Each trade-off is tried in three settings, and each condition in at least three Slides.</li>
          <li>Cuts, Spends and Peeks offer five different factors: {FACTORS.map((f) => f.name.toLowerCase()).join(', ')}.</li>
          <li>Short, invented situations, with no statistics, no psychology words and no fixed currency.</li>
        </ul>
        <p className="small dim">Tell has {plural(CARDS.length, 'experiment')} today. New ones are added to the end of the list.</p>
      </Section>

      <Section title="Lessons" id="lessons">
        <p className="small dim">
          When you close a call, what mattered more or less than expected and what you hadn’t considered become lessons for your next call of
          that kind. You can share them as a file: it holds only Tell’s fixed list, never your words, and you see all of it first. Each
          lesson carries a random id, so a call shared twice, or your own coming back, is never counted again. Shared lessons show an
          item once {POOL_MIN} shared calls report it.
        </p>
      </Section>

      <Section title="Your data" id="data">
        <p className="small dim">
          Tell has no accounts, no analytics and no AI, and its security policy blocks connections to anywhere else. Your record lives in this
          browser: {plural(state.runs.length, 'experiment')}, {plural(state.calls.length, 'call')}.
        </p>
        <div className="stack-tight">
          <p className="small" id="currency">
            Currency
          </p>
          <div className="chips" role="group" aria-labelledby="currency">
            {CURRENCIES.map((x) => (
              <button key={x.id} className={`chip${state.currency === x.id ? ' on' : ''}`} aria-pressed={state.currency === x.id} onClick={() => store.update((s) => setCurrency(s, x.id))}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-block" onClick={() => download(`tell-backup-${localDay(new Date())}.json`, store.exportText())}>
          Export a backup
        </button>
        <RestoreButton current={state.runs.length} />
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
      </Section>

      {rated.length > 0 && (
        <details>
          <summary className="link small">How each experiment is rated</summary>
          <p className="small dim">Your set ratings, credited to the experiments in each set. It shows which experiments earn their place.</p>
          <ul className="evidence">
            {rated.map(([id, r]) => (
              <li key={id}>
                <span>{CARDS.find((x) => x.id === id)?.title ?? id}</span>
                <span className="small num">
                  {r.useful} useful · {r.interesting} interesting · {r.meh} meh
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
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
    const replacing = current ? ` This replaces the ${plural(current, 'experiment')} on this device.` : '';
    if (!window.confirm(`Restore this backup of ${plural(backup.state.runs.length, 'experiment')} and ${plural(backup.state.calls.length, 'call')}?${replacing}`)) return;
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
