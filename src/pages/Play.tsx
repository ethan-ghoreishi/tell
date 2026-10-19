import { useState } from 'react';
import { connectionOf, earlierPlays, found, keyed, limitLine, playView, recordPlay, type Found } from '../domain/engine';
import { CONNECTIONS, SITUATIONS, situation as situationOf } from '../domain/situations';
import { MODEL, type Answers, type StepAnswer, type TellState } from '../domain/types';
import { Section, StepPlay, useFocus } from '../steps';
import { store } from '../store/store';
import { shortDate } from '../ui';

// A situation, played step by step, then its ending. Only a finished play is
// recorded. When both situations of a connection have been played, the
// ending shows it; until then it says only that one exists, never which.

export function SituationPage({ state, id }: { state: TellState; id: string }) {
  const s = situationOf(id);
  const [answers, setAnswers] = useState<Answers>({});
  const [moved, setMoved] = useState(false);
  if (!s) return <Missing what="That situation" />;
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
              You played this on {shortDate(before[0].day)}. Playing again keeps both; connections use your first play.
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
  if (!p) return <Missing what="That play" />;
  const v = playView(p);
  const earlier = earlierPlays(state, p);
  const shared = connectionOf(CONNECTIONS, p.situation);
  const f = found(state, CONNECTIONS).find((x) => x.connection === shared);

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

      {f ? (
        <ConnectionCard f={f} />
      ) : shared ? (
        <p className="notice">One other situation here shares something with this one. Once you’ve played both, Tell shows what connects them.</p>
      ) : null}

      <div className="stack">
        <a className="btn btn-primary btn-block" href="#/">
          Back to the situations
        </a>
        <a className="btn btn-ghost btn-block" href={`#/situation/${p.situation}`}>
          Play it again
        </a>
      </div>
    </article>
  );
}

/** What connects two situations, what was chosen in each, and what that can and can't show. */
export function ConnectionCard({ f }: { f: Found }) {
  const c = f.connection;
  return (
    <section className="card connection stack reveal" aria-labelledby={`c-${c.id}`}>
      <p className="eyebrow">Connection · {MODEL[c.on].name.toLowerCase()}</p>
      <h2 className="section-title" id={`c-${c.id}`}>
        {c.title}
      </h2>
      <p>{c.link}</p>
      <ul className="results small">
        {f.plays.map((p, i) => (
          <li key={p.id}>
            <strong>{p.shown.title}:</strong> {f.chose[i]}
          </li>
        ))}
      </ul>
      <p>{f.note}</p>
      <p className="condition">{c.question}</p>
      <p className="small dim">
        {limitLine(c)}
        {f.replayed ? ' It uses your first play of each.' : ''}
      </p>
    </section>
  );
}

export function Missing({ what }: { what: string }) {
  return (
    <div className="stack-lg">
      <h1 className="title">{what} isn’t here</h1>
      <a className="link" href="#/">
        Back to the situations
      </a>
    </div>
  );
}
