import { useRef, useState, type ChangeEvent } from 'react';
import { EPISODES } from '../domain/episodes';
import { MATCH_MAX, MATCH_MIN, localDay, recordText } from '../domain/engine';
import { FEATURES, PARTS, PART_ORDER, type TellState } from '../domain/types';
import { Section } from '../mechanics';
import { store } from '../store/store';
import { download, plural } from '../ui';

// How Tell works, stated as the rules the code follows, where its method comes
// from and what it can't show, and the player's control over their data.

const common = Object.values(FEATURES)
  .filter((f) => f.group === 'common')
  .map((f) => f.label);

export default function About({ state }: { state: TellState }) {
  return (
    <div className="stack-xl">
      <header className="stack">
        <h1 className="title">How Tell works</h1>
        <p className="lede">
          See what would make a choice clearer. Play a short story or bring a real choice, look at the part that’s unresolved, keep what helps, and come back to
          what happened if you want to. Tell helps you examine a choice; it never makes one.
        </p>
      </header>

      <Section title="Four questions" id="questions">
        <dl className="glossary">
          {PART_ORDER.map((p) => (
            <div key={p}>
              <dt>
                <strong>{PARTS[p].name}</strong>
              </dt>
              <dd className="dim small">{PARTS[p].question}</dd>
            </div>
          ))}
        </dl>
        <p className="small dim">
          They are a light adaptation of two sources: the elements of decision quality used by{' '}
          <a className="link" href="https://sdg.com/decision-quality/" rel="noreferrer" target="_blank">
            Strategic Decisions Group
          </a>{' '}
          (the right frame, creative alternatives, meaningful information, clear values and trade-offs), and Ralph Keeney’s{' '}
          <a className="link" href="https://www.sciencedirect.com/science/article/pii/0377221796000045" rel="noreferrer" target="_blank">
            value-focused thinking
          </a>{' '}
          (start from what you want, then create better options; <i>European Journal of Operational Research</i>, 1996).
        </p>
        <p className="small dim">
          Tell uses them to choose which questions to ask and to write its stories. They are not a tested theory of why choices get stuck, not categories of
          people, and nothing is scored. Tell separates what matters to you, lines you won’t cross, facts you don’t know and things you’re assuming, because
          each calls for something different; some uncertainty always remains.
        </p>
      </Section>

      <Section title="Play" id="play">
        <ul className="rules">
          <li>
            {plural(EPISODES.length, 'invented story', 'invented stories')}, three for each question. Each is short: a situation, a first answer, one change or
            reveal, a second answer and an ending. Play them in any order, whenever you like; there is nothing to unlock and nothing new arrives by itself.
          </li>
          <li>The ending keeps three things apart: what you answered, possible readings of it, and what stays unknown. A reading is about the answers, never about you.</li>
          <li>Every story says why it exists and what it can’t show, under “About this story” at its end.</li>
          <li>A replay is shown with your first play of that story. It never counts as a separate example.</li>
          <li>Pass the phone lets someone else play the same story. Nothing they answer is saved.</li>
          <li>Facts in a story are invented and marked “In this story”. A story is not evidence about the real world.</li>
        </ul>
      </Section>

      <Section title="Bring a choice" id="choose">
        <ul className="rules">
          <li>A title is enough to start; you don’t need two finished options. Pick what feels unresolved, or “Not sure” to look at all four.</li>
          <li>Tell asks only about the parts you pick, in your own words, and keeps them exactly as written. It doesn’t interpret free text.</li>
          <li>
            Waiting, keeping things as they are, a smaller trial or asking someone can be options. Stopping without deciding is a fine ending.
          </li>
          <li>Everything is saved as a draft as you type, so you can leave and come back. Back and “Change what to look at” are always there.</li>
          <li>The summary is built from your answers for you to edit. If you plan to act or test something, it asks what you expect, so you can compare later.</li>
        </ul>
      </Section>

      <Section title="What Tell keeps" id="keeps">
        <ul className="rules">
          <li>
            Four kinds of record, labelled apart: answers to invented stories, what you said about real choices, things you chose to keep, and what you reported
            happened. Each keeps its date and where it came from.
          </li>
          <li>Every play and every save is a snapshot. Revising a choice adds a save; revising a takeaway adds a wording. Earlier ones stay, and so does the evidence.</li>
          <li>Retiring a takeaway moves it to your history. You can bring it back.</li>
        </ul>
      </Section>

      <Section title="How past examples are chosen" id="matching">
        <ul className="rules">
          <li>
            During a choice, Tell may show up to {MATCH_MAX} things from your record: takeaways you kept and your other saved choices. It compares only what you
            marked: the kinds of option, how an unknown that matters could be found out, assumptions you marked, and the circumstances. It never
            reads your words.
          </li>
          <li>
            An example appears only when it shares at least {MATCH_MIN} of those, and at least one is about the choice’s structure rather than its circumstances.
            Sharing a question (say, both about evidence) never counts, and nor do {common.join(', ')}: nearly every choice has them.
          </li>
          <li>Each example says why it appeared, and shows times it applied and things went differently. You say whether it applies, pick one yourself, or use none.</li>
        </ul>
      </Section>

      <Section title="Coming back" id="follow">
        <p className="small dim">
          Whenever you like, add what happened to a saved choice: too early to say, plans changed, or what happened compared with what you expected, and anything
          that surprised you. There are no reminders and no due dates. Nothing is scored: a good outcome doesn’t prove the reasoning, and a bad one doesn’t
          disprove it.
        </p>
      </Section>

      <Section title="What Tell can’t show" id="limits">
        <ul className="rules">
          <li>Answers to an invented story can differ from what you’d do for real. One story is one moment.</li>
          <li>The four questions organise the conversation; they don’t prove which part of a choice is stuck.</li>
          <li>Matching is deliberately simple. Two choices with the same shape can differ in everything that matters.</li>
          <li>
            Untested so far: whether the stories are enjoyable enough to play unprompted, whether a session leaves a real choice clearer, and whether past
            examples help more than they distract. These are what the pilot is for.
          </li>
        </ul>
      </Section>

      <Section title="Your data" id="data">
        <p className="small dim">
          No accounts, no analytics and no AI, and the security policy blocks connections to anywhere else. Your record lives in this browser:{' '}
          {plural(state.plays.length, 'play')}, {plural(state.choices.length, 'choice')}, {plural(state.takeaways.length, 'takeaway')}.
        </p>
        <button className="btn btn-block" onClick={() => download(`tell-backup-${localDay(new Date())}.json`, store.exportText())}>
          Export a backup
        </button>
        <RestoreButton current={state.plays.length + state.choices.length} />
        <button className="btn btn-block" onClick={() => download(`tell-${localDay(new Date())}.txt`, recordText(state), 'text/plain')}>
          Download everything as plain text
        </button>
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
    const earlier = s.archive.length ? ` It is from an earlier Tell, and will be kept whole in your history.` : '';
    if (!window.confirm(`Restore this backup of ${plural(s.plays.length, 'play')}, ${plural(s.choices.length, 'choice')} and ${plural(s.takeaways.length, 'takeaway')}?${earlier}${replacing}`)) return;
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
