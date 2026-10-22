import { useEffect, useState } from 'react';
import { earlierPlays, fresh, keyed, markSeen, playView, recordPlay, type Pair } from '../domain/engine';
import { differs, question, shortText } from '../domain/language';
import { SITUATIONS, situation as situationOf, variantOf } from '../domain/situations';
import { capital } from '../domain/text';
import type { Answers, Play, Situation, StepAnswer, TellState } from '../domain/types';
import { MoveButtons, ShapeCells } from '../lens';
import { Section, StepPlay, useFocus } from '../steps';
import { store } from '../store/store';
import { shortDate } from '../ui';

// A story, played step by step, then its ending. The shape of the step it
// turns on is there from the start, and every option shows its moves before
// it's chosen. Only a finished play is recorded. The ending names the moves
// the play made, marking New the first time the player is shown each, with
// what they cost and risked here; and, where the story has a variant, offers
// it, or sets the two plays side by side.

export function SituationPage({ state, id }: { state: TellState; id: string }) {
  const s = situationOf(id);
  const [answers, setAnswers] = useState<Answers>({});
  const [moved, setMoved] = useState(false);
  if (!s) return <Missing what="That story" />;
  const index = s.steps.findIndex((step) => !answers[step.id]);
  const step = s.steps[index];
  const before = state.plays.filter((p) => p.situation === s.id);
  const base = s.of ? situationOf(s.of) : undefined;
  const shape = <ShapeCells shape={s.shape} label={`The step: ${s.turnsOn}`} was={base?.shape} />;

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
          {s.whatIf && <p className="condition">{s.whatIf}</p>}
          <p className="scene">{s.setup}</p>
          {shape}
        </>
      ) : (
        <>
          <details className="disclosure">
            <summary>Reread the story</summary>
            <div className="stack">
              <p>{s.setup}</p>
              {shape}
            </div>
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

/**
 * The ending of a recorded play: how the story closes; what was done, the
 * moves it made and what each cost and risked here, under the step's shape;
 * the variant, or both plays side by side; and other ways through.
 */
export function PlayPage({ state, id }: { state: TellState; id: string }) {
  const p = state.plays.find((x) => x.id === id);
  const ref = useFocus<HTMLHeadingElement>(id);
  const isNew = useFresh(state, p);
  if (!p) return <Missing what="That play" />;
  const v = playView(p);
  const earlier = earlierPlays(state, p);
  const variant = p.shown.of ? undefined : variantOf(p.situation);
  const base = p.shown.of ? state.plays.filter((x) => x.situation === p.shown.of).at(-1) : undefined;

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
        <ShapeCells shape={p.shown.shape} label={`The step: ${p.shown.turnsOn}`} />
        <ul className="group did">
          {v.did.map((d) => (
            <li key={d.line} className="stack-tight">
              <span>{d.line}</span>
              <MoveButtons ids={d.moves} fresh={isNew} />
              <dl className="cost-risk small">
                <div>
                  <dt>Cost</dt>
                  <dd>{capital(d.costs)}</dd>
                </div>
                <div>
                  <dt>Risk</dt>
                  <dd>{capital(d.risks)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        {earlier.length > 0 && (
          <p className="small dim">
            Before: {earlier.map((x) => `${shortDate(x.day)}, ${playView(x).did.map((d) => d.line).join(' ')}`).join(' ')}
          </p>
        )}
      </Section>

      {variant && (
        <section className="card stack" aria-labelledby="whatif">
          <h2 className="section-title" id="whatif">
            {variant.whatIf}
          </h2>
          <ShapeCells shape={variant.shape} was={p.shown.shape} />
          <a className="btn btn-primary btn-block" href={`#/situation/${variant.id}`}>
            Play it that way
          </a>
        </section>
      )}

      {p.shown.of && (
        <Section title="Both ways" id="both">
          {base ? (
            <PairView pair={{ base, variant: p, differ: differs(base.shown.shape, p.shown.shape) }} />
          ) : (
            <a className="link" href={`#/situation/${p.shown.of}`}>
              Play {situationOf(p.shown.of)?.title ?? 'the story'} as it was
            </a>
          )}
        </Section>
      )}

      <Section title="Other ways through" id="others">
        <p>{v.others}</p>
        {v.unmade.length > 0 && (
          <div className="stack-tight">
            <p className="small dim">Other moves in this story:</p>
            <MoveButtons ids={v.unmade} />
          </div>
        )}
      </Section>

      {p.shown.real && <Real s={p.shown} />}

      <div className="stack">
        <a className={`btn btn-block${variant ? '' : ' btn-primary'}`} href="#/">
          Back to the stories
        </a>
        <a className="btn btn-ghost btn-block" href={`#/situation/${p.situation}`}>
          Play it again
        </a>
      </div>
    </article>
  );
}

/** A story and its variant, played: each play under the answer that differs, with its moves; then when that question's moves are worth something. Never explained. */
export function PairView({ pair }: { pair: Pair }) {
  return (
    <div className="stack">
      {pair.differ.map((q) => (
        <p key={q} className="question">
          {question(q).ask}
        </p>
      ))}
      <ul className="group">
        {[pair.base, pair.variant].map((p) => (
          <li key={p.id} className="pair stack-tight">
            <span className="pair-head">
              <a className="link" href={`#/play/${p.id}`}>
                {p.shown.title}
              </a>
              <span className="cell-value">{pair.differ.map((q) => shortText(p.shown.shape, q)).join('; ')}</span>
            </span>
            {playView(p).did.map((d) => (
              <span key={d.line} className="stack-tight">
                <span className="small">{d.line}</span>
                <MoveButtons ids={d.moves} />
              </span>
            ))}
          </li>
        ))}
      </ul>
      {pair.differ.map((q) => (
        <p key={q} className="small dim">
          {question(q).principle}
        </p>
      ))}
    </div>
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

/** What a story takes from the real world, with sources, and what it invents. */
function Real({ s }: { s: Situation }) {
  return (
    <details className="disclosure">
      <summary>What’s real in this story</summary>
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
