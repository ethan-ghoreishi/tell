import { useState } from 'react';
import { EPISODES, episode as episodeOf } from '../domain/episodes';
import { earlierPlays, optionText, playView, recordPlay, secondOptions, suggestion, keep, type PlayAnswers } from '../domain/engine';
import { fill, value } from '../domain/text';
import { PARTS, UNSURE, type Answer, type BeatAnswer, type Play, type TellState } from '../domain/types';
import { Amounts, CutPlay, SlidePlay, mark, useFocus } from '../mechanics';
import { store } from '../store/store';
import { randomId, shortDate } from '../ui';

// An episode: a short invented story with a first answer, one move, a second
// answer and an ending. Only a finished play is recorded. Pass the phone runs
// the same story for someone else and keeps nothing of theirs.

type Shown = Play['shown'];

/** The start of an episode, then the play itself. */
export function EpisodePage({ state, id }: { state: TellState; id: string }) {
  const e = episodeOf(id);
  const [playing, setPlaying] = useState(false);
  if (!e) return <Missing what="That story" />;
  const before = state.plays.filter((p) => p.episode === e.id);

  if (playing) {
    return (
      <EpisodePlay
        e={e}
        onDone={(answers) => {
          try {
            if (state.plays.length === 0) navigator.storage?.persist?.().catch(() => undefined);
          } catch {
            // Persistence is a request, not a promise.
          }
          let recorded = '';
          store.update((s) => {
            const next = recordPlay(s, EPISODES, e.id, answers, new Date());
            recorded = next.plays.at(-1)!.id;
            return next;
          });
          location.hash = `#/play/${recorded}`;
        }}
      />
    );
  }

  return (
    <article className="stack-lg">
      <header className="stack">
        <p className="eyebrow">
          {PARTS[e.part].name} · {e.project}
        </p>
        <h1 className="title">{e.title}</h1>
        <p className="lede">{PARTS[e.part].question}</p>
      </header>
      <p className="small dim">An invented story, about three minutes. You answer twice; the ending shows what changed and what it might mean.</p>
      {before.length > 0 && (
        <p className="notice">
          You played this on {shortDate(before[0].day)}
          {before.length > 1 ? ` and replayed it ${before.length - 1 === 1 ? 'once' : `${before.length - 1} times`}` : ''}. Playing again adds a replay, shown beside
          the first. It isn’t a new example.
        </p>
      )}
      <button className="btn btn-primary btn-block" onClick={() => setPlaying(true)}>
        {before.length ? 'Play it again' : 'Start'}
      </button>
      <a className="btn btn-ghost btn-block" href="#/">
        Back to the stories
      </a>
    </article>
  );
}

/** The story: in full for the first answer, then folded so the move stays in view on a phone. */
const Setup = ({ e, folded = false }: { e: Shown; folded?: boolean }) =>
  folded ? (
    <details className="card-quiet">
      <summary className="link small">Reread the story</summary>
      <p>{e.setup}</p>
    </details>
  ) : (
    <div className="card stack-tight">
      <p className="eyebrow">Invented story</p>
      <p className="scene">{e.setup}</p>
    </div>
  );

function Choose({ question, options, onPick, focusKey }: { question: string; options: { id: string; text: string }[]; onPick: (a: Answer) => void; focusKey: string }) {
  const ref = useFocus<HTMLParagraphElement>(focusKey);
  return (
    <div className="stack">
      <p className="question" ref={ref} tabIndex={-1}>
        {question}
      </p>
      <div className="options">
        {options.map((o) => (
          <button key={o.id} className="option" onClick={() => onPick(o.id)}>
            {o.text}
          </button>
        ))}
      </div>
      <button className="btn btn-ghost btn-sm btn-block" onClick={() => onPick(UNSURE)}>
        Not sure yet
      </button>
    </div>
  );
}

/** The play of one episode, kept in memory until the second answer. */
export function EpisodePlay({ e, onDone, guest = false }: { e: Shown; onDone: (a: PlayAnswers) => void; guest?: boolean }) {
  const [first, setFirst] = useState<Answer | null>(null);
  const [beat, setBeat] = useState<BeatAnswer | null>(null);
  const [final, setFinal] = useState<Answer | null>(null);
  const b = e.beat;
  const head = (
    <p className="small dim num">
      {guest ? 'Their turn · nothing they answer is saved' : e.title} · {first === null ? 'First answer' : beat === null ? 'Something changes' : 'Second answer'}
    </p>
  );

  if (first === null) {
    return (
      <article className="stack-lg">
        {head}
        <Setup e={e} />
        <Choose question={e.ask} options={e.options} onPick={setFirst} focusKey="first" />
      </article>
    );
  }

  if (beat === null) {
    return (
      <article className="stack-lg">
        {head}
        {b.kind === 'slide' ? (
          <>
          <Setup e={e} folded />
          <SlidePlay
            texts={(i) => ({ scene: fill(b.text, mark(value(b.unit, b.steps[i]))), a: e.options[0].text, b: e.options[1].text })}
            steps={b.steps}
            rises={b.rises}
            onDone={(r) => setBeat({ kind: 'slide', ...r })}
          />
          </>
        ) : (
          <>
            <Setup e={e} folded />
            {b.kind === 'twist' ? (
              <Twist e={e} onNext={() => setBeat({ kind: 'twist' })} />
            ) : b.kind === 'cut' ? (
              <CutPlay prompt={b.prompt} items={b.items} onDone={(order) => setBeat({ kind: 'cut', order })} />
            ) : b.kind === 'widen' ? (
              <Widen e={e} onDone={(picked) => setBeat({ kind: 'widen', picked })} />
            ) : (
              <Peek e={e} first={first} onDone={(opened) => setBeat({ kind: 'peek', opened, wouldHave: [] })} />
            )}
          </>
        )}
      </article>
    );
  }

  const options = secondOptions(e, beat);
  if (final === null) {
    return (
      <article className="stack-lg">
        {head}
        <Setup e={e} folded />
        <Reminder e={e} beat={beat} />
        <Choose
          question={e.reask}
          options={options}
          focusKey="final"
          onPick={(a) => {
            if (b.kind === 'peek' && beat.kind === 'peek' && beat.opened.length < b.facts.length) setFinal(a);
            else onDone({ first, beat, final: a });
          }}
        />
      </article>
    );
  }

  // Peek: the facts left closed, and whether any would have changed the answer.
  return <Unopened e={e} beat={beat as Extract<BeatAnswer, { kind: 'peek' }>} final={final} onDone={(wouldHave) => onDone({ first, beat: { ...(beat as Extract<BeatAnswer, { kind: 'peek' }>), wouldHave }, final })} />;
}

function Twist({ e, onNext }: { e: Shown; onNext: () => void }) {
  const b = e.beat as Extract<Shown['beat'], { kind: 'twist' }>;
  const ref = useFocus<HTMLParagraphElement>('twist');
  return (
    <div className="stack">
      <p className="condition" ref={ref} tabIndex={-1}>
        {b.text}
      </p>
      {b.adds && <p className="small dim">A new option: {b.adds.text}</p>}
      <button className="btn btn-primary btn-block" onClick={onNext}>
        Continue
      </button>
    </div>
  );
}

function Widen({ e, onDone }: { e: Shown; onDone: (picked: string[]) => void }) {
  const b = e.beat as Extract<Shown['beat'], { kind: 'widen' }>;
  const [picked, setPicked] = useState<string[]>([]);
  const ref = useFocus<HTMLParagraphElement>('widen');
  return (
    <div className="stack">
      <p className="question" ref={ref} tabIndex={-1}>
        {b.prompt}
      </p>
      <p className="small dim">Pick any that you would. The ones you pick join the question.</p>
      <div className="options">
        {b.items.map((i) => {
          const on = picked.includes(i.id);
          return (
            <button key={i.id} className={`option${on ? ' on' : ''}`} aria-pressed={on} onClick={() => setPicked(on ? picked.filter((x) => x !== i.id) : [...picked, i.id])}>
              {i.text}
            </button>
          );
        })}
      </div>
      <button className="btn btn-primary btn-block" onClick={() => onDone(picked)}>
        {picked.length ? 'Continue' : 'None of these. Continue'}
      </button>
    </div>
  );
}

function Peek({ e, first, onDone }: { e: Shown; first: Answer; onDone: (opened: { fact: number; lean: Answer }[]) => void }) {
  const b = e.beat as Extract<Shown['beat'], { kind: 'peek' }>;
  const [opened, setOpened] = useState<{ fact: number; lean: Answer | null }[]>([]);
  const pending = opened.at(-1)?.lean === null;
  const left = b.opens - opened.length;
  const ref = useFocus<HTMLParagraphElement>(`${opened.length}-${pending}`);
  const lean = opened.at(-1)?.lean ?? first;
  return (
    <div className="stack">
      <p className="question" ref={ref} tabIndex={-1}>
        {pending ? 'Which way do you lean now?' : left ? b.prompt : 'That’s all you can open.'}
      </p>
      {!pending && <p className="small dim num">{left ? `${left} left to open. Your lean so far: ${lean === UNSURE ? 'not sure' : optionText(e, lean)}.` : `Your lean: ${lean === UNSURE ? 'not sure' : optionText(e, lean)}.`}</p>}
      {pending && (
        <div className="chips" role="group" aria-label="Your lean">
          {[...e.options, { id: UNSURE, text: 'Not sure' }].map((o) => (
            <button key={o.id} className="chip" onClick={() => setOpened(opened.map((x, i) => (i === opened.length - 1 ? { ...x, lean: o.id } : x)))}>
              {o.text}
            </button>
          ))}
        </div>
      )}
      <div className="options">
        {b.facts.map((f, i) => {
          const o = opened.find((x) => x.fact === i);
          return (
            <button key={f.id} className={`option fact${o ? ' open' : ''}`} disabled={!!o || pending || left === 0} onClick={() => setOpened([...opened, { fact: i, lean: null }])}>
              <strong className="option-title">{f.label}</strong>
              <span className={o ? 'option-line' : 'option-line faint small'}>{o ? f.text : 'Hidden. Tap to open.'}</span>
            </button>
          );
        })}
      </div>
      {!pending && (
        <button className="btn btn-primary btn-block" onClick={() => onDone(opened.map((o) => ({ fact: o.fact, lean: o.lean! })))}>
          {opened.length ? 'Choose now' : 'Choose without opening any'}
        </button>
      )}
    </div>
  );
}

function Unopened({ e, beat, final, onDone }: { e: Shown; beat: Extract<BeatAnswer, { kind: 'peek' }>; final: Answer; onDone: (would: number[]) => void }) {
  const b = e.beat as Extract<Shown['beat'], { kind: 'peek' }>;
  const [would, setWould] = useState<number[]>([]);
  const ref = useFocus<HTMLParagraphElement>('unopened');
  const closed = b.facts.map((_, i) => i).filter((i) => !beat.opened.some((o) => o.fact === i));
  return (
    <article className="stack-lg">
      <p className="question" ref={ref} tabIndex={-1}>
        Here’s what you left closed. Would any of it have changed your answer{final === UNSURE ? '' : ` of “${optionText(e, final)}”`}?
      </p>
      <div className="options">
        {closed.map((i) => {
          const on = would.includes(i);
          return (
            <button key={i} className={`option fact${on ? ' on' : ''}`} aria-pressed={on} onClick={() => setWould(on ? would.filter((x) => x !== i) : [...would, i])}>
              <strong className="option-title">{b.facts[i].label}</strong>
              <span className="option-line">{b.facts[i].text}</span>
            </button>
          );
        })}
      </div>
      <button className="btn btn-primary btn-block" onClick={() => onDone(would)}>
        {would.length ? 'Done' : 'None of them. Done'}
      </button>
    </article>
  );
}

/** What the move showed, held in view for the second answer. */
function Reminder({ e, beat }: { e: Shown; beat: BeatAnswer }) {
  const b = e.beat;
  if (b.kind === 'twist') return <p className="condition">{b.text}</p>;
  if (b.kind === 'cut' && beat.kind === 'cut') {
    const kept = b.items.find((i) => !beat.order.includes(i.id))!;
    return (
      <p className="condition">
        Your last one standing: <strong>{kept.text}</strong>
      </p>
    );
  }
  if (b.kind === 'slide' && b.actual) {
    return (
      <p className="condition">
        <Amounts text={b.actual.text} />
      </p>
    );
  }
  if (b.kind === 'peek' && beat.kind === 'peek' && beat.opened.length) {
    return (
      <ul className="condition stack-tight">
        {beat.opened.map((o) => (
          <li key={o.fact}>
            <strong>{b.facts[o.fact].label}:</strong> {b.facts[o.fact].text.replace(/^In this story, /, '')}
          </li>
        ))}
      </ul>
    );
  }
  return null;
}

/** The ending of a recorded play: what was answered, what it might mean, what stays unknown. */
export function PlayPage({ state, id }: { state: TellState; id: string }) {
  const p = state.plays.find((x) => x.id === id);
  const [keeping, setKeeping] = useState<string | null>(null);
  const [kept, setKept] = useState(false);
  const [guest, setGuest] = useState<'off' | 'playing' | PlayAnswers>('off');
  const ref = useFocus<HTMLHeadingElement>(`${id}-${guest === 'playing'}`);
  if (!p) return <Missing what="That play" />;
  const v = playView(p);
  const earlier = earlierPlays(state, p);
  const already = state.takeaways.filter((t) => t.source.kind === 'play' && t.source.play === p.id);
  const next = suggestion(state, EPISODES);
  const rationale = episodeOf(p.episode)?.rationale;

  if (guest === 'playing') return <EpisodePlay e={p.shown} guest onDone={(a) => setGuest(a)} />;

  return (
    <article className="stack-xl reveal">
      <header className="stack">
        <p className="eyebrow">
          Invented story · {PARTS[p.shown.part].name}
          {p.replay ? ` · replay ${p.replay}` : ''}
        </p>
        <h1 className="title" ref={ref} tabIndex={-1}>
          {p.shown.title}
        </h1>
        <p className="lede">{v.point}</p>
      </header>

      <section className="stack" aria-labelledby="answered">
        <h2 className="section-title" id="answered">
          What you answered
        </h2>
        <ul className="results">
          {v.observed.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>

      <section className="stack" aria-labelledby="readings">
        <h2 className="section-title" id="readings">
          Possible readings
        </h2>
        <ul className="rules">
          {v.readings.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="small dim">One story can’t tell which of these is right, if any. They are about these answers, not about you.</p>
      </section>

      <section className="stack" aria-labelledby="unknown">
        <h2 className="section-title" id="unknown">
          Still unknown
        </h2>
        <p>{v.unknown}</p>
      </section>

      {typeof guest === 'object' && <Together mine={p} theirs={guest} />}

      {earlier.length > 0 && (
        <section className="stack" aria-labelledby="before">
          <h2 className="section-title" id="before">
            Earlier plays of this story
          </h2>
          <ul className="results">
            {earlier.map((x) => (
              <li key={x.id}>
                {shortDate(x.day)}: first {say(x.shown, x.first)}, then {say(x.shown, x.final)}.
              </li>
            ))}
          </ul>
          <p className="small dim">A replay of the same story is shown with the first. It isn’t a separate example.</p>
        </section>
      )}

      <section className="card stack" aria-labelledby="keep">
        <h2 className="section-title" id="keep">
          Worth keeping?
        </h2>
        {kept || already.length ? (
          <p className="small" role="status">
            Kept on your map, with this play as its evidence.
          </p>
        ) : keeping === null ? (
          <>
            <p className="small dim">Optional. Keep a line in your own words, or one of these to edit.</p>
            <div className="options">
              {[v.point, ...v.readings].map((t) => (
                <button key={t} className="option small" onClick={() => setKeeping(t.replace(/^Or /, ''))}>
                  {t}
                </button>
              ))}
              <button className="option small" onClick={() => setKeeping('')}>
                Write my own
              </button>
            </div>
          </>
        ) : (
          <div className="stack">
            <label className="field">
              <span className="small">In your words</span>
              <textarea className="input textarea" value={keeping} rows={3} onChange={(ev) => setKeeping(ev.target.value)} />
            </label>
            <div className="row">
              <button
                className="btn btn-primary"
                disabled={!keeping.trim()}
                onClick={() => {
                  store.update((s) => keep(s, `t${randomId()}`, keeping, { kind: 'play', play: p.id }, new Date()));
                  setKept(true);
                }}
              >
                Keep it
              </button>
              <button className="btn btn-ghost" onClick={() => setKeeping(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="stack" aria-labelledby="apply">
        <h2 className="section-title" id="apply">
          A question for a real choice
        </h2>
        <p>{v.apply}</p>
        <a className="btn btn-block" href={`#/choose/${p.shown.part}/${encodeURIComponent(v.apply)}`}>
          Try it on a real choice
        </a>
      </section>

      {guest === 'off' && (
        <button className="btn btn-ghost btn-block" onClick={() => setGuest('playing')}>
          Pass the phone: let someone else play it
        </button>
      )}

      {rationale && (
        <details className="card-quiet">
          <summary className="link small">About this story</summary>
          <dl className="glossary small">
            <dt>The distinction</dt>
            <dd>{rationale.distinction}</dd>
            <dt>Plausible answers</dt>
            <dd>{rationale.alternatives}</dd>
            <dt>What it can’t show</dt>
            <dd>{rationale.limits}</dd>
            <dt>For real choices</dt>
            <dd>{rationale.relevance}</dd>
          </dl>
        </details>
      )}

      <div className="stack">
        {next && (
          <a className="btn btn-primary btn-block" href={`#/episode/${next.episode.id}`}>
            Next story: {next.episode.title}
          </a>
        )}
        <a className="btn btn-ghost btn-block" href="#/">
          {next ? 'Back to the stories' : 'You’ve played every story. Back to the list'}
        </a>
      </div>
    </article>
  );
}

const say = (e: Shown, a: Answer) => (a === UNSURE ? 'not sure' : `“${optionText(e, a)}”`);

/** You and the guest, side by side. Theirs lives only on this screen. */
function Together({ mine, theirs }: { mine: Play; theirs: PlayAnswers }) {
  const them = playView({ ...mine, ...theirs });
  return (
    <section className="stack" aria-labelledby="together">
      <h2 className="section-title" id="together">
        You and them
      </h2>
      <div className="then-now">
        <div>
          <p className="eyebrow">You</p>
          <p className="small">First {say(mine.shown, mine.first)}, then {say(mine.shown, mine.final)}.</p>
        </div>
        <div>
          <p className="eyebrow">Them</p>
          <p className="small">
            First {say(mine.shown, theirs.first)}, then {say(mine.shown, theirs.final)}.
          </p>
        </div>
      </div>
      <p className="small dim">{them.changed ? 'They changed their answer.' : 'They kept their first answer.'} Their answers were not saved.</p>
    </section>
  );
}

export function Missing({ what }: { what: string }) {
  return (
    <div className="stack-lg">
      <h1 className="title">{what} isn’t here</h1>
      <a className="link" href="#/">
        Back to the start
      </a>
    </div>
  );
}
