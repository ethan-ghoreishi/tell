import { useEffect, useState } from 'react';
import { discoveries, earlierPlays, fitsAgain, keyed, madeBy, markSeen, playView, recordPlay, type Discovery } from '../domain/engine';
import { CONNECTIONS, SITUATIONS, situation as situationOf } from '../domain/situations';
import type { Answers, Situation, StepAnswer, TellState } from '../domain/types';
import { Section, StepPlay, useFocus } from '../steps';
import { store } from '../store/store';
import { shortDate } from '../ui';

// A situation, played step by step, then its ending. Only a finished play is
// recorded. An ending shows a connection only when this play found it; a
// replay that fits one found earlier says so quietly, and never as new.

export function SituationPage({ state, id }: { state: TellState; id: string }) {
  const s = situationOf(id);
  const [answers, setAnswers] = useState<Answers>({});
  const [moved, setMoved] = useState(false);
  if (!s) return <Missing what="That story" />;
  const index = s.steps.findIndex((step) => !answers[step.id]);
  const step = s.steps[index];
  const before = state.plays.filter((p) => p.situation === s.id);

  function answer(a: StepAnswer) {
    const next = { ...answers, [step.id]: a };
    if (index < s!.steps.length - 1) return setAnswers(next);
    try {
      if (state.plays.length === 0) navigator.storage?.persist?.().catch(() => undefined);
    } catch {
      // Persistence is a request, not a promise.
    }
    let recorded = '';
    store.update((x) => {
      const after = recordPlay(x, SITUATIONS, s!.id, next, new Date());
      recorded = after.plays.at(-1)!.id;
      return after;
    });
    location.hash = `#/play/${recorded}`;
  }

  return (
    <article className="stack-lg">
      <header className="stack-tight">
        <p className="eyebrow">{s.place}</p>
        <h1 className="title">{s.title}</h1>
      </header>
      {index === 0 && !moved ? (
        <>
          {before.length > 0 && (
            <p className="notice">
              You played this on {shortDate(before[0].day)}. Playing again keeps both.
            </p>
          )}
          <p className="scene">{s.setup}</p>
        </>
      ) : (
        <>
          <details className="card-quiet">
            <summary className="link small">Reread the story</summary>
            <p>{s.setup}</p>
          </details>
          {/* What was found out stays in view for what comes next. */}
          {s.steps.slice(0, index).map((x) => {
            const a = answers[x.id];
            if (x.kind !== 'uncover' || a.kind !== 'uncover' || !a.opened.length) return null;
            return (
              <ul key={x.id} className="condition stack-tight">
                {a.opened.map((id) => {
                  const fact = x.facts.find((f) => f.id === id)!;
                  return <li key={id}>{fact.text}</li>;
                })}
              </ul>
            );
          })}
        </>
      )}
      <StepPlay key={step.id} step={step} before={step.kind === 'choose' && step.before ? keyed(step.before, s, answers) : undefined} onAnswer={answer} onMove={() => setMoved(true)} />
    </article>
  );
}

/** The ending of a recorded play: how the story closes, what was done, and other ways through. */
export function PlayPage({ state, id }: { state: TellState; id: string }) {
  const p = state.plays.find((x) => x.id === id);
  const ref = useFocus<HTMLHeadingElement>(id);
  const found = discoveries(state, CONNECTIONS);
  const made = p ? madeBy(found, p) : [];
  const again = p ? fitsAgain(found, p) : [];
  const fresh = useFresh(state, made);
  if (!p) return <Missing what="That play" />;
  const v = playView(p);
  const earlier = earlierPlays(state, p);

  return (
    <article className="stack-xl reveal">
      <header className="stack">
        <p className="eyebrow">
          {p.shown.place}
          {p.replay ? ` · replay ${p.replay}` : ''}
        </p>
        <h1 className="title" ref={ref} tabIndex={-1}>
          {p.shown.title}
        </h1>
        <p className="scene">{v.closing}</p>
      </header>

      <Section title="What you did" id="did">
        <ul className="results">
          {v.did.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        {earlier.length > 0 && (
          <p className="small dim">
            Before: {earlier.map((x) => `${shortDate(x.day)}, ${playView(x).did.join(' ')}`).join(' ')}
          </p>
        )}
      </Section>

      <Section title="Other ways through" id="others">
        <p>{v.others}</p>
      </Section>

      {made.map((d) => (
        <DiscoveryCard key={d.connection.id} d={d} fresh={fresh.has(d.connection.id)} heading="h2" />
      ))}
      {again.map((d) => (
        <p key={d.connection.id} className="small dim">
          This play fits “{d.connection.title}” too, already on <a className="link" href="#/map">your map</a>.
        </p>
      ))}

      {p.shown.real && <Real s={p.shown} />}

      <div className="stack">
        <a className="btn btn-primary btn-block" href="#/">
          Back to the stories
        </a>
        <a className="btn btn-ghost btn-block" href={`#/situation/${p.situation}`}>
          Play it again
        </a>
      </div>
    </article>
  );
}

/**
 * Which of these discoveries the player hadn't seen when this screen opened.
 * The answer is held for the life of the screen, so marking them seen doesn't
 * take the label away while it's being read.
 */
export function useFresh(state: TellState, shown: Discovery[]) {
  const ids = shown.map((d) => d.connection.id);
  const [fresh] = useState(() => new Set(ids.filter((id) => !state.seen[id])));
  const key = ids.join();
  useEffect(() => {
    if (key) store.update((s) => markSeen(s, key.split(','), new Date()));
  }, [key]);
  return fresh;
}

/** A distinction first, in a sentence or two; the choices behind it, and its limits, on request. */
export function DiscoveryCard({ d, fresh, heading = 'h3' }: { d: Discovery; fresh: boolean; heading?: 'h2' | 'h3' }) {
  const c = d.connection;
  const H = heading;
  return (
    <section className="card connection stack" aria-labelledby={`c-${c.id}`}>
      {fresh && <p className="tag">New</p>}
      <H className="section-title" id={`c-${c.id}`}>
        {c.title}
      </H>
      <p>{c.says}</p>
      <details className="more">
        <summary className="link small">Your choices, and where it breaks</summary>
        <dl className="facts small">
          <dt>Your choices</dt>
          <dd>
            <ul className="stack-tight">
              {d.plays.map((p) => (
                <li key={p.id}>
                  <a className="link" href={`#/play/${p.id}`}>
                    {p.shown.title}
                  </a>
                  : {playView(p).did.join(' ')}
                </li>
              ))}
            </ul>
          </dd>
          <dt>Where it breaks</dt>
          <dd>{c.breaks}</dd>
          <dt>To carry</dt>
          <dd>{c.question}</dd>
          {d.also.length > 0 && (
            <>
              <dt>Fits again</dt>
              <dd>{d.also.map((p) => `${p.shown.title}${p.replay ? `, replay ${p.replay}` : ''} (${shortDate(p.day)})`).join('; ')}</dd>
            </>
          )}
        </dl>
      </details>
    </section>
  );
}

/** What a story takes from the real world, with sources, and what it invents. */
function Real({ s }: { s: Situation }) {
  return (
    <details className="card-quiet">
      <summary className="link small">What’s real in this story</summary>
      <div className="stack small">
        {s.real!.facts.map((f) => (
          <p key={f.fact}>
            {f.fact}{' '}
            <span className="dim">
              (
              {f.sources.map((src, i) => (
                <span key={src.url}>
                  {i > 0 && '; '}
                  <a className="link" href={src.url} target="_blank" rel="noreferrer">
                    {src.name}
                  </a>
                </span>
              ))}
              )
            </span>
          </p>
        ))}
        <p className="dim">{s.real!.invented}</p>
      </div>
    </details>
  );
}

export function Missing({ what }: { what: string }) {
  return (
    <div className="stack-lg">
      <h1 className="title">{what} isn’t here</h1>
      <a className="link" href="#/">
        Back to the stories
      </a>
    </div>
  );
}
