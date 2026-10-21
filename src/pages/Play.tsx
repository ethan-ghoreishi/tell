import { useEffect, useState } from 'react';
import { earlierPlays, fresh, keyed, markSeen, playView, recordPlay } from '../domain/engine';
import { QUESTIONS, answersText, languageMove, type Shape } from '../domain/language';
import { SITUATIONS, situation as situationOf } from '../domain/situations';
import type { Answers, Play, Situation, StepAnswer, TellState } from '../domain/types';
import { Section, StepPlay, useFocus } from '../steps';
import { store } from '../store/store';
import { shortDate } from '../ui';

// A story, played step by step, then its ending. Only a finished play is
// recorded. The ending names the moves the play made, marking New the first
// time the player is shown each, and the shape of the step the story turns on.

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
              You played this on {shortDate(before[0].day)}. Playing again keeps every play.
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

/** The ending of a recorded play: how the story closes, what was done and the moves it made, other ways through, and the shape of the step. */
export function PlayPage({ state, id }: { state: TellState; id: string }) {
  const p = state.plays.find((x) => x.id === id);
  const ref = useFocus<HTMLHeadingElement>(id);
  const isNew = useFresh(state, p);
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
        <p className="small dim">Moves here are about {p.shown.turnsOn}.</p>
        <ul className="results">
          {v.did.map((d) => (
            <li key={d.line} className="stack-tight">
              <span>{d.line}</span>
              <MoveNames ids={d.moves} fresh={isNew} />
            </li>
          ))}
        </ul>
        {earlier.length > 0 && (
          <p className="small dim">
            Before: {earlier.map((x) => `${shortDate(x.day)}, ${playView(x).did.map((d) => d.line).join(' ')}`).join(' ')}
          </p>
        )}
      </Section>

      <Section title="Other ways through" id="others">
        <p>{v.others}</p>
        {v.unmade.length > 0 && <p className="small dim">Other moves in this story: {v.unmade.map(moveName).join(' · ')}.</p>}
      </Section>

      <Section title="The shape of it" id="shape">
        <p className="small dim">The four questions, about {p.shown.turnsOn}.</p>
        <ShapeList shape={p.shown.shape} />
      </Section>

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
 * The moves this play made that the player hadn't been shown as new when the
 * screen opened. Held for the life of the screen, so marking them seen doesn't
 * take the label away while it's being read.
 */
function useFresh(state: TellState, play: Play | undefined) {
  const [shown] = useState(() => new Set(play ? fresh(state, play) : []));
  const key = [...shown].join();
  useEffect(() => {
    if (key) store.update((s) => markSeen(s, key.split(','), new Date()));
  }, [key]);
  return shown;
}

export const moveName = (id: string) => languageMove(id)?.name ?? id;

/** A step's moves, named, each marked New the first time it's shown. */
export function MoveNames({ ids, fresh }: { ids: string[]; fresh?: Set<string> }) {
  if (!ids.length) return null;
  return (
    <span className="moves">
      {ids.map((id) => (
        <span key={id} className="move-name">
          {moveName(id)}
          {fresh?.has(id) && <span className="tag">New</span>}
        </span>
      ))}
    </span>
  );
}

/** The four questions and these answers. */
export function ShapeList({ shape }: { shape: Shape }) {
  return (
    <dl className="facts small">
      {QUESTIONS.map((q) => (
        <div key={q.id}>
          <dt>{q.ask}</dt>
          <dd>{answersText(shape, q.id)}</dd>
        </div>
      ))}
    </dl>
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
