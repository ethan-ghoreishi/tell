import { useState } from 'react';
import { CARDS } from '../domain/content';
import {
  SET_SIZE,
  charted,
  currentStep,
  dueCalls,
  earlier,
  patterns,
  rate,
  record,
  rotate,
  rotation,
  runResult,
  sameTradeoff,
  setStatus,
  slideRange,
  slideSetup,
  startSet,
  todaysSession,
  type Play,
} from '../domain/engine';
import { fill, value } from '../domain/text';
import { CONTEXTS, MECHANICS, RATINGS, type Card, type Currency, type Rating, type Run, type SlideCard, type SlideRun, type Step, type TellState } from '../domain/types';
import { CutPlay, PeekPlay, SlidePlay, SpendPlay, mark, type SlideTexts } from '../mechanics';
import { store } from '../store/store';
import { AddedIcon, longDate, plural, shortDate, useNow } from '../ui';

const ROLE: Record<Step['role'], string> = { probe: 'Probe', stress: 'Stress-test', connect: 'Connect', depends: 'It depends' };

/** The texts of a Slide step, with the changing value marked. */
export function slideTexts(card: SlideCard, step: Pick<Step, 'dial' | 'hold' | 'condition'>, currency: Currency): (i: number | null) => SlideTexts {
  const { dial, x, y } = slideSetup(card, step);
  return (i) => {
    const moving = i === null ? '…' : mark(value(dial.unit, dial.steps[i], currency));
    const vars =
      step.dial === 'alt'
        ? { x: value(card.dial.unit, x!, currency), y: moving }
        : { x: moving, ...(y !== undefined ? { y: value(card.alt!.unit, y, currency) } : {}) };
    return {
      scene: fill(card.scene, currency, vars),
      ...(step.condition ? { condition: card.condition.text } : {}),
      a: fill(card.a.text, currency, vars),
      b: fill(card.b.text, currency, vars),
    };
  };
}

export default function Today({ state }: { state: TellState }) {
  const now = useNow();
  // The run whose result is showing; cleared by Next.
  const [revealing, setRevealing] = useState<string | null>(null);
  const shown = revealing ? state.runs.find((r) => r.id === revealing) : undefined;
  const cur = currentStep(state, now);

  function done(play: Play) {
    const at = new Date();
    try {
      if (state.runs.length === 0) navigator.storage?.persist?.().catch(() => undefined);
      const id = `${state.session!.id}-${cur!.index}`;
      store.update((s) => record(s, CARDS, play, at));
      setRevealing(id);
    } catch {
      // The day rolled over mid-experiment; the next render shows the new day.
      setRevealing(null);
    }
  }

  if (shown) return <Reveal state={state} run={shown} onNext={() => setRevealing(null)} />;
  if (cur) return <Experiment key={`${state.session!.id}-${cur.index}`} state={state} step={cur.step} index={cur.index} onDone={done} />;
  return <Home state={state} now={now} />;
}

function Home({ state, now }: { state: TellState; now: Date }) {
  const status = setStatus(state, CARDS, now);
  const due = dueCalls(state, now);
  const chart = charted(state.runs, CARDS);
  const session = todaysSession(state, now);

  return (
    <div className="stack-xl">
      <header className="stack">
        <p className="eyebrow">{longDate(now)}</p>
        <h1 className="title">{status === 'done' ? 'That’s today’s set' : 'Today'}</h1>
        {status !== 'done' && <p className="lede">Small experiments that show what actually matters to you when you choose.</p>}
      </header>

      {due.map((c) => (
        <a key={c.id} className="card due" href={`#/call/${c.id}`}>
          <span className="eyebrow">Due back</span>
          <span className="section-title">{c.title}</span>
          <span className="small dim">How did it go? Three taps.</span>
        </a>
      ))}

      {status === 'done' && session ? (
        <Summary state={state} session={session.id} />
      ) : status === 'ready' ? (
        <section className="card stack">
          <h2 className="section-title">Today’s set</h2>
          <p className="dim">{SET_SIZE} short experiments, a few minutes, then it ends. Each one adds to your map.</p>
          <button className="btn btn-primary btn-block" onClick={() => store.update((s) => startSet(s, CARDS, new Date()))}>
            Start today’s set
          </button>
        </section>
      ) : (
        <p className="notice">
          Nothing new to test today. Results come back for a retest three weeks after you play them, and new experiments arrive with
          updates.
        </p>
      )}

      <section className="card-quiet stack">
        <h2 className="section-title">Something to decide?</h2>
        <p className="small dim">Bring a real choice. The same experiments, with your own options, in about two minutes.</p>
        <a className="btn btn-block" href="#/decide">
          Decide something
        </a>
      </section>

      {state.runs.length > 0 && (
        <p className="totals">
          <span className="num">
            {chart.done} of {chart.total} experiments charted
          </span>
          <span className="num">{plural(patterns(state.runs, state.currency).length, 'pattern')}</span>
          <a className="link" href="#/map">
            See your map
          </a>
        </p>
      )}
    </div>
  );
}

function Experiment({ state, step, index, onDone }: { state: TellState; step: Step; index: number; onDone: (p: Play) => void }) {
  const card = CARDS.find((c) => c.id === step.card)!;
  const steps = state.session!.steps;
  const normal = steps.slice(0, index + 1).filter((s) => s.role !== 'depends').length;
  return (
    <article className="stack-lg">
      <header className="stack-tight">
        <p className="small dim num">
          {step.role === 'depends' ? 'An extra one' : `Experiment ${normal} of ${SET_SIZE}`} · {ROLE[step.role]} · {MECHANICS[card.mechanic].name}
        </p>
        <p className="reason small">{step.reason}</p>
      </header>
      <Mechanic state={state} card={card} step={step} onDone={onDone} />
    </article>
  );
}

function Mechanic({ state, card, step, onDone }: { state: TellState; card: Card; step: Step; onDone: (p: Play) => void }) {
  const c = state.currency;
  const by = rotation(state, card.mechanic);
  if (card.mechanic === 'slide') {
    const offer = step.role !== 'depends' && step.dial === 'main';
    const depends = offer
      ? [
          ...(card.alt ? [{ on: 'alt' as const, label: card.alt.label }] : []),
          ...(!step.condition ? [{ on: 'condition' as const, label: card.condition.label }] : []),
          { on: 'else' as const, label: 'something else' },
        ]
      : undefined;
    return <SlidePlay texts={slideTexts(card, step, c)} dial={slideSetup(card, step).dial} currency={c} guess={step.role === 'probe'} depends={depends} onDone={onDone} />;
  }
  if (card.mechanic === 'cut') {
    return <CutPlay scene={card.scene} items={rotate(card.items, by)} onDone={(order) => onDone({ mechanic: 'cut', order })} />;
  }
  if (card.mechanic === 'spend') {
    const features = card.features.map((f) => ({ ...f, high: fill(f.high, c), low: fill(f.low, c) }));
    return <SpendPlay scene={card.scene} features={features} onDone={onDone} />;
  }
  const facts = rotate(card.facts, by).map((f) => ({ ...f, a: fill(f.a, c), b: fill(f.b, c) }));
  return <PeekPlay scene={card.scene} a={card.a} b={card.b} facts={facts} onDone={onDone} />;
}

/** What one experiment showed, set beside what came before. */
function Reveal({ state, run, onNext }: { state: TellState; run: Run; onNext: () => void }) {
  const c = state.currency;
  const result = runResult(run, c);
  const last = earlier(state.runs, run).at(-1);
  const others = run.mechanic === 'slide' && run.dial === 'main' ? sameTradeoff(state.runs, run) : [];
  const finished = !currentStep(state, new Date());
  const [guest, setGuest] = useState<'off' | 'playing' | SlideRun['outcome']>('off');
  const card = CARDS.find((x) => x.id === run.card);

  if (guest === 'playing' && card?.mechanic === 'slide' && run.mechanic === 'slide') {
    const step = { dial: run.dial, condition: !!run.condition, hold: undefined };
    return (
      <article className="stack-lg">
        <p className="small dim">Pass the phone. Their answers are never saved.</p>
        <SlidePlay texts={slideTexts(card, step, c)} dial={slideSetup(card, step).dial} currency={c} onDone={(p) => setGuest(p.outcome)} />
      </article>
    );
  }

  return (
    <article className="stack-lg reveal" aria-live="polite">
      <p className="eyebrow">{run.title}</p>
      <h1 className="title result" tabIndex={-1}>
        {result.headline}
      </h1>
      {result.lines.length > 0 && (
        <ul className="stack">
          {result.lines.map((l) => (
            <li key={l} className="dim">
              {l}
            </li>
          ))}
        </ul>
      )}

      {(others.length > 0 || last) && (
        <div className="added">
          <AddedIcon />
          <ul className="stack">
            {others.map((o) => (
              <li key={o.id}>
                Same trade-off, {CONTEXTS[o.context].toLowerCase()} ({o.title}): {slideRange(o, c)}.
              </li>
            ))}
            {last && (
              <li>
                Last time, {shortDate(last.day)}: {lowerFirst(runResult(last, c).headline)}
              </li>
            )}
          </ul>
        </div>
      )}

      {run.mechanic === 'slide' && run.dial === 'main' && run.outcome.kind !== 'depends' && card?.mechanic === 'slide' && (
        typeof guest === 'object' ? (
          <div className="then-now">
            <div>
              <p className="eyebrow">You</p>
              <p>{slideRange(run, c)}</p>
            </div>
            <div>
              <p className="eyebrow">Them</p>
              <p>{slideRange({ ...run, outcome: guest }, c)}</p>
            </div>
          </div>
        ) : (
          <button className="btn btn-ghost btn-sm btn-block" onClick={() => setGuest('playing')}>
            Pass the phone: let someone else try this one
          </button>
        )
      )}

      <button className="btn btn-primary btn-block" onClick={onNext}>
        {finished ? 'See today’s results' : 'Next experiment'}
      </button>
    </article>
  );
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function Summary({ state, session }: { state: TellState; session: string }) {
  const c = state.currency;
  const runs = state.runs.filter((r) => r.session === session);
  const fresh = patterns(state.runs, c).filter((p) => p.first.day === session || p.runs.some((r) => r.session === session && p.kind === 'change'));
  const rating = state.ratings.find((r) => r.session === session)?.rating;
  return (
    <div className="stack-lg reveal">
      <section className="card stack" aria-labelledby="showed">
        <h2 className="section-title" id="showed">
          What it showed
        </h2>
        <ul className="results">
          {runs.map((r) => (
            <li key={r.id} className="stack-tight">
              <span className="faint tiny">{r.title}</span>
              <span>{runResult(r, c).headline}</span>
            </li>
          ))}
        </ul>
      </section>
      {fresh.length > 0 && (
        <section className="stack" aria-labelledby="new">
          <h2 className="section-title" id="new">
            New on your map
          </h2>
          {fresh.map((p) => (
            <p key={p.id} className="added">
              <AddedIcon />
              <span>{p.text}</span>
            </p>
          ))}
        </section>
      )}
      <div className="stack">
        <p className="small" id="rate">
          How was this set?
        </p>
        <div className="chips" role="group" aria-labelledby="rate">
          {(Object.keys(RATINGS) as Rating[]).map((r) => (
            <button key={r} className={`chip${rating === r ? ' on' : ''}`} aria-pressed={rating === r} onClick={() => store.update((s) => rate(s, session, r, new Date()))}>
              {RATINGS[r]}
            </button>
          ))}
        </div>
        <p className="tiny faint">Your rating stays on this device. It shows which experiments are worth keeping.</p>
      </div>
      <p className="dim">The next set is ready tomorrow.</p>
      <a className="btn btn-primary btn-block" href="#/map">
        See your map
      </a>
    </div>
  );
}
